import { LLMProvider, LLMRequest, LLMResponse, LLMToolCall } from '../LLMProvider.js'
import { logger } from '../../config/logger.js'

export class OpenAIProvider implements LLMProvider {
  name = 'openai'

  async isAvailable(): Promise<boolean> {
    const key = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY
    return Boolean(key && key.trim().length > 10)
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    return this.chat(request)
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const key = request.activeKey || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.LLM_API_KEY
    if (!key || key.trim().length < 10) {
      throw new Error('API key (OPENROUTER_API_KEY or OPENAI_API_KEY) is missing or unconfigured.')
    }

    const isOpenRouter = key.startsWith('sk-or-') ||
      (process.env.EDEN_LLM_PROVIDER || '').toLowerCase() === 'openrouter' ||
      (process.env.LLM_BASE_URL || '').includes('openrouter.ai')

    const model = request.model || process.env.LLM_MODEL || process.env.OPENAI_MODEL ||
      (isOpenRouter ? 'meta-llama/llama-3.2-3b-instruct:free' : 'gpt-4o-mini')
    const baseUrl = request.baseUrl || process.env.LLM_BASE_URL ||
      (isOpenRouter ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1')

    const messages: any[] = []

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt })
    }

    if (request.history && request.history.length > 0) {
      for (const msg of request.history) {
        if (msg.role === 'user') {
          messages.push({ role: 'user', content: msg.content || '' })
        } else if (msg.role === 'assistant' || msg.role === 'model') {
          messages.push({ role: 'assistant', content: msg.content || '' })
        } else if (msg.role === 'tool' || msg.role === 'function') {
          messages.push({
            role: 'tool',
            tool_call_id: msg.toolCallId || 'call_1',
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          })
        }
      }
    }

    messages.push({ role: 'user', content: request.userQuery })

    const tools = request.tools && request.tools.length > 0
      ? request.tools.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters || { type: 'object', properties: {} },
          },
        }))
      : undefined

    const body: any = {
      model,
      messages,
      temperature: request.temperature ?? Number(process.env.LLM_TEMPERATURE || 0.7),
      max_tokens: request.maxTokens ?? Number(process.env.LLM_MAX_TOKENS || 2048),
    }

    if (tools) {
      body.tools = tools
      body.tool_choice = 'auto'
    }

    try {
      const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key.trim()}`,
          ...(isOpenRouter ? {
            'HTTP-Referer': 'https://edusphere.ai',
            'X-Title': 'EduSphere AI',
          } : {})
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errText = await res.text()
        logger.warn({ status: res.status, errText }, '[OpenAIProvider] API request failed')
        throw new Error(`OpenAI/OpenRouter API returned status ${res.status}: ${errText}`)
      }

      const data: any = await res.json()
      const choice = data?.choices?.[0]
      const choiceMsg = choice?.message

      const toolCalls: LLMToolCall[] = []
      if (choiceMsg?.tool_calls && Array.isArray(choiceMsg.tool_calls)) {
        for (const tc of choiceMsg.tool_calls) {
          try {
            const args = typeof tc.function.arguments === 'string'
              ? JSON.parse(tc.function.arguments)
              : tc.function.arguments
            toolCalls.push({
              id: tc.id,
              name: tc.function.name,
              args,
            })
          } catch {
            toolCalls.push({
              id: tc.id,
              name: tc.function.name,
              args: {},
            })
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
      }
    } catch (err: any) {
      logger.error({ err: err.message }, '[OpenAIProvider] Execution error')
      throw err
    }
  }

  async *stream(request: LLMRequest): AsyncIterable<string> {
    const res = await this.chat(request)
    const words = (res.content || '').split(' ')
    for (const word of words) {
      yield word + ' '
      await new Promise(r => setTimeout(r, 10))
    }
  }
}
