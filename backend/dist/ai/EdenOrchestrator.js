import { IntentClassifier } from './IntentClassifier.js';
import { ContextBuilder } from './ContextBuilder.js';
import { SystemPrompt } from './SystemPrompt.js';
import { ToolRegistry } from './tools/ToolRegistry.js';
import { WebResearchAgent } from './WebResearchAgent.js';
import { SourceManager } from './SourceManager.js';
import { RAGEngine } from './RAGEngine.js';
import { LLMProviderFactory } from './providers/LLMProviderFactory.js';
import { ResponseValidator } from './ResponseValidator.js';
import EdenConversation from '../models/EdenConversation.js';
import { logger } from '../config/logger.js';
export class EdenOrchestrator {
    static async processRequest(req) {
        const startTime = Date.now();
        const cleanQuery = (req.userQuery || '').trim();
        // 1. JWT Authentication Guard: Must be valid 24-char ObjectId
        if (!req.userId || !/^[0-9a-fA-F]{24}$/.test(req.userId)) {
            logger.warn({ userId: req.userId }, '[EdenOrchestrator] Rejecting unauthenticated request');
            return {
                success: false,
                conversationId: req.conversationId || `conv-${Date.now()}`,
                intent: 'UNKNOWN',
                agentRole: 'general',
                content: '🔒 Authentication required. Please log in to access EDEN AI.',
                sources: [],
                toolsUsed: [],
            };
        }
        const role = req.role || 'student';
        const conversationId = req.conversationId || `conv-${req.userId}-${Date.now()}`;
        const sourceManager = new SourceManager();
        const toolsUsed = [];
        // 2. Scoped Context Building (LLM will determine intent — not pre-classified)
        const contextData = await ContextBuilder.buildContext(req.userId, req.userName || 'Student', role, cleanQuery, req.options?.pageRoute || '', req);
        // 3. Web Research Pipeline — broader trigger: let LLM also request via tool
        //    Auto-trigger for queries clearly needing live/current data
        let webEvidence = '';
        if (WebResearchAgent.isResearchNeeded(cleanQuery)) {
            const researchRes = await WebResearchAgent.conductResearch(cleanQuery, sourceManager);
            if (researchRes.hasWebResults) {
                webEvidence = researchRes.evidenceText;
                toolsUsed.push({ tool: 'web_research_auto', query: cleanQuery, sources: researchRes.sources.length });
            }
        }
        // 4. RAG Document Retrieval — now uses production RAGEngine (Gemini text-embedding-004 + MongoDB)
        //    replaces old RAGContextBuilder which used in-memory TF-IDF VectorStore
        let ragContext = '';
        try {
            const chunks = await RAGEngine.retrieveChunks(cleanQuery, contextData.user.department);
            if (chunks.length > 0) {
                ragContext = '### 📄 Institutional Knowledge Base Context:\n\n';
                chunks.forEach((chunk, idx) => {
                    ragContext += `[Knowledge Chunk ${idx + 1}]:\n${chunk}\n\n`;
                });
                toolsUsed.push({ tool: 'rag_retrieval', chunks: chunks.length, department: contextData.user.department });
            }
        }
        catch (ragErr) {
            logger.warn({ err: ragErr.message }, '[EdenOrchestrator] RAG retrieval skipped');
        }
        // 5. Assemble System Prompt with role-specific tool guidance
        const systemInstruction = SystemPrompt.buildPrompt(contextData.user);
        const availableTools = ToolRegistry.getDeclarations(role);
        const provider = LLMProviderFactory.getProvider(req.options?.provider, req.options?.activeKey);
        try {
            // 6. First LLM Turn — Prompt + Web/RAG Evidence + Full Tool Arsenal
            let promptWithEvidence = cleanQuery;
            if (webEvidence)
                promptWithEvidence += `\n\n${webEvidence}`;
            if (ragContext)
                promptWithEvidence += `\n\n${ragContext}`;
            const llmRes = await provider.chat({
                systemPrompt: systemInstruction,
                userQuery: promptWithEvidence,
                history: req.options?.history || [],
                tools: availableTools,
                activeKey: req.options?.activeKey,
            });
            let finalContent = llmRes.content || '';
            let lastAction = null;
            let lastTarget = null;
            // 7. Execute ALL Tool Calls if LLM requested tools (not just first)
            if (llmRes.toolCalls && llmRes.toolCalls.length > 0) {
                let combinedToolOutputs = '';
                for (const tc of llmRes.toolCalls) {
                    logger.info({ tool: tc.name, args: tc.args }, '[EdenOrchestrator] LLM-requested tool executing');
                    // If LLM itself called web_search, run the enhanced multi-query research
                    if (tc.name === 'web_search' && tc.args?.query) {
                        const llmSearchRes = await WebResearchAgent.conductResearch(tc.args.query, sourceManager);
                        toolsUsed.push({ tool: 'web_search_llm_requested', query: tc.args.query, sources: llmSearchRes.sources.length });
                        combinedToolOutputs += `\n[Web Search Results for "${tc.args.query}"]:\n${llmSearchRes.evidenceText}`;
                        continue;
                    }
                    const toolResult = await ToolRegistry.executeTool(tc.name, tc.args, {
                        userId: req.userId,
                        role,
                        userName: req.userName,
                        department: req.department,
                    });
                    toolsUsed.push({ tool: tc.name, args: tc.args, result: toolResult.data });
                    if (tc.name === 'open_module' || toolResult.data?.action === 'NAVIGATE') {
                        lastAction = 'NAVIGATE';
                        lastTarget = toolResult.data?.target || tc.args.moduleName || tc.args.target || 'dashboard';
                    }
                    combinedToolOutputs += `\n[Tool Output — ${tc.name}]: ${JSON.stringify(toolResult.data || toolResult.error)}`;
                }
                // 8. Second LLM Turn — synthesize final answer from tool outputs + evidence
                const followUpQuery = `${promptWithEvidence}\n\n[System: Tool execution completed. Use the following real data to form your response]:${combinedToolOutputs}`;
                const secondLlmRes = await provider.chat({
                    systemPrompt: systemInstruction,
                    userQuery: followUpQuery,
                    history: req.options?.history || [],
                    activeKey: req.options?.activeKey,
                });
                finalContent = secondLlmRes.content || combinedToolOutputs;
            }
            // 9. Response Validation & Citation Formatting
            // IntentClassifier used HERE (post-response) for metadata tagging only
            const intentResult = IntentClassifier.classify(cleanQuery);
            const validatedContent = ResponseValidator.validateAndClean(finalContent, intentResult);
            const citationsMarkdown = sourceManager.formatCitationsMarkdown();
            const fullResponseWithCitations = validatedContent + citationsMarkdown;
            // 10. Extract code block if present
            let codeSnippet = null;
            const codeMatch = fullResponseWithCitations.match(/```(?:java|python|javascript|typescript|cpp|c|html|css|sql)?\n([\s\S]*?)```/i);
            if (codeMatch && codeMatch[1]) {
                codeSnippet = codeMatch[1].trim();
            }
            const latencyMs = Date.now() - startTime;
            // 11. Persist Conversation Memory in MongoDB
            EdenConversation.findOneAndUpdate({ conversationId, userId: req.userId }, {
                $setOnInsert: { conversationId, userId: req.userId, role },
                $push: {
                    messages: [
                        { sender: 'user', content: cleanQuery, timestamp: new Date() },
                        {
                            sender: 'eden',
                            content: fullResponseWithCitations,
                            intent: intentResult.intent,
                            toolCalls: toolsUsed,
                            sources: sourceManager.getSources(),
                            timestamp: new Date(),
                        },
                    ],
                },
            }, { upsert: true, new: true }).catch(() => { });
            // 12. Persist EDEN Request Log for observability
            EdenOrchestrator.persistRequestLog({
                userId: req.userId,
                userRole: role,
                query: cleanQuery,
                intent: intentResult.intent,
                provider: provider.name,
                latencyMs,
                toolsUsed: toolsUsed.map(t => t.tool),
                webSearched: toolsUsed.some(t => t.tool.includes('web')),
                ragRetrieved: toolsUsed.some(t => t.tool === 'rag_retrieval'),
                ragChunkCount: toolsUsed.find(t => t.tool === 'rag_retrieval')?.chunks || 0,
                success: true,
            }).catch(() => { });
            return {
                success: true,
                conversationId,
                intent: intentResult.intent,
                agentRole: intentResult.agentRole,
                content: fullResponseWithCitations,
                code: codeSnippet,
                language: intentResult.language || null,
                action: lastAction,
                target: lastTarget,
                sources: sourceManager.getSources(),
                toolsUsed,
                metadata: { latencyMs, provider: provider.name, ragChunks: toolsUsed.find(t => t.tool === 'rag_retrieval')?.chunks || 0 },
            };
        }
        catch (err) {
            const latencyMs = Date.now() - startTime;
            const intentResult = IntentClassifier.classify(cleanQuery);
            logger.error({ err: err.message }, '[EdenOrchestrator] Request processing failed');
            EdenOrchestrator.persistRequestLog({
                userId: req.userId,
                userRole: role,
                query: cleanQuery,
                intent: intentResult.intent,
                provider: provider?.name || 'unknown',
                latencyMs,
                toolsUsed: [],
                webSearched: false,
                ragRetrieved: false,
                ragChunkCount: 0,
                success: false,
                errorMessage: err.message,
            }).catch(() => { });
            return {
                success: false,
                conversationId,
                intent: 'UNKNOWN',
                agentRole: 'general',
                content: `EDEN AI encountered an error processing your request: ${err.message}`,
                sources: [],
                toolsUsed: [],
            };
        }
    }
    /**
     * Persist request telemetry for EDEN Analytics dashboard.
     * Uses dynamic import to avoid circular deps with model imports at startup.
     */
    static async persistRequestLog(data) {
        try {
            const { EdenRequestLog } = await import('../models/EdenRequestLog.js');
            await EdenRequestLog.create({
                userId: data.userId,
                userRole: data.userRole,
                query: data.query.slice(0, 500),
                intent: data.intent,
                provider: data.provider,
                latencyMs: data.latencyMs,
                toolsUsed: data.toolsUsed,
                webSearched: data.webSearched,
                ragRetrieved: data.ragRetrieved,
                ragChunkCount: data.ragChunkCount,
                success: data.success,
                errorMessage: data.errorMessage,
            });
        }
        catch {
            // Non-blocking — never fail the main request due to logging
        }
    }
}
