import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  ThumbsUp, MessageSquare, Eye, Plus,
  Search, X, Send, Loader2,
} from 'lucide-react'

import { forumService } from '../../services/forumService'
import { formatRelativeTime } from '../../lib/utils'
import { useAppSelector } from '../../hooks/useStore'

const CATEGORY_COLORS: Record<string, string> = {
  doubt: '#EF4444',
  discussion: '#2563EB',
  announcement: '#F59E0B',
  resource: '#10B981',
  project: '#8B5CF6',
  placement: '#06B6D4',
  general: '#94A3B8',
}

export default function DiscussionForumPage() {
  const { user } = useAppSelector(s => s.auth)
  const userName = user?.name || 'Student'
  const userRole = user?.role || 'student'

  const [category, setCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [askModalOpen, setAskModalOpen] = useState(false)
  const [viewPost, setViewPost] = useState<any>(null)

  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('discussion')
  const [newContent, setNewContent] = useState('')
  const [commentInput, setCommentInput] = useState('')

  const { data: forumData, isLoading, refetch } = useQuery({
    queryKey: ['forumPosts', category, searchTerm],
    queryFn: () => forumService.getPosts({
      category: category !== 'all' ? category : undefined,
      search: searchTerm.trim() || undefined,
    }),
  })

  const posts = Array.isArray(forumData) ? forumData : (forumData?.data || [])


  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) return

    try {
      await forumService.createPost({
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        tags: [newCategory, 'discussion'],
      })
      setNewTitle('')
      setNewContent('')
      setAskModalOpen(false)
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentInput.trim() || !viewPost) return

    try {
      await forumService.replyToPost(viewPost._id || viewPost.id, { content: commentInput.trim() })

      setCommentInput('')
      refetch()
      setViewPost((prev: any) => ({
        ...prev,
        replies: [
          ...(prev.replies || []),
          { authorName: userName, authorRole: userRole, content: commentInput.trim(), createdAt: new Date() },
        ],
      }))
    } catch (err) {
      console.error(err)
    }
  }

  const handleLike = async (postId: string) => {
    try {
      await forumService.likePost(postId)
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="page-container space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-extrabold flex items-center gap-2.5" style={{ color: 'var(--foreground)' }}>
            <MessageSquare className="text-blue-500" /> Discussion Forum
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>300 Real Forum Posts from MongoDB — ask questions, answer peers, gain XP</p>
        </motion.div>

        <button
          onClick={() => setAskModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 shrink-0 shadow-lg cursor-pointer"
        >
          <Plus size={16} /> Ask Question
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search MongoDB forum topics or tags..."
            className="input w-full pl-10 pr-4 py-2 text-xs rounded-xl font-semibold"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          {['all', 'doubt', 'discussion', 'announcement', 'resource', 'placement'].map(cat => (
            <button
              key={cat} onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer border shrink-0 ${
                category === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
              }`}
            >
              {cat === 'all' ? 'All Topics' : cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post: any, i: number) => (
            <motion.div
              key={post._id || post.id || i}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="card p-5 space-y-3 border border-indigo-500/20 hover:border-blue-500/40 cursor-pointer"
              onClick={() => { setViewPost(post); forumService.incrementViews(post._id || post.id) }}
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 shrink-0 p-2.5 rounded-xl border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                  <button onClick={(e) => { e.stopPropagation(); handleLike(post._id || post.id) }} className="text-slate-400 hover:text-blue-500 cursor-pointer">
                    <ThumbsUp size={15} />
                  </button>
                  <span className="text-xs font-black" style={{ color: 'var(--foreground)' }}>{post.likes?.length || 0}</span>
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-2xs px-2.5 py-0.5 rounded-full font-bold capitalize"
                      style={{ background: `${CATEGORY_COLORS[post.category] || '#94A3B8'}20`, color: CATEGORY_COLORS[post.category] || '#94A3B8' }}
                    >
                      {post.category || 'general'}
                    </span>
                    {(post.tags || []).map((tag: string) => (
                      <span key={tag} className="text-2xs px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold border border-indigo-500/20">#{tag}</span>
                    ))}
                  </div>

                  <h3 className="font-extrabold text-sm hover:text-blue-500 transition-colors leading-snug" style={{ color: 'var(--foreground)' }}>{post.title}</h3>
                  <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{post.content}</p>

                  <div className="flex items-center justify-between pt-2 text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                    <div className="flex items-center gap-3">
                      <span className="font-bold" style={{ color: 'var(--foreground)' }}>{post.authorName || 'Student'} ({post.authorRole || 'student'})</span>
                      <span className="flex items-center gap-1"><MessageSquare size={12} /> {post.replies?.length || 0} replies</span>
                      <span className="flex items-center gap-1"><Eye size={12} /> {post.views || 0} views</span>
                    </div>
                    <span className="font-mono">{formatRelativeTime(new Date(post.createdAt || Date.now()))}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Ask Modal */}
      <AnimatePresence>
        {askModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="card p-6 max-w-lg w-full space-y-4 border-2 border-blue-500/40" style={{ background: 'var(--card)', color: 'var(--card-foreground)' }}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--foreground)' }}><Plus size={16} className="text-blue-500" /> Post a Question to MongoDB</h3>
                <button onClick={() => setAskModalOpen(false)} className="text-slate-400 hover:text-blue-500 cursor-pointer"><X size={16} /></button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-3">
                <div>
                  <label className="text-2xs font-bold block mb-1" style={{ color: 'var(--muted-foreground)' }}>Title *</label>
                  <input type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. How to structure MongoDB schemas?" className="input text-xs w-full p-3 font-semibold" />
                </div>

                <div>
                  <label className="text-2xs font-bold block mb-1" style={{ color: 'var(--muted-foreground)' }}>Category</label>
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="input text-xs w-full p-3 capitalize font-semibold">
                    <option value="doubt">Doubt</option>
                    <option value="discussion">Discussion</option>
                    <option value="announcement">Announcement</option>
                    <option value="resource">Resource</option>
                    <option value="placement">Placement</option>
                  </select>
                </div>

                <div>
                  <label className="text-2xs font-bold block mb-1" style={{ color: 'var(--muted-foreground)' }}>Description *</label>
                  <textarea rows={4} required value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Explain your question in detail..." className="input text-xs w-full p-3 resize-none font-semibold" />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setAskModalOpen(false)} className="btn btn-secondary text-xs cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">Post Question</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* View Post Drawer */}
      <AnimatePresence>
        {viewPost && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <div className="card p-6 max-w-2xl w-full my-6 space-y-4 border-2 border-blue-500/40 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--card)', color: 'var(--card-foreground)' }}>
              <div className="flex items-start justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>{viewPost.title}</h2>
                  <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Asked by {viewPost.authorName || 'Student'}</p>
                </div>
                <button onClick={() => setViewPost(null)} className="text-slate-400 hover:text-blue-500 cursor-pointer"><X size={18} /></button>
              </div>

              <div className="p-4 rounded-xl border text-xs leading-relaxed" style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                {viewPost.content}
              </div>

              <div className="space-y-3 pt-3 border-t border-white/10">
                <h4 className="text-xs font-bold text-white">Replies ({(viewPost.replies || []).length})</h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(viewPost.replies || []).map((r: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700 text-xs text-slate-300">
                      <p className="font-semibold text-white text-2xs mb-1">{r.authorName || 'User'} ({r.authorRole || 'student'})</p>
                      <p>{r.content}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                  <input type="text" required value={commentInput} onChange={e => setCommentInput(e.target.value)} placeholder="Write your solution..." className="input text-xs flex-1 p-3" />
                  <button type="submit" className="px-5 py-3 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5"><Send size={14} /> Reply</button>
                </form>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
