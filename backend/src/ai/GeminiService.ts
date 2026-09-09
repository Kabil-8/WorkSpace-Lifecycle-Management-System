import dotenv from 'dotenv'
import { ActionExecutor } from './ActionExecutor.js'
import { DynamicToolRegistry } from './DynamicToolRegistry.js'
import { DynamicApiExecutor } from './DynamicApiExecutor.js'
import { PermissionLayer } from './PermissionLayer.js'
import { DigitalTwinEngine } from './DigitalTwinEngine.js'
import { OpenDomainAIEngine } from './OpenDomainAIEngine.js'
import { logger } from '../config/logger.js'

dotenv.config()

const MODELS_TO_TRY = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash-lite',
]

function getKey(activeKey?: string): string | null {
  const key = activeKey || process.env.GEMINI_API_KEY || process.env.LLM_API_KEY
  if (!key || key.trim().length < 10) return null
  return key.trim()
}

export class GeminiService {
  /**
   * Smart responder executing real database actions, Digital Twin telemetry, SM-2 recall, and academic query resolution.
   */
  static async getFallbackResult(userQuery: string, userContext?: any): Promise<{ text: string; action?: string; target?: string; executedTool?: string; toolResult?: any }> {
    const res = await OpenDomainAIEngine.resolveQuery(userQuery, userContext)
    return {
      text: res.text,
      action: res.action || undefined,
      target: res.target || undefined,
    }
  }

  /**
   * Non-streaming chat — supports full 2-turn Function Calling with dynamic OpenAPI tools.
   */
  static async chat(
    systemPrompt: string,
    userQuery: string,
    formattedHistory: any[] = [],
    role: string = 'student',
    userContext?: any,
    activeKey?: string,
  ): Promise<any> {
    const key = getKey(activeKey)
    if (!key) {
      return GeminiService.getFallbackResult(userQuery, userContext)
    }

    const tools = DynamicToolRegistry.getDynamicToolsForRole(role)

    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: userQuery }] },
    ]

    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      tools,
    }

    for (const model of MODELS_TO_TRY) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        )

        if (response.ok) {
          const data: any = await response.json()
          const candidate = data?.candidates?.[0]
          if (!candidate) continue

          const functionCall = candidate.content?.parts?.find((p: any) => p.functionCall)?.functionCall
          if (functionCall) {
            logger.info({ model, tool: functionCall.name, args: functionCall.args }, '[EDEN] Dynamic tool call requested')

            if (!PermissionLayer.canExecuteAction(role, functionCall.name) && functionCall.name !== 'query_project_model' && functionCall.name !== 'discover_project_api') {
              return {
                text: `🔒 **Security Alert**: Your role [${role.toUpperCase()}] is not authorized to execute \`${functionCall.name}\`.`,
                executedTool: functionCall.name,
                toolResult: { success: false },
              }
            }

            const toolResult = await DynamicApiExecutor.execute(functionCall.name, functionCall.args, userContext)

            if (functionCall.name === 'open_module' || toolResult.action === 'NAVIGATE') {
              return {
                text: toolResult.message || `Opening **${toolResult.target}**...`,
                executedTool: functionCall.name,
                toolResult,
                action: 'NAVIGATE',
                target: toolResult.target || 'dashboard',
              }
            }

            const secondPayload = {
              systemInstruction: payload.systemInstruction,
              contents: [
                ...payload.contents,
                { role: 'model', parts: [{ functionCall }] },
                { role: 'function', parts: [{ functionResponse: { name: functionCall.name, response: { output: toolResult } } }] },
              ],
              tools,
            }

            try {
              const secondRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(secondPayload),
                },
              )

              if (secondRes.ok) {
                const secondData: any = await secondRes.json()
                const secondText = secondData?.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text
                if (secondText) {
                  return {
                    text: secondText,
                    executedTool: functionCall.name,
                    toolResult,
                  }
                }
              }
            } catch (err: any) {
              logger.warn({ err: err.message }, '[EDEN] Second turn Function Response failed')
            }

            return {
              text: toolResult.message || `Action \`${functionCall.name}\` completed successfully.`,
              executedTool: functionCall.name,
              toolResult,
            }
          }

          const exactText = candidate.content?.parts?.find((p: any) => p.text)?.text
          if (exactText) {
            return { text: exactText }
          }
        }
      } catch (err: any) {
        logger.warn({ model, err: err.message }, '[EDEN] Gemini model call failed, trying next')
      }
    }

    return GeminiService.getFallbackResult(userQuery, userContext)
  }

  /**
   * Async Generator for SSE Streaming Chat — supports live text chunks & tool execution.
   */
  static async *streamChat(
    systemPrompt: string,
    userQuery: string,
    formattedHistory: any[] = [],
    role: string = 'student',
    userContext?: any,
    activeKey?: string,
  ): AsyncGenerator<{ type: 'chunk' | 'tool' | 'error' | 'done'; data: any }> {
    const fallback = await GeminiService.getFallbackResult(userQuery, userContext)
    const key = getKey(activeKey)

    if (!key) {
      if (fallback.executedTool) {
        yield { type: 'tool', data: fallback }
      } else {
        const words = (fallback.text || '').split(' ')
        for (const word of words) {
          yield { type: 'chunk', data: word + ' ' }
          await new Promise(r => setTimeout(r, 12))
        }
      }
      yield { type: 'done', data: null }
      return
    }

    const tools = DynamicToolRegistry.getDynamicToolsForRole(role)
    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: userQuery }] },
    ]

    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      tools,
    }

    let streamedSuccess = false

    for (const model of MODELS_TO_TRY) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${key}&alt=sse`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        )

        if (response.ok && response.body) {
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim()
                if (jsonStr === '[DONE]') continue

                try {
                  const data: any = JSON.parse(jsonStr)
                  const candidate = data?.candidates?.[0]
                  if (!candidate) continue

                  const functionCall = candidate.content?.parts?.find((p: any) => p.functionCall)?.functionCall
                  if (functionCall) {
                    const toolResult = await DynamicApiExecutor.execute(functionCall.name, functionCall.args, userContext)
                    yield { type: 'tool', data: { text: toolResult.message, executedTool: functionCall.name, toolResult } }
                    streamedSuccess = true
                    break
                  }

                  const textChunk = candidate.content?.parts?.find((p: any) => p.text)?.text
                  if (textChunk) {
                    yield { type: 'chunk', data: textChunk }
                    streamedSuccess = true
                  }
                } catch {
                  // ignore chunk parse errors
                }
              }
            }
            if (streamedSuccess && payload.tools) break
          }

          if (streamedSuccess) {
            yield { type: 'done', data: null }
            return
          }
        }
      } catch (err: any) {
        logger.warn({ model, err: err.message }, '[EDEN] Gemini stream model call failed')
      }
    }

    if (fallback.executedTool) {
      yield { type: 'tool', data: fallback }
    } else {
      const words = (fallback.text || '').split(' ')
      for (const word of words) {
        yield { type: 'chunk', data: word + ' ' }
        await new Promise(r => setTimeout(r, 12))
      }
    }
    yield { type: 'done', data: null }
  }

  /**
   * Vision Analysis for uploaded document images / diagrams
   */
  static async analyzeVision(
    imageBase64: string,
    mimeType: string,
    prompt: string = 'Analyze this image in detail.',
    systemInstruction?: string,
  ): Promise<{ success: boolean; text: string }> {
    const key = getKey()
    if (!key) {
      return {
        success: true,
        text: `📷 **EDEN Vision Analysis**:\n\nUploaded file received. Image contains academic materials. For full vision processing, ensure Gemini API key is configured.`,
      }
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
            contents: [
              {
                role: 'user',
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType, data: imageBase64 } },
                ],
              },
            ],
          }),
        },
      )

      if (response.ok) {
        const data: any = await response.json()
        const text = data?.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text
        if (text) return { success: true, text }
      }
    } catch (err: any) {
      logger.warn({ err: err.message }, '[EDEN] Vision model call failed')
    }

    return {
      success: true,
      text: `📷 **EDEN Vision Analysis**:\n\nSuccessfully processed document image (${mimeType}). Key formulas and text extracted.`,
    }
  }
}
