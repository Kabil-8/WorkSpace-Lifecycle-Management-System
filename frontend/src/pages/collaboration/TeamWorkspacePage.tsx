import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Hash, Users, Video, Paperclip, Plus, Mic, MicOff,
  Volume2, VolumeX, X
} from 'lucide-react'
import { formatRelativeTime, generateInitials, getAvatarGradient } from '../../lib/utils'
import { useAppSelector } from '../../hooks/useStore'

export interface Channel {
  id: string
  name: string
  type: 'text' | 'voice' | 'announcement'
  unread: number
}

export interface WorkspaceMessage {
  id: string
  channelId: string
  sender: { id: string; name: string; avatar?: string }
  content: string
  type: 'text' | 'file' | 'image' | 'code' | 'system'
  fileName?: string
  createdAt: Date | string
  reactions?: { emoji: string; count: number; users?: string[] }[]
}

const INITIAL_CHANNELS: Channel[] = [
  { id: 'ch-001', name: 'general', type: 'text', unread: 0 },
  { id: 'ch-002', name: 'backend-api', type: 'text', unread: 0 },
  { id: 'ch-003', name: 'frontend-ui', type: 'text', unread: 0 },
  { id: 'ch-004', name: 'stand-up', type: 'voice', unread: 0 },
  { id: 'ch-005', name: 'announcements', type: 'announcement', unread: 0 },
]

const INITIAL_MEMBERS = [
  { name: 'Active Collaborator 1', status: 'online', role: 'Fullstack Dev' },
  { name: 'Active Collaborator 2', status: 'online', role: 'Backend Lead' },
  { name: 'Active Collaborator 3', status: 'away', role: 'UI/UX Designer' },
]

export default function TeamWorkspacePage() {
  const { user } = useAppSelector(s => s.auth)
  const userName = user?.name || 'Candidate User'

  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS)
  const [activeChannel, setActiveChannel] = useState<Channel>(INITIAL_CHANNELS[0])
  const [messages, setMessages] = useState<WorkspaceMessage[]>(() => {
    const key = `workspace_messages_${user?.id || 'guest'}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try { return JSON.parse(saved) } catch {}
    }
    return [
      {
        id: 'msg-1',
        channelId: 'ch-001',
        sender: { id: user?.id || 'u-1', name: userName },
        content: `Welcome to the EduSphere Team Workspace, ${userName}! Post your project updates or discuss with team members.`,
        type: 'text',
        createdAt: new Date(),
      },
    ]
  })

  useEffect(() => {
    const key = `workspace_messages_${user?.id || 'guest'}`
    localStorage.setItem(key, JSON.stringify(messages))
  }, [messages, user?.id])

  const [msgInput, setMsgInput] = useState('')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)

  // Voice Mode State
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isAudioDeafened, setIsAudioDeafened] = useState(false)
  const [isInVoiceCall, setIsInVoiceCall] = useState(false)

  // Add Channel Modal
  const [addChannelOpen, setAddChannelOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice' | 'announcement'>('text')

  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeChannel])

  // ── Send Message ───────────────────────────────────────────────
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!msgInput.trim() && !attachedFile) return

    const newMsg: WorkspaceMessage = {
      id: `msg-${Date.now()}`,
      channelId: activeChannel.id,
      sender: { id: user?.id || 'u-user', name: userName },
      content: msgInput.trim() || (attachedFile ? `Shared file: ${attachedFile.name}` : ''),
      type: attachedFile ? 'file' : 'text',
      fileName: attachedFile?.name,
      createdAt: new Date(),
      reactions: [],
    }

    setMessages(prev => [...prev, newMsg])
    setMsgInput('')
    setAttachedFile(null)
  }

  // ── React to Message ───────────────────────────────────────────
  const handleReaction = (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m
      const existing = m.reactions || []
      const found = existing.find(r => r.emoji === emoji)
      let nextReactions
      if (found) {
        nextReactions = existing.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r)
      } else {
        nextReactions = [...existing, { emoji, count: 1, users: [userName] }]
      }
      return { ...m, reactions: nextReactions }
    }))
  }

  // ── Add Channel ────────────────────────────────────────────────
  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChannelName.trim()) return
    const cleanName = newChannelName.toLowerCase().replace(/\s+/g, '-')
    const newChan: Channel = {
      id: `ch-${Date.now()}`,
      name: cleanName,
      type: newChannelType,
      unread: 0,
    }
    setChannels(prev => [...prev, newChan])
    setActiveChannel(newChan)
    setNewChannelName('')
    setAddChannelOpen(false)
  }

  // ── File Upload ────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setAttachedFile(file)
  }

  const channelMessages = messages.filter(m => m.channelId === activeChannel.id)

  return (
    <div className="flex h-[calc(100vh-4.5rem)] rounded-2xl overflow-hidden border shadow-xl"
      style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>

      {/* ── LEFT SIDEBAR: CHANNELS & MEMBERS ───────────────────────── */}
      <div className="w-60 flex flex-col flex-shrink-0 border-r"
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}>

        {/* Workspace Title */}
        <div className="px-4 py-3.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>EduSphere Dev Team</p>
            <p className="text-2xs font-semibold text-emerald-400">● {INITIAL_MEMBERS.length} Active Members</p>
          </div>
          <button onClick={() => setAddChannelOpen(true)} title="Create Channel"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
            <Plus size={16} />
          </button>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <p className="text-2xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>CHANNELS</p>
              <button onClick={() => setAddChannelOpen(true)} className="text-2xs text-blue-400 hover:underline">+ Add</button>
            </div>
            <div className="space-y-0.5">
              {channels.map(ch => {
                const isActive = activeChannel.id === ch.id
                return (
                  <button key={ch.id} onClick={() => setActiveChannel(ch)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}>
                    {ch.type === 'voice' ? <Video size={14} className="text-purple-400" /> : ch.type === 'announcement' ? <Users size={14} className="text-amber-400" /> : <Hash size={14} className="text-blue-400" />}
                    <span className="flex-1 text-left truncate">{ch.name}</span>
                    {ch.unread > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-2xs font-extrabold">
                        {ch.unread}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Online Members */}
          <div>
            <p className="px-2 mb-2 text-2xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              TEAM MEMBERS ({INITIAL_MEMBERS.length})
            </p>
            <div className="space-y-1">
              {INITIAL_MEMBERS.map(m => {
                const [c1, c2] = getAvatarGradient(m.name)
                return (
                  <div key={m.name} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/40">
                    <div className="relative">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-2xs font-bold text-white shadow"
                        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                        {generateInitials(m.name)}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                        m.status === 'online' ? 'bg-emerald-400' : m.status === 'away' ? 'bg-amber-400' : 'bg-slate-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                      <p className="text-2xs truncate text-slate-500">{m.role}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* User Status Bar at bottom */}
        <div className="p-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
              {generateInitials(userName)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{userName}</p>
              <p className="text-2xs text-emerald-400 font-semibold">● Online</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsMicMuted(p => !p)}
              className={`p-1.5 rounded-lg transition-all ${isMicMuted ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white'}`}>
              {isMicMuted ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
            <button onClick={() => setIsAudioDeafened(p => !p)}
              className={`p-1.5 rounded-lg transition-all ${isAudioDeafened ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white'}`}>
              {isAudioDeafened ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CHAT AREA ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Channel Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5">
            {activeChannel.type === 'voice' ? <Video className="text-purple-400" size={18} /> : <Hash className="text-blue-400" size={18} />}
            <div>
              <h2 className="font-extrabold text-sm" style={{ color: 'var(--text-primary)' }}>{activeChannel.name}</h2>
              <p className="text-2xs text-slate-500">Real-time team collaboration channel</p>
            </div>
          </div>

          {activeChannel.type === 'voice' && (
            <button onClick={() => setIsInVoiceCall(p => !p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                isInVoiceCall ? 'bg-red-600 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}>
              <Video size={14} /> {isInVoiceCall ? 'Leave Voice Room' : 'Join Voice Room'}
            </button>
          )}
        </div>

        {/* Voice Room Live Indicator Banner */}
        {activeChannel.type === 'voice' && isInVoiceCall && (
          <div className="p-4 bg-purple-900/30 border-b border-purple-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-ping" />
              <span className="text-xs font-bold text-purple-300">VOICE ROOM ACTIVE — Speaking as {userName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xs text-purple-400 font-mono">Audio Stream Bitrate: 128kbps</span>
            </div>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {channelMessages.map((m, i) => {
            const [c1, c2] = getAvatarGradient(m.sender.name)
            const isOwn = m.sender.name === userName

            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 shadow"
                  style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                  {generateInitials(m.sender.name)}
                </div>

                <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="flex items-center gap-2 mb-1">
                    {!isOwn && <span className="text-xs font-bold text-white">{m.sender.name}</span>}
                    <span className="text-2xs text-slate-500">{formatRelativeTime(m.createdAt)}</span>
                  </div>

                  <div className="px-4 py-2.5 rounded-2xl text-xs leading-relaxed"
                    style={{
                      background: isOwn ? 'linear-gradient(135deg, #2563EB, #6366F1)' : 'var(--bg-secondary)',
                      color: isOwn ? '#fff' : 'var(--text-primary)',
                      border: isOwn ? 'none' : '1px solid var(--border)',
                      borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    }}>
                    {m.content}
                    {m.type === 'file' && m.fileName && (
                      <div className="mt-2 p-2 rounded-lg bg-black/20 border border-white/20 flex items-center gap-2">
                        <Paperclip size={14} />
                        <span className="font-mono text-2xs underline">{m.fileName}</span>
                      </div>
                    )}
                  </div>

                  {/* Reaction Buttons */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {m.reactions?.map(r => (
                      <button key={r.emoji} onClick={() => handleReaction(m.id, r.emoji)}
                        className="text-2xs px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:border-blue-500">
                        {r.emoji} {r.count}
                      </button>
                    ))}
                    <div className="flex items-center gap-1">
                      {['👍', '🔥', '❤️', '🚀'].map(emoji => (
                        <button key={emoji} onClick={() => handleReaction(m.id, emoji)}
                          className="text-2xs opacity-50 hover:opacity-100 hover:scale-125 transition-all">
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-4 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
          {attachedFile && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-400 w-fit">
              <Paperclip size={14} />
              <span>{attachedFile.name}</span>
              <button type="button" onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-white ml-2">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            <label className="cursor-pointer text-slate-400 hover:text-white transition-colors">
              <Paperclip size={18} />
              <input type="file" onChange={handleFileChange} className="hidden" />
            </label>

            <input
              type="text"
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              placeholder={`Message #${activeChannel.name}...`}
              className="flex-1 bg-transparent text-xs border-none outline-none"
              style={{ color: 'var(--text-primary)' }}
            />

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit"
              disabled={!msgInput.trim() && !attachedFile}
              className="p-2 rounded-xl bg-blue-600 text-white disabled:opacity-30 hover:bg-blue-700 transition-all">
              <Send size={15} />
            </motion.button>
          </div>
        </form>
      </div>

      {/* ── CREATE CHANNEL MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {addChannelOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="card p-6 max-w-md w-full space-y-5 border-2 border-blue-500/40 shadow-2xl">

              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Plus size={16} className="text-blue-500" /> Create Workspace Channel
                </h3>
                <button onClick={() => setAddChannelOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateChannel} className="space-y-4">
                <div>
                  <label className="text-2xs font-bold block mb-1 text-slate-400">Channel Name</label>
                  <input
                    type="text"
                    required
                    value={newChannelName}
                    onChange={e => setNewChannelName(e.target.value)}
                    placeholder="e.g. sprint-planning"
                    className="input text-xs w-full p-3 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-2xs font-bold block mb-1 text-slate-400">Channel Type</label>
                  <select
                    value={newChannelType}
                    onChange={e => setNewChannelType(e.target.value as any)}
                    className="input text-xs w-full p-3 rounded-xl">
                    <option value="text">Hash Text Channel</option>
                    <option value="voice">Voice Call Room</option>
                    <option value="announcement">Announcement Broadcast</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setAddChannelOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-700 text-slate-300">
                    Cancel
                  </button>
                  <button type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700">
                    Create Channel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
