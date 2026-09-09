import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Brain, CheckCircle2, RefreshCw, Send, ChevronRight, Upload, FileText,
  Target, Shield, Eye, AlertTriangle, Lock, Unlock, Volume2, VolumeX,
  Camera, X, ZoomIn, BarChart3, Star, Award, Clock, KeyRound, LogOut
} from 'lucide-react'
import { useAppSelector } from '../../hooks/useStore'
import { MLService, InterviewQuestion, AnswerEvaluation } from '../../../../backend/src/services/mlService'
import { useRealTimeProctor } from '../../hooks/useRealTimeProctor'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface QuestionResult {
  question: InterviewQuestion
  transcript: string
  evaluation: AnswerEvaluation
  voiceScore: number
  timeSpent: number
}

type Stage = 'setup' | 'password' | 'session' | 'exit_confirm' | 'results'

// ─────────────────────────────────────────────
// Gaze Direction Indicator
// ─────────────────────────────────────────────
function GazeIndicator({ direction }: { direction: string }) {
  const positions: Record<string, string> = {
    Center: 'translate-x-0 translate-y-0',
    Left: '-translate-x-3',
    Right: 'translate-x-3',
    Up: '-translate-y-3',
    Down: 'translate-y-3',
  }
  return (
    <div className="relative w-10 h-10 rounded-full border-2 border-slate-600 bg-slate-800/70 flex items-center justify-center">
      <div className={`w-3 h-3 rounded-full transition-transform duration-200 ${positions[direction] || ''} ${direction === 'Center' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
    </div>
  )
}

// ─────────────────────────────────────────────
// Score Ring
// ─────────────────────────────────────────────
function ScoreRing({ score, size = 64, label }: { score: number; size?: number; label: string }) {
  const radius = (size - 8) / 2
  const circ = 2 * Math.PI * radius
  const dash = (score / 100) * circ
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth="4" stroke="rgba(255,255,255,0.1)" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth="4" stroke={color}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontSize="12" fontWeight="bold" fill={color}>{score}</text>
      </svg>
      <span className="text-2xs text-slate-400 text-center leading-tight">{label}</span>
    </div>
  )
}

// ─────────────────────────────────────────────
// Warning Overlay
// ─────────────────────────────────────────────
function WarningOverlay({ warning, onDismiss }: { warning: any; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 7000)
    return () => clearTimeout(t)
  }, [warning, onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, y: -60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.9 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md mx-4"
    >
      <div className="rounded-2xl shadow-2xl border border-red-500/50 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e0505 0%, #2d0b0b 100%)' }}>
        <div className="h-1 bg-red-500 animate-pulse" />
        <div className="p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-red-300">⚠️ Warning #{warning.number} — {warning.type.replace(/_/g, ' ').toUpperCase()}</p>
            <p className="text-xs text-red-200/80 mt-1 leading-relaxed">{warning.message}</p>
            <p className="text-2xs text-slate-500 mt-2">Auto-dismissing in 7s...</p>
          </div>
          <button onClick={onDismiss} className="text-slate-400 hover:text-white">
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
export default function MockInterviewPage() {
  useAppSelector(s => s.auth)

  // ── Setup State ─────────────────────────────
  const [stage, setStage] = useState<Stage>('setup')
  const [uploadedResumeFileName, setUploadedResumeFileName] = useState<string | null>(null)
  const [resumeContentText, setResumeContentText] = useState(
    `Experience: Frontend Developer Intern at TechCorp. Built React 19 dashboards, Node.js REST APIs, MongoDB, Redis, Docker, and WebSockets.`
  )
  const [isUploading, setIsUploading] = useState(false)
  const [targetRole, setTargetRole] = useState('Fullstack Developer')
  const [proctoredQuestions, setProctoredQuestions] = useState<InterviewQuestion[]>([])
  const [filterCategory, setFilterCategory] = useState<'All' | 'Technical HR' | 'General HR'>('All')

  // ── Password Gate State ──────────────────────
  const [entryPasswordInput, setEntryPasswordInput] = useState('')
  const [exitPasswordInput, setExitPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showEntryPass, setShowEntryPass] = useState(false)
  const [showExitPass, setShowExitPass] = useState(false)
  const ENTRY_PASSWORD = `MOCK-${targetRole.split(' ').map(w => w[0]).join('').toUpperCase()}`
  const EXIT_PASSWORD = 'EXIT-CONFIRM'

  // ── Session State ───────────────────────────
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answerText, setAnswerText] = useState('')
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<AnswerEvaluation | null>(null)
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([])
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [sessionTimer, setSessionTimer] = useState(0)
  const sessionTimerRef = useRef<any>(null)

  // ── Voice State ─────────────────────────────
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [liveTranscriptDisplay, setLiveTranscriptDisplay] = useState('')
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const recognitionRef = useRef<any>(null)

  // ── Real-Time Proctor ───────────────────────
  const {
    videoRef, canvasRef, state: pState, startCamera,
    triggerWarning, dismissWarning, enableSecureLockdown,
    requestFullscreen, exitFullscreen, cleanup
  } = useRealTimeProctor({
    maxWarnings: 3,
    onMaxWarnings: () => {
      triggerWarning('max_warnings', 'Maximum warnings reached. Session flagged for review.')
    }
  })

  const lockdownCleanupRef = useRef<(() => void) | null>(null)

  const roles = [
    'Fullstack Developer', 'Frontend Developer', 'Backend Developer',
    'AI / ML Engineer', 'Data Engineer', 'DevOps / Cloud Engineer',
  ]

  // ── Timers ──────────────────────────────────
  useEffect(() => {
    if (stage === 'session') {
      sessionTimerRef.current = setInterval(() => setSessionTimer(t => t + 1), 1000)
      return () => clearInterval(sessionTimerRef.current)
    }
  }, [stage])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // ── Resume Upload ───────────────────────────
  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedResumeFileName(file.name)
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('targetRole', targetRole)
      const res = await fetch('http://localhost:8000/api/ml/resume/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        if (data.extractedText?.trim().length > 10) {
          setResumeContentText(data.extractedText)
          setIsUploading(false)
          return
        }
      }
    } catch { /* fallback */ }
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = (event.target?.result as string)
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim()
      setResumeContentText(text.length > 40 ? text :
        `Resume for ${file.name}. Proficient in ${targetRole} technologies.`)
      setIsUploading(false)
    }
    reader.readAsText(file)
  }

  // ── Generate Questions ──────────────────────
  const handleGenerateQuestions = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/ml/interview/proctored-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: resumeContentText, targetRole }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.data?.length > 0) { setProctoredQuestions(data.data); return }
      }
    } catch { /* fallback */ }
    const fallback: InterviewQuestion[] = Array.from({ length: 20 }, (_, i) => ({
      id: `q-${i + 1}`,
      company: 'AI Interview Arena',
      role: targetRole,
      category: i < 10 ? 'Technical HR' : 'General HR',
      difficulty: i % 2 === 0 ? 'Medium' : 'Hard',
      question: i < 10
        ? `[Technical Q${i + 1}] For ${targetRole}: Describe how you designed and optimized system component #${i + 1} from your resume experience, including trade-offs and performance improvements.`
        : `[General HR Q${i - 9}] Describe a situation using STAR method where you demonstrated leadership, problem-solving, or project delivery under pressure (Scenario ${i - 9}).`,
      expectedKeywords: ['architecture', 'performance', 'database', 'star', 'collaboration'],
      modelAnswerOutline: 'Explain technical choices, metrics, STAR outcomes.',
    }))
    setProctoredQuestions(fallback)
  }

  // ── Password Gate: Enter ────────────────────
  const handleEnterPasswordSubmit = () => {
    if (entryPasswordInput.toUpperCase() === ENTRY_PASSWORD) {
      setPasswordError('')
      setStage('session')
      setCurrentQuestionIndex(0)
      setAnswerText('')
      setVoiceTranscript('')
      setEvaluationResult(null)
      setQuestionResults([])
      setSessionTimer(0)
      setQuestionStartTime(Date.now())
      startCamera()
      requestFullscreen()
      lockdownCleanupRef.current = enableSecureLockdown()
    } else {
      setPasswordError(`Incorrect password. The exam password is: ${ENTRY_PASSWORD}`)
    }
  }

  // ── Voice Controls ──────────────────────────
  const handleStartVoice = () => {
    setLiveTranscriptDisplay('')
    setVoiceTranscript('')
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recog = new SpeechRecognition()
        recog.continuous = true
        recog.interimResults = true
        recog.lang = 'en-US'
        recog.onresult = (event: any) => {
          let interim = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              setVoiceTranscript(prev => (prev + ' ' + transcript).trim())
              setAnswerText(prev => (prev + ' ' + transcript).trim())
            } else {
              interim += transcript
            }
          }
          setLiveTranscriptDisplay(interim)
        }
        recog.onerror = () => setIsRecordingVoice(false)
        recog.onend = () => setIsRecordingVoice(false)
        recog.start()
        recognitionRef.current = recog
        setIsRecordingVoice(true)
      } else {
        setIsRecordingVoice(true)
      }
    } catch {
      setIsRecordingVoice(true)
    }
  }

  const handleStopVoice = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    setIsRecordingVoice(false)
    if (liveTranscriptDisplay) {
      setAnswerText(prev => (prev + ' ' + liveTranscriptDisplay).trim())
      setVoiceTranscript(prev => (prev + ' ' + liveTranscriptDisplay).trim())
      setLiveTranscriptDisplay('')
    }
  }

  // ── Evaluate Answer ─────────────────────────
  const filteredQuestions = proctoredQuestions.filter(q => {
    if (filterCategory === 'Technical HR') return q.category.includes('Technical')
    if (filterCategory === 'General HR') return q.category.includes('General') || q.category.includes('HR') || q.category.includes('Behavioral')
    return true
  })
  const currentQ = filteredQuestions[currentQuestionIndex] || proctoredQuestions[0]

  const handleEvaluate = useCallback(async () => {
    if (!answerText.trim() || !currentQ) return
    setIsEvaluating(true)

    let evalRes: AnswerEvaluation | null = null

    try {
      const res = await fetch('http://localhost:8000/api/ml/interview/score-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          voiceTranscript: answerText,
          targetRole,
          category: currentQ.category,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        evalRes = {
          overallScore: data.totalScore,
          relevanceScore: data.breakdown?.keyword_relevance || 0,
          technicalClarityScore: data.breakdown?.completeness || 0,
          starFormatScore: data.breakdown?.star_structure || 0,
          feedback: data.feedback || 'Good response. Focus on more specific technical metrics.',
          matchedKeywords: data.keywords_found || [],
          missingKeywords: [],
          improvementTip: data.feedback || 'Strengthen STAR structure and add role-specific technical terms.',
          modelAnswer: '',
        }
      }
    } catch { /* fallback to local scoring */ }

    if (!evalRes) {
      setTimeout(() => {
        evalRes = MLService.evaluateAnswer(currentQ, answerText)
        finalizeEval(evalRes)
      }, 600)
      return
    }
    finalizeEval(evalRes)
  }, [answerText, currentQ, targetRole])

  const finalizeEval = (evalRes: AnswerEvaluation) => {
    const voiceScore = voiceTranscript.split(/\s+/).filter(Boolean).length > 20 ? 10 : 0
    setEvaluationResult(evalRes)
    setIsEvaluating(false)
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)
    setQuestionResults(prev => [...prev, {
      question: currentQ,
      transcript: answerText,
      evaluation: evalRes,
      voiceScore,
      timeSpent,
    }])
  }

  // ── Next Question ───────────────────────────
  const handleNextQuestion = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setAnswerText('')
      setVoiceTranscript('')
      setLiveTranscriptDisplay('')
      setEvaluationResult(null)
      setQuestionStartTime(Date.now())
    } else {
      setStage('exit_confirm')
    }
  }

  // ── Exit Confirm ────────────────────────────
  const handleEndInterview = () => setStage('exit_confirm')

  const handleConfirmExit = () => {
    if (exitPasswordInput.toUpperCase() === EXIT_PASSWORD) {
      setPasswordError('')
      handleStopVoice()
      cleanup()
      lockdownCleanupRef.current?.()
      exitFullscreen()
      clearInterval(sessionTimerRef.current)
      setStage('results')
    } else {
      setPasswordError(`Incorrect exit password. Type: ${EXIT_PASSWORD}`)
    }
  }

  // ── Results ─────────────────────────────────
  const avgScore = questionResults.length
    ? Math.round(questionResults.reduce((a, r) => a + r.evaluation.overallScore, 0) / questionResults.length)
    : 0

  const avgRelevance = questionResults.length
    ? Math.round(questionResults.reduce((a, r) => a + r.evaluation.relevanceScore, 0) / questionResults.length)
    : 0

  const avgSTAR = questionResults.length
    ? Math.round(questionResults.reduce((a, r) => a + r.evaluation.starFormatScore, 0) / questionResults.length)
    : 0

  // ── Cleanup on unmount ──────────────────────
  useEffect(() => {
    return () => {
      cleanup()
      lockdownCleanupRef.current?.()
    }
  }, [cleanup])

  // ══════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════

  return (
    <div className={`${stage === 'session' ? 'fixed inset-0 z-[9990] flex flex-col' : 'page-container space-y-6'}`}
      style={stage === 'session' ? { background: 'var(--bg-primary)' } : {}}>

      {/* ─── WARNING OVERLAY ─── */}
      <AnimatePresence>
        {pState.activeWarning && (
          <WarningOverlay warning={pState.activeWarning} onDismiss={dismissWarning} />
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════ */}
      {/* STAGE: SETUP                       */}
      {/* ══════════════════════════════════ */}
      {stage === 'setup' && (
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              🎯 AI Mock Interview Arena
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Real-time proctored interview with gaze tracking, voice-to-text AI scoring, and browser lockdown
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-5">
              {/* Resume Upload */}
              <div className="card p-5 space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Upload size={16} className="text-blue-500" /> Step 1: Upload Resume (.PDF / .DOCX / .TXT)
                </h3>
                <div className="border-2 border-dashed rounded-2xl p-6 text-center border-blue-500/30 hover:border-blue-500 transition-all cursor-pointer relative"
                  style={{ background: 'rgba(37,99,235,0.03)' }}>
                  <input type="file" accept=".pdf,.docx,.txt" onChange={handleResumeFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <FileText size={28} className="mx-auto text-blue-500 mb-2" />
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {isUploading ? 'Parsing Resume...' : uploadedResumeFileName ? `✓ ${uploadedResumeFileName}` : 'Click to upload resume'}
                  </p>
                </div>
                <div>
                  <label className="text-2xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>Resume Context:</label>
                  <textarea value={resumeContentText} onChange={e => setResumeContentText(e.target.value)} rows={4}
                    className="input text-xs w-full p-3 rounded-xl resize-none font-mono" />
                </div>
              </div>

              {/* Role Selector */}
              <div className="card p-5 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Target size={16} className="text-purple-500" /> Step 2: Select Target Role
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {roles.map(r => (
                    <button key={r} onClick={() => setTargetRole(r)}
                      className={`p-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${targetRole === r ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                      <span>{r}</span>
                      {targetRole === r && <CheckCircle2 size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate + Proceed */}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={async () => { await handleGenerateQuestions(); setStage('password') }}
                className="w-full py-4 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2 shadow-xl"
                style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}>
                <Shield size={18} /> Generate 20 Questions & Enter Exam Room
              </motion.button>
            </div>

            {/* Info Panel */}
            <div className="lg:col-span-5 space-y-4">
              <div className="card p-5 space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Eye size={16} className="text-emerald-500" /> Real-Time Proctoring Features
                </h3>
                {[
                  { icon: <Eye size={14} />, color: 'blue', title: 'Gaze Tracking', desc: 'Eye movement & iris direction monitored live on canvas' },
                  { icon: <Camera size={14} />, color: 'purple', title: 'Face Detection', desc: 'Face presence & confidence % tracked every frame' },
                  { icon: <Mic size={14} />, color: 'red', title: 'Voice-to-Text', desc: 'Web Speech API transcribes your spoken answers in real-time' },
                  { icon: <BarChart3 size={14} />, color: 'amber', title: 'AI Scoring', desc: 'STAR structure, keyword relevance, completeness scored' },
                  { icon: <Lock size={14} />, color: 'emerald', title: 'Fullscreen Lock', desc: 'Browser lockdown with 3-warning system' },
                ].map((f, i) => (
                  <div key={i} className={`p-3 rounded-xl bg-${f.color}-500/10 border border-${f.color}-500/20 flex items-start gap-2`}>
                    <span className={`text-${f.color}-500 mt-0.5`}>{f.icon}</span>
                    <div>
                      <p className={`font-bold text-xs text-${f.color}-400`}>{f.title}</p>
                      <p className="text-2xs text-slate-500 mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Exam Password Info */}
              <div className="card p-4 border border-amber-500/30" style={{ background: 'rgba(245,158,11,0.05)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound size={14} className="text-amber-500" />
                  <span className="text-xs font-bold text-amber-500">Exam Password</span>
                </div>
                <p className="text-2xs text-slate-500 mb-2">The exam entry password for <strong>{targetRole}</strong> is:</p>
                <div className="rounded-lg px-3 py-2 font-mono text-sm font-bold text-amber-300 bg-slate-800/80 tracking-widest text-center border border-amber-500/30">
                  {ENTRY_PASSWORD}
                </div>
                <p className="text-2xs text-slate-600 mt-2">Exit password: <span className="text-slate-400 font-mono">{EXIT_PASSWORD}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════ */}
      {/* STAGE: PASSWORD GATE               */}
      {/* ══════════════════════════════════ */}
      {stage === 'password' && (
        <div className="min-h-screen flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md">
            <div className="card p-8 space-y-6 border-2 border-purple-500/30 text-center"
              style={{ background: 'linear-gradient(145deg, rgba(88,28,135,0.15) 0%, rgba(30,27,75,0.3) 100%)' }}>

              <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)' }}>
                <Lock size={36} className="text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-white">Enter Exam Room</h2>
                <p className="text-sm text-slate-400 mt-1">AI Mock Interview Arena — {targetRole}</p>
              </div>

              <div className="rounded-xl p-4 bg-slate-800/60 border border-slate-700 text-left space-y-2">
                <p className="text-xs font-bold text-slate-300">📋 Exam Rules:</p>
                {['Stay fullscreen at all times', 'Do not switch browser tabs', 'Speak clearly into microphone', '3 violations = automatic flagging', 'Use STAR method for answers'].map((r, i) => (
                  <p key={i} className="text-2xs text-slate-400 flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> {r}
                  </p>
                ))}
              </div>

              <div className="space-y-3 text-left">
                <label className="text-xs font-bold text-slate-300">Exam Access Password</label>
                <div className="relative">
                  <input
                    type={showEntryPass ? 'text' : 'password'}
                    value={entryPasswordInput}
                    onChange={e => { setEntryPasswordInput(e.target.value); setPasswordError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleEnterPasswordSubmit()}
                    className="input w-full pr-10 font-mono tracking-widest text-center text-lg"
                    placeholder="Enter exam password..."
                  />
                  <button onClick={() => setShowEntryPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showEntryPass ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle size={12} /> {passwordError}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStage('setup')}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all">
                  ← Back
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleEnterPasswordSubmit}
                  className="flex-2 flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)' }}>
                  <Unlock size={16} /> Unlock & Begin
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ══════════════════════════════════ */}
      {/* STAGE: LIVE SESSION (FULLSCREEN)   */}
      {/* ══════════════════════════════════ */}
      {stage === 'session' && (
        <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>

          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b shrink-0"
            style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-red-400">PROCTORED LIVE</span>
              </div>
              <span className="text-2xs text-slate-500">|</span>
              <Shield size={14} className="text-purple-400" />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{targetRole}</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Timer */}
              <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                <Clock size={12} className="text-amber-500" />
                {formatTime(sessionTimer)}
              </div>
              {/* Progress */}
              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                Q{currentQuestionIndex + 1}/{filteredQuestions.length}
              </span>
              {/* Integrity */}
              <div className={`px-2 py-0.5 rounded-full text-2xs font-bold ${pState.integrityScore >= 80 ? 'bg-emerald-500/20 text-emerald-400' : pState.integrityScore >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                Integrity: {pState.integrityScore}%
              </div>
              {/* Warnings */}
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <AlertTriangle size={12} className={pState.warningsCount > 0 ? 'text-amber-400' : 'text-slate-600'} />
                {pState.warningsCount}/3 warnings
              </div>
              {/* End Button */}
              <button onClick={handleEndInterview}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-2xs font-bold bg-red-500/15 text-red-400 hover:bg-red-500/30 transition-all border border-red-500/30">
                <LogOut size={12} /> End Interview
              </button>
            </div>
          </div>

          {/* Main Session Grid */}
          <div className="flex flex-1 overflow-hidden gap-0">

            {/* LEFT: Question + Answer */}
            <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-4">

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl w-fit"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                {(['All', 'Technical HR', 'General HR'] as const).map(cat => (
                  <button key={cat} onClick={() => { setFilterCategory(cat); setCurrentQuestionIndex(0) }}
                    className={`px-3 py-1 rounded-lg text-2xs font-bold transition-all ${filterCategory === cat ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>
                    {cat === 'All' ? 'All (20)' : cat}
                  </button>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #2563EB, #7C3AED)', width: `${((currentQuestionIndex + 1) / filteredQuestions.length) * 100}%` }}
                  transition={{ duration: 0.4 }} />
              </div>

              {/* Question Card */}
              {currentQ && (
                <AnimatePresence mode="wait">
                  <motion.div key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                    className="card p-5 space-y-4 border-2 border-blue-500/30">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-2xs px-2.5 py-1 rounded-full font-bold ${currentQ.category.includes('Technical') ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {currentQ.category}
                      </span>
                      <span className={`text-2xs px-2.5 py-1 rounded-full font-bold ${currentQ.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {currentQ.difficulty}
                      </span>
                      <span className="text-2xs text-slate-500 ml-auto">
                        {Math.round((Date.now() - questionStartTime) / 1000)}s elapsed
                      </span>
                    </div>
                    <h3 className="text-base font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                      {currentQ.question}
                    </h3>
                    <p className="text-2xs text-slate-500 italic">
                      💡 Use STAR method: Situation → Task → Action → Result
                    </p>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Voice + Text Answer */}
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Mic size={14} className="text-red-500" /> Your Answer
                    <span className="text-slate-500 font-normal">({answerText.split(/\s+/).filter(Boolean).length} words)</span>
                  </label>
                  {/* Voice Controls */}
                  <div className="flex items-center gap-2">
                    {!isRecordingVoice ? (
                      <motion.button whileTap={{ scale: 0.95 }} onClick={handleStartVoice}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 transition-all">
                        <Mic size={13} /> Start Speaking
                      </motion.button>
                    ) : (
                      <motion.button whileTap={{ scale: 0.95 }} onClick={handleStopVoice}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500 text-white shadow-lg animate-pulse">
                        <MicOff size={13} /> Stop (Recording...)
                      </motion.button>
                    )}
                    <button onClick={() => { setAnswerText(''); setVoiceTranscript(''); setLiveTranscriptDisplay('') }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-all">
                      <RefreshCw size={12} />
                    </button>
                  </div>
                </div>

                {/* Live transcript display */}
                {isRecordingVoice && liveTranscriptDisplay && (
                  <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/5 text-xs text-red-300 italic animate-pulse">
                    🎙️ Live: "{liveTranscriptDisplay}"
                  </div>
                )}

                <textarea
                  value={answerText}
                  onChange={e => setAnswerText(e.target.value)}
                  rows={6}
                  placeholder="Speak your answer (mic button) or type here... Use STAR format for best results."
                  className="input text-xs w-full p-4 rounded-xl resize-none"
                />

                <div className="flex justify-end">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleEvaluate} disabled={isEvaluating || !answerText.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                    {isEvaluating ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    {isEvaluating ? 'Scoring...' : 'Evaluate Answer'}
                  </motion.button>
                </div>
              </div>

              {/* Evaluation Result */}
              <AnimatePresence>
                {evaluationResult && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="card p-5 space-y-4 border-2 border-emerald-500/30">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                        <Brain size={18} /> EDEN AI Score
                      </h4>
                      <div className="flex items-center gap-1">
                        <Award size={16} className="text-amber-400" />
                        <span className="text-xl font-extrabold text-emerald-400">{evaluationResult.overallScore}/100</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-6 py-2">
                      <ScoreRing score={evaluationResult.relevanceScore} label="Relevance" />
                      <ScoreRing score={evaluationResult.technicalClarityScore} label="Completeness" />
                      <ScoreRing score={evaluationResult.starFormatScore} label="STAR Format" />
                      <ScoreRing score={Math.min(100, evaluationResult.overallScore + 5)} label="Overall" size={72} />
                    </div>

                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {evaluationResult.feedback}
                    </p>

                    <div className="flex justify-end pt-1">
                      <button onClick={handleNextQuestion}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700">
                        {currentQuestionIndex < filteredQuestions.length - 1 ? 'Next Question' : 'Finish Interview'}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT: Proctor Panel */}
            <div className="w-64 xl:w-72 shrink-0 flex flex-col border-l gap-3 p-3 overflow-y-auto"
              style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>

              {/* Camera Feed */}
              <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700 aspect-video">
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-0" muted playsInline />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-2xs text-white font-bold bg-black/50 px-1 rounded">LIVE</span>
                </div>
                <div className="absolute bottom-2 right-2">
                  <div className={`text-2xs px-2 py-0.5 rounded-full font-bold ${pState.gaze.faceCount > 0 ? 'bg-emerald-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                    {pState.gaze.faceCount > 0 ? `Face: ${pState.gaze.faceConfidence}%` : 'No Face'}
                  </div>
                </div>
              </div>

              {/* Gaze Tracker */}
              <div className="card p-3 space-y-2">
                <p className="text-2xs font-bold text-slate-400 flex items-center gap-1.5">
                  <ZoomIn size={11} /> GAZE TRACKER
                </p>
                <div className="flex items-center justify-between">
                  <GazeIndicator direction={pState.gaze.direction} />
                  <div className="text-right">
                    <p className={`text-xs font-bold ${pState.gaze.direction === 'Center' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {pState.gaze.direction}
                    </p>
                    <p className="text-2xs text-slate-500">Focus: {pState.gaze.eyeFocusScore}%</p>
                  </div>
                </div>
                {/* Focus bar */}
                <div className="h-1.5 rounded-full overflow-hidden bg-slate-700">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pState.gaze.eyeFocusScore}%`, background: pState.gaze.eyeFocusScore > 70 ? '#10B981' : '#F59E0B' }} />
                </div>
              </div>

              {/* Integrity */}
              <div className="card p-3 space-y-2">
                <p className="text-2xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Shield size={11} /> INTEGRITY SCORE
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-xl font-extrabold ${pState.integrityScore >= 80 ? 'text-emerald-400' : pState.integrityScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {pState.integrityScore}%
                  </span>
                  <span className={`text-2xs px-2 py-0.5 rounded-full font-bold ${pState.riskCategory === 'Safe' ? 'bg-emerald-500/20 text-emerald-400' : pState.riskCategory === 'Low Risk' ? 'bg-blue-500/20 text-blue-400' : pState.riskCategory === 'Needs Review' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                    {pState.riskCategory}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-slate-700">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pState.integrityScore}%`, background: pState.integrityScore >= 80 ? '#10B981' : pState.integrityScore >= 50 ? '#F59E0B' : '#EF4444' }} />
                </div>
              </div>

              {/* Warnings Log */}
              {pState.warnings.length > 0 && (
                <div className="card p-3 space-y-2">
                  <p className="text-2xs font-bold text-red-400 flex items-center gap-1.5">
                    <AlertTriangle size={11} /> VIOLATIONS ({pState.warnings.length})
                  </p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {pState.warnings.map(w => (
                      <div key={w.id} className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-2xs font-bold text-red-400">#{w.number} {w.type.replace(/_/g, ' ')}</p>
                        <p className="text-2xs text-slate-500">{w.timestamp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Voice Status */}
              <div className={`card p-3 border ${isRecordingVoice ? 'border-red-500/40' : 'border-transparent'}`}>
                <p className="text-2xs font-bold text-slate-400 flex items-center gap-1.5 mb-2">
                  <Mic size={11} /> VOICE STATUS
                </p>
                <div className={`flex items-center gap-2 ${isRecordingVoice ? 'text-red-400' : 'text-slate-500'}`}>
                  <div className={`w-2 h-2 rounded-full ${isRecordingVoice ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="text-2xs font-bold">{isRecordingVoice ? 'Recording...' : 'Idle'}</span>
                </div>
                {voiceTranscript && (
                  <p className="text-2xs text-slate-500 mt-1 line-clamp-3 italic">"{voiceTranscript.slice(-80)}..."</p>
                )}
              </div>

              {/* Session Stats */}
              <div className="card p-3 space-y-2">
                <p className="text-2xs font-bold text-slate-400">SESSION STATS</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-2xs">
                    <span className="text-slate-500">Duration</span>
                    <span className="font-mono text-slate-300">{formatTime(sessionTimer)}</span>
                  </div>
                  <div className="flex justify-between text-2xs">
                    <span className="text-slate-500">Answered</span>
                    <span className="text-emerald-400 font-bold">{questionResults.length} / {filteredQuestions.length}</span>
                  </div>
                  {questionResults.length > 0 && (
                    <div className="flex justify-between text-2xs">
                      <span className="text-slate-500">Avg Score</span>
                      <span className="text-blue-400 font-bold">
                        {Math.round(questionResults.reduce((a, r) => a + r.evaluation.overallScore, 0) / questionResults.length)}/100
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════ */}
      {/* STAGE: EXIT CONFIRM                */}
      {/* ══════════════════════════════════ */}
      {stage === 'exit_confirm' && (
        <div className="min-h-screen flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md">
            <div className="card p-8 space-y-6 border-2 border-red-500/30 text-center">
              <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center bg-red-500/20 border border-red-500/30">
                <LogOut size={36} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Confirm Exit Interview</h2>
                <p className="text-sm text-slate-400 mt-1">
                  You've answered {questionResults.length} / {filteredQuestions.length} questions.
                  This action is irreversible.
                </p>
              </div>

              <div className="space-y-3 text-left">
                <label className="text-xs font-bold text-slate-300">Exit Password</label>
                <div className="relative">
                  <input
                    type={showExitPass ? 'text' : 'password'}
                    value={exitPasswordInput}
                    onChange={e => { setExitPasswordInput(e.target.value); setPasswordError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleConfirmExit()}
                    className="input w-full pr-10 font-mono tracking-widest text-center text-lg"
                    placeholder={`Type: ${EXIT_PASSWORD}`}
                  />
                  <button onClick={() => setShowExitPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showExitPass ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle size={12} /> {passwordError}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStage('session')}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all">
                  ← Continue
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleConfirmExit}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 transition-all">
                  <LogOut size={16} /> Confirm Exit
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ══════════════════════════════════ */}
      {/* STAGE: RESULTS                     */}
      {/* ══════════════════════════════════ */}
      {stage === 'results' && (
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              🏆 Interview Complete — Performance Report
            </h1>
            <p className="text-sm mt-1 text-slate-500">
              Duration: {formatTime(sessionTimer)} · Questions: {questionResults.length} answered · Role: {targetRole}
            </p>
          </motion.div>

          {/* Overall Score Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Overall Score', value: `${avgScore}%`, color: avgScore >= 75 ? 'emerald' : avgScore >= 50 ? 'amber' : 'red', icon: <Award size={20} /> },
              { label: 'Relevance Avg', value: `${avgRelevance}%`, color: 'blue', icon: <Target size={20} /> },
              { label: 'STAR Format Avg', value: `${avgSTAR}%`, color: 'purple', icon: <Star size={20} /> },
              { label: 'Warnings', value: `${pState.warningsCount}`, color: pState.warningsCount === 0 ? 'emerald' : pState.warningsCount < 3 ? 'amber' : 'red', icon: <AlertTriangle size={20} /> },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`card p-5 text-center border border-${stat.color}-500/20`}
                style={{ background: `rgba(var(--${stat.color}-rgb, 16, 185, 129), 0.05)` }}>
                <div className={`text-${stat.color}-500 mx-auto mb-2 flex justify-center`}>{stat.icon}</div>
                <p className={`text-2xl font-extrabold text-${stat.color}-400`}>{stat.value}</p>
                <p className="text-2xs text-slate-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Per-Question Breakdown */}
          <div className="card p-5 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <BarChart3 size={16} className="text-blue-500" /> Question-by-Question Breakdown
            </h3>
            <div className="space-y-3">
              {questionResults.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
                  style={{ background: 'var(--bg-secondary)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold leading-snug flex-1" style={{ color: 'var(--text-primary)' }}>
                      Q{i + 1}: {r.question.question.slice(0, 80)}...
                    </p>
                    <span className={`text-sm font-extrabold shrink-0 ${r.evaluation.overallScore >= 75 ? 'text-emerald-400' : r.evaluation.overallScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                      {r.evaluation.overallScore}/100
                    </span>
                  </div>
                  <div className="flex gap-4 text-2xs text-slate-500">
                    <span>⏱ {r.timeSpent}s</span>
                    <span>📝 {r.transcript.split(/\s+/).filter(Boolean).length} words</span>
                    <span className={r.question.category.includes('Technical') ? 'text-blue-400' : 'text-purple-400'}>{r.question.category}</span>
                  </div>
                  <p className="text-2xs text-slate-500 italic line-clamp-2">{r.evaluation.feedback}</p>
                </motion.div>
              ))}
              {questionResults.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">No questions were answered before exiting.</p>
              )}
            </div>
          </div>

          {/* Start Over */}
          <div className="flex justify-center gap-4">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setStage('setup'); setQuestionResults([]); setSessionTimer(0); setEntryPasswordInput(''); setExitPasswordInput('') }}
              className="px-8 py-3 rounded-2xl font-bold text-sm text-white flex items-center gap-2 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              <RefreshCw size={16} /> Start New Interview
            </motion.button>
          </div>
        </div>
      )}
    </div>
  )
}
