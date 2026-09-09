import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, Calculator, CheckCircle2, Save, Search, Sparkles, Plus, Settings, X, BookOpen } from 'lucide-react'
import api from '../../services/api'
import { useAppSelector } from '../../hooks/useStore'

export default function GradebookPage() {
  const { user } = useAppSelector(s => s.auth)
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'hod' || user?.role === 'faculty'

  const [students, setStudents] = useState<any[]>([])
  const [semester, setSemester] = useState(5)
  const [coursesList, setCoursesList] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState('CS501: Data Structures & Algorithms')
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Admin Course CRUD Modal State
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [newCourseCode, setNewCourseCode] = useState('')
  const [newCourseTitle, setNewCourseTitle] = useState('')
  const [newCourseCredits, setNewCourseCredits] = useState(4)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [courseActionMsg, setCourseActionMsg] = useState('')

  // 1. Fetch courses whenever semester changes
  useEffect(() => {
    fetchCoursesForSemester(semester)
  }, [semester])

  // 2. Fetch student grade sheet whenever semester or selectedCourse changes
  useEffect(() => {
    if (selectedCourse) {
      fetchGradebookSheet(semester, selectedCourse)
    }
  }, [semester, selectedCourse])

  const fetchCoursesForSemester = async (sem: number) => {
    try {
      const res: any = await api.get(`/academic/courses?semester=${sem}`)
      const list = res?.data?.data || []
      setCoursesList(list)

      if (list.length > 0) {
        const firstCourse = `${list[0].courseCode}: ${list[0].title}`
        setSelectedCourse(firstCourse)
      } else {
        setSelectedCourse(`CS${sem}01: Core Subject - Sem ${sem}`)
      }
    } catch (err) {
      console.warn('Failed to fetch semester courses:', err)
    }
  }

  const fetchGradebookSheet = async (sem: number, courseStr: string) => {
    try {
      const cleanCode = courseStr.includes(':') ? courseStr.split(':')[0].trim() : courseStr
      const res: any = await api.get(`/academic/gradebook-sheet?semester=${sem}&courseCode=${cleanCode}`)
      const list = res?.data?.data || []

      if (list.length > 0) {
        setStudents(list)
      } else {
        // Fallback roster from attendance class sheet
        const attRes: any = await api.get('/attendance/class-sheet')
        const attList = attRes?.data?.data || []
        setStudents(attList.map((s: any, idx: number) => {
          const internal = 30 + (idx % 8)
          const endSem = 45 + (idx % 12)
          const total = internal + endSem
          return {
            studentId: s.id,
            rollNo: s.rollNo,
            studentName: s.studentName,
            photo: s.photo,
            internalMarks: internal,
            endSemMarks: endSem,
            totalMarks: total,
            grade: computeGrade(total),
            gradePoints: computeGradePoints(total),
          }
        }))
      }
    } catch (err) {
      console.warn('Failed to fetch gradebook sheet:', err)
    }
  }

  const computeGrade = (total: number) => {
    if (total >= 90) return 'S'
    if (total >= 80) return 'A'
    if (total >= 70) return 'B'
    if (total >= 60) return 'C'
    if (total >= 50) return 'D'
    return 'F'
  }

  const computeGradePoints = (total: number) => {
    if (total >= 90) return 10
    if (total >= 80) return 9
    if (total >= 70) return 8
    if (total >= 60) return 7
    if (total >= 50) return 6
    return 0
  }

  const handleMarkChange = (studentId: string, field: 'internalMarks' | 'endSemMarks', val: number) => {
    setStudents(prev => prev.map(s => {
      if (s.studentId !== studentId) return s
      const internal = field === 'internalMarks' ? Math.min(40, Math.max(0, val)) : s.internalMarks
      const endSem = field === 'endSemMarks' ? Math.min(60, Math.max(0, val)) : s.endSemMarks
      const total = internal + endSem
      return {
        ...s,
        internalMarks: internal,
        endSemMarks: endSem,
        totalMarks: total,
        grade: computeGrade(total),
        gradePoints: computeGradePoints(total),
      }
    }))
  }

  const handleSaveGrades = async () => {
    setSaving(true)
    try {
      const cleanCode = selectedCourse.includes(':') ? selectedCourse.split(':')[0].trim() : selectedCourse
      const cleanTitle = selectedCourse.includes(':') ? selectedCourse.split(':')[1]?.trim() : selectedCourse

      await api.post('/academic/grade/bulk', {
        semester,
        courseCode: cleanCode,
        courseTitle: cleanTitle,
        credits: 4,
        grades: students.map(s => ({
          studentId: s.studentId,
          internalMarks: s.internalMarks,
          endSemMarks: s.endSemMarks,
        }))
      })

      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to save course grades:', err)
    } finally {
      setSaving(false)
    }
  }

  // Admin Course CRUD Handlers
  const handleSaveCourse = async () => {
    if (!newCourseCode || !newCourseTitle) return
    try {
      if (editingCourseId && !editingCourseId.startsWith('fallback')) {
        await api.put(`/academic/courses/${editingCourseId}`, {
          courseCode: newCourseCode,
          title: newCourseTitle,
          semester,
          credits: newCourseCredits,
        })
        setCourseActionMsg('Course updated successfully!')
      } else {
        await api.post('/academic/courses', {
          courseCode: newCourseCode,
          title: newCourseTitle,
          semester,
          credits: newCourseCredits,
        })
        setCourseActionMsg('New course added for Semester ' + semester)
      }

      setNewCourseCode('')
      setNewCourseTitle('')
      setEditingCourseId(null)
      fetchCoursesForSemester(semester)
      setTimeout(() => setCourseActionMsg(''), 3000)
    } catch (err: any) {
      setCourseActionMsg(err?.response?.data?.message || 'Error saving course')
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (courseId.startsWith('fallback')) {
      setCourseActionMsg('Cannot delete default system template course')
      return
    }
    try {
      await api.delete(`/academic/courses/${courseId}`)
      setCourseActionMsg('Course deleted successfully')
      fetchCoursesForSemester(semester)
      setTimeout(() => setCourseActionMsg(''), 3000)
    } catch (err: any) {
      setCourseActionMsg(err?.response?.data?.message || 'Error deleting course')
    }
  }

  const filteredStudents = students.filter(s =>
    s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const avgTotal = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + s.totalMarks, 0) / students.length)
    : 0

  const countS = students.filter(s => s.grade === 'S' || s.grade === 'A').length
  const countF = students.filter(s => s.grade === 'F').length

  return (
    <div className="page-container space-y-6">
      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)', border: '1px solid rgba(99,102,241,0.3)' }}>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-2xs font-semibold"
            style={{ background: 'rgba(99, 102, 241, 0.25)', color: '#A5B4FC', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
            <Sparkles size={12} /> Institutional Academic Gradebook Engine
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-white" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            Faculty Portal — Semester Subject Gradebook
          </h1>

          <p className="text-xs max-w-xl leading-relaxed text-slate-300">
            Record subject marks per semester (Internal max 40, End-Sem max 60). Courses dynamically load by semester and marks persist directly to MongoDB.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <button onClick={() => setIsCourseModalOpen(true)}
              className="px-4 py-3 rounded-2xl font-bold text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 flex items-center gap-2 transition-all cursor-pointer">
              <Settings size={16} /> Manage Courses
            </button>
          )}

          <button onClick={handleSaveGrades} disabled={saving}
            className="px-5 py-3 rounded-2xl font-extrabold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow-lg transition-all cursor-pointer">
            {saving ? <Calculator className="animate-spin" size={16} /> : savedSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
            <span>{saving ? 'Calculating & Saving...' : savedSuccess ? 'Saved to MongoDB!' : 'Save & Publish Grades'}</span>
          </button>
        </div>
      </motion.div>

      {/* Course & Semester Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="card p-4 space-y-1.5 border border-indigo-500/20">
          <label className="text-2xs font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>Academic Semester</label>
          <select value={semester} onChange={e => setSemester(Number(e.target.value))}
            className="input w-full px-3 py-2 text-xs font-bold focus:outline-none">
            <option value={1}>Semester 1</option>
            <option value={2}>Semester 2</option>
            <option value={3}>Semester 3</option>
            <option value={4}>Semester 4</option>
            <option value={5}>Semester 5 (Active)</option>
            <option value={6}>Semester 6</option>
            <option value={7}>Semester 7</option>
            <option value={8}>Semester 8</option>
          </select>
        </div>

        <div className="card p-4 space-y-1.5 border border-indigo-500/20">
          <label className="text-2xs font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>Select Subject Course (Sem {semester})</label>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
            className="input w-full px-3 py-2 text-xs font-bold focus:outline-none">
            {coursesList.map((c: any) => {
              const val = `${c.courseCode}: ${c.title}`
              return <option key={c._id || c.courseCode} value={val}>{c.courseCode}: {c.title}</option>
            })}
          </select>
        </div>

        <div className="card p-4 space-y-1.5 border border-indigo-500/20 sm:col-span-1 lg:col-span-2 flex flex-col justify-between">
          <label className="text-2xs font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>Quick Search Roster</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input type="text" placeholder="Search by student name or roll number..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="input w-full pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card border-l-4 border-l-indigo-500">
          <p className="text-2xs font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>Subject Average Score</p>
          <p className="text-2xl font-black mt-1 text-indigo-500 dark:text-indigo-400">{avgTotal} / 100</p>
        </div>

        <div className="stat-card border-l-4 border-l-emerald-500">
          <p className="text-2xs font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>Top Performers (S/A Grade)</p>
          <p className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{countS} Students</p>
        </div>

        <div className="stat-card border-l-4 border-l-amber-500">
          <p className="text-2xs font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>Total Enrolled</p>
          <p className="text-2xl font-black mt-1 text-amber-600 dark:text-amber-400">{students.length} Students</p>
        </div>

        <div className="stat-card border-l-4 border-l-red-500">
          <p className="text-2xs font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>Backlogs / Failures (F)</p>
          <p className="text-2xl font-black mt-1 text-red-600 dark:text-red-400">{countF} Students</p>
        </div>
      </div>

      {/* Gradebook Table */}
      <div className="card p-5 space-y-4 border border-indigo-500/20">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Award size={18} className="text-indigo-500 dark:text-indigo-400" /> Gradebook Roster — {selectedCourse} (Semester {semester})
          </h3>
          <span className="text-2xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            {filteredStudents.length} Students Enrolled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b uppercase text-2xs border-slate-200 dark:border-slate-800" style={{ color: 'var(--muted-foreground)' }}>
                <th className="p-3">Student Name</th>
                <th className="p-3">Roll No</th>
                <th className="p-3">Internal Marks (Max 40)</th>
                <th className="p-3">End Sem Marks (Max 60)</th>
                <th className="p-3">Total Marks (100)</th>
                <th className="p-3">Letter Grade</th>
                <th className="p-3">Grade Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredStudents.map((s) => (
                <tr key={s.studentId} className="hover:bg-slate-500/5 transition-all">
                  <td className="p-3 flex items-center gap-3">
                    <img src={s.photo} alt={s.studentName} className="w-8 h-8 rounded-full object-cover border border-indigo-500/30" />
                    <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{s.studentName}</span>
                  </td>
                  <td className="p-3 font-mono font-medium text-xs" style={{ color: 'var(--muted-foreground)' }}>{s.rollNo}</td>
                  <td className="p-3">
                    <input type="number" min={0} max={40} value={s.internalMarks}
                      onChange={e => handleMarkChange(s.studentId, 'internalMarks', Number(e.target.value))}
                      className="input w-16 px-2.5 py-1 text-center font-mono text-xs font-bold" />
                  </td>
                  <td className="p-3">
                    <input type="number" min={0} max={60} value={s.endSemMarks}
                      onChange={e => handleMarkChange(s.studentId, 'endSemMarks', Number(e.target.value))}
                      className="input w-16 px-2.5 py-1 text-center font-mono text-xs font-bold" />
                  </td>
                  <td className="p-3 font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">{s.totalMarks} / 100</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-lg text-2xs font-extrabold shadow ${
                      s.grade === 'S' || s.grade === 'A' ? 'bg-emerald-500 text-white' :
                      s.grade === 'B' || s.grade === 'C' ? 'bg-indigo-500 text-white' :
                      s.grade === 'D' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      Grade {s.grade}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold" style={{ color: 'var(--foreground)' }}>{s.gradePoints} / 10</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Course Management Modal */}
      <AnimatePresence>
        {isCourseModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <div className="card p-6 max-w-xl w-full my-8 space-y-5 border-2 border-indigo-500/40 shadow-2xl" style={{ background: 'var(--card)', color: 'var(--card-foreground)' }}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-lg font-extrabold flex items-center gap-2" style={{ color: 'var(--card-foreground)' }}>
                  <BookOpen className="text-indigo-500" /> Admin Course Catalog — Semester {semester}
                </h3>
                <button onClick={() => setIsCourseModalOpen(false)} className="text-slate-400 hover:text-indigo-500 cursor-pointer"><X size={18} /></button>
              </div>

              {courseActionMsg && (
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500 font-bold text-xs border border-indigo-500/30">
                  {courseActionMsg}
                </div>
              )}

              {/* Add / Edit Course Form */}
              <div className="space-y-3 p-4 rounded-xl border" style={{ background: 'var(--elevated)', borderColor: 'var(--border)' }}>
                <h4 className="font-bold text-xs text-indigo-500">
                  {editingCourseId ? 'Edit Course Details' : 'Add New Subject Course'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-bold block mb-1 text-2xs">Course Code *</label>
                    <input type="text" placeholder="e.g. CS505" value={newCourseCode} onChange={e => setNewCourseCode(e.target.value)} className="input p-2 rounded-lg font-mono font-bold" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold block mb-1 text-2xs">Course Title *</label>
                    <input type="text" placeholder="e.g. Machine Learning & AI" value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} className="input p-2 rounded-lg font-semibold" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <label className="font-bold text-2xs">Credits:</label>
                    <input type="number" min={1} max={8} value={newCourseCredits} onChange={e => setNewCourseCredits(Number(e.target.value))} className="input p-1 w-16 text-center font-bold" />
                  </div>

                  <button onClick={handleSaveCourse} className="btn btn-sm btn-primary cursor-pointer flex items-center gap-1">
                    <Plus size={14} /> {editingCourseId ? 'Update Course' : 'Save Course to DB'}
                  </button>
                </div>
              </div>

              {/* Current Semester Courses List */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-400 uppercase">Existing Courses in Semester {semester} ({coursesList.length})</h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {coursesList.map((c) => (
                    <div key={c._id || c.courseCode} className="p-3 rounded-xl border flex items-center justify-between text-xs" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                      <div>
                        <span className="font-mono font-bold text-indigo-500 mr-2">{c.courseCode}</span>
                        <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{c.title}</span>
                        <span className="text-2xs font-mono ml-2 text-slate-400">({c.credits} Credits)</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button onClick={() => {
                          setEditingCourseId(c._id)
                          setNewCourseCode(c.courseCode)
                          setNewCourseTitle(c.title)
                          setNewCourseCredits(c.credits || 4)
                        }} className="text-indigo-500 hover:underline text-2xs font-bold cursor-pointer">Edit</button>

                        <button onClick={() => handleDeleteCourse(c._id)} className="text-red-500 hover:underline text-2xs font-bold cursor-pointer">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <button onClick={() => setIsCourseModalOpen(false)} className="btn btn-secondary text-xs cursor-pointer">
                  Close Catalog
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
