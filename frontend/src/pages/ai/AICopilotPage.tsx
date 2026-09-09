import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useNavigate } from 'react-router-dom'
import {
  Brain, Send, Mic, MicOff, Volume2, VolumeX,
  Copy, Check, RefreshCw, Shield,
  Plus, Trash2, Upload, Sparkles, Zap,
  StopCircle,
} from 'lucide-react'
import { useAppSelector, useAppDispatch } from '../../hooks/useStore'
import {
  addMessage, startStreaming, appendStreamChunk, finishStreaming,
  clearMessages, setSessions, setRagInfo, setAgentRole,
  ChatMessage, ChatSession,
} from '../../store/edenSlice'
import { api } from '../../services/api'

// ─── Constants ───────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:5000/api/eden'

function getToken() {
  return localStorage.getItem('edusphere_token') || localStorage.getItem('token') || ''
}

// ─── Streaming hook ───────────────────────────────────────────────────────────
function useEdenStream() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const abortRef = useRef<AbortController | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const sendStream = useCallback(
    async (message: string, pageRoute: string, pageContextData: any) => {
      if (abortRef.current) abortRef.current.abort()
      const abortController = new AbortController()
      abortRef.current = abortController
      setIsStreaming(true)

      const streamId = `eden-stream-${Date.now()}`
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      dispatch(startStreaming({ id: streamId, timestamp }))

      try {
        const response = await fetch(`${API_BASE}/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
            'x-gemini-key': localStorage.getItem('edusphere_gemini_key') || '',
          },
          body: JSON.stringify({ message, pageRoute, pageContextData }),
          signal: abortController.signal,
        })

        if (!response.ok || !response.body) {
          throw new Error(`Stream failed: ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''
        let metaData: any = null
        let toolData: any = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          let currentEvent = ''
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim()
            } else if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6).trim())

                if (currentEvent === 'meta') {
                  metaData = parsed
                  dispatch(setAgentRole(parsed.agentRole || 'academic'))
                  dispatch(setRagInfo({
                    ragSourcesCount: parsed.ragSourcesCount || 0,
                    memoriesCount: parsed.memoriesCount || 0,
                  }))
                } else if (currentEvent === 'chunk') {
                  dispatch(appendStreamChunk(parsed.text || ''))
                } else if (currentEvent === 'tool') {
                  toolData = parsed
                  dispatch(appendStreamChunk(parsed.text || ''))
                } else if (currentEvent === 'error') {
                  dispatch(appendStreamChunk(`\n\n⚠️ ${parsed.message}`))
                } else if (currentEvent === 'done') {
                  // Stream complete
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }

        dispatch(finishStreaming({
          executedTool: toolData?.executedTool,
          agentRole: metaData?.agentRole,
          ragCount: metaData?.ragSourcesCount,
          plan: metaData?.plan,
        }))

        // Navigation after tool call
        if (toolData?.action === 'NAVIGATE' && toolData?.target) {
          setTimeout(() => navigate(`/${toolData.target.replace(/^\//, '')}`), 1200)
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          dispatch(finishStreaming({}))
        } else {
          // Seamless Fallback: Retry via POST /api/eden/chat for guaranteed answer delivery
          try {
            const fallbackRes: any = await api.post('/eden/chat', { message, pageRoute, pageContextData })
            if (fallbackRes?.reply) {
              dispatch(appendStreamChunk(fallbackRes.reply))
              dispatch(finishStreaming({
                executedTool: fallbackRes.executedTool,
                agentRole: fallbackRes.agentRole,
                plan: fallbackRes.plan,
              }))
              if (fallbackRes.action === 'NAVIGATE' && fallbackRes.target) {
                setTimeout(() => navigate(`/${fallbackRes.target.replace(/^\//, '')}`), 1200)
              }
              return
            }
          } catch {
            // fallback error ignored
          }

          dispatch(appendStreamChunk('\n\n⚠️ EDEN AI is initializing connection. Please click submit again.'))
          dispatch(finishStreaming({}))
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [dispatch, navigate],
  )

  const stopStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
  }, [])

  return { sendStream, stopStream, isStreaming }
}

// ─── Code Block Renderer ─────────────────────────────────────────────────────
function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-slate-700/50">
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900/90 text-2xs text-slate-400 font-mono">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{ margin: 0, padding: '1rem', background: '#090d16', fontSize: '0.8rem' }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
}

// ─── Message Bubble ──────────────────────────────────────────────────────────
function MessageBubble({
  message,
  userName,
  userRole: _userRole,
  isStreaming,
  onCopy,
  onRegenerate,
  onSpeak,
  copiedId,
}: {
  message: ChatMessage
  userName: string
  userRole: string
  isStreaming: boolean
  onCopy: (id: string, text: string) => void
  onRegenerate?: () => void
  onSpeak?: (text: string) => void
  copiedId: string | null
}) {
  const isUser = message.role === 'user' || (message as any).sender === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-md ${
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
            : 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white'
        }`}
      >
        {isUser ? userName.charAt(0).toUpperCase() : <Zap size={15} />}
      </div>

      {/* Content box */}
      <div className={`space-y-1.5 max-w-[82%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Header */}
        <div className={`flex items-center gap-2 text-3xs ${isUser ? 'justify-end' : 'justify-start'}`}
          style={{ color: 'var(--muted-foreground)' }}>
          <span className="font-bold" style={{ color: 'var(--foreground)' }}>
            {isUser ? userName : 'EDEN AI'}
          </span>
          {message.agentRole && !isUser && (
            <span className="px-1.5 py-0.2 rounded text-3xs font-mono font-bold capitalize"
              style={{ background: 'var(--indigo-muted)', color: 'var(--indigo)' }}>
              {message.agentRole}
            </span>
          )}
          <span>{message.timestamp}</span>
        </div>

        {/* Bubble */}
        <div
          className={`p-4 rounded-2xl text-xs leading-relaxed transition-all shadow-sm ${
            isUser
              ? 'rounded-tr-2xs text-white'
              : 'rounded-tl-2xs border'
          }`}
          style={isUser
            ? { background: 'linear-gradient(135deg, #4F46E5, #4338CA)' }
            : { background: 'var(--elevated)', borderColor: 'var(--border)', color: 'var(--foreground)' }
          }
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <CodeBlock
                      language={match[1]}
                      value={String(children).replace(/\n$/, '')}
                    />
                  ) : (
                    <code className="px-1.5 py-0.5 rounded font-mono text-2xs"
                      style={{ background: 'var(--muted)', color: 'var(--indigo)' }} {...props}>
                      {children}
                    </code>
                  )
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}

          {/* Executed Tool Banner */}
          {message.executedTool && (
            <div className="mt-2.5 pt-2 border-t flex items-center justify-between text-3xs font-mono"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
              <span className="flex items-center gap-1">
                <Sparkles size={10} style={{ color: 'var(--indigo)' }} />
                Executed: <code>{message.executedTool}</code>
              </span>
              {message.ragCount !== undefined && message.ragCount > 0 && (
                <span>📚 {message.ragCount} RAG sources</span>
              )}
            </div>
          )}
        </div>

        {/* Action icons */}
        {!isUser && (
          <div className="flex items-center gap-3 text-3xs pt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            <button
              onClick={() => onCopy(message.id, message.content)}
              className="hover:opacity-100 flex items-center gap-1 cursor-pointer"
            >
              {copiedId === message.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              <span>{copiedId === message.id ? 'Copied' : 'Copy'}</span>
            </button>

            {onSpeak && (
              <button
                onClick={() => onSpeak(message.content)}
                className="hover:opacity-100 flex items-center gap-1 cursor-pointer"
                title="Read aloud"
              >
                <Volume2 size={11} />
                <span>Listen</span>
              </button>
            )}

            {onRegenerate && !isStreaming && (
              <button
                onClick={onRegenerate}
                className="hover:opacity-100 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={11} />
                <span>Regenerate</span>
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AICopilotPage() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const {
    messages,
    isStreaming: isStreamingState,
    agentRole,
    sessions,
  } = useAppSelector((s) => s.eden)

  const [input, setInput] = useState('')
  const [isSpeechMuted, setIsSpeechMuted] = useState(false)
  const [isSpeechListening, setIsSpeechListening] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [uploadResult, setUploadResult] = useState<string | null>(null)

  const docInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  const { sendStream, stopStream, isStreaming } = useEdenStream()

  const userName = user?.name || 'Student'
  const userRole = user?.role || 'student'

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Speech Recognition (Browser Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = false
      rec.lang = 'en-US'

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript
        if (transcript) setInput(transcript)
        setIsSpeechListening(false)
      }
      rec.onerror = () => setIsSpeechListening(false)
      rec.onend = () => setIsSpeechListening(false)

      recognitionRef.current = rec
    }
  }, [])

  const toggleMic = () => {
    if (!recognitionRef.current) return
    if (isSpeechListening) {
      recognitionRef.current.stop()
      setIsSpeechListening(false)
    } else {
      recognitionRef.current.start()
      setIsSpeechListening(true)
    }
  }

  // TTS Output
  const speakText = (text: string) => {
    if (isSpeechMuted || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const cleanText = text.replace(/[*#`_~]/g, '').slice(0, 300)
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 1.05
    window.speechSynthesis.speak(utterance)
  }

  // Fetch memory & sessions on open
  const fetchMemoryAndSessions = async () => {
    try {
      const res: any = await api.get('/eden/memory')
      if (res?.data) {
        if (res.data.sessions) dispatch(setSessions(res.data.sessions))
      }
    } catch (err) {
      console.error('Failed to fetch memory:', err)
    }
  }

  useEffect(() => {
    fetchMemoryAndSessions()
  }, [])

  // Send message handler
  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim()
    if (!query || isStreaming) return

    const userMsgId = `user-${Date.now()}`
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    dispatch(
      addMessage({
        id: userMsgId,
        role: 'user',
        content: query,
        timestamp,
      }),
    )

    if (!textToSend) setInput('')

    const pageRoute = window.location.pathname
    sendStream(query, pageRoute, null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Copy handler
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Clear session handler
  const handleClearSession = () => {
    dispatch(clearMessages())
  }

  // RAG Document Upload
  const handleDocUpload = async (file: File) => {
    try {
      setIsUploadingDoc(true)
      setUploadResult(null)

      const formData = new FormData()
      formData.append('document', file)

      const res: any = await api.post('/eden/upload-doc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setUploadResult(res?.message || 'Document indexed to RAG!')
    } catch (err: any) {
      setUploadResult(err?.message || 'Upload failed')
    } finally {
      setIsUploadingDoc(false)
      setTimeout(() => setUploadResult(null), 4000)
    }
  }

  const lastEdenMessageIndex = messages.map(m => m.role).lastIndexOf('eden')

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden rounded-2xl border shadow-lg m-2 sm:m-3"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      
      {/* ── Left Sidebar ─────────────────────────────────────────────── */}
      <div className="w-64 flex flex-col flex-shrink-0 border-r"
        style={{ background: 'var(--elevated)', borderColor: 'var(--border)' }}>
        
        {/* Brand */}
        <div className="p-4 border-b space-y-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--indigo), #4338CA)' }}>
              ⚡
            </div>
            <div>
              <h2 className="font-extrabold text-sm leading-tight" style={{ color: 'var(--foreground)' }}>EDEN AI OS</h2>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--indigo)' }}>
                {userRole.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
            style={{ background: 'var(--success-muted)', color: 'var(--success)', borderColor: 'color-mix(in srgb, var(--success) 30%, transparent)' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }} aria-hidden="true" />
            <span className="text-[10px] font-bold">EDEN · Gemini AI Live</span>
          </div>
          <span className="model-disclaimer" title="AI suggestions are based on staging data">Staging Model</span>
        </div>

        {/* Actions */}
        <div className="p-3 border-b space-y-2" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={handleClearSession}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            style={{ background: 'var(--indigo-muted)', color: 'var(--indigo)', border: '1px solid color-mix(in srgb, var(--indigo) 30%, transparent)' }}
            aria-label="Start a new EDEN AI session"
          >
            <Plus size={14} aria-hidden="true" /> New Session
          </button>

          <button
            onClick={() => docInputRef.current?.click()}
            disabled={isUploadingDoc}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-50"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            {isUploadingDoc ? (
              <><RefreshCw size={14} className="animate-spin" /> Uploading...</>
            ) : (
              <><Upload size={14} /> Upload RAG Document</>
            )}
          </button>
          <input ref={docInputRef} type="file" className="hidden"
            accept=".pdf,.txt,.docx,.doc,.md"
            onChange={(e) => e.target.files?.[0] && handleDocUpload(e.target.files[0])} />

          {uploadResult && (
            <div className="p-2 rounded-lg text-3xs font-mono font-bold"
              style={{ background: 'var(--success-muted)', color: 'var(--success)' }}>
              ✅ {uploadResult}
            </div>
          )}
        </div>

        {/* Memory Stats */}
        <div className="p-3 border-b space-y-1" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => fetchMemoryAndSessions()}
            className="w-full flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <Shield size={12} style={{ color: 'var(--indigo)' }} />
              <span className="text-3xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Long-Term Memory</span>
            </div>
            <span className="text-3xs font-bold" style={{ color: 'var(--indigo)' }}>Inspect</span>
          </button>
        </div>

        {/* Session History */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <p className="text-3xs font-mono uppercase font-bold px-1" style={{ color: 'var(--muted-foreground)' }}>
            Recent Sessions ({sessions.length})
          </p>
          {sessions.map((session: ChatSession) => (
            <div key={session.id} className="p-2.5 rounded-xl border space-y-0.5"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <p className="text-2xs font-bold line-clamp-1" style={{ color: 'var(--foreground)' }}>{session.title}</p>
              <p className="text-3xs" style={{ color: 'var(--muted-foreground)' }}>{session.messageCount} messages</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Chat Area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-3.5 border-b flex items-center justify-between"
          style={{ background: 'var(--elevated)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <Brain style={{ color: 'var(--indigo)' }} size={20} />
            <div>
              <h3 className="font-extrabold text-sm flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                EDEN AI Operating System
                {agentRole && (
                  <span className="text-3xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={{ background: 'var(--indigo-muted)', color: 'var(--indigo)' }}>
                    {agentRole}
                  </span>
                )}
              </h3>
              <p className="text-3xs" style={{ color: 'var(--muted-foreground)' }}>
                Gemini LLM · Live MongoDB Telemetry Context · Active Recall
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSpeechMuted(!isSpeechMuted)}
              className="p-2 rounded-xl border transition-all cursor-pointer"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              title={isSpeechMuted ? 'Unmute voice' : 'Mute voice'}
            >
              {isSpeechMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <button
              onClick={handleClearSession}
              className="p-2 rounded-xl border transition-all cursor-pointer"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
              title="Clear session"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full min-h-[380px] space-y-6 text-center px-4"
            >
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl text-white shadow-xl"
                style={{ background: 'linear-gradient(135deg, var(--indigo), #4338CA)' }}
                aria-hidden="true"
              >
                ⚡
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>EDEN AI Copilot</h3>
                <p className="text-xs max-w-lg mx-auto" style={{ color: 'var(--muted-foreground)' }}>
                  Your context-aware AI companion. Ask about your learning progress, career readiness, code problems, or attendance — EDEN knows your academic profile.
                </p>
                <div className="flex justify-center mt-2">
                  <span className="model-disclaimer" aria-label="EDEN AI uses staging data models, not production-validated">
                    EDEN AI · Staging Model · Not production-validated
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full">
                {[
                  { q: 'Explain my Digital Twin scores', icon: '🧬' },
                  { q: 'How can I improve my placement readiness?', icon: '🎯' },
                  { q: 'Create a weekly study plan for me', icon: '📅' },
                  { q: 'Analyze my weak academic areas', icon: '📊' },
                  { q: 'Review my career progress so far', icon: '🚀' },
                  { q: 'What is my current attendance status?', icon: '🏫' },
                ].map(({ q, icon }) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="flex items-start gap-2.5 p-3.5 rounded-2xl text-left border transition-all cursor-pointer"
                    style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-muted)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card)' }}
                    aria-label={`Ask EDEN: ${q}`}
                  >
                    <span className="text-base flex-shrink-0" aria-hidden="true">{icon}</span>
                    <span className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--foreground)' }}>{q}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((m, idx) => (
            <MessageBubble
              key={m.id}
              message={m}
              userName={userName}
              userRole={userRole}
              isStreaming={isStreamingState}
              onCopy={handleCopy}
              onSpeak={speakText}
              onRegenerate={idx === lastEdenMessageIndex && !isStreaming ? () => handleSend(messages[idx - 1]?.content) : undefined}
              copiedId={copiedId}
            />
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t" style={{ background: 'var(--elevated)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 p-2 rounded-2xl border"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            
            <button onClick={toggleMic}
              className="p-2 rounded-xl border cursor-pointer"
              style={{
                background: isSpeechListening ? 'var(--destructive-muted)' : 'var(--elevated)',
                borderColor: 'var(--border)',
                color: isSpeechListening ? 'var(--destructive)' : 'var(--muted-foreground)'
              }}
              aria-label={isSpeechListening ? 'Stop voice input' : 'Start voice input'}
              aria-pressed={isSpeechListening}
            >
              {isSpeechListening ? <MicOff size={16} aria-hidden="true" /> : <Mic size={16} aria-hidden="true" />}
            </button>

            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask EDEN AI — learning pace, code, recall, attendance..."
              className="flex-1 bg-transparent border-none outline-none text-xs leading-relaxed resize-none px-2"
              style={{ color: 'var(--foreground)' }}
            />

            {isStreaming ? (
              <button onClick={stopStream} className="p-2 rounded-xl text-white cursor-pointer"
                style={{ background: 'var(--destructive)' }}
                aria-label="Stop AI response">
                <StopCircle size={16} aria-hidden="true" />
              </button>
            ) : (
              <button
                disabled={!input.trim()}
                onClick={() => handleSend()}
                className="p-2 rounded-xl text-white cursor-pointer disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, var(--indigo), #4338CA)' }}
                aria-label="Send message to EDEN AI"
              >
                <Send size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
