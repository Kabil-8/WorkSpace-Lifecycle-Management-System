import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Share2, Sparkles, FileText, Brain, Lock, Loader2 } from 'lucide-react'
import { formatRelativeTime } from '../../lib/utils'
import { api } from '../../services/api'

export default function SmartNotesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedNote, setSelectedNote] = useState<any | null>(null)

  // New Note Modal / Input
  const [showNewModal, setShowNewModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCourse, setNewCourse] = useState('Computer Science')

  const { data: notesData, isLoading } = useQuery({
    queryKey: ['smartNotesList'],
    queryFn: async () => {
      const res: any = await api.get('/notes')
      return res?.data || res || []
    },
  })

  const createNoteMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; courseName: string }) => {
      const res: any = await api.post('/notes', data)
      return res
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['smartNotesList'] })
      setSelectedNote(res?.data)
      setShowNewModal(false)
      setNewTitle('')
      setNewContent('')
    },
  })

  const notes = notesData?.length > 0 ? notesData : [
    {
      _id: 'n1',
      title: 'React 19 Concurrent Features & Hooks',
      content: 'Notes on useTransition, useDeferredValue, and Suspense improvements in modern web development.',
      tags: ['React', 'TypeScript'],
      courseName: 'Advanced Web Architecture',
      updatedAt: new Date(),
      isPublic: false,
      aiSummary: 'React 19 introduces improved concurrent rendering with hooks like useTransition.',
    },
  ]

  const activeNote = selectedNote || notes[0]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="flex h-[calc(100vh-9rem)] gap-4">
        {/* Sidebar */}
        <div className="w-72 flex flex-col gap-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white">Smart Notes</h1>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: 'linear-gradient(135deg, #2563EB, #6366F1)', color: 'var(--text-primary)' }}>
              <Plus size={14} /> New
            </motion.button>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..." className="input pl-9 text-xs py-2" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 hide-scrollbar">
            {notes.filter((n: any) => !search || n.title.toLowerCase().includes(search.toLowerCase())).map((note: any) => (
              <motion.div key={note._id || note.id} whileHover={{ x: 3 }} onClick={() => setSelectedNote(note)}
                className="p-3 rounded-xl cursor-pointer transition-all"
                style={{
                  background: activeNote?._id === note._id ? 'rgba(37,99,235,0.1)' : 'rgba(var(--rgb-white),0.03)',
                  border: `1px solid ${activeNote?._id === note._id ? 'rgba(37,99,235,0.2)' : 'transparent'}`,
                }}>
                <div className="flex items-center gap-2 mb-1">
                  {note.isPublic ? <Share2 size={12} className="text-emerald-400" /> : <Lock size={12} style={{ color: 'var(--text-muted)' }} />}
                  <p className="text-xs font-semibold text-white truncate">{note.title}</p>
                </div>
                <p className="text-2xs truncate" style={{ color: 'var(--text-muted)' }}>{note.courseName}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(note.tags || ['Study']).slice(0, 2).map((tag: string) => (
                    <span key={tag} className="text-2xs px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(37,99,235,0.1)', color: '#60A5FA' }}>{tag}</span>
                  ))}
                </div>
                <p className="text-2xs mt-1" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(note.updatedAt || new Date())}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {activeNote ? (
            <>
              <div className="card p-5 flex-1 flex flex-col overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{activeNote.title}</h2>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{activeNote.courseName} · {formatRelativeTime(activeNote.updatedAt || new Date())}</p>
                    <div className="flex gap-1.5 mt-2">
                      {(activeNote.tags || ['Core']).map((tag: string) => (
                        <span key={tag} className="badge-blue text-2xs">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}>
                      <Brain size={14} className="inline mr-1" /> Generate Flashcards
                    </button>
                    <button className="px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: '#34D399', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <Share2 size={14} className="inline mr-1" /> Share
                    </button>
                  </div>
                </div>

                {/* AI Summary */}
                {activeNote.aiSummary && (
                  <div className="p-3 rounded-xl mb-4 flex items-start gap-2"
                    style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <Sparkles size={14} className="text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-2xs font-semibold text-purple-400 mb-0.5">EDEN AI Summary</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{activeNote.aiSummary}</p>
                    </div>
                  </div>
                )}

                <textarea
                  className="flex-1 resize-none outline-none text-sm leading-relaxed"
                  style={{ background: 'transparent', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                  defaultValue={activeNote.content}
                  placeholder="Start writing..."
                />
              </div>
            </>
          ) : (
            <div className="card flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText size={48} className="mx-auto text-blue-400 mb-3" />
                <p className="font-semibold text-white">Select a note to view</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Note Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-950 border-2 border-indigo-500/40 p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Create New Smart Note</h3>
            <div className="space-y-3 text-xs">
              <input
                type="text"
                placeholder="Note Title"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Course Subject"
                value={newCourse}
                onChange={e => setNewCourse(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
              <textarea
                placeholder="Note Content & Concepts..."
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                className="w-full h-32 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowNewModal(false)} className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
                <button
                  disabled={!newTitle || !newContent || createNoteMutation.isPending}
                  onClick={() => createNoteMutation.mutate({ title: newTitle, content: newContent, courseName: newCourse })}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {createNoteMutation.isPending ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
