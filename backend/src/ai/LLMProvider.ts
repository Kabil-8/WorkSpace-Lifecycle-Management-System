export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'model' | 'tool' | 'function'
  content?: string
  name?: string
  toolCallId?: string
  toolCalls?: LLMToolCall[]
}

export interface LLMToolDeclaration {
  name: string
  description: string
  parameters?: Record<string, any>
}

export interface LLMRequest {
  systemPrompt?: string
  userQuery: string
  history?: LLMMessage[]
  tools?: LLMToolDeclaration[]
  temperature?: number
  maxTokens?: number
  activeKey?: string
  baseUrl?: string
  model?: string
}

export interface LLMToolCall {
  id?: string
  name: string
  args: Record<string, any>
}

export interface LLMResponse {
  content: string
  toolCalls?: LLMToolCall[]
  finishReason?: string
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
}

export interface LLMProvider {
  name: string
  generate(request: LLMRequest): Promise<LLMResponse>
  chat(request: LLMRequest): Promise<LLMResponse>
  stream?(request: LLMRequest): AsyncIterable<string>
  isAvailable(): Promise<boolean>
}
