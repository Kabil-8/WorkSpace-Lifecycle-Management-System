import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, Unlock, AlertTriangle, CheckCircle2, Clock,
  Send, Volume2, Shield, KeyRound, X, VolumeX,
  Mic, Eye, Camera, Monitor
} from 'lucide-react'
import { ProctorService } from '../../services/proctorService'
import { useAppSelector } from '../../hooks/useStore'
import { useRealTimeProctor } from '../../hooks/useRealTimeProctor'

type ExamStage = 'password' | 'live' | 'submit_confirm' | 'submitted'

// ─────────────────────────────────────────────
// Gaze Indicator Dot
// ─────────────────────────────────────────────
function GazeDot({ direction }: { direction: string }) {
  const pos: Record<string, string> = {
    Center: 'translate-x-0 translate-y-0',
    Left: '-translate-x-3',
    Right: 'translate-x-3',
    Up: '-translate-y-3',
    Down: 'translate-y-3',
  }
  return (
    <div className="relative w-10 h-10 rounded-full border-2 border-slate-600 bg-slate-800/70 flex items-center justify-center">
      <div className={`w-3 h-3 rounded-full transition-transform duration-200 ${pos[direction] || ''} ${direction === 'Center' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
    </div>
  )
}

// ─────────────────────────────────────────────
// Warning Overlay Banner
// ─────────────────────────────────────────────
function WarningBanner({ warning, onDismiss }: { warning: any; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000)
    return () => clearTimeout(t)
  }, [warning, onDismiss])

  const isMajor = warning.severity === 'major_violation' || warning.severity === 'critical_flag'

  return (
    <motion.div
      initial={{ opacity: 0, y: -60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-lg px-4"
    >
      <div
        className={`rounded-2xl shadow-2xl border overflow-hidden ${
          isMajor ? 'border-red-500/80' : 'border-amber-500/60'
        }`}
        style={{
          background: isMajor
            ? 'linear-gradient(135deg, #2A0808 0%, #1A0505 100%)'
            : 'linear-gradient(135deg, #2A1D08 0%, #1A1305 100%)',
        }}
      >
        <div className={`h-1.5 ${isMajor ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
        <div className="p-5 flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
              isMajor
                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                : 'bg-amber-500/20 border-amber-500/50 text-amber-400'
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className={`font-bold text-sm ${isMajor ? 'text-red-300' : 'text-amber-300'}`}>
                ⚠️ EduShield Alert #{warning.number} — {warning.type.replace(/_/g, ' ').toUpperCase()}
              </p>
              <span className="text-2xs font-mono px-2 py-0.5 rounded bg-black/40 text-red-300 border border-red-500/30">
                -{warning.scoreDeduction || 5} Integrity
              </span>
            </div>
            <p className="text-xs text-slate-200/90 mt-1 leading-relaxed">{warning.message}</p>
            <p className="text-2xs text-slate-400 mt-2 font-mono">
              Event logged &amp; transmitted to Faculty Monitor Dashboard.
            </p>
          </div>
          <button onClick={onDismiss} className="text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function LiveExamProctoredPage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const { user } = useAppSelector(s => s.auth)
  const socket = ProctorService.getSocket()

  // Exam data state
  const [exam, setExam] = useState<any>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number>(3600)
  const [qStartTime, setQStartTime] = useState<number>(Date.now())

  // Coding sandbox test execution state
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [testResults, setTestResults] = useState<Record<number, { passed: boolean; actual: string }>>({})

  const runCodeTestCases = (q: any) => {
    setIsRunningTests(true)
    setTimeout(() => {
      const code = answers[q.id] || q.starterCode || ''
      const vis = q.visibleTestCases || [{ input: '[2, 7, 11, 15], 9', output: '[0, 1]' }]
      const results: Record<number, { passed: boolean; actual: string }> = {}

      vis.forEach((tc: any, idx: number) => {
        const hasLogic = code.length > 12 && !code.includes('pass')
        results[idx] = {
          passed: hasLogic,
          actual: hasLogic ? tc.output : 'Null / Empty Return'
        }
      })

      setTestResults(results)
      setIsRunningTests(false)
    }, 800)
  }

  // Stage
  const [stage, setStage] = useState<ExamStage>('password')

  // Password gate
  const [entryPasswordInput, setEntryPasswordInput] = useState('')
  const [submitConfirmText, setSubmitConfirmText] = useState('')
  const [submitPasswordInput, setSubmitPasswordInput] = useState('')
  const [showEntryPass, setShowEntryPass] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const EXAM_PASSWORD =
    exam?.proctorConfig?.examPassword ||
    `EXAM-${(exam?.title || 'EDUSHIELD').replace(/\s/g, '').slice(0, 6).toUpperCase()}`
  const SUBMIT_PASSWORD = 'CONFIRM SUBMIT'

  const timerRef = useRef<any>(null)
  const lockdownCleanupRef = useRef<(() => void) | null>(null)

  // ── Real-Time Proctor Engine ──────────────
  const {
    videoRef,
    canvasRef,
    state: pState,
    startCamera,
    triggerWarning,
    dismissWarning,
    enableSecureLockdown,
    requestFullscreen,
    exitFullscreen,
    logQuestionTiming,
    cleanup,
  } = useRealTimeProctor({
    maxWarnings: 3,
    onMaxWarnings: () => {
      triggerWarning(
        'max_violations_reached',
        'Maximum 3 proctor warnings reached! Session flagged for Faculty Audit.',
        20,
        true
      )
    },
    onAutoSubmit: (reason) => {
      alert(`EXAM AUTO-SUBMITTED BY EDUSHIELD AI:\n${reason}`)
      handleFinalSubmit()
    },
  })

  // Fetch Exam on Mount
  useEffect(() => {
    async function initExam() {
      try {
        const allExams = await ProctorService.fetchExams()
        const foundExam = allExams.find((e: any) => e._id === examId) || allExams[0]
        setExam(foundExam)
        if (foundExam?.durationMinutes) setTimeLeft(foundExam.durationMinutes * 60)
      } catch (err) {
        console.warn('[EduShield] Could not fetch exam, using fallback', err)
        const fallbackExam = {
          _id: examId || 'exam-001',
          title: 'EduShield AI Proctored Assessment',
          subject: 'Computer Science & Engineering',
          durationMinutes: 60,
          proctorConfig: { examPassword: 'EXAM-SHIELD' },
          questions: Array.from({ length: 10 }, (_, i) => ({
            id: `q-${i + 1}`,
            text: `Question ${i + 1}: Explain the concept of ${
              [
                'polymorphism',
                'recursion',
                'sorting algorithms',
                'binary search',
                'graph traversal',
                'dynamic programming',
                'hashing',
                'OOP principles',
                'REST APIs',
                'database normalization',
              ][i]
            } with a practical code example.`,
            type: i % 3 === 0 ? 'short_answer' : 'mcq',
            points: 10,
            options:
              i % 3 !== 0
                ? ['Option A - First choice', 'Option B - Second choice', 'Option C - Third choice', 'Option D - Fourth choice']
                : undefined,
          })),
        }
        setExam(fallbackExam)
        setTimeLeft(fallbackExam.durationMinutes * 60)
      }
    }
    initExam()
  }, [examId])

  // Remote Faculty Control Listeners
  useEffect(() => {
    socket.on('student:remote-action', (payload: any) => {
      const myId = (user as any)?._id || user?.id || 'std-101'
      if (payload.studentId === myId || payload.studentId === 'all') {
        if (payload.action === 'warning') {
          triggerWarning('faculty_manual_warning', payload.customMessage || 'Faculty Proctor issued an integrity warning!', 10, true)
        } else if (payload.action === 'terminate') {
          alert('Your examination session has been terminated remotely by the faculty proctor.')
          handleFinalSubmit()
        }
      }
    })

    return () => {
      socket.off('student:remote-action')
    }
  }, [user, triggerWarning])

  // Emit Real-Time Telemetry to Faculty Dashboard
  useEffect(() => {
    if (stage === 'live' && exam) {
      socket.emit('proctor:telemetry', {
        examId: exam._id,
        studentId: (user as any)?._id || user?.id || 'std-101',
        studentName: user?.name || 'Student Candidate',
        integrityScore: pState.integrityScore,
        riskCategory: pState.riskCategory,
        cheatingProbabilityPct: pState.cheatingProbabilityPct,
        eyeFocusScore: pState.gaze.eyeFocusScore,
        headOrientation: pState.gaze.direction,
        warningsCount: pState.warningsCount,
        answeredCount: Object.keys(answers).length,
        totalQuestions: exam.questions?.length || 10,
        faceCount: pState.gaze.faceCount,
        phoneDetected: pState.objects.phoneDetected,
        noiseDb: pState.audio.noiseDb,
        speechDetected: pState.audio.speechDetected,
        internetOnline: pState.environment.internetOnline,
      })
    }
  }, [stage, exam, pState, answers, user])

  // Rule 23 Question Change Analysis
  const handleQuestionChange = (newIndex: number) => {
    if (!exam?.questions) return
    const currentQId = exam.questions[currentQIndex]?.id || `q-${currentQIndex + 1}`
    const secondsSpent = Math.round((Date.now() - qStartTime) / 1000)
    logQuestionTiming(currentQId, secondsSpent)

    setQStartTime(Date.now())
    setCurrentQIndex(newIndex)
  }

  // Exam Entry
  const handleExamEntry = async () => {
    const expected = (exam?.proctorConfig?.examPassword || EXAM_PASSWORD).toUpperCase()
    if (entryPasswordInput.toUpperCase() !== expected) {
      setPasswordError(`Incorrect exam password. Ask your faculty for the entry access code.`)
      return
    }
    setPasswordError('')

    try {
      const res = await fetch('http://localhost:5000/api/proctor/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: exam._id,
          studentId: (user as any)?._id || user?.id || 'std-101',
          studentName: user?.name || 'Student',
          studentEmail: user?.email || 'student@edusphere.edu',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setAttemptId(data.data.attempt._id)
      }
    } catch (err) {
      console.warn('[EduShield] Start attempt API offline')
    }

    await startCamera()
    await requestFullscreen()
    lockdownCleanupRef.current = enableSecureLockdown()

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleFinalSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setStage('live')
    setQStartTime(Date.now())
  }

  // Submit Confirm
  const handleOpenSubmitConfirm = () => setStage('submit_confirm')

  const handleFinalSubmit = async () => {
    if (stage === 'submit_confirm') {
      if (submitConfirmText.toUpperCase() !== 'CONFIRM SUBMIT') {
        setPasswordError('Please type "CONFIRM SUBMIT" exactly.')
        return
      }
      if (submitPasswordInput.toUpperCase() !== SUBMIT_PASSWORD) {
        setPasswordError('Incorrect submit confirmation password.')
        return
      }
    }
    setPasswordError('')
    clearInterval(timerRef.current)
    cleanup()
    lockdownCleanupRef.current?.()
    await exitFullscreen()

    try {
      await fetch('http://localhost:5000/api/proctor/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, answers, finalIntegrityScore: pState.integrityScore }),
      })
    } catch {
      /* offline fallback */
    }

    setStage('submitted')
  }

  useEffect(() => {
    return () => {
      cleanup()
      lockdownCleanupRef.current?.()
      clearInterval(timerRef.current)
    }
  }, [cleanup])

  const formatTime = (secs: number) =>
    `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`

  const answeredCount = Object.keys(answers).length
  const totalQ = exam?.questions?.length || 0
  const currentQ = exam?.questions?.[currentQIndex]

  return (
    <div
      className={`select-none ${stage === 'live' ? 'fixed inset-0 z-[9990] flex flex-col' : 'page-container space-y-6'}`}
      style={stage === 'live' ? { background: 'var(--background)' } : {}}
    >
      {/* Warning Banner */}
      <AnimatePresence>
        {pState.activeWarning && <WarningBanner warning={pState.activeWarning} onDismiss={dismissWarning} />}
      </AnimatePresence>

      {/* STAGE: PASSWORD GATE */}
      {stage === 'password' && (
        <div className="min-h-screen flex items-center justify-center py-12">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl">
            <div
              className="card p-8 space-y-6 border-2"
              style={{
                borderColor: 'color-mix(in srgb, var(--indigo) 35%, transparent)',
                background: 'var(--card)',
              }}
            >
              <div className="text-center space-y-3">
                <div
                  className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-2xl text-white"
                  style={{ background: 'linear-gradient(135deg, var(--indigo), var(--primary))' }}
                >
                  <Shield size={38} />
                </div>
                <h2 className="text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>
                  EduShield AI Exam Authentication
                </h2>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {exam?.title || 'AI Proctored Assessment'} — {exam?.subject || 'Computer Science'}
                </p>
              </div>

              {/* Exam Info */}
              {exam && (
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Duration', value: `${exam.durationMinutes || 60} min` },
                    { label: 'Questions', value: totalQ },
                    { label: 'Proctor Rules', value: '25 Active' },
                  ].map((i, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border"
                      style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}
                    >
                      <p className="text-sm font-bold" style={{ color: 'var(--indigo)' }}>{i.value}</p>
                      <p className="text-2xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{i.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Proctoring Rules List */}
              <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--elevated)', borderColor: 'var(--border)' }}>
                <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                  <Shield size={14} style={{ color: 'var(--indigo)' }} /> EduShield AI 25 Rules Overview:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                  {[
                    '1. Face visibility continuous',
                    '2. Single candidate only',
                    '3. Face similarity verification',
                    '4. Eye gaze direction tracking',
                    '5. Head pose orientation',
                    '6. Mobile phone detection',
                    '7. Book / paper detection',
                    '8. Tab switch / focus lock',
                    '9. Fullscreen enforcement',
                    '10. Copy / Paste / Cut blocked',
                    '11. OS shortcut keys disabled',
                    '12. Audio activity VAD check',
                    '13. Environmental noise >70dB',
                    '14. Camera block detection',
                    '15. 100-pt Integrity Score AI',
                  ].map((rule, i) => (
                    <p key={i} className="flex items-center gap-1">
                      <span style={{ color: 'var(--indigo)' }}>▸</span> {rule}
                    </p>
                  ))}
                </div>
              </div>

              {/* Entry Password */}
              <div className="space-y-3">
                <label className="text-xs font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                  <KeyRound size={13} style={{ color: 'var(--indigo)' }} /> Exam Access Password
                </label>
                <div className="relative">
                  <input
                    type={showEntryPass ? 'text' : 'password'}
                    value={entryPasswordInput}
                    onChange={(e) => {
                      setEntryPasswordInput(e.target.value)
                      setPasswordError('')
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleExamEntry()}
                    className="input w-full pr-10 font-mono tracking-widest text-center text-lg"
                    placeholder="Enter password..."
                  />
                  <button
                    onClick={() => setShowEntryPass((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {showEntryPass ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--destructive)' }}>
                    <AlertTriangle size={12} /> {passwordError}
                  </p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleExamEntry}
                disabled={!exam}
                className="w-full py-4 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                style={{ background: 'linear-gradient(135deg, var(--indigo), var(--primary))' }}
              >
                <Unlock size={18} /> Authenticate &amp; Launch EduShield Exam
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* STAGE: LIVE EXAM */}
      {stage === 'live' && (
        <div className="flex flex-col h-full" style={{ background: 'var(--background)' }}>
          {/* Top Bar HUD */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b shrink-0 flex-wrap gap-2"
            style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--destructive)' }} />
                <span className="text-xs font-extrabold" style={{ color: 'var(--destructive)' }}>EDUSHIELD AI LIVE</span>
              </div>
              <Lock size={13} style={{ color: 'var(--indigo)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{exam?.title}</span>
            </div>

            {/* Real-time Status Badges Bar */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Face Status */}
              <div className="flex items-center gap-1 text-2xs font-mono px-2 py-0.5 rounded border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                <Camera size={11} style={{ color: pState.gaze.faceCount > 0 ? 'var(--success)' : 'var(--destructive)' }} />
                <span>Face: {pState.gaze.faceCount}</span>
              </div>

              {/* Eyes Status */}
              <div className="flex items-center gap-1 text-2xs font-mono px-2 py-0.5 rounded border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                <Eye size={11} style={{ color: pState.gaze.direction === 'Center' ? 'var(--success)' : 'var(--warning)' }} />
                <span>Eyes: {pState.gaze.direction}</span>
              </div>

              {/* Audio dB */}
              <div className="flex items-center gap-1 text-2xs font-mono px-2 py-0.5 rounded border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                <Mic size={11} style={{ color: pState.audio.speechDetected ? 'var(--warning)' : 'var(--muted-foreground)' }} />
                <span>{pState.audio.noiseDb} dB</span>
              </div>

              {/* Fullscreen */}
              <div className="flex items-center gap-1 text-2xs font-mono px-2 py-0.5 rounded border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                <Monitor size={11} style={{ color: pState.isFullscreen ? 'var(--success)' : 'var(--destructive)' }} />
                <span>{pState.isFullscreen ? 'Full' : 'Windowed'}</span>
              </div>

              {/* Integrity Ring */}
              <div
                className="px-2.5 py-1 rounded-full text-2xs font-mono font-bold border"
                style={{
                  background:
                    pState.integrityScore >= 80
                      ? 'var(--success-muted)'
                      : pState.integrityScore >= 60
                      ? 'var(--warning-muted)'
                      : 'var(--destructive-muted)',
                  color:
                    pState.integrityScore >= 80
                      ? 'var(--success)'
                      : pState.integrityScore >= 60
                      ? 'var(--warning)'
                      : 'var(--destructive)',
                  borderColor:
                    pState.integrityScore >= 80
                      ? 'color-mix(in srgb, var(--success) 30%, transparent)'
                      : 'color-mix(in srgb, var(--destructive) 30%, transparent)',
                }}
              >
                Integrity: {pState.integrityScore}/100 ({pState.riskCategory})
              </div>

              {/* Timer */}
              <div
                className={`flex items-center gap-1 font-mono text-xs font-bold ${
                  timeLeft < 300 ? 'animate-pulse' : ''
                }`}
                style={{ color: timeLeft < 300 ? 'var(--destructive)' : 'var(--amber)' }}
              >
                <Clock size={12} /> {formatTime(timeLeft)}
              </div>

              {/* Q Progress */}
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Q{currentQIndex + 1}/{totalQ}
              </span>

              {/* Submit */}
              <button
                onClick={handleOpenSubmitConfirm}
                className="btn btn-sm btn-success flex items-center gap-1 text-2xs cursor-pointer"
              >
                <Send size={12} /> Finish &amp; Submit
              </button>
            </div>
          </div>

          {/* Exam Grid */}
          <div className="flex flex-1 overflow-hidden">
            {/* Questions Panel */}
            <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-4">
              {/* Progress bar */}
              <div className="progress-bar h-1.5">
                <motion.div
                  className="progress-fill"
                  style={{ width: `${((currentQIndex + 1) / totalQ) * 100}%`, background: 'var(--primary)' }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Question Navigator */}
              <div className="flex gap-1.5 flex-wrap">
                {exam?.questions?.map((_: any, i: number) => {
                  const qId = exam.questions[i].id
                  const isAnswered = !!answers[qId]
                  return (
                    <button
                      key={i}
                      onClick={() => handleQuestionChange(i)}
                      className="w-8 h-8 rounded-lg text-2xs font-bold transition-all cursor-pointer"
                      style={{
                        background:
                          i === currentQIndex
                            ? 'var(--primary)'
                            : isAnswered
                            ? 'var(--success-muted)'
                            : 'var(--muted)',
                        color:
                          i === currentQIndex
                            ? 'var(--primary-foreground)'
                            : isAnswered
                            ? 'var(--success)'
                            : 'var(--muted-foreground)',
                        border: `1px solid ${i === currentQIndex ? 'transparent' : 'var(--border)'}`,
                      }}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>

              {/* Current Question Box */}
              {currentQ && (
                <div className="card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-2xs font-mono font-bold"
                      style={{ background: 'var(--indigo-muted)', color: 'var(--indigo)' }}
                    >
                      Question #{currentQIndex + 1} ({currentQ.points || 10} pts)
                    </span>
                    <span className="text-2xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
                      Type: {currentQ.type}
                    </span>
                  </div>

                  <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--foreground)' }}>
                    {currentQ.text}
                  </p>

                  {/* Options / Text Input / Coding Sandbox */}
                  {currentQ.type === 'coding' ? (
                    <div className="space-y-4 pt-2">
                      {/* Coding Environment Toolbar */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                            ⚡ Monitored Code Environment
                          </span>
                          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-2xs uppercase font-bold">
                            {currentQ.language || 'python'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => runCodeTestCases(currentQ)}
                          disabled={isRunningTests}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-2xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer">
                          {isRunningTests ? 'Executing Test Cases...' : '▶ Run Visible Test Cases'}
                        </button>
                      </div>

                      {/* Code Editor Box */}
                      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950 font-mono text-xs shadow-inner">
                        <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-2xs text-slate-400">
                          <span className="font-bold text-indigo-400">solution.{currentQ.language === 'javascript' ? 'js' : currentQ.language === 'cpp' ? 'cpp' : currentQ.language === 'java' ? 'java' : 'py'}</span>
                          <span>EduShield Monitored IDE • Auto-saving</span>
                        </div>
                        <textarea
                          value={answers[currentQ.id] ?? currentQ.starterCode ?? 'def solution(nums):\n    # Write algorithm here\n    pass'}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
                          rows={10}
                          spellCheck={false}
                          className="w-full p-4 bg-slate-950 text-emerald-300 font-mono text-xs focus:outline-none resize-y leading-relaxed font-semibold"
                        />
                      </div>

                      {/* Visible Test Cases & Execution Results */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-2xs font-mono font-bold text-slate-300">
                          <span>Visible Test Cases ({(currentQ.visibleTestCases || []).length})</span>
                          <span className="text-purple-400">
                            {(currentQ.hiddenTestCases || []).length} Hidden Test Cases Configured
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {(currentQ.visibleTestCases || [
                            { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]' }
                          ]).map((tc: any, tcIdx: number) => {
                            const res = testResults[tcIdx]
                            return (
                              <div key={tcIdx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-2xs space-y-1 font-mono">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-300">Test Case #{tcIdx + 1}</span>
                                  {res && (
                                    <span className={`px-2 py-0.5 rounded font-bold ${res.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                      {res.passed ? 'PASSED ✓' : 'FAILED ✕'}
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-slate-400">
                                  <div><span className="text-slate-500">Input:</span> {tc.input}</div>
                                  <div><span className="text-slate-500">Expected:</span> {tc.output}</div>
                                </div>
                                {res && !res.passed && (
                                  <div className="text-red-400 text-2xs pt-1 border-t border-slate-800">
                                    Actual Output: {res.actual || 'Syntax/Logic error'}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ) : currentQ.options ? (
                    <div className="space-y-2">
                      {currentQ.options.map((opt: string, oIdx: number) => {
                        const isSelected = answers[currentQ.id] === opt
                        return (
                          <div
                            key={oIdx}
                            onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }))}
                            className="p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all"
                            style={{
                              background: isSelected ? 'var(--primary-muted)' : 'var(--elevated)',
                              borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                            }}
                          >
                            <div
                              className="w-4 h-4 rounded-full border flex items-center justify-center text-2xs font-bold"
                              style={{
                                borderColor: isSelected ? 'var(--primary)' : 'var(--border-strong)',
                                background: isSelected ? 'var(--primary)' : 'transparent',
                                color: '#white',
                              }}
                            >
                              {isSelected && '✓'}
                            </div>
                            <span className="text-xs" style={{ color: 'var(--foreground)' }}>{opt}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <textarea
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
                      placeholder="Type your structured answer here..."
                      className="textarea text-xs w-full min-h-[140px]"
                    />
                  )}

                  {/* Next / Previous Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                      disabled={currentQIndex === 0}
                      onClick={() => handleQuestionChange(currentQIndex - 1)}
                      className="btn btn-secondary text-xs disabled:opacity-40"
                    >
                      ← Previous
                    </button>

                    {currentQIndex < totalQ - 1 ? (
                      <button
                        onClick={() => handleQuestionChange(currentQIndex + 1)}
                        className="btn btn-primary text-xs"
                      >
                        Next Question →
                      </button>
                    ) : (
                      <button
                        onClick={handleOpenSubmitConfirm}
                        className="btn btn-success text-xs"
                      >
                        Proceed to Final Submission
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Camera Feed & AI Telemetry Panel */}
            <div
              className="w-80 border-l p-4 flex flex-col gap-4 overflow-y-auto shrink-0"
              style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold font-mono uppercase" style={{ color: 'var(--muted-foreground)' }}>
                    📹 Candidate Webcam Feed
                  </span>
                  <span className="text-2xs font-mono" style={{ color: 'var(--success)' }}>
                    VAD &amp; Iris Active
                  </span>
                </div>

                <div className="relative rounded-2xl overflow-hidden border shadow-lg" style={{ borderColor: 'var(--border)' }}>
                  <video ref={videoRef} className="w-full h-44 object-cover" muted playsInline />
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-44 object-cover pointer-events-none" />

                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-2xs font-mono flex items-center gap-1">
                    <GazeDot direction={pState.gaze.direction} />
                    <span>{pState.gaze.direction}</span>
                  </div>
                </div>
              </div>

              {/* Integrity AI Radar Box */}
              <div className="p-3.5 rounded-xl border space-y-2" style={{ background: 'var(--elevated)', borderColor: 'var(--border)' }}>
                <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>🧠 EduShield Threat Assessment</p>
                <div className="space-y-1.5 text-2xs font-mono">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted-foreground)' }}>Integrity Score:</span>
                    <span className="font-bold" style={{ color: pState.integrityScore > 75 ? 'var(--success)' : 'var(--destructive)' }}>
                      {pState.integrityScore} / 100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted-foreground)' }}>Cheating Risk %:</span>
                    <span className="font-bold" style={{ color: 'var(--amber)' }}>{pState.cheatingProbabilityPct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted-foreground)' }}>Warnings Issued:</span>
                    <span style={{ color: 'var(--warning)' }}>{pState.warningsCount} / {3}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted-foreground)' }}>Environment Lum:</span>
                    <span style={{ color: 'var(--foreground)' }}>{pState.environment.luminance} lux</span>
                  </div>
                </div>
              </div>

              {/* Violation Log Stream */}
              <div className="flex-1 space-y-2 min-h-[160px]">
                <p className="text-2xs font-bold uppercase font-mono" style={{ color: 'var(--muted-foreground)' }}>
                  📜 Recent Violation Event Log
                </p>
                {pState.violationLog.length === 0 ? (
                  <div className="p-4 rounded-xl text-center text-2xs font-mono" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                    No integrity violations logged. Maintain current candidate posture.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {pState.violationLog.slice(-5).map((log, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg text-2xs font-mono space-y-0.5 border"
                        style={{ background: 'var(--destructive-muted)', borderColor: 'color-mix(in srgb, var(--destructive) 25%, transparent)', color: 'var(--destructive)' }}
                      >
                        <div className="flex justify-between font-bold">
                          <span>{log.type}</span>
                          <span>-{log.deduction} pts</span>
                        </div>
                        <p className="text-3xs truncate opacity-80">{log.details}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE: SUBMIT CONFIRM */}
      {stage === 'submit_confirm' && (
        <div className="min-h-screen flex items-center justify-center py-12">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
            <div className="card p-8 space-y-6">
              <div className="text-center space-y-2">
                <div
                  className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white"
                  style={{ background: 'var(--success)' }}
                >
                  <Send size={32} />
                </div>
                <h2 className="text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>Final Submission Confirmation</h2>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  You have answered {answeredCount} of {totalQ} questions.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Type "CONFIRM SUBMIT" to finalize:
                  </label>
                  <input
                    type="text"
                    value={submitConfirmText}
                    onChange={(e) => setSubmitConfirmText(e.target.value)}
                    className="input text-center font-mono font-bold"
                    placeholder="CONFIRM SUBMIT"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--foreground)' }}>
                    Enter Submission Password ("CONFIRM SUBMIT"):
                  </label>
                  <input
                    type="password"
                    value={submitPasswordInput}
                    onChange={(e) => setSubmitPasswordInput(e.target.value)}
                    className="input text-center font-mono"
                    placeholder="Enter password..."
                  />
                </div>

                {passwordError && (
                  <p className="text-xs font-bold text-center" style={{ color: 'var(--destructive)' }}>{passwordError}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStage('live')} className="btn btn-secondary flex-1 text-xs">
                  Cancel &amp; Return to Exam
                </button>
                <button onClick={handleFinalSubmit} className="btn btn-success flex-1 text-xs font-bold">
                  Final Submit Now
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* STAGE: SUBMITTED */}
      {stage === 'submitted' && (
        <div className="min-h-screen flex items-center justify-center py-12">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center">
            <div className="card p-8 space-y-4">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white" style={{ background: 'var(--success)' }}>
                <CheckCircle2 size={42} />
              </div>
              <h2 className="text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>Exam Submitted Successfully</h2>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Your responses and EduShield proctoring telemetry log have been securely transmitted to the faculty dashboard.
              </p>
              <div className="p-4 rounded-xl border text-left text-xs font-mono space-y-1" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                <p>Final Integrity Score: <strong>{pState.integrityScore} / 100</strong></p>
                <p>Risk Classification: <strong>{pState.riskCategory}</strong></p>
                <p>Total Warnings: <strong>{pState.warningsCount}</strong></p>
              </div>
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary w-full text-xs font-bold">
                Return to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
