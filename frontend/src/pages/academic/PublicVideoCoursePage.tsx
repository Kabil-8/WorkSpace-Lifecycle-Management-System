import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Play, CheckCircle2, Award, BookOpen,
  Loader2, Star, Check
} from 'lucide-react'
import { api } from '../../services/api'
import { useAppSelector } from '../../hooks/useStore'

export default function PublicVideoCoursePage() {
  const { courseSlug, lessonId: paramLessonId } = useParams<{ courseSlug: string; lessonId?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAppSelector(s => s.auth)

  const [activeLessonId, setActiveLessonId] = useState<string | null>(paramLessonId || null)
  const [showCertModal, setShowCertModal] = useState(false)

  // ── 1. Fetch Video Course Public Details ──────────────────────────────────────
  const { data: courseData, isLoading: isCourseLoading } = useQuery({
    queryKey: ['publicVideoCourse', courseSlug],
    queryFn: async () => {
      const res: any = await api.get(`/learn/${courseSlug}`)
      return res?.data || res
    },
    enabled: !!courseSlug,
  })

  // ── 2. Fetch User's Watch Progress (if logged in) ────────────────────────────
  const { data: progressData } = useQuery({
    queryKey: ['videoCourseProgress', courseSlug],
    queryFn: async () => {
      if (!isAuthenticated) return null
      const res: any = await api.get(`/learn/${courseSlug}/progress`)
      return res?.data?.progress || null
    },
    enabled: !!courseSlug && isAuthenticated,
  })

  // ── 3. Fetch Certificate (if 100% completed) ──────────────────────────────────
  const { data: certData } = useQuery({
    queryKey: ['videoCourseCert', courseSlug],
    queryFn: async () => {
      if (!isAuthenticated || !progressData || progressData.completionPct < 100) return null
      const res: any = await api.get(`/learn/${courseSlug}/certificate`)
      return res?.data?.certificate || null
    },
    enabled: !!courseSlug && isAuthenticated && (progressData?.completionPct ?? 0) >= 100,
  })

  // Mark Lesson Completed Mutation
  const markLessonMutation = useMutation({
    mutationFn: async (lesId: string) => {
      if (!isAuthenticated) return
      const res: any = await api.post(`/learn/${courseSlug}/progress`, {
        lessonId: lesId,
        isCompleted: true,
        watchedTimeSeconds: 300,
      })
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoCourseProgress', courseSlug] })
    }
  })

  if (isCourseLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-sky-500" size={32} />
        <p className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>Loading Public Video Course...</p>
      </div>
    )
  }

  const course = courseData?.course
  if (!course) {
    return (
      <div className="p-8 text-center space-y-4 rounded-2xl" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
        <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Public Video Course Not Found</h3>
        <button onClick={() => navigate('/courses')} className="px-4 py-2 text-white rounded-xl text-xs font-bold"
          style={{ background: '#0284C7' }}>
          Back to Catalog
        </button>
      </div>
    )
  }

  const sections = course.sections || []
  const allLessons = sections.flatMap((s: any) => s.lessons || [])
  const currentLesson = allLessons.find((l: any) => l.lessonId === activeLessonId) || allLessons[0]
  const completedLessonIds: string[] = progressData?.completedLessonIds || []
  const completionPct = progressData?.completionPct || 0

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner — Dark Sky Blue Gradient with explicit bright white text */}
      <div className="relative p-6 sm:p-8 rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #0369A1 60%, #0284C7 100%)', border: '1px solid rgba(56,189,248,0.4)' }}>
        
        <button onClick={() => navigate('/courses')}
          className="mb-4 flex items-center gap-1.5 text-2xs font-bold transition-all px-3 py-1.5 rounded-xl cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.12)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)' }}>
          <ArrowLeft size={13} /> Back to Catalog
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-black uppercase tracking-wider"
                style={{ background: 'rgba(56,189,248,0.25)', color: '#BAE6FD', border: '1px solid rgba(186,230,253,0.4)' }}>
                🌐 Public Video Learning
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#F1F5F9', border: '1px solid rgba(255,255,255,0.2)' }}>
                {course.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold flex items-center gap-1"
                style={{ background: 'rgba(245,158,11,0.2)', color: '#FDE68A', border: '1px solid rgba(253,230,138,0.3)' }}>
                <Star size={10} className="fill-amber-400 text-amber-400" /> {course.rating} ({course.reviewCount} Reviews)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black" style={{ color: '#FFFFFF' }}>{course.title}</h1>
            <p className="text-xs sm:text-sm" style={{ color: '#E0F2FE' }}>{course.description}</p>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {(course.skills || []).map((sk: string) => (
                <span key={sk} className="px-2 py-0.5 rounded text-3xs font-mono"
                  style={{ background: 'rgba(255,255,255,0.12)', color: '#BAE6FD', border: '1px solid rgba(255,255,255,0.2)' }}>
                  #{sk}
                </span>
              ))}
            </div>
          </div>

          {/* Progress / Certificate Card */}
          <div className="p-5 rounded-2xl border space-y-3 min-w-[260px]"
            style={{ background: 'rgba(15,23,42,0.85)', borderColor: 'rgba(56,189,248,0.3)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: '#CBD5E1' }}>Course Progress</span>
              <span className="text-xs font-mono font-bold" style={{ color: '#38BDF8' }}>{completionPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <div className="h-full transition-all duration-500"
                style={{ width: `${completionPct}%`, background: 'linear-gradient(90deg, #38BDF8, #34D399)' }} />
            </div>
            <p className="text-3xs" style={{ color: '#94A3B8' }}>
              {completedLessonIds.length} of {allLessons.length} Video Lessons Completed
            </p>

            {completionPct >= 100 && (
              <button onClick={() => setShowCertModal(true)}
                className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
                <Award size={14} /> View Verified Certificate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Video Player + Section Outline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-2xl space-y-3" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
            <div className="aspect-video w-full rounded-2xl overflow-hidden relative flex flex-col items-center justify-center"
              style={{ background: '#090D16', border: '1px solid var(--border)' }}>
              {currentLesson ? (
                <div className="text-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-xl"
                    style={{ background: 'rgba(56,189,248,0.2)', border: '1px solid rgba(56,189,248,0.4)', color: '#38BDF8' }}>
                    <Play size={28} className="ml-1" />
                  </div>
                  <h3 className="text-base font-bold text-white">{currentLesson.title}</h3>
                  <p className="text-xs text-slate-400 max-w-md">{currentLesson.description}</p>
                  <span className="inline-block px-3 py-1 rounded-full text-3xs font-mono"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#BAE6FD' }}>
                    Duration: {currentLesson.durationMinutes} minutes
                  </span>
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Select a lesson to begin watching</p>
              )}
            </div>

            {/* Lesson Bar */}
            {currentLesson && (
              <div className="flex items-center justify-between gap-3 pt-2">
                <div>
                  <h4 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{currentLesson.title}</h4>
                  <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Instructor: {course.instructorName}</p>
                </div>

                {isAuthenticated && (
                  <button
                    disabled={completedLessonIds.includes(currentLesson.lessonId) || markLessonMutation.isPending}
                    onClick={() => markLessonMutation.mutate(currentLesson.lessonId)}
                    className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    style={completedLessonIds.includes(currentLesson.lessonId)
                      ? { background: 'rgba(16,185,129,0.15)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)' }
                      : { background: '#0284C7', color: '#FFFFFF' }
                    }>
                    {completedLessonIds.includes(currentLesson.lessonId) ? (
                      <><Check size={14} /> Lesson Completed</>
                    ) : markLessonMutation.isPending ? (
                      <><Loader2 size={14} className="animate-spin" /> Updating...</>
                    ) : (
                      <><CheckCircle2 size={14} /> Mark as Complete</>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Section Outline */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <BookOpen size={16} style={{ color: '#0284C7' }} /> Course Curriculum Outline
          </h2>

          <div className="space-y-3">
            {sections.map((section: any, secIdx: number) => (
              <div key={section.sectionId || secIdx} className="p-4 rounded-2xl space-y-2"
                style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                <h3 className="text-xs font-bold" style={{ color: '#0284C7' }}>{section.title}</h3>
                
                <div className="space-y-1.5">
                  {(section.lessons || []).map((les: any) => {
                    const isSelected = activeLessonId === les.lessonId
                    const isDone = completedLessonIds.includes(les.lessonId)

                    return (
                      <button
                        key={les.lessonId}
                        onClick={() => setActiveLessonId(les.lessonId)}
                        className="w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition-all cursor-pointer"
                        style={isSelected
                          ? { background: 'rgba(2,132,199,0.15)', border: '1px solid rgba(2,132,199,0.4)', color: 'var(--foreground)' }
                          : { background: 'var(--card)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }
                        }>
                        <div className="flex items-center gap-2 min-w-0">
                          {isDone ? (
                            <CheckCircle2 size={14} className="flex-shrink-0" style={{ color: 'var(--success)' }} />
                          ) : (
                            <Play size={14} className="flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                          )}
                          <span className="text-xs font-semibold truncate">{les.title}</span>
                        </div>
                        <span className="text-3xs font-mono flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                          {les.durationMinutes}m
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      <AnimatePresence>
        {showCertModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="p-8 max-w-xl w-full text-center space-y-6 rounded-3xl border-2 shadow-2xl"
              style={{ background: 'var(--card)', borderColor: '#F59E0B' }}>
              
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-xl text-amber-400"
                style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.5)' }}>
                <Award size={36} />
              </div>

              <div>
                <p className="text-2xs font-mono font-bold text-amber-500 tracking-widest uppercase">Verified Certificate of Completion</p>
                <h2 className="text-xl font-black mt-1" style={{ color: 'var(--foreground)' }}>EduSphere Public Video Academy</h2>
              </div>

              <div className="p-6 rounded-2xl space-y-2" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>This certifies that</p>
                <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{certData?.studentName || user?.name || 'Student Candidate'}</p>
                <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>has successfully completed the public video course</p>
                <p className="text-sm font-extrabold" style={{ color: '#0284C7' }}>{course.title}</p>
                <p className="text-3xs font-mono pt-2" style={{ color: 'var(--muted-foreground)' }}>Certificate ID: {certData?.certificateId || 'EDUSPHERE-CERT-884920'}</p>
              </div>

              <button onClick={() => setShowCertModal(false)}
                className="w-full py-2.5 rounded-xl font-bold text-xs cursor-pointer"
                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                Close Certificate
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
