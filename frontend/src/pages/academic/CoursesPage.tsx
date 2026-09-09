import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Search, Star, Zap, Loader2, Play, BookOpen, Plus,
  Edit3, Trash2, CheckCircle2, AlertCircle, X, UserCheck
} from 'lucide-react'
import { api } from '../../services/api'
import { collegeCourseService } from '../../services/collegeCourseService'
import { useAppSelector } from '../../hooks/useStore'

interface CourseModalProps {
  initialData?: any
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function CourseModal({ initialData, isOpen, onClose, onSuccess }: CourseModalProps) {
  const isEditing = !!initialData?._id
  const [courseCode, setCourseCode] = useState(initialData?.courseCode || '')
  const [title, setTitle] = useState(initialData?.title || '')
  const [department, setDepartment] = useState(initialData?.department || 'Computer Science & Engineering')
  const [semester, setSemester] = useState(initialData?.semester || 6)
  const [credits, setCredits] = useState(initialData?.credits || 4)
  const [instructorName, setInstructorName] = useState(initialData?.instructorName || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseCode.trim() || !title.trim()) {
      setError('Course code and title are required.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const payload = {
        courseCode: courseCode.trim().toUpperCase(),
        title: title.trim(),
        department,
        semester: Number(semester),
        credits: Number(credits),
        instructorName: instructorName.trim() || undefined,
        description: description.trim(),
      }

      if (isEditing) {
        await collegeCourseService.updateCollegeCourse(initialData._id, payload)
      } else {
        await collegeCourseService.createCollegeCourse(payload)
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
            <div className="p-2 rounded-xl" style={{ background: 'var(--indigo-muted)', color: 'var(--indigo)' }}>
              {isEditing ? <Edit3 size={18} /> : <Plus size={18} />}
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
                {isEditing ? 'Edit Academic College Course' : 'Create New Academic College Course'}
              </h2>
              <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                {isEditing ? 'Update course specifications and credits' : 'Add degree coursework to curriculum'}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>Course Code *</label>
              <input
                type="text"
                value={courseCode}
                onChange={e => setCourseCode(e.target.value)}
                placeholder="e.g. 23CSP701"
                className="input w-full text-xs font-mono uppercase font-bold"
                required
                disabled={isEditing}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>Course Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Distributed Cloud Architectures"
                className="input w-full text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="input w-full text-xs"
              >
                <option value="Computer Science & Engineering">CSE</option>
                <option value="Information Technology">IT</option>
                <option value="Artificial Intelligence & Data Science">AI & DS</option>
                <option value="Electronics & Communication">ECE</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>Semester</label>
              <select
                value={semester}
                onChange={e => setSemester(Number(e.target.value))}
                className="input w-full text-xs"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>Credits</label>
              <input
                type="number"
                value={credits}
                onChange={e => setCredits(Number(e.target.value))}
                min={1}
                max={10}
                className="input w-full text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>Faculty Instructor Name</label>
            <input
              type="text"
              value={instructorName}
              onChange={e => setInstructorName(e.target.value)}
              placeholder="e.g. Dr. N. Suba Rani, ASP/CSE"
              className="input w-full text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>Course Overview &amp; Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide course learning outcomes, syllabus overview, and reference textbooks..."
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
              {isEditing ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function CoursesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAppSelector(s => s.auth)
  const isFaculty = ['faculty', 'admin', 'hod', 'super_admin'].includes(user?.role || '')

  const [ecosystemTab, setEcosystemTab] = useState<'college' | 'public'>('college')
  const [search, setSearch] = useState('')
  const [selectedSemester, setSelectedSemester] = useState<string>('all')

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any>(null)
  const [enrollingId, setEnrollingId] = useState<string | null>(null)

  // ── 1. Fetch Type 1 Enrolled College Courses ──────────────────────────────────
  const { data: collegeData, isLoading: isCollegeLoading, refetch: refetchCollege } = useQuery({
    queryKey: ['myCollegeCourses'],
    queryFn: async () => {
      const res = await collegeCourseService.getCollegeCourses()
      return res
    },
  })

  // ── 2. Fetch Type 2 Public Video Courses ──────────────────────────────────────
  const { data: videoData, isLoading: isVideoLoading } = useQuery({
    queryKey: ['publicVideoCourses', search],
    queryFn: async () => {
      try {
        const res: any = await api.get('/learn', {
          params: {
            q: search.trim() || undefined,
          }
        })
        return res?.data?.courses || []
      } catch {
        return []
      }
    },
  })

  const collegeCourses = collegeData?.courses || (Array.isArray(collegeData) ? collegeData : [])
  const videoCourses = videoData || []

  const filteredCollegeCourses = collegeCourses.filter((c: any) => {
    const matchSearch = !search
      || c.title?.toLowerCase().includes(search.toLowerCase())
      || c.courseCode?.toLowerCase().includes(search.toLowerCase())
      || c.department?.toLowerCase().includes(search.toLowerCase())
      || c.instructorName?.toLowerCase().includes(search.toLowerCase())

    const matchSem = selectedSemester === 'all' || String(c.semester) === selectedSemester
    return matchSearch && matchSem
  })

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this college course and all associated enrollments?')) return
    try {
      await collegeCourseService.deleteCollegeCourse(courseId)
      refetchCollege()
      queryClient.invalidateQueries({ queryKey: ['myCollegeCourses'] })
    } catch (err) {
      console.error(err)
    }
  }

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrollingId(courseId)
      await collegeCourseService.enrollInCourse(courseId)
      refetchCollege()
      queryClient.invalidateQueries({ queryKey: ['myCollegeCourses'] })
    } catch (err) {
      console.error(err)
    } finally {
      setEnrollingId(null)
    }
  }

  return (
    <div className="page-container space-y-6 pb-12">
      {/* ── Hero Banner ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-banner shadow-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0A0F1E 0%, #0F172A 35%, #1E1B4B 70%, #312E81 100%)',
          border: '1px solid rgba(99,102,241,0.3)',
        }}
      >
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-8 left-1/4 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)' }}
        />

        <div className="space-y-3">
          <span className="hero-badge"><Zap size={10} /> Dual Course Ecosystem</span>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight text-white">
            EduSphere Academic Course Ecosystems
          </h1>
          <p className="text-sm max-w-2xl text-white/70">
            Degree coursework, academic syllabus units, continuous assessment, and self-paced video learning.
          </p>
        </div>

        {/* Ecosystem Tabs & Action */}
        <div className="flex items-center gap-3 flex-wrap shrink-0 justify-between sm:justify-end w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEcosystemTab('college')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              style={ecosystemTab === 'college'
                ? { background: 'linear-gradient(135deg, #4F46E5, #4338CA)', color: '#fff', border: '1px solid rgba(199,210,254,0.4)', boxShadow: '0 8px 24px rgba(79,70,229,0.5)' }
                : { background: 'rgba(255,255,255,0.12)', color: '#F1F5F9', border: '1px solid rgba(255,255,255,0.22)' }}
            >
              🎓 College Courses ({collegeCourses.length})
            </button>
            <button
              onClick={() => setEcosystemTab('public')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              style={ecosystemTab === 'public'
                ? { background: 'linear-gradient(135deg, #0284C7, #0369A1)', color: '#fff', border: '1px solid rgba(186,230,253,0.4)', boxShadow: '0 8px 24px rgba(2,132,199,0.5)' }
                : { background: 'rgba(255,255,255,0.12)', color: '#F1F5F9', border: '1px solid rgba(255,255,255,0.22)' }}
            >
              🌐 Explore Video Learning ({videoCourses.length})
            </button>
          </div>

          {isFaculty && ecosystemTab === 'college' && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { setEditingCourse(null); setIsModalOpen(true) }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-white cursor-pointer shadow-lg"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', border: '1px solid rgba(216,180,254,0.4)' }}
            >
              <Plus size={14} /> Add College Course
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ECOSYSTEM 1: TYPE 1 — COLLEGE COURSES */}
      {ecosystemTab === 'college' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <span>🎓</span> Degree College Courses
              </h2>
              <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                Curriculum coursework, units syllabus, continuous internal assessment, and grading.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedSemester}
                onChange={e => setSelectedSemester(e.target.value)}
                className="input text-xs py-1.5 px-2"
              >
                <option value="all">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={String(s)}>Semester {s}</option>
                ))}
              </select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--muted-foreground)' }} />
                <input
                  type="text"
                  placeholder="Search course code or title..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input pl-9 pr-4 py-1.5 text-xs w-48 sm:w-60"
                />
              </div>
            </div>
          </div>

          {isCollegeLoading ? (
            <div className="py-12 text-center">
              <Loader2 size={32} className="animate-spin mx-auto" style={{ color: 'var(--indigo)' }} />
              <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>Loading academic coursework...</p>
            </div>
          ) : filteredCollegeCourses.length === 0 ? (
            <div className="p-12 rounded-2xl text-center space-y-3 card" style={{ border: '1px dashed var(--border)' }}>
              <BookOpen size={36} className="mx-auto" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }} />
              <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>No College Courses Found</h3>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {search ? 'Try a different search keyword.' : 'No academic courses currently match the selected semester.'}
              </p>
              {isFaculty && (
                <button
                  onClick={() => { setEditingCourse(null); setIsModalOpen(true) }}
                  className="btn btn-primary text-xs flex items-center gap-1.5 mx-auto mt-2"
                >
                  <Plus size={14} /> Create First College Course
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCollegeCourses.map((c: any) => (
                <motion.div
                  key={c._id}
                  whileHover={{ y: -4 }}
                  className="p-5 rounded-2xl space-y-4 transition-all flex flex-col justify-between card"
                  style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-3xs font-black font-mono"
                        style={{ background: 'var(--indigo-muted)', color: 'var(--indigo)', border: '1px solid color-mix(in srgb, var(--indigo) 30%, transparent)' }}
                      >
                        {c.courseCode}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded bg-muted" style={{ color: 'var(--muted-foreground)' }}>
                          Sem {c.semester}
                        </span>
                        <span className="text-3xs font-mono font-bold" style={{ color: 'var(--success)' }}>
                          {c.credits} Credits
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-extrabold line-clamp-1" style={{ color: 'var(--foreground)' }}>{c.title}</h3>
                    <p className="text-3xs line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>{c.description || 'Academic syllabus units, lectures, and assessment criteria.'}</p>

                    <div className="pt-2 space-y-1.5 text-2xs font-mono" style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="flex items-center justify-between" style={{ color: 'var(--muted-foreground)' }}>
                        <span>Attendance Standing:</span>
                        <strong style={{ color: (c.attendancePct || 85) >= 75 ? 'var(--success)' : 'var(--warning)' }}>{c.attendancePct || 85}%</strong>
                      </div>
                      <div className="flex items-center justify-between" style={{ color: 'var(--muted-foreground)' }}>
                        <span>Instructor:</span>
                        <strong className="truncate max-w-[150px]" style={{ color: 'var(--foreground)' }}>{c.instructorName || 'Department Faculty'}</strong>
                      </div>
                      <div className="flex items-center justify-between" style={{ color: 'var(--muted-foreground)' }}>
                        <span>Units / Modules:</span>
                        <strong style={{ color: 'var(--indigo)' }}>{c.units?.length || 5} Units</strong>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <button
                      onClick={() => navigate(`/college-courses/${c._id}`)}
                      className="w-full py-2.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                      style={{ background: 'linear-gradient(135deg, var(--indigo), #4338CA)' }}
                    >
                      <BookOpen size={14} /> View Syllabus &amp; Marks
                    </button>

                    {isFaculty ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingCourse(c); setIsModalOpen(true) }}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border hover:bg-muted transition-colors cursor-pointer"
                          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(c._id)}
                          className="py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border hover:bg-destructive-muted transition-colors cursor-pointer"
                          style={{ borderColor: 'var(--border)', color: 'var(--destructive)' }}
                          title="Delete Course"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEnroll(c._id)}
                        disabled={enrollingId === c._id}
                        className="w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border hover:bg-muted transition-colors cursor-pointer"
                        style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                      >
                        {enrollingId === c._id ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
                        Confirm Enrollment
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ECOSYSTEM 2: TYPE 2 — PUBLIC VIDEO COURSES */}
      {ecosystemTab === 'public' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <span>🌐</span> Public Video Learning Catalog
              </h2>
              <p className="text-2xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Self-paced video courses, hands-on skills, progress tracking, and verified certificates.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                placeholder="Search AWS, React, Docker..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-9 pr-4 py-1.5 text-xs w-full sm:w-64"
              />
            </div>
          </div>

          {isVideoLoading ? (
            <div className="py-12 text-center"><Loader2 size={32} className="animate-spin mx-auto" style={{ color: 'var(--indigo)' }} /></div>
          ) : videoCourses.length === 0 ? (
            <div className="p-12 rounded-2xl text-center space-y-3 card" style={{ border: '1px dashed var(--border)' }}>
              <Play size={36} className="mx-auto" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }} />
              <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>No Public Courses Found</h3>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {videoCourses.map((v: any) => (
                <motion.div
                  key={v.slug}
                  whileHover={{ y: -4 }}
                  className="p-5 rounded-2xl space-y-4 transition-all flex flex-col justify-between card"
                  style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <div className="space-y-3">
                    <div className="aspect-video w-full rounded-2xl overflow-hidden relative" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                      <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                      <div
                        className="absolute top-2 right-2 px-2 py-0.5 rounded text-3xs font-mono font-bold text-amber-400 flex items-center gap-1"
                        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', border: '1px solid rgba(245,158,11,0.4)' }}
                      >
                        <Star size={10} className="fill-amber-400" /> {v.rating}
                      </div>
                    </div>

                    <div>
                      <span
                        className="px-2 py-0.5 rounded text-3xs font-bold uppercase"
                        style={{ background: 'var(--indigo-muted)', color: 'var(--indigo)' }}
                      >
                        {v.category} · {v.level}
                      </span>
                      <h3 className="text-sm font-extrabold mt-1.5 line-clamp-1" style={{ color: 'var(--foreground)' }}>{v.title}</h3>
                      <p className="text-3xs line-clamp-2 mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{v.description}</p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(v.skills || []).slice(0, 3).map((sk: string) => (
                        <span
                          key={sk}
                          className="px-2 py-0.5 rounded text-3xs font-mono"
                          style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
                        >
                          #{sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/learn/${v.slug}`)}
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', boxShadow: '0 4px 12px rgba(2,132,199,0.3)' }}
                  >
                    <Play size={14} /> Start Video Learning ({v.durationHours}h)
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Course Modal */}
      <CourseModal
        isOpen={isModalOpen}
        initialData={editingCourse}
        onClose={() => { setIsModalOpen(false); setEditingCourse(null) }}
        onSuccess={() => {
          refetchCollege()
          queryClient.invalidateQueries({ queryKey: ['myCollegeCourses'] })
        }}
      />
    </div>
  )
}
