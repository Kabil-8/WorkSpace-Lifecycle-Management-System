import { Ollama } from 'ollama';
import { logger } from '../config/logger.js';
export class EdenLLMService {
    static getOllamaClient() {
        const host = process.env.OLLAMA_BASE_URL || process.env.LLM_BASE_URL || 'http://127.0.0.1:11434';
        return new Ollama({ host });
    }
    static getModel() {
        return process.env.EDEN_LLM_MODEL || process.env.LLM_MODEL || 'gemma3';
    }
    /**
     * Check if local Ollama daemon is reachable
     */
    static async isAvailable() {
        try {
            const ollama = this.getOllamaClient();
            const list = await ollama.list();
            return !!list && Array.isArray(list.models);
        }
        catch {
            return false;
        }
    }
    /**
     * Primary Chat with Local Ollama LLM
     */
    static async chat(systemPrompt, userMessage, conversationHistory = [], temperature = 0.7) {
        const model = this.getModel();
        const ollama = this.getOllamaClient();
        try {
            const messages = [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                ...conversationHistory,
                {
                    role: 'user',
                    content: userMessage,
                },
            ];
            const response = await ollama.chat({
                model,
                messages,
                stream: false,
                options: {
                    temperature,
                },
            });
            return {
                content: response.message.content,
                model,
                provider: 'ollama_local',
            };
        }
        catch (error) {
            logger.warn({ err: error.message, model, host: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434' }, '[EdenLLMService] Local Ollama LLM unreachable or errored, delegating to LLMProviderFactory');
            try {
                const { LLMProviderFactory } = await import('../ai/providers/LLMProviderFactory.js');
                const provider = LLMProviderFactory.getProvider();
                const history = conversationHistory.map(m => ({
                    role: (m.role === 'user' ? 'user' : 'assistant'),
                    content: m.content
                }));
                const res = await provider.chat({
                    systemPrompt,
                    userQuery: userMessage,
                    history,
                    temperature,
                });
                return {
                    content: res.content || '',
                    model: provider.name,
                    provider: 'fallback',
                };
            }
            catch (fallbackErr) {
                logger.error({ fallbackErr: fallbackErr.message }, '[EdenLLMService] Fallback provider also encountered error');
                return {
                    content: '',
                    model,
                    provider: 'fallback',
                    error: error.message,
                };
            }
        }
    }
}
