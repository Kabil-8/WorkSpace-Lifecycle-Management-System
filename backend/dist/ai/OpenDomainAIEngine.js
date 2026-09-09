import { EdenOrchestrator } from './EdenOrchestrator.js';
export class OpenDomainAIEngine {
    /**
     * Compatibility layer delegating to EdenOrchestrator.
     * Contains ZERO hardcoded educational templates or fallback numbers.
     */
    static async resolveQuery(userQuery, userContext, options = {}) {
        const orchestratorRes = await EdenOrchestrator.processRequest({
            userQuery,
            userId: userContext.userId,
            userName: userContext.userName,
            role: userContext.role,
            department: userContext.department,
            semester: userContext.semester,
            conversationId: options.conversationId,
            options,
        });
        return {
            success: true,
            text: orchestratorRes.content,
            content: orchestratorRes.content,
            intent: orchestratorRes.intent,
            agentRole: orchestratorRes.agentRole,
            code: orchestratorRes.code,
            language: orchestratorRes.language,
            action: orchestratorRes.action,
            target: orchestratorRes.target,
            sources: orchestratorRes.sources,
            toolCalls: orchestratorRes.toolsUsed,
            toolsUsed: orchestratorRes.toolsUsed,
            conversationId: orchestratorRes.conversationId,
        };
    }
}
