import { logger } from '../../config/logger.js';
export class DeepSeekProvider {
    name = 'deepseek';
    async isAvailable() {
        const key = process.env.DEEPSEEK_API_KEY || process.env.LLM_API_KEY;
        return Boolean(key && key.trim().length > 10);
    }
    async generate(request) {
        return this.chat(request);
    }
    async chat(request) {
        const key = request.activeKey || process.env.DEEPSEEK_API_KEY || process.env.LLM_API_KEY;
        if (!key || key.trim().length < 10) {
            throw new Error('DEEPSEEK_API_KEY is missing or unconfigured.');
        }
        const model = request.model || process.env.LLM_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-chat';
        const baseUrl = request.baseUrl || process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1';
        const messages = [];
        if (request.systemPrompt) {
            messages.push({ role: 'system', content: request.systemPrompt });
        }
        if (request.history && request.history.length > 0) {
            for (const msg of request.history) {
                if (msg.role === 'user') {
                    messages.push({ role: 'user', content: msg.content || '' });
                }
                else if (msg.role === 'assistant' || msg.role === 'model') {
                    messages.push({ role: 'assistant', content: msg.content || '' });
                }
            }
        }
        messages.push({ role: 'user', content: request.userQuery });
        const tools = request.tools && request.tools.length > 0
            ? request.tools.map(t => ({
                type: 'function',
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters || { type: 'object', properties: {} },
                },
            }))
            : undefined;
        const body = {
            model,
            messages,
            temperature: request.temperature ?? Number(process.env.LLM_TEMPERATURE || 0.7),
            max_tokens: request.maxTokens ?? Number(process.env.LLM_MAX_TOKENS || 2048),
        };
        if (tools) {
            body.tools = tools;
        }
        try {
            const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${key.trim()}`,
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const errText = await res.text();
                logger.warn({ status: res.status, errText }, '[DeepSeekProvider] API request failed');
                throw new Error(`DeepSeek API returned status ${res.status}: ${errText}`);
            }
            const data = await res.json();
            const choice = data?.choices?.[0];
            const choiceMsg = choice?.message;
            const toolCalls = [];
            if (choiceMsg?.tool_calls && Array.isArray(choiceMsg.tool_calls)) {
                for (const tc of choiceMsg.tool_calls) {
                    try {
                        const args = typeof tc.function.arguments === 'string'
                            ? JSON.parse(tc.function.arguments)
                            : tc.function.arguments;
                        toolCalls.push({
                            id: tc.id,
                            name: tc.function.name,
                            args,
                        });
                    }
                    catch {
                        toolCalls.push({
                            id: tc.id,
                            name: tc.function.name,
                            args: {},
                        });
                    }
                }
            }
            return {
                content: choiceMsg?.content || '',
                toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                finishReason: choice?.finish_reason,
                usage: {
                    promptTokens: data?.usage?.prompt_tokens,
                    completionTokens: data?.usage?.completion_tokens,
                    totalTokens: data?.usage?.total_tokens,
                },
            };
        }
        catch (err) {
            logger.error({ err: err.message }, '[DeepSeekProvider] Execution error');
            throw err;
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
