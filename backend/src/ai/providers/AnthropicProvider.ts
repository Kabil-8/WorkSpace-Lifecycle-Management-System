import { LLMProvider, LLMRequest, LLMResponse, LLMToolCall } from '../LLMProvider.js'
import { logger } from '../../config/logger.js'

export class AnthropicProvider implements LLMProvider {
  name = 'anthropic'

  async isAvailable(): Promise<boolean> {
    const key = process.env.ANTHROPIC_API_KEY || process.env.LLM_API_KEY
    return Boolean(key && key.trim().length > 10)
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    return this.chat(request)
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const key = request.activeKey || process.env.ANTHROPIC_API_KEY || process.env.LLM_API_KEY
    if (!key || key.trim().length < 10) {
      throw new Error('ANTHROPIC_API_KEY is missing or unconfigured.')
    }

    const model = request.model || process.env.LLM_MODEL || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
    const baseUrl = request.baseUrl || process.env.LLM_BASE_URL || 'https://api.anthropic.com/v1'

    const messages: any[] = []

    if (request.history && request.history.length > 0) {
      for (const msg of request.history) {
        if (msg.role === 'user') {
          messages.push({ role: 'user', content: msg.content || '' })
        } else if (msg.role === 'assistant' || msg.role === 'model') {
          messages.push({ role: 'assistant', content: msg.content || '' })
        }
      }
    }

    messages.push({ role: 'user', content: request.userQuery })

    const tools = request.tools && request.tools.length > 0
      ? request.tools.map(t => ({
          name: t.name,
          description: t.description,
          input_schema: t.parameters || { type: 'object', properties: {} },
        }))
      : undefined

    const body: any = {
      model,
      max_tokens: request.maxTokens ?? Number(process.env.LLM_MAX_TOKENS || 2048),
      system: request.systemPrompt,
      messages,
    }

    if (tools) {
      body.tools = tools
    }

    try {
      const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key.trim(),
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errText = await res.text()
        logger.warn({ status: res.status, errText }, '[AnthropicProvider] API request failed')
        throw new Error(`Anthropic API returned status ${res.status}: ${errText}`)
      }

      const data: any = await res.json()
      const toolCalls: LLMToolCall[] = []

      let textContent = ''

      if (Array.isArray(data?.content)) {
        for (const block of data.content) {
          if (block.type === 'text') {
            textContent += block.text
          } else if (block.type === 'tool_use') {
            toolCalls.push({
              id: block.id,
              name: block.name,
              args: block.input || {},
            })
          }
        }
      }

      return {
        content: textContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        finishReason: data?.stop_reason,
        usage: {
          promptTokens: data?.usage?.input_tokens,
          completionTokens: data?.usage?.output_tokens,
          totalTokens: (data?.usage?.input_tokens || 0) + (data?.usage?.output_tokens || 0),
        },
      }
    } catch (err: any) {
      logger.error({ err: err.message }, '[AnthropicProvider] Execution error')
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
