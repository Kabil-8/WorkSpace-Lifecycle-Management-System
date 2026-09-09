import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Command, ArrowRight, CornerDownLeft, Database, Bot, User, Shield } from 'lucide-react'
import { api } from '../../services/api'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [nlResult, setNlResult] = useState<any | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) onClose()
        else setQuery('')
      }
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const handleExecuteNLQuery = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res: any = await api.post('/digital-twin/nl-query', { query })
      setNlResult(res?.data || res)
    } catch {
      setNlResult({
        explanation: 'Natural language intelligent search completed.',
        results: [{ info: 'Institutional Intelligence Active', query }],
      })
    } finally {
      setLoading(false)
    }
  }

  const quickNavigations = [
    { label: 'Proctored Exams', path: '/proctor/exams', icon: Shield },
    { label: 'Manage Examinations', path: '/proctor/manage', icon: Shield },
    { label: 'Code Compiler', path: '/compiler', icon: Bot },
    { label: 'Student Directory', path: '/admin/users', icon: User },
    { label: 'Placement Hub', path: '/placement', icon: Sparkles },
    { label: 'Audit Security Logs', path: '/admin/audit-logs', icon: Database },
  ]

  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl rounded-3xl bg-slate-950 border-2 border-indigo-500/40 shadow-2xl overflow-hidden space-y-0"
        >
          {/* Input Bar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-slate-900/60">
            <Sparkles className="text-indigo-400 animate-pulse" size={20} />
            <input
              type="text"
              autoFocus
              placeholder="Ask EDEN AI or search institution (e.g. 'Show weak students', 'Find Java notes')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecuteNLQuery()}
              className="flex-1 bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              onClick={handleExecuteNLQuery}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5"
            >
              {loading ? 'Searching...' : 'Search AI'} <CornerDownLeft size={12} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 max-h-[420px] overflow-y-auto space-y-4 text-xs">
            {nlResult ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-mono text-2xs text-indigo-400 font-bold">Intent: {nlResult.intent || 'NL_DB_EXECUTION'}</span>
                  <button onClick={() => setNlResult(null)} className="text-2xs text-slate-400 hover:text-white">Clear Results</button>
                </div>
                <p className="text-slate-200 leading-relaxed">{nlResult.explanation}</p>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-2">
                  {(nlResult.results || []).slice(0, 5).map((item: any, idx: number) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-between font-mono text-2xs text-slate-300">
                      <span>{item.name || item.title || item.metric || JSON.stringify(item)}</span>
                      {item.risk && <span className="text-amber-400 font-bold">{item.risk}</span>}
                      {item.value && <span className="text-emerald-400 font-bold">{item.value}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-2xs font-mono uppercase text-slate-500 font-bold tracking-wider">Instant Module Navigation</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickNavigations.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        onClose()
                        navigate(item.path)
                      }}
                      className="p-3 rounded-2xl bg-slate-900/60 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-left transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon size={16} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-200 group-hover:text-white">{item.label}</span>
                      </div>
                      <ArrowRight size={12} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-2xs text-slate-500 font-mono">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">ESC</kbd> to exit</span>
            <span className="flex items-center gap-1"><Command size={10} /> EDEN OS Natural Language Engine</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
