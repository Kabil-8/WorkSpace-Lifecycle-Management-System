import { logger } from '../../config/logger.js';
export class LocalLLMProvider {
    name = 'local';
    async isAvailable() {
        const baseUrl = process.env.LLM_BASE_URL || 'http://localhost:11434';
        try {
            const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/tags`, { method: 'GET' });
            return res.ok;
        }
        catch {
            return false;
        }
    }
    async generate(request) {
        return this.chat(request);
    }
    async chat(request) {
        const baseUrl = request.baseUrl || process.env.LLM_BASE_URL || 'http://localhost:11434';
        const model = request.model || process.env.LLM_MODEL || 'llama3:latest';
        // Try OpenAI-compatible endpoint first (/v1/chat/completions)
        try {
            const messages = [];
            if (request.systemPrompt)
                messages.push({ role: 'system', content: request.systemPrompt });
            if (request.history && request.history.length > 0) {
                for (const m of request.history) {
                    messages.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content || '' });
                }
            }
            messages.push({ role: 'user', content: request.userQuery });
            const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature: request.temperature ?? 0.7,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                const choiceMsg = data?.choices?.[0]?.message;
                return {
                    content: choiceMsg?.content || '',
                };
            }
        }
        catch {
            // Fallback to Ollama native API (/api/chat)
        }
        // Try Ollama native /api/chat
        try {
            const messages = [];
            if (request.systemPrompt)
                messages.push({ role: 'system', content: request.systemPrompt });
            if (request.history && request.history.length > 0) {
                for (const m of request.history) {
                    messages.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content || '' });
                }
            }
            messages.push({ role: 'user', content: request.userQuery });
            const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    messages,
                    stream: false,
                }),
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Local LLM server returned status ${res.status}: ${errText}`);
            }
            const data = await res.json();
            return {
                content: data?.message?.content || '',
            };
        }
        catch (err) {
            logger.warn({ err: err.message, baseUrl, model }, '[LocalLLMProvider] Local Ollama unreachable, falling back to GeminiProvider');
            // Automatic fallback to cloud GeminiProvider
            try {
                const { GeminiProvider } = await import('./GeminiProvider.js');
                const gemini = new GeminiProvider();
                return await gemini.chat(request);
            }
            catch (fallbackErr) {
                logger.error({ fallbackErr: fallbackErr.message }, '[LocalLLMProvider] Both Local Ollama and Cloud Fallback unavailable');
                return {
                    content: `⚡ **EDEN AI (Offline Intelligence Mode)**\n\nI'm ready to assist you. To activate ultra-fast local LLM reasoning:\n1. Open your terminal and run \`ollama run gemma3\`\n2. Ollama will serve at \`${baseUrl}\`\n\nBased on your verified student profile:\n• Target Role: **${request.systemPrompt?.includes('Target Career Goal:') ? request.systemPrompt.split('Target Career Goal:')[1].split('\n')[0].trim() : 'Fullstack Developer'}**\n• Status: Tracking academic & placement readiness\n\nAsk me any question about your courses, syllabus, or coding topics!`
                };
            }
        }
    }
    async *stream(request) {
        const res = await this.chat(request);
        const words = (res.content || '').split(' ');
        for (const word of words) {
            yield word + ' ';
            await new Promise(r => setTimeout(r, 10));
        }
    }
}
