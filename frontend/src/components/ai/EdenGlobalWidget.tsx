import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useLocation, useNavigate } from 'react-router-dom'
import { Send, Minimize2, Maximize2, X, ArrowUpRight, Mic, MicOff, RefreshCw } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '../../hooks/useStore'
import { addMessage, setTyping, ChatMessage } from '../../store/edenSlice'

function getToken() {
  return localStorage.getItem('edusphere_token') || localStorage.getItem('token') || ''
}

const PAGE_CONTEXT_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/courses': 'Courses',
  '/assignments': 'Assignments',
  '/attendance': 'Attendance',
  '/compiler': 'Code Compiler',
  '/resume': 'Resume Builder',
  '/placement': 'Placement Portal',
  '/interview': 'Mock Interview',
  '/forum': 'Discussion Forum',
  '/workspace': 'Team Workspace',
  '/kanban': 'Project Kanban',
  '/admin/users': 'User Management',
  '/proctor/manage': 'Exam Proctoring',
  '/analytics': 'Analytics',
  '/gamification': 'Gamification',
  '/events': 'Campus Events',
  '/jobs': 'Job Board',
}

export default function EdenGlobalWidget() {
  const { user } = useAppSelector((s) => s.auth)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const { messages, isTyping, pageContextData } = useAppSelector((s) => s.eden)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentPageLabel = PAGE_CONTEXT_TITLES[location.pathname] || 'EduSphere'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async (customText?: string) => {
    const text = (customText || input).trim()
    if (!text) return

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      contextPage: currentPageLabel,
    }

    dispatch(addMessage(userMsg))
    setInput('')
    dispatch(setTyping(true))

    try {
      const res = await fetch('http://localhost:5000/api/eden/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          message: text,
          pageRoute: location.pathname,
          pageContextData,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        dispatch(
          addMessage({
            id: `eden-${Date.now()}`,
            role: 'eden',
            content: data.reply || 'I encountered an issue. Please try again.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }),
        )

        // Navigation if EDEN triggers an action
        if ((data.action === 'NAVIGATE' || data.action?.type === 'navigate') && (data.target || data.action?.target)) {
          const target = data.target || data.action.target
          setTimeout(() => navigate(`/${target.replace(/^\//, '')}`), 1000)
        }
      } else {
        throw new Error(`${res.status}`)
      }
    } catch {
      dispatch(
        addMessage({
          id: `eden-${Date.now()}`,
          role: 'eden',
          content: 'EDEN is temporarily unavailable. Open the full EDEN workspace for the best experience.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }),
      )
    } finally {
      dispatch(setTyping(false))
    }
  }

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const r = new SR()
    r.continuous = false
    r.interimResults = false
    r.lang = 'en-US'
    r.onstart = () => setIsListening(true)
    r.onend = () => setIsListening(false)
    r.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      if (transcript) handleSend(transcript)
    }
    r.start()
  }

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl shadow-purple-900/50 border border-purple-400/30 text-white cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)' }}
        >
          <div className="relative">
            <span className="text-base">⚡</span>
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 border border-white animate-pulse" />
          </div>
          <span className="text-xs font-extrabold hidden sm:inline tracking-wide">EDEN AI</span>
        </motion.button>
      )}

      {/* Floating Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={`fixed right-6 z-50 flex flex-col rounded-2xl border shadow-2xl shadow-black/60 overflow-hidden transition-all ${
              isMinimized ? 'bottom-6 w-72 h-14' : 'bottom-6 w-[400px] h-[520px]'
            }`}
            style={{ background: '#0a0a18', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 border-b border-white/8 flex items-center justify-between cursor-pointer select-none"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(37,99,235,0.12) 100%)' }}
              onClick={() => setIsMinimized((p) => !p)}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-sm shadow-md">
                  ⚡
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-white">EDEN AI</h4>
                  <p className="text-[9px] text-purple-400 font-semibold">📍 {currentPageLabel}</p>
                </div>
              </div>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => { setIsOpen(false); navigate('/ai') }}
                  title="Open full EDEN workspace"
                  className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-white/8 transition-all"
                >
                  <ArrowUpRight size={14} />
                </button>
                <button
                  onClick={() => setIsMinimized((p) => !p)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all"
                >
                  {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/8 transition-all"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Body (expanded) */}
            {!isMinimized && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-2xl">⚡</div>
                      <p className="text-xs text-slate-500 max-w-[200px]">Ask me anything about {currentPageLabel} or any EduSphere feature.</p>
                    </div>
                  )}

                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                          m.role === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                            : 'bg-gradient-to-br from-purple-600 to-indigo-700'
                        }`}
                      >
                        {m.role === 'user' ? (user?.name?.charAt(0) || 'U') : '⚡'}
                      </div>

                      <div className="max-w-[83%]">
                        <div
                          className="px-3 py-2 rounded-xl text-xs leading-relaxed"
                          style={{
                            background:
                              m.role === 'user'
                                ? 'linear-gradient(135deg, #2563EB, #4338CA)'
                                : 'rgba(255,255,255,0.05)',
                            color: m.role === 'user' ? '#fff' : '#cbd5e1',
                            border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.07)',
                            borderRadius:
                              m.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                          }}
                        >
                          {m.role === 'user' ? (
                            <p>{m.content}</p>
                          ) : (
                            <div className="markdown-eden-compact">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {m.content}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-700 mt-0.5 px-1">{m.timestamp}</p>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-center gap-2 pl-8">
                      <div className="flex gap-1 px-3 py-2 rounded-xl bg-white/4 border border-white/6">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSend() }}
                  className="p-3 flex items-center gap-2 border-t border-white/6"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isTyping}
                    placeholder={`Ask about ${currentPageLabel}...`}
                    className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-purple-500/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={startVoice}
                    className={`p-2 rounded-xl transition-all ${
                      isListening ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="p-2 rounded-xl bg-purple-600 text-white disabled:opacity-30 hover:bg-purple-700 transition-all"
                  >
                    {isTyping ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
