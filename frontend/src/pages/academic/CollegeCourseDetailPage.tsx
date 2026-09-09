import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, CheckCircle2, Award,
  FileText, HelpCircle, Loader2, Send, TrendingUp, AlertTriangle, Layers
} from 'lucide-react'
import { api } from '../../services/api'

export default function CollegeCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'syllabus' | 'assignments' | 'quizzes' | 'exams' | 'performance'>('syllabus')
  
  // Assignment submission modal
  const [submittingAssignment, setSubmittingAssignment] = useState<any | null>(null)
  const [submissionText, setSubmissionText] = useState('')

  // ── 1. Fetch Enrolled College Course Details ──────────────────────────────────
  const { data: courseData, isLoading: isCourseLoading } = useQuery({
    queryKey: ['collegeCourseDetail', courseId],
    queryFn: async () => {
      const res: any = await api.get(`/college-courses/${courseId}`)
      return res?.data || res
    },
    enabled: !!courseId,
  })

  // ── 2. Fetch Course Assignments ───────────────────────────────────────────────
  const { data: assignmentsData, isLoading: isAssignLoading } = useQuery({
    queryKey: ['collegeCourseAssignments', courseId],
    queryFn: async () => {
      const res: any = await api.get(`/college-courses/${courseId}/assignments`)
      return res?.data?.assignments || []
    },
    enabled: !!courseId && activeTab === 'assignments',
  })

  // ── 3. Fetch Course Quizzes ────────────────────────────────────────────────────
  const { data: quizzesData, isLoading: isQuizLoading } = useQuery({
    queryKey: ['collegeCourseQuizzes', courseId],
    queryFn: async () => {
      const res: any = await api.get(`/college-courses/${courseId}/quizzes`)
      return res?.data?.quizzes || []
    },
    enabled: !!courseId && activeTab === 'quizzes',
  })

  // ── 4. Fetch Internal Exam Marks ─────────────────────────────────────────────
  const { data: examsData, isLoading: isExamLoading } = useQuery({
    queryKey: ['collegeCourseExams', courseId],
    queryFn: async () => {
      const res: any = await api.get(`/college-courses/${courseId}/exams`)
      return res?.data?.exams || []
    },
    enabled: !!courseId && activeTab === 'exams',
  })

  // ── 5. Fetch Performance Summary ──────────────────────────────────────────────
  const { data: perfData } = useQuery({
    queryKey: ['collegeCoursePerf', courseId],
    queryFn: async () => {
      const res: any = await api.get(`/college-courses/${courseId}/performance`)
      return res?.data || null
    },
    enabled: !!courseId && activeTab === 'performance',
  })

  // Submit Assignment Mutation
  const submitAssignMutation = useMutation({
    mutationFn: async () => {
      if (!submittingAssignment || !submissionText.trim()) return
      const res: any = await api.post(`/college-courses/${courseId}/assignments/${submittingAssignment._id}/submit`, {
        submissionText
      })
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collegeCourseAssignments', courseId] })
      setSubmittingAssignment(null)
      setSubmissionText('')
    }
  })

  if (isCourseLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--indigo)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>Loading Academic College Course...</p>
      </div>
    )
  }

  const course = courseData?.course
  const enrollment = courseData?.enrollment

  if (!course) {
    return (
      <div className="p-8 text-center space-y-4 rounded-2xl" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
        <AlertTriangle className="mx-auto text-amber-500" size={36} />
        <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>College Course Access Restricted</h3>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>You are not enrolled in this college academic course or the course does not exist.</p>
        <button onClick={() => navigate('/courses')} className="px-4 py-2 text-white rounded-xl text-xs font-bold"
          style={{ background: 'var(--indigo)' }}>
          Back to Courses
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Hero Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 60%, #312E81 100%)', border: '1px solid rgba(99,102,241,0.4)' }}>
        
        <button onClick={() => navigate('/courses')}
          className="mb-4 flex items-center gap-1.5 text-2xs font-bold transition-all px-3 py-1.5 rounded-xl cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.12)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)' }}>
          <ArrowLeft size={13} /> Back to Courses
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-black uppercase tracking-wider"
                style={{ background: 'rgba(99,102,241,0.25)', color: '#C7D2FE', border: '1px solid rgba(165,180,252,0.4)' }}>
                🎓 {course.courseCode}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#F1F5F9', border: '1px solid rgba(255,255,255,0.2)' }}>
                {course.department} — Sem {course.semester}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold"
                style={{ background: 'rgba(16,185,129,0.2)', color: '#A7F3D0', border: '1px solid rgba(167,243,208,0.3)' }}>
                {course.credits} Academic Credits
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black" style={{ color: '#FFFFFF' }}>{course.title}</h1>
            <p className="text-xs sm:text-sm mt-1 max-w-2xl" style={{ color: '#CBD5E1' }}>{course.description}</p>
          </div>

          <div className="p-4 rounded-2xl border flex items-center gap-3"
            style={{ background: 'rgba(15,23,42,0.8)', borderColor: 'rgba(99,102,241,0.3)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-indigo-300"
              style={{ background: 'rgba(99,102,241,0.2)' }}>
              👨‍🏫
            </div>
            <div>
              <p className="text-3xs font-semibold uppercase" style={{ color: '#94A3B8' }}>Course Instructor</p>
              <p className="text-xs font-bold" style={{ color: '#FFFFFF' }}>{course.instructorName}</p>
              <p className="text-3xs" style={{ color: '#C7D2FE' }}>Section {enrollment?.section || 'A'} · {enrollment?.academicYear || '2025-2026'}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          {[
            { id: 'syllabus', label: '📖 Syllabus & Units', icon: <Layers size={13} /> },
            { id: 'assignments', label: '📋 Assignments & Marks', icon: <FileText size={13} /> },
            { id: 'quizzes', label: '🧠 Unit Quizzes', icon: <HelpCircle size={13} /> },
            { id: 'exams', label: '🏅 Midterms & Exams', icon: <Award size={13} /> },
            { id: 'performance', label: '📈 Performance Standing', icon: <TrendingUp size={13} /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
              style={activeTab === tab.id
                ? { background: 'linear-gradient(135deg, #4F46E5, #4338CA)', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(79,70,229,0.4)' }
                : { background: 'rgba(255,255,255,0.12)', color: '#F1F5F9', border: '1px solid rgba(255,255,255,0.2)' }
              }>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* 1. SYLLABUS TAB */}
        {activeTab === 'syllabus' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Layers size={16} style={{ color: 'var(--indigo)' }} /> Official Academic Units & Topics Syllabus
            </h2>
            {(course.units || []).length > 0 ? (
              (course.units || []).map((unit: any) => (
                <div key={unit.unitNumber} className="p-5 rounded-2xl space-y-3"
                  style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm" style={{ color: 'var(--indigo)' }}>
                      Unit {unit.unitNumber}: {unit.title}
                    </h3>
                    <span className="text-2xs font-mono px-2 py-0.5 rounded"
                      style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                      {unit.topics?.length || 0} Topics
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{unit.description}</p>
                  
                  <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    {(unit.topics || []).map((topic: any) => (
                      <div key={topic.id} className="p-3 rounded-xl flex items-center justify-between gap-3"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-2xs"
                            style={{ background: 'var(--indigo-muted)', color: 'var(--indigo)' }}>
                            {topic.contentType === 'lab' ? '🧪' : topic.contentType === 'pdf' ? '📄' : '📚'}
                          </div>
                          <div>
                            <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{topic.title}</p>
                            <p className="text-3xs" style={{ color: 'var(--muted-foreground)' }}>{topic.description}</p>
                          </div>
                        </div>
                        <span className="text-3xs font-semibold px-2 py-1 rounded capitalize"
                          style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>
                          {topic.contentType || 'lecture'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-2xl text-center text-xs"
                style={{ background: 'var(--elevated)', border: '1px dashed var(--border)', color: 'var(--muted-foreground)' }}>
                No syllabus units published yet for this course.
              </div>
            )}
          </div>
        )}

        {/* 2. ASSIGNMENTS TAB */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <FileText size={16} style={{ color: 'var(--indigo)' }} /> College Assignments & Submissions
            </h2>
            {isAssignLoading ? (
              <div className="py-8 text-center"><Loader2 size={24} className="animate-spin mx-auto" style={{ color: 'var(--indigo)' }} /></div>
            ) : (assignmentsData || []).length > 0 ? (
              (assignmentsData || []).map((assign: any) => (
                <div key={assign._id} className="p-5 rounded-2xl space-y-3"
                  style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-extrabold text-sm" style={{ color: 'var(--foreground)' }}>{assign.title}</h3>
                      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{assign.description}</p>
                      <div className="flex items-center gap-3 text-2xs mt-2 font-mono" style={{ color: 'var(--muted-foreground)' }}>
                        <span>Max Marks: <strong style={{ color: 'var(--indigo)' }}>{assign.maxMarks}</strong></span>
                        <span>Due: <strong style={{ color: 'var(--warning)' }}>{new Date(assign.dueDate).toDateString()}</strong></span>
                      </div>
                    </div>

                    <div>
                      {assign.isSubmitted ? (
                        <span className="px-3 py-1 rounded-full text-2xs font-bold flex items-center gap-1"
                          style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)' }}>
                          <CheckCircle2 size={11} /> Submitted
                        </span>
                      ) : (
                        <button onClick={() => setSubmittingAssignment(assign)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
                          style={{ background: 'var(--indigo)' }}>
                          <Send size={12} /> Submit Work
                        </button>
                      )}
                    </div>
                  </div>

                  {assign.submission && (
                    <div className="p-3 rounded-xl space-y-1 text-2xs"
                      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                      <p className="font-bold" style={{ color: 'var(--success)' }}>Your Submission ({new Date(assign.submission.submittedAt).toLocaleDateString()}):</p>
                      <p className="font-mono italic" style={{ color: 'var(--foreground)' }}>"{assign.submission.submissionText}"</p>
                      {assign.submission.marksObtained !== undefined && (
                        <p className="font-bold pt-1" style={{ color: 'var(--indigo)' }}>Grade: {assign.submission.marksObtained} / {assign.maxMarks}</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 rounded-2xl text-center text-xs"
                style={{ background: 'var(--elevated)', border: '1px dashed var(--border)', color: 'var(--muted-foreground)' }}>
                No assignments currently assigned for this college course.
              </div>
            )}
          </div>
        )}

        {/* 3. QUIZZES TAB */}
        {activeTab === 'quizzes' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <HelpCircle size={16} style={{ color: 'var(--indigo)' }} /> Academic Unit Quizzes
            </h2>
            {isQuizLoading ? (
              <div className="py-8 text-center"><Loader2 size={24} className="animate-spin mx-auto" style={{ color: 'var(--indigo)' }} /></div>
            ) : (quizzesData || []).length > 0 ? (
              (quizzesData || []).map((quiz: any) => (
                <div key={quiz._id} className="p-5 rounded-2xl flex items-center justify-between gap-3"
                  style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                  <div>
                    <h3 className="font-extrabold text-sm" style={{ color: 'var(--foreground)' }}>{quiz.title}</h3>
                    <div className="flex items-center gap-3 text-2xs mt-1 font-mono" style={{ color: 'var(--muted-foreground)' }}>
                      <span>Duration: {quiz.durationMinutes} min</span>
                      <span>Total Points: {quiz.totalPoints}</span>
                      <span>Pass Mark: {quiz.passingScorePct}%</span>
                    </div>
                  </div>

                  <div>
                    {quiz.isCompleted ? (
                      <div className="text-right">
                        <span className="px-3 py-1 rounded-full text-2xs font-bold"
                          style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)' }}>
                          Completed: {quiz.result?.percentage}% ({quiz.result?.score}/{quiz.result?.totalPoints})
                        </span>
                      </div>
                    ) : (
                      <button onClick={() => navigate(`/quizzes`)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer"
                        style={{ background: 'var(--indigo)' }}>
                        Take Quiz
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-2xl text-center text-xs"
                style={{ background: 'var(--elevated)', border: '1px dashed var(--border)', color: 'var(--muted-foreground)' }}>
                No active unit quizzes for this course.
              </div>
            )}
          </div>
        )}

        {/* 4. EXAMS TAB */}
        {activeTab === 'exams' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Award size={16} style={{ color: 'var(--indigo)' }} /> Midterms & Internal Examination Results
            </h2>
            {isExamLoading ? (
              <div className="py-8 text-center"><Loader2 size={24} className="animate-spin mx-auto" style={{ color: 'var(--indigo)' }} /></div>
            ) : (examsData || []).length > 0 ? (
              (examsData || []).map((exam: any) => (
                <div key={exam._id} className="p-5 rounded-2xl flex items-center justify-between gap-3"
                  style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                  <div>
                    <span className="px-2 py-0.5 rounded text-3xs font-bold uppercase"
                      style={{ background: 'var(--indigo-muted)', color: 'var(--indigo)' }}>
                      {exam.examType}
                    </span>
                    <h3 className="font-extrabold text-sm mt-1" style={{ color: 'var(--foreground)' }}>{exam.title}</h3>
                    <p className="text-2xs font-mono mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      Exam Date: {new Date(exam.date).toDateString()} · Weightage: {exam.weightagePct}%
                    </p>
                  </div>

                  <div className="text-right">
                    {exam.myMarks ? (
                      <div className="p-2.5 rounded-xl text-right" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                        <p className="text-sm font-black" style={{ color: 'var(--success)' }}>{exam.myMarks.marksObtained} / {exam.myMarks.maxMarks}</p>
                        <p className="text-3xs font-bold" style={{ color: 'var(--indigo)' }}>Grade: {exam.myMarks.grade}</p>
                      </div>
                    ) : (
                      <span className="text-2xs italic" style={{ color: 'var(--muted-foreground)' }}>Marks Pending Evaluation</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-2xl text-center text-xs"
                style={{ background: 'var(--elevated)', border: '1px dashed var(--border)', color: 'var(--muted-foreground)' }}>
                No internal examination records found for this course.
              </div>
            )}
          </div>
        )}

        {/* 5. PERFORMANCE TAB */}
        {activeTab === 'performance' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <TrendingUp size={16} style={{ color: 'var(--indigo)' }} /> Course Academic Performance Breakdown
            </h2>

            {perfData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl text-center" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                  <p className="text-xl font-extrabold" style={{ color: 'var(--success)' }}>{perfData.attendancePct}%</p>
                  <p className="text-2xs font-semibold mt-1" style={{ color: 'var(--muted-foreground)' }}>Course Attendance</p>
                </div>
                <div className="p-4 rounded-2xl text-center" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                  <p className="text-xl font-extrabold" style={{ color: 'var(--indigo)' }}>{perfData.quizAvg}%</p>
                  <p className="text-2xs font-semibold mt-1" style={{ color: 'var(--muted-foreground)' }}>Quiz Average</p>
                </div>
                <div className="p-4 rounded-2xl text-center" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                  <p className="text-xl font-extrabold" style={{ color: '#8B5CF6' }}>{perfData.examAvg}%</p>
                  <p className="text-2xs font-semibold mt-1" style={{ color: 'var(--muted-foreground)' }}>Exam Average</p>
                </div>
                <div className="p-4 rounded-2xl text-center" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-bold mt-1" style={{ color: 'var(--foreground)' }}>{perfData.academicStatus}</p>
                  <p className="text-2xs font-semibold mt-1" style={{ color: 'var(--muted-foreground)' }}>Academic Status</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assignment Submission Modal */}
      <AnimatePresence>
        {submittingAssignment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="p-6 max-w-lg w-full space-y-4 rounded-2xl border shadow-2xl"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Submit Assignment: {submittingAssignment.title}</h3>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{submittingAssignment.description}</p>
              
              <textarea
                rows={5}
                value={submissionText}
                onChange={e => setSubmissionText(e.target.value)}
                placeholder="Type or paste your assignment solution documentation here..."
                className="w-full p-3 text-xs rounded-xl font-mono border"
                style={{ background: 'var(--elevated)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />

              <div className="flex justify-end gap-3">
                <button onClick={() => setSubmittingAssignment(null)} className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                  Cancel
                </button>
                <button
                  disabled={!submissionText.trim() || submitAssignMutation.isPending}
                  onClick={() => submitAssignMutation.mutate()}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                  style={{ background: 'var(--indigo)' }}>
                  {submitAssignMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Submit Assignment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
