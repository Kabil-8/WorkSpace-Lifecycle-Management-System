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

function normalizeSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return { type: 'OBJECT', properties: {} }
  }
  const res: any = { ...schema }
  if (res.type && typeof res.type === 'string') {
    res.type = res.type.toUpperCase()
  } else {
    res.type = 'OBJECT'
  }
  if (!res.properties) {
    res.properties = {}
  } else {
    const newProps: any = {}
    for (const [k, v] of Object.entries(res.properties)) {
      newProps[k] = normalizeSchema(v)
    }
    res.properties = newProps
  }
  return res
}

    const tools = request.tools && request.tools.length > 0
      ? [
          {
            functionDeclarations: request.tools.map(t => ({
              name: t.name,
              description: t.description,
              parameters: normalizeSchema(t.parameters),
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
          const parts = candidate.content?.parts || []
          for (const p of parts) {
            if (p.functionCall) {
              toolCalls.push({
                name: p.functionCall.name,
                args: p.functionCall.args || {},
              })
            }
          }

          let text = parts.map((p: any) => p.text || '').filter(Boolean).join('\n')

          // Extract text-based tool calls if model formatted code blocks instead of structured functionCalls
          if (toolCalls.length === 0 && text) {
            const toolBlockRegex = /```(?:tool_code|tool_call|tool)?\s*\n?([\s\S]*?)```/gi
            let match
            while ((match = toolBlockRegex.exec(text)) !== null) {
              const raw = match[1].trim()
              if (!raw) continue
              const fnMatch = raw.match(/^([a-zA-Z0-9_]+)(?:\(([\s\S]*?)\))?$/)
              if (fnMatch) {
                const toolName = fnMatch[1]
                let args = {}
                if (fnMatch[2]?.trim()) {
                  try { args = JSON.parse(fnMatch[2].trim()) } catch {}
                }
                toolCalls.push({ name: toolName, args })
              } else {
                try {
                  const parsed = JSON.parse(raw)
                  const name = parsed.name || parsed.tool || parsed.function
                  const args = parsed.args || parsed.arguments || {}
                  if (name) toolCalls.push({ name, args })
                } catch {}
              }
            }
          }

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
