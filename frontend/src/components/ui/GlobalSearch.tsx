import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, BookOpen, FileText, Briefcase, Users, MessageSquare, Loader2 } from 'lucide-react'
import { searchService } from '../../services/searchService'
import { useNavigate } from 'react-router-dom'

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({})
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchService.globalSearch(query.trim())
        setResults(res.data || {})
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card p-4 max-w-xl w-full border-2 border-blue-500/40 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <Search size={18} className="text-blue-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search students, teachers, courses, assignments, jobs..."
                className="bg-transparent text-sm text-white focus:outline-none w-full"
              />
              {loading && <Loader2 className="animate-spin text-blue-400" size={16} />}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 pr-1 text-xs">
              {results.courses?.length > 0 && (
                <div>
                  <p className="font-bold text-slate-400 mb-1 flex items-center gap-1.5"><BookOpen size={12} /> Courses</p>
                  {results.courses.map((c: any) => (
                    <div key={c._id} onClick={() => handleSelect('/courses')} className="p-2 rounded-lg bg-white/5 hover:bg-blue-600/20 cursor-pointer flex justify-between items-center">
                      <span className="font-semibold text-white">{c.title}</span>
                      <span className="text-2xs text-slate-400">{c.instructorName}</span>
                    </div>
                  ))}
                </div>
              )}

              {results.jobs?.length > 0 && (
                <div>
                  <p className="font-bold text-slate-400 mb-1 flex items-center gap-1.5"><Briefcase size={12} /> Jobs</p>
                  {results.jobs.map((j: any) => (
                    <div key={j._id} onClick={() => handleSelect('/jobs')} className="p-2 rounded-lg bg-white/5 hover:bg-emerald-600/20 cursor-pointer flex justify-between items-center">
                      <span className="font-semibold text-white">{j.title}</span>
                      <span className="text-2xs text-emerald-400">{j.company}</span>
                    </div>
                  ))}
                </div>
              )}

              {results.users?.length > 0 && (
                <div>
                  <p className="font-bold text-slate-400 mb-1 flex items-center gap-1.5"><Users size={12} /> People</p>
                  {results.users.map((u: any) => (
                    <div key={u._id} onClick={() => handleSelect('/admin/users')} className="p-2 rounded-lg bg-white/5 hover:bg-purple-600/20 cursor-pointer flex justify-between items-center">
                      <span className="font-semibold text-white">{u.name} ({u.role})</span>
                      <span className="text-2xs text-slate-400">{u.department}</span>
                    </div>
                  ))}
                </div>
              )}

              {results.assignments?.length > 0 && (
                <div>
                  <p className="font-bold text-slate-400 mb-1 flex items-center gap-1.5"><FileText size={12} /> Assignments</p>
                  {results.assignments.map((a: any) => (
                    <div key={a._id} onClick={() => handleSelect('/assignments')} className="p-2 rounded-lg bg-white/5 hover:bg-amber-600/20 cursor-pointer flex justify-between items-center">
                      <span className="font-semibold text-white">{a.title}</span>
                      <span className="text-2xs text-amber-400">{a.courseName}</span>
                    </div>
                  ))}
                </div>
              )}

              {results.forum?.length > 0 && (
                <div>
                  <p className="font-bold text-slate-400 mb-1 flex items-center gap-1.5"><MessageSquare size={12} /> Forum Posts</p>
                  {results.forum.map((f: any) => (
                    <div key={f._id} onClick={() => handleSelect('/forum')} className="p-2 rounded-lg bg-white/5 hover:bg-cyan-600/20 cursor-pointer flex justify-between items-center">
                      <span className="font-semibold text-white">{f.title}</span>
                      <span className="text-2xs text-cyan-400">{f.authorName}</span>
                    </div>
                  ))}
                </div>
              )}

              {query.length >= 2 && !loading && Object.keys(results).length === 0 && (
                <div className="text-center py-6 text-slate-400">
                  No matching records found for "{query}".
                </div>
              )}
            </div>

            <div className="text-2xs text-slate-500 flex justify-between border-t border-white/10 pt-2">
              <span>Press <kbd className="px-1 bg-slate-800 rounded">ESC</kbd> to close</span>
              <span>Global Search v2.0 (MongoDB Indexed)</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
