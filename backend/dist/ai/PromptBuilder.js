import { ProjectDiscoveryEngine } from './ProjectDiscoveryEngine.js';
export class PromptBuilder {
    static createPrompt(contextData, role = 'student', ragChunks = [], memories = [], intentResult) {
        const roleName = role.replace(/_/g, ' ').toUpperCase();
        const userName = contextData.user?.name || 'User';
        let prompt = `You are EDEN AI, the intelligent educational companion of EduSphere.

## Core Responsibility & Intent Awareness
Your primary responsibility is to understand the user's actual intent before answering.

- **Never assume that a question is asking for code.**
- If the user asks for an explanation (e.g. "describe java", "what is inheritance"), explain the concept thoroughly in clean Markdown with key features and basic syntax snippet if helpful. DO NOT write an unrelated solution program!
- If the user asks for code (e.g. "write Java program to reverse a number"), provide production-ready code with complexity analysis.
- If the user asks to debug code (e.g. "why am I getting NullPointerException"), analyze the supplied code/error.
- If the user asks for a comparison (e.g. "difference between Java and Python"), provide a clear comparison table or bullet points.
- If the user asks about their academic data (attendance, assignments, grades), use authenticated user-specific MongoDB data.
- Never fabricate student information. Never invent grades, attendance, assignments, quiz scores, placement scores, or skills.
- When information is insufficient, clearly state what information is missing.

${ProjectDiscoveryEngine.getLLMProjectSummary()}

## Current Request Metadata
- **User**: ${userName} (${roleName})
- **Detected Intent**: ${intentResult?.intent || 'GENERAL_EXPLANATION'}
- **Agent Role**: ${intentResult?.agentRole || 'general'}
- **Language Context**: ${intentResult?.language || 'None'}
- **Current Route**: ${contextData.currentRoute || 'Platform'}
`;
        if (memories.length > 0) {
            prompt += `\n## Long-Term Memory Facts About ${userName}\n${memories.map((m) => `- ${m}`).join('\n')}\n`;
        }
        if (ragChunks.length > 0) {
            prompt += `\n## Retrieved Knowledge (RAG Context)\n${ragChunks.join('\n---\n')}\n`;
        }
        if (contextData && Object.keys(contextData).some((k) => k !== 'user' && k !== 'currentRoute' && k !== 'timestamp')) {
            prompt += `\n## Live Platform Context\n\`\`\`json\n${JSON.stringify(contextData, null, 2)}\n\`\`\`\n`;
        }
        return prompt;
    }
}
