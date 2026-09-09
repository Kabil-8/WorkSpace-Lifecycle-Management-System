import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ChatMessage {
  id: string
  role: 'user' | 'eden'
  content: string
  timestamp: string
  isStreaming?: boolean
  contextPage?: string
  attachmentName?: string
  attachmentType?: 'pdf' | 'image' | 'code' | 'doc'
  evolutionStage?: string
  executedTool?: string
  agentRole?: string
  ragCount?: number
  plan?: any
}

export interface ChatSession {
  id: string
  title: string
  mode: string
  messageCount: number
  createdAt: string
  isPinned?: boolean
}

interface EdenState {
  messages: ChatMessage[]
  isTyping: boolean
  isStreaming: boolean
  streamingMessageId: string | null
  hasInitialized: boolean
  pageContextData: any
  sessions: ChatSession[]
  agentRole: string | null
  ragSourcesCount: number
  memoriesCount: number
  activePlan: any | null
}

const initialState: EdenState = {
  messages: [],
  isTyping: false,
  isStreaming: false,
  streamingMessageId: null,
  hasInitialized: false,
  pageContextData: null,
  sessions: [],
  agentRole: null,
  ragSourcesCount: 0,
  memoriesCount: 0,
  activePlan: null,
}

const edenSlice = createSlice({
  name: 'eden',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload)
    },

    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload
    },

    startStreaming: (state, action: PayloadAction<{ id: string; timestamp: string }>) => {
      state.isStreaming = true
      state.streamingMessageId = action.payload.id
      state.messages.push({
        id: action.payload.id,
        role: 'eden',
        content: '',
        timestamp: action.payload.timestamp,
        isStreaming: true,
      })
    },

    appendStreamChunk: (state, action: PayloadAction<string>) => {
      if (!state.streamingMessageId) return
      const msg = state.messages.find((m) => m.id === state.streamingMessageId)
      if (msg) {
        msg.content += action.payload
      }
    },

    finishStreaming: (
      state,
      action: PayloadAction<{ executedTool?: string; agentRole?: string; ragCount?: number; plan?: any } | undefined>,
    ) => {
      if (state.streamingMessageId) {
        const msg = state.messages.find((m) => m.id === state.streamingMessageId)
        if (msg) {
          msg.isStreaming = false
          if (action.payload?.executedTool) msg.executedTool = action.payload.executedTool
          if (action.payload?.agentRole) msg.agentRole = action.payload.agentRole
          if (action.payload?.ragCount !== undefined) msg.ragCount = action.payload.ragCount
          if (action.payload?.plan) msg.plan = action.payload.plan
        }
      }
      state.isStreaming = false
      state.streamingMessageId = null
    },

    replaceLastEdenMessage: (state, action: PayloadAction<ChatMessage>) => {
      for (let i = state.messages.length - 1; i >= 0; i--) {
        if (state.messages[i].role === 'eden') {
          state.messages[i] = action.payload
          break
        }
      }
    },

    initializeMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      if (!state.hasInitialized) {
        state.messages = action.payload
        state.hasInitialized = true
      }
    },

    clearMessages: (state) => {
      state.messages = []
      state.hasInitialized = false
      state.isStreaming = false
      state.streamingMessageId = null
      state.activePlan = null
    },

    setPageContextData: (state, action: PayloadAction<any>) => {
      state.pageContextData = action.payload
    },

    setSessions: (state, action: PayloadAction<ChatSession[]>) => {
      state.sessions = action.payload
    },

    togglePinSession: (state, action: PayloadAction<string>) => {
      const sess = state.sessions.find((s) => s.id === action.payload)
      if (sess) {
        sess.isPinned = !sess.isPinned
      }
    },

    setAgentRole: (state, action: PayloadAction<string>) => {
      state.agentRole = action.payload
    },

    setActivePlan: (state, action: PayloadAction<any>) => {
      state.activePlan = action.payload
    },

    setRagInfo: (state, action: PayloadAction<{ ragSourcesCount: number; memoriesCount: number }>) => {
      state.ragSourcesCount = action.payload.ragSourcesCount
      state.memoriesCount = action.payload.memoriesCount
    },
  },
})

export const {
  addMessage,
  setTyping,
  startStreaming,
  appendStreamChunk,
  finishStreaming,
  replaceLastEdenMessage,
  initializeMessages,
  clearMessages,
  setPageContextData,
  setSessions,
  togglePinSession,
  setAgentRole,
  setActivePlan,
  setRagInfo,
} = edenSlice.actions

export default edenSlice.reducer
