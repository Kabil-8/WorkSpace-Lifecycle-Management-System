import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Search, X, CheckCircle2, Layers
} from 'lucide-react'
import type { KanbanTask, TaskStatus, TaskPriority } from '../../types'
import { getAvatarGradient, generateInitials } from '../../lib/utils'
import { useAppSelector } from '../../hooks/useStore'

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'backlog', label: '📋 Backlog', color: '#94A3B8' },
  { status: 'todo', label: '🔵 To Do', color: '#2563EB' },
  { status: 'in_progress', label: '🟡 In Progress', color: '#F59E0B' },
  { status: 'review', label: '🟣 Review', color: '#8B5CF6' },
  { status: 'done', label: '✅ Done', color: '#10B981' },
]

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#94A3B8',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
}

import { useQuery } from '@tanstack/react-query'
import { kanbanService } from '../../services/kanbanService'

export default function ProjectKanbanPage() {
  const { user } = useAppSelector(s => s.auth)
  const userName = user?.name || 'Candidate User'

  const { data: boardData } = useQuery({
    queryKey: ['kanbanBoard'],
    queryFn: kanbanService.getBoard,
  })

  const [tasks, setTasks] = useState<any[]>([])

  useEffect(() => {
    if (boardData && boardData.tasks) {
      setTasks(boardData.tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        status: t.status === 'done' ? 'done' : t.status === 'in_progress' ? 'in_progress' : t.status === 'review' ? 'review' : 'todo',
        priority: t.priority || 'medium',
        assignees: [{ id: t.assigneeId || user?.id, name: t.assigneeName || userName }],
        labels: t.tags || ['academic'],
        subtasks: [],
        attachments: [],
        createdAt: new Date(),
      })))
    }
  }, [boardData, user?.id, userName])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  // Modals
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null)

  // Form State for New Task
  const [titleInput, setTitleInput] = useState('')
  const [descInput, setDescInput] = useState('')
  const [statusInput, setStatusInput] = useState<TaskStatus>('todo')
  const [priorityInput, setPriorityInput] = useState<TaskPriority>('medium')
  const [labelInput, setLabelInput] = useState('')
  const subtasksInput = ['Setup repository', 'Write initial tests']

  // Subtask New Input inside Detail Modal
  const [newSubtaskText, setNewSubtaskText] = useState('')

  // ── Move Task Status ─────────────────────────────────────────
  const moveTask = (id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status, updatedAt: new Date() } : t))
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask(prev => prev ? { ...prev, status } : null)
    }
  }

  // ── Toggle Subtask ───────────────────────────────────────────
  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t
      const updatedSubs = (t.subtasks || []).map((s: any) => s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s)
      return { ...t, subtasks: updatedSubs }
    }))

    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev: any) => {
        if (!prev) return null
        const updatedSubs = (prev.subtasks || []).map((s: any) => s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s)
        return { ...prev, subtasks: updatedSubs }
      })
    }
  }

  // ── Add New Subtask inside Detail Modal ──────────────────────
  const handleAddSubtaskToTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtaskText.trim() || !selectedTask) return
    const newSub = {
      id: `sub-${Date.now()}`,
      title: newSubtaskText.trim(),
      isCompleted: false,
    }
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, subtasks: [...t.subtasks, newSub] } : t))
    setSelectedTask(prev => prev ? { ...prev, subtasks: [...prev.subtasks, newSub] } : null)
    setNewSubtaskText('')
  }

  // ── Delete Task ──────────────────────────────────────────────
  const handleDeleteTask = (id: string) => {
    if (window.confirm('Delete this task?')) {
      setTasks(prev => prev.filter(t => t.id !== id))
      setSelectedTask(null)
    }
  }

  // ── Create New Task ──────────────────────────────────────────
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!titleInput.trim()) return

    const newTask: KanbanTask = {
      id: `task-${Date.now()}`,
      title: titleInput.trim(),
      description: descInput.trim(),
      status: statusInput,
      priority: priorityInput,
      assignees: [{ id: user?.id || 'u-user', name: userName }],
      labels: labelInput ? labelInput.split(',').map(l => l.trim()).filter(Boolean) : ['feature'],
      subtasks: subtasksInput.filter(Boolean).map((st, i) => ({
        id: `sub-${Date.now()}-${i}`,
        title: st,
        isCompleted: false,
      })),
      attachments: [],
      createdAt: new Date(),
    }

    setTasks(prev => [newTask, ...prev])
    setTitleInput('')
    setDescInput('')
    setAddTaskOpen(false)
  }

  // ── Filtered Tasks ───────────────────────────────────────────
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || (t.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority
    return matchesSearch && matchesPriority
  })

  return (
    <div className="page-container space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
            <Layers className="text-purple-500" /> Real-Time Project Kanban
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Sprint Board · Track tasks, drag status, and update subtasks in real time
          </p>
        </motion.div>

        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setAddTaskOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg shrink-0"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}>
          <Plus size={16} /> Create Task
        </motion.button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search task title or description..."
            className="input w-full pl-10 pr-4 py-2 text-xs rounded-xl"
          />
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-xl w-full sm:w-auto"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          {(['all', 'low', 'medium', 'high', 'critical'] as const).map(p => (
            <button key={p} onClick={() => setFilterPriority(p)}
              className={`px-3 py-1 rounded-lg text-2xs font-bold capitalize transition-all ${filterPriority === p ? 'bg-purple-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar min-h-[calc(100vh-16rem)]">
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.status)
          return (
            <div key={col.status} className="flex-shrink-0 w-72 flex flex-col gap-3 rounded-2xl p-3"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>

              {/* Column Header */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: col.color }}>
                  {col.label}
                </span>
                <span className="text-2xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: `${col.color}20`, color: col.color }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                {colTasks.map(task => {
                  const completedSubs = (task.subtasks || []).filter((s: any) => s.isCompleted).length
                  const pColor = PRIORITY_COLORS[task.priority as TaskPriority] || '#F59E0B'
                  return (
                    <motion.div key={task.id} layout onClick={() => setSelectedTask(task)}
                      whileHover={{ y: -2 }}
                      className="card p-4 cursor-pointer space-y-3 border-t-4 transition-all"
                      style={{ borderTopColor: pColor }}>

                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                          {task.title}
                        </p>
                      </div>

                      {task.description && (
                        <p className="text-2xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                          {task.description}
                        </p>
                      )}

                      {/* Subtasks Progress */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-2xs" style={{ color: 'var(--text-muted)' }}>
                            <span>Subtasks</span>
                            <span className="font-bold">{completedSubs}/{task.subtasks.length}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${(completedSubs / task.subtasks.length) * 100}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Bottom Row */}
                      <div className="flex items-center justify-between pt-1 text-2xs">
                        <div className="flex -space-x-1">
                          {(task.assignees || []).map((a: any) => {
                            const [c1, c2] = getAvatarGradient(a.name)
                            return (
                              <div key={a.id} className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-white text-[9px] shadow"
                                style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                                {generateInitials(a.name)}
                              </div>
                            )
                          })}
                        </div>

                        <span className="px-2 py-0.5 rounded-full font-bold capitalize"
                          style={{ background: `${pColor}20`, color: pColor }}>
                          {task.priority}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}

                {colTasks.length === 0 && (
                  <div className="p-6 text-center text-2xs border border-dashed rounded-xl"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    No tasks in {col.status}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── CREATE TASK MODAL ───────────────────────────────────────────── */}
      <AnimatePresence>
        {addTaskOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="card p-6 max-w-lg w-full space-y-4 border-2 border-purple-500/40 shadow-2xl">

              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Plus size={16} className="text-purple-400" /> Create Kanban Task
                </h3>
                <button onClick={() => setAddTaskOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3">
                <div>
                  <label className="text-2xs font-bold block mb-1 text-slate-400">Task Title *</label>
                  <input type="text" required value={titleInput} onChange={e => setTitleInput(e.target.value)}
                    placeholder="e.g. Implement WebSocket authentication" className="input text-xs w-full p-3 rounded-xl" />
                </div>

                <div>
                  <label className="text-2xs font-bold block mb-1 text-slate-400">Description</label>
                  <textarea rows={3} value={descInput} onChange={e => setDescInput(e.target.value)}
                    placeholder="Provide task details..." className="input text-xs w-full p-3 rounded-xl resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-2xs font-bold block mb-1 text-slate-400">Column Status</label>
                    <select value={statusInput} onChange={e => setStatusInput(e.target.value as any)}
                      className="input text-xs w-full p-3 rounded-xl">
                      <option value="backlog">Backlog</option>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-2xs font-bold block mb-1 text-slate-400">Priority</label>
                    <select value={priorityInput} onChange={e => setPriorityInput(e.target.value as any)}
                      className="input text-xs w-full p-3 rounded-xl">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-2xs font-bold block mb-1 text-slate-400">Labels (comma-separated)</label>
                  <input type="text" value={labelInput} onChange={e => setLabelInput(e.target.value)}
                    placeholder="frontend, auth, feature" className="input text-xs w-full p-3 rounded-xl" />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setAddTaskOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-700 text-slate-300">
                    Cancel
                  </button>
                  <button type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700">
                    Save Task
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TASK DETAIL / EDIT MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="card p-6 max-w-lg w-full space-y-4 border-2 border-purple-500/40 shadow-2xl">

              <div className="flex items-start justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <span className="text-2xs px-2 py-0.5 rounded-full font-bold uppercase"
                    style={{ background: `${PRIORITY_COLORS[selectedTask.priority]}20`, color: PRIORITY_COLORS[selectedTask.priority] }}>
                    {selectedTask.priority} priority
                  </span>
                  <h3 className="font-bold text-base text-white mt-1">{selectedTask.title}</h3>
                </div>
                <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Status Switcher */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">Status Column:</span>
                <select
                  value={selectedTask.status}
                  onChange={e => moveTask(selectedTask.id, e.target.value as TaskStatus)}
                  className="input text-xs px-3 py-1.5 rounded-xl font-bold">
                  <option value="backlog">Backlog</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                {selectedTask.description || 'No detailed description provided.'}
              </p>

              {/* Interactive Subtasks List */}
              <div className="space-y-2">
                <p className="text-2xs font-bold text-purple-400 uppercase tracking-wider">
                  Interactive Subtasks ({selectedTask.subtasks.filter(s => s.isCompleted).length}/{selectedTask.subtasks.length})
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedTask.subtasks.map(s => (
                    <div key={s.id} onClick={() => toggleSubtask(selectedTask.id, s.id)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                        s.isCompleted ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 line-through' : 'bg-slate-800/40 border-slate-700/60 text-slate-200'
                      }`}>
                      <CheckCircle2 size={14} className={s.isCompleted ? 'text-emerald-400' : 'text-slate-600'} />
                      <span className="text-xs font-semibold flex-1">{s.title}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddSubtaskToTask} className="flex gap-2 pt-1">
                  <input type="text" value={newSubtaskText} onChange={e => setNewSubtaskText(e.target.value)}
                    placeholder="Add subtask item..." className="input text-xs flex-1 p-2 rounded-xl" />
                  <button type="submit" className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700">
                    Add
                  </button>
                </form>
              </div>

              {/* Footer Delete Action */}
              <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button onClick={() => handleDeleteTask(selectedTask.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30">
                  <Trash2 size={14} /> Delete Task
                </button>
                <button onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-700 text-white">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
