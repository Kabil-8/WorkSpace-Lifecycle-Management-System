import { EdenConversation } from '../models/EdenSchemas.js';
import { EdenMemory } from '../models/EdenMemory.js';
import { RAGEngine } from './RAGEngine.js';
import { logger } from '../config/logger.js';
export class MemoryService {
    /**
     * Fetches isolated role-memory for a user (last 20 messages)
     */
    static async getHistory(userId, role = 'student') {
        try {
            const conv = await EdenConversation.findOne({ userId, mode: role });
            if (!conv)
                return [];
            return conv.messages.slice(-20);
        }
        catch (err) {
            logger.error({ userId, role, err: err.message }, '[MemoryService] Error fetching history');
            return [];
        }
    }
    /**
     * Returns conversation sessions for sidebar
     */
    static async getSessions(userId) {
        try {
            const sessions = await EdenConversation.find({ userId })
                .select('_id title mode createdAt messages')
                .sort({ updatedAt: -1 })
                .limit(20)
                .lean();
            return sessions.map((s) => ({
                id: s._id.toString(),
                title: s.title || `${s.mode?.toUpperCase()} Session`,
                mode: s.mode,
                messageCount: s.messages?.length || 0,
                createdAt: s.createdAt,
            }));
        }
        catch (err) {
            logger.error({ userId, err: err.message }, '[MemoryService] Error fetching sessions');
            return [];
        }
    }
    /**
     * Appends message to user's isolated role-memory
     */
    static async addMessage(userId, sender, text, role = 'student') {
        try {
            let conv = await EdenConversation.findOne({ userId, mode: role });
            if (!conv) {
                conv = new EdenConversation({
                    userId,
                    title: `${role.toUpperCase()} AI Session`,
                    mode: role,
                    messages: [],
                });
            }
            conv.messages.push({ sender, text, timestamp: new Date() });
            // Limit memory depth to last 50 messages
            if (conv.messages.length > 50) {
                conv.messages = conv.messages.slice(-50);
            }
            await conv.save();
            if (sender === 'user') {
                MemoryService.extractAndSaveFactsSemantically(userId, text, role).catch(() => { });
            }
        }
        catch (err) {
            logger.error({ userId, role, err: err.message }, '[MemoryService] Error adding message');
        }
    }
    /**
     * Semantic fact extraction with vector embeddings
     */
    static async extractAndSaveFactsSemantically(userId, text, role) {
        try {
            const key = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
            if (!key || key.trim().length < 15)
                return;
            const lowerText = text.toLowerCase();
            const hasFacts = lowerText.includes('goal') ||
                lowerText.includes('want to') ||
                lowerText.includes('i am') ||
                lowerText.includes("i'm") ||
                lowerText.includes('prefer') ||
                lowerText.includes('learning') ||
                lowerText.includes('working on') ||
                lowerText.includes('career');
            if (!hasFacts)
                return;
            const extractionPrompt = `Extract concrete personal facts from this message worth remembering long-term. Return ONLY a JSON array of short fact strings.
User message: "${text}"`;
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${key.trim()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: extractionPrompt }] }],
                    generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
                }),
            });
            if (!response.ok)
                return;
            const data = await response.json();
            const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (!jsonMatch)
                return;
            const facts = JSON.parse(jsonMatch[0]);
            if (!Array.isArray(facts) || facts.length === 0)
                return;
            let memory = await EdenMemory.findOne({ userId });
            if (!memory) {
                memory = new EdenMemory({ userId, role, facts: [], factEmbeddings: [], preferredLanguages: [] });
            }
            for (const fact of facts) {
                if (fact && typeof fact === 'string' && !memory.facts.includes(fact)) {
                    memory.facts.push(fact);
                    const vector = await RAGEngine.generateEmbedding(fact);
                    if (!memory.factEmbeddings)
                        memory.factEmbeddings = [];
                    memory.factEmbeddings.push({ fact, vector });
                }
            }
            await memory.save();
            logger.info({ userId, factsExtracted: facts.length }, '[MemoryService] Semantic facts saved with vector embeddings');
        }
        catch (err) {
            logger.warn({ userId, err: err.message }, '[MemoryService] Fact extraction skipped');
        }
    }
    /**
     * Vector-based Memory Recall with Exponential Memory Decay Math:
     * Score = CosineSimilarity(queryVec, factVec) * exp(-lambda * deltaDays)
     */
    static async getLongTermMemories(userId, currentQuery) {
        try {
            const mem = await EdenMemory.findOne({ userId }).lean();
            if (!mem)
                return [];
            const facts = [];
            if (mem.careerGoal)
                facts.push(`Career Goal: ${mem.careerGoal}`);
            if (mem.preferredLanguages?.length)
                facts.push(`Preferred Tech Stack: ${mem.preferredLanguages.join(', ')}`);
            if (currentQuery && mem.factEmbeddings && mem.factEmbeddings.length > 0) {
                const queryVec = await RAGEngine.generateEmbedding(currentQuery);
                const lambda = 0.05; // Decay constant per day
                const now = Date.now();
                const scoredFacts = mem.factEmbeddings.map((f) => {
                    const sim = RAGEngine.cosineSimilarity(queryVec, f.vector);
                    const updatedTime = mem.updatedAt ? new Date(mem.updatedAt).getTime() : now;
                    const deltaDays = Math.max(0, (now - updatedTime) / (1000 * 60 * 60 * 24));
                    const decay = Math.exp(-lambda * deltaDays);
                    const finalScore = sim * decay;
                    return { fact: f.fact, score: finalScore };
                });
                scoredFacts.sort((a, b) => b.score - a.score);
                const topFacts = scoredFacts.slice(0, 5).map((sf) => sf.fact);
                facts.push(...topFacts);
            }
            else if (mem.facts?.length) {
                facts.push(...mem.facts.slice(-10));
            }
            return Array.from(new Set(facts)); // Deduplicate
        }
        catch {
            return [];
        }
    }
    static formatForGemini(messages) {
        return messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
        }));
    }
    static async clearHistory(userId, role = 'student') {
        await EdenConversation.deleteOne({ userId, mode: role });
    }
}
