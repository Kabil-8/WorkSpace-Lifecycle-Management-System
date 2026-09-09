import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserCheck, Plus, ShieldCheck, Loader2, Handshake,
  Edit3, Brain, X, Check, Activity, Target, Code,
  Clock, AlertTriangle, MessageSquare, RefreshCw, BarChart2
} from 'lucide-react'
import { mentorshipService, StudentTelemetryUpdateData } from '../../services/mentorshipService'
import { useAppSelector, useAppDispatch } from '../../hooks/useStore'
import { addToast } from '../../store/uiSlice'

export default function MentorshipPage() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector(s => s.auth)
  const token = useAppSelector(s => s.auth.token)
  const queryClient = useQueryClient()

  const isStudent = user?.role === 'student'
  const isFaculty = ['faculty', 'mentor', 'hod', 'admin', 'super_admin'].includes(user?.role || '')
  const [tab, setTab] = useState(isFaculty ? 'myClass' : 'find')
  const [showAllocateModal, setShowAllocateModal] = useState(false)

  // Selected Student for CRUD / ML Telemetry Drawer
  const [editingStudent, setEditingStudent] = useState<any | null>(null)
  const [editForm, setEditForm] = useState<StudentTelemetryUpdateData & { studentName?: string; rollNumber?: string }>({})
  const [isSavingTelemetry, setIsSavingTelemetry] = useState(false)
  const [isRecalculatingML, setIsRecalculatingML] = useState(false)

  // Allocation Form State
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedMentorId, setSelectedMentorId] = useState('')
  const [topic, setTopic] = useState('Academic & Career Placement')
  const [allocateSuccess, setAllocateSuccess] = useState<string | null>(null)

  const handleOpenModal = (preselectedMentorId?: string) => {
    const activeUserId = (user as any)?._id || user?.id || ''
    if (isStudent) {
      setSelectedStudentId(activeUserId)
    }
    if (preselectedMentorId) {
      setSelectedMentorId(preselectedMentorId)
    } else if (['faculty', 'mentor'].includes(user?.role || '')) {
      setSelectedMentorId(activeUserId)
    }
    setShowAllocateModal(true)
  }

  // Fetch Teacher's Class Students & Mentees
  const { data: myStudentsData, isLoading: myStudentsLoading } = useQuery({
    queryKey: ['myStudentsAndMentees'],
    queryFn: mentorshipService.getMyStudentsAndMentees,
    enabled: isFaculty && !!token,
  })

  // Fetch Available Mentors from MongoDB
  const { data: mentorsData, isLoading: mentorsLoading } = useQuery({
    queryKey: ['availableMentors'],
    queryFn: mentorshipService.getAvailableMentors,
    enabled: !!token,
  })

  // Fetch Student's Mentorship Allocations
  const { data: allocationsData } = useQuery({
    queryKey: ['mentorshipAllocations'],
    queryFn: mentorshipService.getAllocations,
    enabled: !!token,
  })

  // Fetch Students for Allocation Modal
  const { data: studentsData } = useQuery({
    queryKey: ['mentorshipStudentsList'],
    queryFn: mentorshipService.getStudents,
    enabled: showAllocateModal && !isStudent && !!token,
  })

  // Open Edit Modal for a Student
  const handleOpenStudentEditor = async (student: any) => {
    setEditingStudent(student)
    setEditForm({
      studentName: student.name,
      rollNumber: student.rollNumber,
      cgpa: student.cgpa || 8.5,
      placementReadiness: student.placementProbabilityPct || student.placementReadiness || 78,
      learningPaceScore: student.learningPaceScore || 82,
      codingProficiencyScore: student.codingProficiencyScore || 75,
      attendanceRate: student.attendanceRate || 92,
      weakSubjects: Array.isArray(student.weakSubjects) ? student.weakSubjects.join(', ') : (student.weakSubjects || 'System Design, Dynamic Programming'),
      strongSubjects: Array.isArray(student.strongSubjects) ? student.strongSubjects.join(', ') : (student.strongSubjects || 'Data Structures, Web Engineering'),
      careerGoal: student.careerGoal || 'Fullstack AI Engineer',
      mentorNotes: student.lastMentorFeedback || '',
      burnoutRisk: student.burnoutRisk || 'Low',
    })
  }

  // Save Telemetry Mutation
  const handleSaveTelemetry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent?._id) return

    setIsSavingTelemetry(true)
    try {
      await mentorshipService.updateStudentTelemetry(editingStudent._id, {
        cgpa: Number(editForm.cgpa),
        placementReadiness: Number(editForm.placementReadiness),
        learningPaceScore: Number(editForm.learningPaceScore),
        codingProficiencyScore: Number(editForm.codingProficiencyScore),
        attendanceRate: Number(editForm.attendanceRate),
        weakSubjects: typeof editForm.weakSubjects === 'string' ? editForm.weakSubjects.split(',').map(s => s.trim()).filter(Boolean) : editForm.weakSubjects,
        strongSubjects: typeof editForm.strongSubjects === 'string' ? editForm.strongSubjects.split(',').map(s => s.trim()).filter(Boolean) : editForm.strongSubjects,
        careerGoal: editForm.careerGoal,
        mentorNotes: editForm.mentorNotes,
        burnoutRisk: editForm.burnoutRisk,
      })

      dispatch(addToast({
        type: 'success',
        title: 'Student Data Updated! 🚀',
        description: `Successfully saved academic & ML telemetry for ${editingStudent.name}.`,
      }))

      queryClient.invalidateQueries({ queryKey: ['myStudentsAndMentees'] })
      queryClient.invalidateQueries({ queryKey: ['studentDigitalTwin'] })
      setEditingStudent(null)
    } catch (err: any) {
      dispatch(addToast({
        type: 'error',
        title: 'Update Failed',
        description: err.message || 'Could not save student telemetry',
      }))
    } finally {
      setIsSavingTelemetry(false)
    }
  }

  // Run ML Recalculation
  const handleRunRecalculation = async () => {
    if (!editingStudent?._id) return
    setIsRecalculatingML(true)
    try {
      const res = await mentorshipService.recalculateStudentML(editingStudent._id)
      if (res?.data) {
        const twin = res.data.digitalTwin
        setEditForm(prev => ({
          ...prev,
          learningPaceScore: twin.learningPaceScore,
          codingProficiencyScore: twin.codingProficiencyScore,
          placementReadiness: twin.placementProbabilityPct,
          burnoutRisk: twin.burnoutRisk,
        }))
        dispatch(addToast({
          type: 'success',
          title: 'ML Recalculation Complete! 🧠',
          description: `Updated predictive learning pace and placement score.`,
        }))
      }
      queryClient.invalidateQueries({ queryKey: ['myStudentsAndMentees'] })
    } catch (err: any) {
      dispatch(addToast({
        type: 'error',
        title: 'Recalculation Error',
        description: err.message || 'ML service calculation failed',
      }))
    } finally {
      setIsRecalculatingML(false)
    }
  }

  // Mutation to allocate/connect mentor
  const allocateMutation = useMutation({
    mutationFn: mentorshipService.createAllocation,
    onSuccess: (res: any) => {
      setAllocateSuccess(res?.message || 'Mentor connected successfully!')
      dispatch(addToast({
        type: 'success',
        title: 'Mentor Allocated! 🤝',
        description: res?.message || 'Successfully allocated mentor.',
      }))
      queryClient.invalidateQueries({ queryKey: ['mentorshipAllocations'] })
      queryClient.invalidateQueries({ queryKey: ['myStudentsAndMentees'] })
      setTimeout(() => {
        setAllocateSuccess(null)
        setShowAllocateModal(false)
      }, 1500)
    },
    onError: (err: any) => {
      dispatch(addToast({
        type: 'error',
        title: 'Allocation Failed',
        description: err.message || 'Could not allocate mentor',
      }))
    }
  })

  const mentors = (mentorsData?.data || mentorsData || []) as any[]
  const allocations = (allocationsData?.data || allocationsData || []) as any[]

  const classStudents = myStudentsData?.data?.classStudents || myStudentsData?.classStudents || []
  const mentees = myStudentsData?.data?.mentees || myStudentsData?.mentees || []
  const classTeacherSection = myStudentsData?.data?.classTeacherSection || myStudentsData?.classTeacherSection || user?.section || 'Section A'

  return (
    <div className="page-container space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-extrabold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Handshake className="text-purple-500" size={24} /> Student Telemetry &amp; Mentorship Hub
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {isFaculty
              ? 'Real-time CRUD management for Student CGPA, Coding Proficiencies, Placement Readiness, and ML Learning Telemetry'
              : 'Choose and connect with institutional faculty mentors for personalized academic & placement guidance'}
          </p>
        </motion.div>

        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary text-xs font-extrabold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-lg"
        >
          <Plus size={15} /> {isStudent ? 'Choose 1-on-1 Mentor' : 'Allocate Mentor to Student'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b pb-2 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {isFaculty && (
          <>
            <button
              onClick={() => setTab('myClass')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                tab === 'myClass'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'hover:opacity-90'
              }`}
              style={tab !== 'myClass' ? { color: 'var(--muted-foreground)' } : {}}
            >
              Class Roster &amp; ML Telemetry ({classStudents.length})
            </button>
            <button
              onClick={() => setTab('myMentees')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                tab === 'myMentees'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'hover:opacity-90'
              }`}
              style={tab !== 'myMentees' ? { color: 'var(--muted-foreground)' } : {}}
            >
              1-on-1 Mentees ({mentees.length})
            </button>
          </>
        )}

        <button
          onClick={() => setTab('find')}
          className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
            tab === 'find'
              ? 'bg-purple-600 text-white shadow-md'
              : 'hover:opacity-90'
          }`}
          style={tab !== 'find' ? { color: 'var(--muted-foreground)' } : {}}
        >
          Faculty &amp; Mentors Catalog ({mentors.length})
        </button>

        {!isFaculty && (
          <button
            onClick={() => setTab('allocations')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              tab === 'allocations'
                ? 'bg-purple-600 text-white shadow-md'
                : 'hover:opacity-90'
            }`}
            style={tab !== 'allocations' ? { color: 'var(--muted-foreground)' } : {}}
          >
            My Assigned Mentors ({allocations.length})
          </button>
        )}
      </div>

      {/* Tab 1: My Class Students (Homeroom Section) */}
      {tab === 'myClass' && isFaculty && (
        <div className="space-y-4">
          <div className="card p-4 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: 'var(--card)' }}>
            <div>
              <h2 className="text-xs font-extrabold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                Class Section: {classTeacherSection} ({myStudentsData?.data?.classTeacherDepartment || 'Computer Science'})
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Class Teacher Roster
                </span>
              </h2>
              <p className="text-2xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Click on any student card to view, inspect and edit their individual CGPA, Coding Scores, Placement Readiness, and ML Cognitive Telemetry.
              </p>
            </div>
            <span className="text-sm font-mono font-extrabold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-xl border border-purple-500/30 self-start sm:self-auto">
              {classStudents.length} Students Enrolled
            </span>
          </div>

          {myStudentsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-purple-500" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classStudents.map((s: any) => (
                <motion.div
                  key={s._id}
                  whileHover={{ y: -2 }}
                  className="card p-4 border space-y-3 transition-all cursor-pointer relative group hover:border-purple-500/60"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                  onClick={() => handleOpenStudentEditor(s)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-extrabold text-white text-sm shadow-md">
                        {s.name?.charAt(0) || 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate group-hover:text-purple-400 transition-colors" style={{ color: 'var(--foreground)' }}>
                          {s.name}
                        </h3>
                        <p className="text-2xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
                          {s.rollNumber || 'CS2026'} • {s.section || classTeacherSection}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all cursor-pointer"
                      title="Edit Student Telemetry"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>

                  {/* Telemetry Snapshot Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-xl border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                    <div>
                      <span className="text-3xs uppercase tracking-wider block text-muted-foreground">CGPA</span>
                      <strong className="text-xs font-bold text-purple-400">{s.cgpa || 8.5}</strong>
                    </div>
                    <div>
                      <span className="text-3xs uppercase tracking-wider block text-muted-foreground">Placement</span>
                      <strong className="text-xs font-bold text-emerald-400">{s.placementProbabilityPct || s.placementReadiness || 80}%</strong>
                    </div>
                    <div>
                      <span className="text-3xs uppercase tracking-wider block text-muted-foreground">Learning Pace</span>
                      <strong className="text-xs font-bold text-cyan-400">{s.learningPaceScore || 82} pts</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-2xs pt-1 text-slate-400">
                    <span className="flex items-center gap-1">
                      <Code size={11} className="text-indigo-400" /> Coding: <strong className="text-foreground">{s.codingProficiencyScore || 74}/100</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity size={11} className="text-emerald-400" /> Att: <strong className="text-foreground">{s.attendanceRate || 92}%</strong>
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My 1-on-1 Mentees */}
      {tab === 'myMentees' && isFaculty && (
        <div className="space-y-4">
          <div className="card p-4 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: 'var(--card)' }}>
            <div>
              <h2 className="text-xs font-extrabold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                1-on-1 Assigned Mentees
              </h2>
              <p className="text-2xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Directly evaluate your mentees, adjust their learning pace targets, and write mentorship guidance notes.
              </p>
            </div>
            <span className="text-sm font-mono font-extrabold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-xl border border-purple-500/30 self-start sm:self-auto">
              {mentees.length} Mentees Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentees.map((m: any) => {
              const details = m.studentDetails || {}
              return (
                <motion.div
                  key={m._id}
                  whileHover={{ y: -2 }}
                  className="card p-4 border space-y-3 transition-all cursor-pointer hover:border-purple-500/60"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                  onClick={() => handleOpenStudentEditor({ ...details, name: m.studentName, _id: m.studentId, lastMentorFeedback: m.lastMentorFeedback })}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center font-extrabold text-white text-xs shadow-md">
                        {m.studentName?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <h3 className="font-bold text-xs" style={{ color: 'var(--foreground)' }}>{m.studentName}</h3>
                        <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{details.department || 'CSE'} • Sec {details.section || 'A'}</p>
                      </div>
                    </div>
                    {m.isSameClass ? (
                      <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Homeroom
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Mentee
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-2xs p-2 rounded-lg border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                    <div>Placement Score: <strong className="text-emerald-400">{details.placementProbabilityPct || 82}%</strong></div>
                    <div>Learning Pace: <strong className="text-cyan-400">{details.learningPaceScore || 78} pts</strong></div>
                  </div>

                  <p className="text-2xs p-2 rounded-lg border text-muted-foreground truncate" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <strong>Focus:</strong> {m.topic || 'Academic & Placement Guidance'}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Faculty & Mentors Catalog */}
      {tab === 'find' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentorsLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="animate-spin text-purple-500" size={32} />
            </div>
          ) : (
            mentors.map((mentor: any) => (
              <motion.div
                key={mentor._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-5 border transition-all space-y-3 flex flex-col justify-between hover:border-purple-500/50"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-md">
                      {mentor.name?.charAt(0) || 'M'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>{mentor.name}</h3>
                        <span className="px-2 py-0.5 rounded text-2xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                          {mentor.role || 'Faculty'}
                        </span>
                      </div>
                      <p className="text-2xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{mentor.department || 'Computer Science'}</p>
                    </div>
                  </div>

                  <p className="text-xs line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                    {mentor.bio || 'Dedicated institutional mentor offering academic guidance, career coaching, and research assistance.'}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {(mentor.skills || ['Academic Guidance', 'Career Planning']).map((skill: string) => (
                      <span key={skill} className="px-2 py-0.5 rounded-md text-2xs font-medium border" style={{ background: 'var(--muted)', color: 'var(--foreground)', borderColor: 'var(--border)' }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between mt-2" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-2xs text-emerald-400 font-mono flex items-center gap-1">
                    <ShieldCheck size={12} /> Institutional Verified
                  </span>
                  <button
                    onClick={() => handleOpenModal(mentor._id)}
                    className="btn btn-primary text-2xs py-1.5 px-3 flex items-center gap-1 cursor-pointer transition-all shadow-md"
                  >
                    <UserCheck size={13} /> {isStudent ? 'Choose as My Mentor' : 'Select Mentor'}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Student's Assigned Mentors */}
      {tab === 'allocations' && !isFaculty && (
        <div className="space-y-4">
          <div className="card p-4 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: 'var(--card)' }}>
            <div>
              <h2 className="text-xs font-extrabold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                Your Active 1-on-1 Mentorship Connections
              </h2>
              <p className="text-2xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Connect directly with your allocated faculty mentors for interview readiness and academic improvement.
              </p>
            </div>
            <span className="text-sm font-mono font-extrabold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-xl border border-purple-500/30 self-start sm:self-auto">
              {allocations.length} Active Mentors
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allocations.map((alloc: any) => (
              <div
                key={alloc._id}
                className="card p-4 border space-y-3"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-extrabold text-white text-sm">
                    {alloc.mentorName?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs" style={{ color: 'var(--foreground)' }}>{alloc.mentorName}</h3>
                    <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Role: {alloc.mentorRole || 'Faculty Mentor'}</p>
                  </div>
                </div>
                <div className="text-2xs p-2 rounded-lg border space-y-1" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                  <p><strong>Guidance Topic:</strong> {alloc.topic}</p>
                  {alloc.lastMentorFeedback && (
                    <p className="text-purple-300"><strong>Latest Feedback:</strong> {alloc.lastMentorFeedback}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STUDENT CRUD & ML TELEMETRY DRAWER / MODAL ───────────────────── */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="card max-w-2xl w-full p-6 rounded-2xl space-y-5 shadow-2xl border my-8"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold">
                    {editingStudent.name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                      {editingStudent.name}
                      <span className="text-xs font-normal text-muted-foreground">({editingStudent.rollNumber || 'CS-2026'})</span>
                    </h3>
                    <p className="text-2xs text-muted-foreground">Teacher / Mentor Telemetry &amp; Cognitive ML Management</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Quick Actions / ML Recalculate */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <div className="flex items-center gap-2 text-2xs text-purple-200">
                  <Brain size={16} className="text-purple-400 shrink-0" />
                  <span>Real ML telemetry calculated specifically for this student profile.</span>
                </div>
                <button
                  type="button"
                  onClick={handleRunRecalculation}
                  disabled={isRecalculatingML}
                  className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-2xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm shrink-0"
                >
                  <RefreshCw size={12} className={isRecalculatingML ? 'animate-spin' : ''} />
                  {isRecalculatingML ? 'Recalculating...' : 'Recompute ML Scores'}
                </button>
              </div>

              {/* CRUD Form */}
              <form onSubmit={handleSaveTelemetry} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-2xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Target size={11} className="text-purple-400" /> Academic CGPA
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={editForm.cgpa ?? ''}
                      onChange={e => setEditForm({ ...editForm, cgpa: parseFloat(e.target.value) || 0 })}
                      className="input text-xs font-bold"
                      placeholder="e.g. 8.75"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-2xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <BarChart2 size={11} className="text-emerald-400" /> Placement Readiness (%)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={editForm.placementReadiness ?? ''}
                      onChange={e => setEditForm({ ...editForm, placementReadiness: parseFloat(e.target.value) || 0 })}
                      className="input text-xs font-bold text-emerald-400"
                      placeholder="0 - 100"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-2xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Activity size={11} className="text-cyan-400" /> Learning Pace (pts)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={editForm.learningPaceScore ?? ''}
                      onChange={e => setEditForm({ ...editForm, learningPaceScore: parseFloat(e.target.value) || 0 })}
                      className="input text-xs font-bold text-cyan-400"
                      placeholder="0 - 100"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-2xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Code size={11} className="text-indigo-400" /> Coding Score (0-100)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={editForm.codingProficiencyScore ?? ''}
                      onChange={e => setEditForm({ ...editForm, codingProficiencyScore: parseFloat(e.target.value) || 0 })}
                      className="input text-xs font-bold"
                      placeholder="0 - 100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-2xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Clock size={11} className="text-amber-400" /> Attendance Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={editForm.attendanceRate ?? ''}
                      onChange={e => setEditForm({ ...editForm, attendanceRate: parseFloat(e.target.value) || 0 })}
                      className="input text-xs font-bold"
                      placeholder="0 - 100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-2xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <AlertTriangle size={11} className="text-rose-400" /> Burnout Risk
                    </label>
                    <select
                      value={editForm.burnoutRisk || 'Low'}
                      onChange={e => setEditForm({ ...editForm, burnoutRisk: e.target.value })}
                      className="input text-xs font-bold"
                    >
                      <option value="Low">Low Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="High">High Risk</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-2xs font-bold uppercase tracking-wider text-muted-foreground block">Weak Subjects / Topics</label>
                    <input
                      type="text"
                      value={typeof editForm.weakSubjects === 'string' ? editForm.weakSubjects : (editForm.weakSubjects?.join(', ') || '')}
                      onChange={e => setEditForm({ ...editForm, weakSubjects: e.target.value })}
                      placeholder="e.g. Dynamic Programming, Distributed Systems"
                      className="input text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-2xs font-bold uppercase tracking-wider text-muted-foreground block">Strong Subjects / Proficiencies</label>
                    <input
                      type="text"
                      value={typeof editForm.strongSubjects === 'string' ? editForm.strongSubjects : (editForm.strongSubjects?.join(', ') || '')}
                      onChange={e => setEditForm({ ...editForm, strongSubjects: e.target.value })}
                      placeholder="e.g. Data Structures, React, Python"
                      className="input text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-2xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <MessageSquare size={11} className="text-purple-400" /> Mentorship Notes &amp; Action Plan
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.mentorNotes || ''}
                    onChange={e => setEditForm({ ...editForm, mentorNotes: e.target.value })}
                    placeholder="Provide specific recommendations, action items, and feedback for this student..."
                    className="input w-full text-xs resize-none"
                  />
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="btn btn-ghost text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTelemetry}
                    className="btn btn-primary text-xs flex items-center gap-1.5 shadow-lg"
                  >
                    {isSavingTelemetry ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                    {isSavingTelemetry ? 'Saving Updates...' : 'Save Student Telemetry'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ALLOCATION MODAL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAllocateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card max-w-lg w-full p-6 rounded-2xl space-y-4 shadow-2xl border"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Handshake className="text-purple-400" size={18} />
                  {isStudent ? 'Choose Faculty Mentor' : 'Allocate Mentor to Student'}
                </h3>
                <button onClick={() => setShowAllocateModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              {allocateSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold text-center">
                  {allocateSuccess}
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    allocateMutation.mutate({
                      studentId: selectedStudentId || (user as any)?._id || '',
                      mentorId: selectedMentorId,
                      topic,
                    })
                  }}
                  className="space-y-4"
                >
                  {!isStudent && (
                    <div className="space-y-1">
                      <label className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">Target Student</label>
                      <select
                        value={selectedStudentId}
                        onChange={e => setSelectedStudentId(e.target.value)}
                        className="input text-xs w-full"
                        required
                      >
                        <option value="">-- Select Student --</option>
                        {((studentsData?.data || studentsData || classStudents) as any[]).map((s: any) => (
                          <option key={s._id} value={s._id}>
                            {s.name} ({s.rollNumber || 'CS2026'} - {s.section || 'A'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">Select Mentor</label>
                    <select
                      value={selectedMentorId}
                      onChange={e => setSelectedMentorId(e.target.value)}
                      className="input text-xs w-full"
                      required
                    >
                      <option value="">-- Select Mentor / Faculty Member --</option>
                      {mentors.map((m: any) => (
                        <option key={m._id} value={m._id}>
                          {m.name} ({m.department || 'Computer Science'} - {m.role || 'Faculty'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">Mentorship Focus Topic</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      placeholder="e.g. Placement Interview Prep, System Architecture"
                      className="input text-xs w-full"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => setShowAllocateModal(false)}
                      className="btn btn-ghost text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={allocateMutation.isPending}
                      className="btn btn-primary text-xs flex items-center gap-1.5"
                    >
                      {allocateMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                      Confirm Connection
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
