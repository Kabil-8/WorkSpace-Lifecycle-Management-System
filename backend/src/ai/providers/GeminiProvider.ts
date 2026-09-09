import { LLMProvider, LLMRequest, LLMResponse, LLMToolCall } from '../LLMProvider.js'
import { logger } from '../../config/logger.js'

const MODELS_TO_TRY = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
]

export class GeminiProvider implements LLMProvider {
  name = 'gemini'

  async isAvailable(): Promise<boolean> {
    const key = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY
    return Boolean(key && key.trim().length > 10)
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    return this.chat(request)
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const key = request.activeKey || process.env.GEMINI_API_KEY || process.env.LLM_API_KEY
    if (!key || key.trim().length < 10) {
      throw new Error('GEMINI_API_KEY is missing or unconfigured.')
    }

    const contents: any[] = []

    if (request.history && request.history.length > 0) {
      for (const msg of request.history) {
        if (msg.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: msg.content || '' }] })
        } else if (msg.role === 'assistant' || msg.role === 'model') {
          contents.push({ role: 'model', parts: [{ text: msg.content || '' }] })
        }
      }
    }

    contents.push({ role: 'user', parts: [{ text: request.userQuery }] })

    const tools = request.tools && request.tools.length > 0
      ? [
          {
            functionDeclarations: request.tools.map(t => ({
              name: t.name,
              description: t.description,
              parameters: t.parameters || { type: 'OBJECT', properties: {} },
            })),
          },
        ]
      : undefined

    const payload: any = {
      systemInstruction: request.systemPrompt ? { parts: [{ text: request.systemPrompt }] } : undefined,
      contents,
      tools,
    }

    for (const model of MODELS_TO_TRY) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        )

        if (res.ok) {
          const data: any = await res.json()
          const candidate = data?.candidates?.[0]
          if (!candidate) continue

          const toolCalls: LLMToolCall[] = []
          const functionCall = candidate.content?.parts?.find((p: any) => p.functionCall)?.functionCall
          if (functionCall) {
            toolCalls.push({
              name: functionCall.name,
              args: functionCall.args || {},
            })
          }

          const text = candidate.content?.parts?.find((p: any) => p.text)?.text || ''

          return {
            content: text,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            finishReason: candidate.finishReason,
          }
        }
      } catch (err: any) {
        logger.warn({ model, err: err.message }, '[GeminiProvider] Model invocation error')
      }
    }

    throw new Error('Gemini API call failed across available models.')
  }
}
