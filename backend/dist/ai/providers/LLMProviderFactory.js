import { OpenAIProvider } from './OpenAIProvider.js';
import { AnthropicProvider } from './AnthropicProvider.js';
import { DeepSeekProvider } from './DeepSeekProvider.js';
import { GeminiProvider } from './GeminiProvider.js';
import { LocalLLMProvider } from './LocalLLMProvider.js';
import { logger } from '../../config/logger.js';
export class LLMProviderFactory {
    static openaiInstance = new OpenAIProvider();
    static anthropicInstance = new AnthropicProvider();
    static deepseekInstance = new DeepSeekProvider();
    static geminiInstance = new GeminiProvider();
    static localInstance = new LocalLLMProvider();
    static getProvider(requestedProvider, activeKey) {
        const providerName = (requestedProvider || process.env.EDEN_LLM_PROVIDER || process.env.LLM_PROVIDER || '').toLowerCase();
        if (providerName === 'openai' || providerName === 'openrouter')
            return this.openaiInstance;
        if (providerName === 'anthropic' || providerName === 'claude')
            return this.anthropicInstance;
        if (providerName === 'deepseek')
            return this.deepseekInstance;
        if (providerName === 'gemini')
            return this.geminiInstance;
        if (providerName === 'local' || providerName === 'ollama')
            return this.localInstance;
        // Auto selection based on activeKey format or environment variables
        if (activeKey && (activeKey.startsWith('sk-ant-')))
            return this.anthropicInstance;
        if (activeKey && (activeKey.startsWith('sk-or-') || activeKey.startsWith('sk-')))
            return this.openaiInstance;
        if (process.env.OPENROUTER_API_KEY)
            return this.openaiInstance;
        if (process.env.DEEPSEEK_API_KEY)
            return this.deepseekInstance;
        if (process.env.OPENAI_API_KEY && (process.env.OPENAI_API_KEY.startsWith('sk-') || process.env.OPENAI_API_KEY.startsWith('sk-or-')))
            return this.openaiInstance;
        if (process.env.ANTHROPIC_API_KEY)
            return this.anthropicInstance;
        if (process.env.LLM_BASE_URL && !process.env.LLM_BASE_URL.includes('11434'))
            return this.openaiInstance;
        if (process.env.LLM_BASE_URL)
            return this.localInstance;
        if (activeKey || process.env.GEMINI_API_KEY || process.env.LLM_API_KEY) {
            return this.geminiInstance;
        }
        logger.info('[LLMProviderFactory] Defaulting to GeminiProvider');
        return this.geminiInstance;
    }
}
