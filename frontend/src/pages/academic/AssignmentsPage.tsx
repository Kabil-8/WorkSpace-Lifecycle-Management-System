import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../hooks/useStore'
import { setPageContextData } from '../../store/edenSlice'
import {
  Search, Upload, Clock, ChevronDown, Loader2, Flame,
  BookOpen, ShieldCheck, Plus, Edit3, Trash2, CheckCircle2,
  AlertCircle, FileText, Award, Users, X
} from 'lucide-react'
import { assignmentService } from '../../services/assignmentService'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  todo:        { label: 'To Do',                          color: 'var(--muted-foreground)', bg: 'var(--muted)' },
  in_progress: { label: 'In Progress',                   color: 'var(--amber)',             bg: 'var(--warning-muted)' },
  submitted:   { label: 'Submitted & Pending Assessment', color: 'var(--primary)',           bg: 'var(--primary-muted)' },
  graded:      { label: 'Graded',                        color: 'var(--success)',           bg: 'var(--success-muted)' },
  overdue:     { label: 'Overdue',                       color: 'var(--destructive)',       bg: 'var(--destructive-muted)' },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; pulse?: boolean }> = {
  low:    { label: 'Low',    color: 'var(--muted-foreground)', bg: 'var(--muted)' },
  medium: { label: 'Medium', color: 'var(--amber)',            bg: 'var(--warning-muted)' },
  high:   { label: 'High',   color: 'var(--orange)',           bg: 'var(--orange-muted)' },
  urgent: { label: 'Urgent', color: 'var(--destructive)',      bg: 'var(--destructive-muted)', pulse: true },
}

interface AssignmentFormProps {
  initialData?: any
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function AssignmentModal({ initialData, isOpen, onClose, onSuccess }: AssignmentFormProps) {
  const isEditing = !!initialData?._id
  const [title, setTitle] = useState(initialData?.title || '')
  const [courseName, setCourseName] = useState(initialData?.courseName || '')
  const [department, setDepartment] = useState(initialData?.department || 'Computer Science & Engineering')
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate ? new Date(initialData.dueDate).toISOString().slice(0, 10) : new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  )
  const [maxMarks, setMaxMarks] = useState(initialData?.maxMarks || 100)
  const [priority, setPriority] = useState(initialData?.priority || 'medium')
  const [description, setDescription] = useState(initialData?.description || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setCourseName(initialData.courseName || '')
      setDepartment(initialData.department || 'Computer Science & Engineering')
      setDueDate(initialData.dueDate ? new Date(initialData.dueDate).toISOString().slice(0, 10) : '')
      setMaxMarks(initialData.maxMarks || 100)
      setPriority(initialData.priority || 'medium')
      setDescription(initialData.description || '')
    } else {
      setTitle('')
      setCourseName('')
      setDepartment('Computer Science & Engineering')
      setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
      setMaxMarks(100)
      setPriority('medium')
      setDescription('')
    }
    setError(null)
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    if (!courseName.trim()) { setError('Course name is required'); return }

    try {
      setLoading(true)
      setError(null)
      const payload = {
        title: title.trim(),
        courseName: courseName.trim(),
        department,
        dueDate: new Date(dueDate).toISOString(),
        maxMarks: Number(maxMarks) || 100,
        priority,
        description: description.trim(),
      }

      if (isEditing) {
        await assignmentService.updateAssignment(initialData._id, payload)
      } else {
        await assignmentService.createAssignment(payload)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="card w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6"
        style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
      >
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl" style={{ background: 'var(--primary-muted)', color: 'var(--primary)' }}>
              {isEditing ? <Edit3 size={18} /> : <Plus size={18} />}
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
                {isEditing ? 'Edit Assignment' : 'Create New Academic Assignment'}
              </h2>
              <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                {isEditing ? 'Update assignment parameters and deadline' : 'Post coursework for enrolled department students'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer">
            <X size={18} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl text-xs flex items-center gap-2" style={{ background: 'var(--destructive-muted)', color: 'var(--destructive)' }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>Assignment Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Distributed Caching Architecture & Redis Optimization"
              className="input w-full text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>Course Name *</label>
              <input
                type="text"
                value={courseName}
                onChange={e => setCourseName(e.target.value)}
                placeholder="e.g. Distributed Systems"
                className="input w-full text-xs"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="input w-full text-xs"
              >
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>Due Date *</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="input w-full text-xs"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>Max Marks</label>
              <input
                type="number"
                value={maxMarks}
                onChange={e => setMaxMarks(Number(e.target.value))}
                min={10}
                max={500}
                className="input w-full text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="input w-full text-xs"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent 🔥</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>Description &amp; Guidelines</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide assignment specifications, deliverables, and assessment criteria..."
              className="input w-full text-xs resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost text-xs cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : (isEditing ? <CheckCircle2 size={14} /> : <Plus size={14} />)}
              {isEditing ? 'Save Changes' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function SubmissionsReviewModal({
  assignment,
  isOpen,
  onClose,
  onGraded,
}: {
  assignment: any
  isOpen: boolean
  onClose: () => void
  onGraded: () => void
}) {
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null)
  const [grade, setGrade] = useState<number>(100)
  const [feedback, setFeedback] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const submissions = assignment?.submissions || []

  useEffect(() => {
    if (submissions.length > 0) {
      const first = submissions[0]
      setSelectedSubId(first._id || first.studentId)
      setGrade(first.grade !== undefined ? first.grade : assignment?.maxMarks || 100)
      setFeedback(first.feedback || '')
    }
  }, [assignment])

  if (!isOpen || !assignment) return null

  const activeSub = submissions.find((s: any) => (s._id || s.studentId) === selectedSubId) || submissions[0]

  const handleSelectSub = (sub: any) => {
    setSelectedSubId(sub._id || sub.studentId)
    setGrade(sub.grade !== undefined ? sub.grade : assignment.maxMarks || 100)
    setFeedback(sub.feedback || '')
    setError(null)
  }

  const handleGradeSubmit = async () => {
    if (!activeSub) return
    try {
      setSubmitting(true)
      setError(null)
      await assignmentService.gradeSubmission(assignment._id, {
        submissionId: activeSub._id || activeSub.studentId,
        grade: Number(grade),
        feedback: feedback.trim(),
      })
      onGraded()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Grading failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="card w-full max-w-3xl overflow-hidden shadow-2xl space-y-4 p-6 flex flex-col max-h-[85vh]"
        style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
      >
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl" style={{ background: 'var(--indigo-muted)', color: 'var(--indigo)' }}>
              <Users size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
                Submissions &amp; Grading: {assignment.title}
              </h2>
              <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                {submissions.length} student submission{submissions.length === 1 ? '' : 's'} · Max Marks: {assignment.maxMarks || 100}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer">
            <X size={18} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>

        {submissions.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <FileText size={32} className="mx-auto" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>No Submissions Yet</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Students in {assignment.department} have not submitted solutions yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-hidden">
            {/* Student List */}
            <div className="md:col-span-5 space-y-2 overflow-y-auto pr-1">
              <p className="text-2xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                Submitted Students ({submissions.length})
              </p>
              {submissions.map((sub: any) => {
                const isSelected = (sub._id || sub.studentId) === selectedSubId
                const isGraded = sub.grade !== undefined && sub.grade !== null
                return (
                  <div
                    key={sub._id || sub.studentId}
                    onClick={() => handleSelectSub(sub)}
                    className="p-3 rounded-xl cursor-pointer transition-all border"
                    style={{
                      background: isSelected ? 'var(--primary-muted)' : 'var(--muted)',
                      borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--foreground)' }}>{sub.studentName}</p>
                      {isGraded ? (
                        <span className="text-2xs px-2 py-0.5 rounded-full font-bold font-mono" style={{ background: 'var(--success-muted)', color: 'var(--success)' }}>
                          {sub.grade}/{assignment.maxMarks || 100}
                        </span>
                      ) : (
                        <span className="text-2xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--warning-muted)', color: 'var(--amber)' }}>
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-2xs mt-1 truncate" style={{ color: 'var(--muted-foreground)' }}>
                      📄 {sub.formattedFileName || sub.originalFileName || 'solution.pdf'}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Evaluation & Grading Form */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-3 p-4 rounded-xl border overflow-y-auto" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              {activeSub ? (
                <div className="space-y-3 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{activeSub.studentName}</h3>
                      <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                        Submitted on: {new Date(activeSub.submittedAt || Date.now()).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-lg font-mono font-bold" style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>
                      Max: {assignment.maxMarks || 100}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg space-y-1" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                    <p className="text-2xs font-bold" style={{ color: 'var(--foreground)' }}>Submitted Artifact:</p>
                    <p className="text-2xs font-mono truncate" style={{ color: 'var(--primary)' }}>
                      📄 {activeSub.formattedFileName || activeSub.originalFileName || 'solution.pdf'}
                    </p>
                    {activeSub.content && (
                      <p className="text-2xs italic pt-1" style={{ color: 'var(--muted-foreground)' }}>
                        "{activeSub.content}"
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="p-2 rounded-lg text-2xs flex items-center gap-1.5" style={{ background: 'var(--destructive-muted)', color: 'var(--destructive)' }}>
                      <AlertCircle size={13} /> {error}
                    </div>
                  )}

                  <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                        Award Marks (out of {assignment.maxMarks || 100}) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={assignment.maxMarks || 100}
                        value={grade}
                        onChange={e => setGrade(Number(e.target.value))}
                        className="input w-full text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                        Teacher Assessment Feedback
                      </label>
                      <textarea
                        rows={2}
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        placeholder="e.g. Excellent architectural analysis. High code quality and clean schema design."
                        className="input w-full text-xs resize-none"
                      />
                    </div>

                    <button
                      onClick={handleGradeSubmit}
                      disabled={submitting}
                      className="btn btn-primary w-full text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
                      Save Grade &amp; Send Feedback Notification
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function AssignmentCard({
  assignment,
  onEdit,
  onDelete,
  onOpenSubmissions,
  isDeleting,
}: {
  assignment: any
  onEdit: () => void
  onDelete: () => void
  onOpenSubmissions: () => void
  isDeleting?: boolean
}) {
  const navigate = useNavigate()
  const { user } = useAppSelector(s => s.auth)
  const isFaculty = ['faculty', 'admin', 'hod', 'super_admin'].includes(user?.role || '')

  const [expanded, setExpanded] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [solutionNotes, setSolutionNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedFile, setSubmittedFile] = useState<string | null>(
    assignment.userSubmission?.formattedFileName || assignment.submissions?.[0]?.formattedFileName || null
  )
  const myGrade = assignment.userSubmission?.grade
  const myFeedback = assignment.userSubmission?.feedback

  const statusKey = assignment.status || (submittedFile ? 'submitted' : 'todo')
  const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.todo
  const priority = PRIORITY_CONFIG[assignment.priority || 'medium'] || PRIORITY_CONFIG.medium

  const due = new Date(assignment.dueDate || Date.now())
  const daysLeft = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const isUrgent = assignment.priority === 'urgent' || assignment.priority === 'high' || daysLeft <= 2

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleApplySubmission = async () => {
    try {
      setSubmitting(true)
      const fileName = selectedFile ? selectedFile.name : 'solution.pdf'
      const res: any = await assignmentService.submitAssignment(assignment._id || assignment.id, {
        content: solutionNotes || 'Submitted via student academic portal',
        fileName,
      })
      const sanitizedStudent = (user?.name || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_')
      const sanitizedTitle = (assignment.title || 'Assignment').replace(/[^a-zA-Z0-9_-]/g, '_')
      const formatted = res?.formattedFileName || `${sanitizedStudent}_${sanitizedTitle}_${fileName}`
      setSubmittedFile(formatted)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenParticularCourse = () => {
    const courseQuery = assignment.courseName || assignment.courseId || ''
    navigate(`/courses?course=${encodeURIComponent(courseQuery)}`)
  }

  const submissionCount = assignment.submissionCount || assignment.submissions?.length || 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden transition-all shadow-sm hover:shadow-md"
      style={{
        borderLeft: `4px solid ${priority.color}`,
        background: 'var(--card)',
        ...(isUrgent && !submittedFile && myGrade === undefined ? { boxShadow: '0 4px 20px color-mix(in srgb, var(--destructive) 15%, transparent)' } : {}),
      }}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${priority.pulse && !submittedFile ? 'animate-pulse' : ''}`}
            style={{ background: priority.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm sm:text-base" style={{ color: 'var(--foreground)' }}>
                {assignment.title}
              </h3>
              {isUrgent && !submittedFile && myGrade === undefined && (
                <span
                  className="px-2 py-0.5 rounded-full text-2xs font-bold font-mono flex items-center gap-1"
                  style={{
                    background: 'var(--destructive-muted)',
                    color: 'var(--destructive)',
                    border: '1px solid color-mix(in srgb, var(--destructive) 30%, transparent)',
                  }}
                >
                  <Flame size={11} className="animate-pulse" /> Urgent Matter
                </span>
              )}
              <span
                className="text-2xs px-2 py-0.5 rounded font-mono font-semibold"
                style={{ background: priority.bg, color: priority.color }}
              >
                {priority.label} Priority
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {assignment.courseName || assignment.department} · {assignment.department}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <button
              onClick={handleOpenParticularCourse}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              style={{
                background: 'var(--indigo-muted)',
                color: 'var(--indigo)',
                border: '1px solid color-mix(in srgb, var(--indigo) 30%, transparent)',
              }}
              title="Navigate to course"
            >
              <BookOpen size={13} /> <span className="hidden sm:inline">Go to Particular Course</span>
            </button>

            {isFaculty ? (
              <>
                <button
                  onClick={onOpenSubmissions}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer text-white"
                  style={{ background: 'var(--primary)' }}
                >
                  <Users size={13} /> Submissions ({submissionCount})
                </button>
                <button
                  onClick={onEdit}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  title="Edit Assignment"
                  style={{ color: 'var(--foreground)' }}
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="p-1.5 rounded-lg hover:bg-destructive-muted transition-colors cursor-pointer disabled:opacity-50"
                  title="Delete Assignment"
                  style={{ color: 'var(--destructive)' }}
                >
                  {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              </>
            ) : (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ background: status.bg, color: status.color }}
              >
                {myGrade !== undefined ? `Graded: ${myGrade}/${assignment.maxMarks || 100}` : (submittedFile ? 'Submitted & Pending Assessment' : status.label)}
              </span>
            )}

            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-lg transition-all cursor-pointer hover:bg-muted"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Metadata bar */}
        <div className="flex items-center gap-4 mt-3 text-xs flex-wrap" style={{ color: 'var(--muted-foreground)' }}>
          <div className="flex items-center gap-1.5">
            <Clock size={13} />
            <span>Due: {new Date(assignment.dueDate || Date.now()).toLocaleDateString()}</span>
          </div>
          <span>Max Marks: <strong>{assignment.maxMarks || 100}</strong></span>
          {assignment.instructorName && (
            <span>Instructor: <strong>{assignment.instructorName}</strong></span>
          )}
        </div>

        {/* Expanded Panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-3 space-y-3"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              {assignment.description && (
                <div className="p-3 rounded-xl text-xs leading-relaxed" style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>
                  <p className="font-bold text-2xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>Guidelines &amp; Requirements:</p>
                  {assignment.description}
                </div>
              )}

              {/* Student Submission / Graded Box */}
              {!isFaculty && (
                submittedFile || myGrade !== undefined ? (
                  <div
                    className="p-4 rounded-xl space-y-2"
                    style={{
                      background: myGrade !== undefined ? 'var(--success-muted)' : 'var(--primary-muted)',
                      border: `1px solid ${myGrade !== undefined ? 'color-mix(in srgb, var(--success) 35%, transparent)' : 'color-mix(in srgb, var(--primary) 35%, transparent)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: myGrade !== undefined ? 'var(--success)' : 'var(--primary)' }}>
                        <ShieldCheck size={16} />
                        {myGrade !== undefined ? 'Assignment Graded by Faculty:' : 'Saved & Submitted Assignment File:'}
                      </p>
                      {myGrade !== undefined && (
                        <span className="text-xs font-black font-mono px-3 py-1 rounded-full bg-white dark:bg-black" style={{ color: 'var(--success)' }}>
                          Score: {myGrade} / {assignment.maxMarks || 100} ({Math.round((myGrade / (assignment.maxMarks || 100)) * 100)}%)
                        </span>
                      )}
                    </div>
                    {submittedFile && (
                      <p
                        className="text-2xs font-mono p-2.5 rounded-lg truncate"
                        style={{ color: 'var(--foreground)', background: 'var(--elevated)', border: '1px solid var(--border)' }}
                      >
                        📄 {submittedFile}
                      </p>
                    )}
                    {myFeedback && (
                      <div className="p-2.5 rounded-lg bg-white/40 dark:bg-black/40 text-xs">
                        <p className="text-2xs font-bold" style={{ color: 'var(--foreground)' }}>Teacher Feedback:</p>
                        <p className="italic text-xs mt-0.5" style={{ color: 'var(--foreground)' }}>"{myFeedback}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="p-4 rounded-xl space-y-3"
                    style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                  >
                    <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                      Submit Solution File (.PDF / .DOCX / .ZIP / .PY):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="text-2xs w-full input py-2"
                        style={{ color: 'var(--muted-foreground)' }}
                      />
                      <input
                        type="text"
                        value={solutionNotes}
                        onChange={e => setSolutionNotes(e.target.value)}
                        placeholder="Optional solution link or notes..."
                        className="input text-xs"
                      />
                    </div>
                    <button
                      disabled={submitting}
                      onClick={handleApplySubmission}
                      className="btn btn-primary text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                      Save &amp; Submit Assignment Solution
                    </button>
                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default function AssignmentsPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAppSelector(s => s.auth)
  const isFaculty = ['faculty', 'admin', 'hod', 'super_admin'].includes(user?.role || '')

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<any>(null)
  const [reviewingAssignment, setReviewingAssignment] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: assignmentsData, isLoading, refetch } = useQuery({
    queryKey: ['assignmentsList', selectedStatus, selectedPriority],
    queryFn: async () => {
      const params: any = {}
      if (selectedStatus !== 'all') params.status = selectedStatus
      if (selectedPriority !== 'all') params.priority = selectedPriority
      const res: any = await assignmentService.getAssignments(params)
      return Array.isArray(res) ? res : (res?.data || [])
    },
  })

  const assignments = assignmentsData || []

  const urgentAssignments = assignments.filter((a: any) => {
    const due = new Date(a.dueDate || Date.now())
    const daysLeft = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return (a.priority === 'urgent' || a.priority === 'high' || daysLeft <= 2)
      && a.status !== 'submitted'
      && a.status !== 'graded'
  })

  const submittedCount = assignments.filter((a: any) => a.status === 'submitted').length
  const gradedCount = assignments.filter((a: any) => a.status === 'graded').length

  const filteredAssignments = assignments.filter((a: any) => {
    const matchQuery = !searchQuery
      || a.title?.toLowerCase().includes(searchQuery.toLowerCase())
      || a.courseName?.toLowerCase().includes(searchQuery.toLowerCase())
      || a.department?.toLowerCase().includes(searchQuery.toLowerCase())
      || a.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchPriority = selectedPriority === 'all' || a.priority === selectedPriority
    return matchQuery && matchPriority
  })

  useEffect(() => {
    dispatch(setPageContextData({
      currentTool: 'Assignments Hub',
      totalAssignments: assignments.length,
      urgentCount: urgentAssignments.length,
    }))
    return () => { dispatch(setPageContextData(null)) }
  }, [assignments, urgentAssignments, dispatch])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this assignment?')) return
    try {
      setDeletingId(id)
      await assignmentService.deleteAssignment(id)
      refetch()
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const FILTER_OPTIONS = [
    { key: 'all', label: 'All' },
    { key: 'todo', label: 'To Do' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'graded', label: 'Graded' },
    { key: 'overdue', label: 'Overdue' },
  ]

  return (
    <div className="page-container space-y-5 pb-12">
      {/* ── Hero Banner ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-banner shadow-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0A0F1E 0%, #0F172A 40%, #1A1040 75%, #200E3A 100%)',
          border: '1px solid rgba(139,92,246,0.3)',
        }}
      >
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)' }}
        />

        <div className="space-y-3">
          <span className="hero-badge"><BookOpen size={10} /> Academic Assignments Portal</span>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight text-white">Academic Coursework &amp; Assignments</h1>
          <p className="text-sm max-w-xl text-white/70">
            Submit coursework, track grading assessments, and manage academic deadlines across all enrolled courses.
          </p>
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-500/30">
              📚 {assignments.length} Total Coursework
            </span>
            {urgentAssignments.length > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold animate-pulse"
                style={{ background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5' }}>
                <Flame size={12} /> {urgentAssignments.length} urgent deadline{urgentAssignments.length > 1 ? 's' : ''}
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
              ✅ {gradedCount} Graded
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 items-start sm:items-end flex-shrink-0">
          {isFaculty && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { setEditingAssignment(null); setIsModalOpen(true) }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer shadow-lg"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', boxShadow: '0 4px 16px rgba(139,92,246,0.4)' }}
            >
              <Plus size={14} /> Create Assignment
            </motion.button>
          )}
          <p className="text-2xs text-white/50">
            {assignments.length} total · {submittedCount} submitted · {gradedCount} graded
          </p>
        </div>
      </motion.div>

      {/* Matter of Urgency Alert Banner — only shown when there are urgent items */}
      {urgentAssignments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl space-y-3"
          style={{
            background: 'var(--destructive-muted)',
            border: '2px solid color-mix(in srgb, var(--destructive) 35%, transparent)',
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold flex items-center gap-2" style={{ color: 'var(--destructive)' }}>
              <Flame className="animate-pulse" size={18} />
              Matter of Urgency — Action Needed ({urgentAssignments.length})
            </h2>
            <span
              className="text-2xs font-mono font-bold px-2.5 py-0.5 rounded-full"
              style={{
                background: 'color-mix(in srgb, var(--destructive) 15%, transparent)',
                color: 'var(--destructive)',
                border: '1px solid color-mix(in srgb, var(--destructive) 30%, transparent)',
              }}
            >
              High Priority &amp; Expiring Soon
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentAssignments.slice(0, 3).map((urg: any) => (
              <div
                key={urg._id || urg.id}
                className="p-3 rounded-xl space-y-2 card"
                style={{ border: '1px solid color-mix(in srgb, var(--destructive) 25%, transparent)' }}
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-xs font-bold truncate" style={{ color: 'var(--foreground)' }}>{urg.title}</h3>
                  <span
                    className="text-2xs px-2 py-0.5 rounded font-mono font-bold flex-shrink-0 ml-2"
                    style={{ background: 'var(--destructive-muted)', color: 'var(--destructive)' }}
                  >
                    Urgent
                  </span>
                </div>
                <p className="text-2xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
                  {urg.courseName || urg.department}
                </p>
                <button
                  onClick={() => navigate(`/courses?course=${encodeURIComponent(urg.courseName || '')}`)}
                  className="w-full py-1.5 rounded-lg text-2xs font-bold flex items-center justify-center gap-1.5 cursor-pointer text-white transition-all"
                  style={{ background: 'var(--primary)' }}
                >
                  <BookOpen size={12} /> Go to Particular Course
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Filter & Search Controls ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        {/* Tab-style filter pills */}
        <div className="tab-list flex-wrap">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedStatus(key)}
              className={`tab-item ${selectedStatus === key ? 'active' : ''} cursor-pointer text-xs`}
            >
              {label}
              {key !== 'all' && (
                <span className="text-2xs font-bold ml-1" style={{ opacity: 0.7 }}>
                  ({assignments.filter((a: any) => a.status === key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Priority Filter & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="input text-xs py-1.5 px-2"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent Priority 🔥</option>
          </select>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assignments..."
              className="input pl-9 text-xs w-48 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* ── Assignments List ── */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-purple-500/20" />
              <Loader2 className="absolute inset-0 animate-spin text-purple-500 m-auto" size={28} />
            </div>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading coursework assignments...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.length === 0 ? (
            <div className="card p-16 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--muted)' }}>
                <BookOpen size={28} style={{ color: 'var(--muted-foreground)', opacity: 0.6 }} />
              </div>
              <div>
                <p className="font-bold text-base" style={{ color: 'var(--foreground)' }}>No assignments found</p>
                <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {searchQuery ? 'Try a different search term or priority filter.' : 'You have no assignments in this category.'}
                </p>
              </div>
              {isFaculty && (
                <button
                  onClick={() => { setEditingAssignment(null); setIsModalOpen(true) }}
                  className="btn btn-primary text-xs flex items-center gap-1.5 mt-2"
                >
                  <Plus size={14} /> Create First Assignment
                </button>
              )}
            </div>
          ) : (
            filteredAssignments.map((a: any) => (
              <AssignmentCard
                key={a._id || a.id}
                assignment={a}
                onEdit={() => { setEditingAssignment(a); setIsModalOpen(true) }}
                onDelete={() => handleDelete(a._id || a.id)}
                onOpenSubmissions={() => setReviewingAssignment(a)}
                isDeleting={deletingId === (a._id || a.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AssignmentModal
        isOpen={isModalOpen}
        initialData={editingAssignment}
        onClose={() => { setIsModalOpen(false); setEditingAssignment(null) }}
        onSuccess={() => { refetch(); queryClient.invalidateQueries({ queryKey: ['assignmentsList'] }) }}
      />

      {/* Faculty Grading Modal */}
      <SubmissionsReviewModal
        isOpen={!!reviewingAssignment}
        assignment={reviewingAssignment}
        onClose={() => setReviewingAssignment(null)}
        onGraded={() => {
          refetch()
          queryClient.invalidateQueries({ queryKey: ['assignmentsList'] })
          setReviewingAssignment(null)
        }}
      />
    </div>
  )
}
