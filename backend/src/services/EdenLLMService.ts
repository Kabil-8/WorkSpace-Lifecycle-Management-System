import { Ollama } from 'ollama'
import { logger } from '../config/logger.js'

export interface EdenChatHistoryMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface EdenLLMChatResponse {
  content: string
  model: string
  provider: 'ollama_local' | 'fallback'
  error?: string
}

export class EdenLLMService {
  private static getOllamaClient() {
    const host = process.env.OLLAMA_BASE_URL || process.env.LLM_BASE_URL || 'http://127.0.0.1:11434'
    return new Ollama({ host })
  }

  private static getModel(): string {
    return process.env.EDEN_LLM_MODEL || process.env.LLM_MODEL || 'gemma3'
  }

  /**
   * Check if local Ollama daemon is reachable
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const ollama = this.getOllamaClient()
      const list = await ollama.list()
      return !!list && Array.isArray(list.models)
    } catch {
      return false
    }
  }

  /**
   * Primary Chat with Local Ollama LLM
   */
  static async chat(
    systemPrompt: string,
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    temperature: number = 0.7
  ): Promise<EdenLLMChatResponse> {
    const model = this.getModel()
    const ollama = this.getOllamaClient()

    try {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage,
        },
      ]

      const response = await ollama.chat({
        model,
        messages,
        stream: false,
        options: {
          temperature,
        },
      })

      return {
        content: response.message.content,
        model,
        provider: 'ollama_local',
      }
    } catch (error: any) {
      logger.warn(
        { err: error.message, model, host: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434' },
        '[EdenLLMService] Local Ollama LLM call encountered error, activating resilient fallback'
      )

      return {
        content: '',
        model,
        provider: 'fallback',
        error: error.message,
      }
    }
  }
}
