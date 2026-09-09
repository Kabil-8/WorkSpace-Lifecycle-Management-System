import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Video, AlertTriangle, Pause, Play, XCircle, Camera, Bell, User } from 'lucide-react'
import { ProctorService } from '../../services/proctorService'

export default function FacultyLiveMonitorDashboard() {
  const [students, setStudents] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExamId, setSelectedExamId] = useState<string>('all')
  const [examsList, setExamsList] = useState<any[]>([])

  useEffect(() => {
    async function loadExams() {
      try {
        const list = await ProctorService.fetchExams()
        if (Array.isArray(list)) setExamsList(list)
      } catch (err) {
        console.warn('Could not fetch exams list for live monitor', err)
      }
    }
    loadExams()
  }, [])

  // Fetch active attempts from backend API when selectedExamId changes
  useEffect(() => {
    async function fetchActiveMonitor() {
      setLoading(true)
      try {
        const res = await fetch(`http://localhost:5000/api/proctor/faculty/live-monitor/${selectedExamId}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.data)) {
            setStudents(data.data.map((att: any) => ({
              id: att.studentId || att._id,
              attemptId: att._id,
              examId: att.examId,
              name: att.studentName || 'Student Candidate',
              email: att.studentEmail || 'student@edusphere.edu',
              integrityScore: att.integrityScore || 100,
              riskCategory: att.riskCategory || 'Safe',
              cheatingProbabilityPct: att.cheatingProbabilityPct || 5,
              eyeFocusScore: att.eyeFocusPercentage || 95,
              headOrientation: 'Center',
              warningsCount: att.warningsCount || 0,
              faceCount: att.faceCount ?? 1,
              phoneDetected: att.phoneDetected ?? false,
              noiseDb: att.noiseDb ?? 35,
              speechDetected: att.speechDetected ?? false,
              internetOnline: att.internetOnline ?? true,
              cameraActive: true,
              isPaused: att.status === 'paused',
              answeredCount: Object.keys(att.answers || {}).length,
              totalQuestions: att.totalQuestions || 10,
            })))
          }
        }
      } catch (err) {
        console.warn('Backend live monitor API offline, listening for live socket connections', err)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveMonitor()
  }, [selectedExamId])

  useEffect(() => {
    const socket = ProctorService.getSocket()
    socket.emit('student-joined', { examId: selectedExamId, studentId: 'fac-monitor-1', studentName: 'Faculty Monitor Console' })

    const handleTelemetryData = (data: any) => {
      if (selectedExamId !== 'all' && data.examId && data.examId !== selectedExamId) return
      if (data.studentId === 'fac-monitor-1' || data.studentName?.includes('Faculty Monitor')) return

      setStudents(prev => {
        const exists = prev.some(s => s.id === data.studentId || s.name === data.studentName)
        if (exists) {
          return prev.map(s => (s.id === data.studentId || s.name === data.studentName) ? { ...s, ...data } : s)
        }
        return [...prev, {
          id: data.studentId || `std-${Date.now()}`,
          name: data.studentName || 'Candidate',
          integrityScore: data.integrityScore ?? 100,
          riskCategory: data.riskCategory || 'Safe',
          cheatingProbabilityPct: data.cheatingProbabilityPct ?? 5,
          eyeFocusScore: data.eyeFocusScore ?? 90,
          headOrientation: data.headOrientation || 'Center',
          warningsCount: data.warningsCount ?? 0,
          faceCount: data.faceCount ?? 1,
          phoneDetected: data.phoneDetected ?? false,
          noiseDb: data.noiseDb ?? 35,
          speechDetected: data.speechDetected ?? false,
          internetOnline: data.internetOnline ?? true,
          cameraActive: true,
          isPaused: false,
          answeredCount: data.answeredCount ?? 0,
          totalQuestions: data.totalQuestions ?? 10,
        }]
      })

      if (data.integrityScore !== undefined && data.integrityScore < 70) {
        setAlerts(prev => {
          const alertMsg = `Flagged RED: Integrity score dropped to ${data.integrityScore}% (${data.riskCategory || 'High Risk'})`
          if (prev.some(a => a.studentName === data.studentName && a.msg === alertMsg)) return prev
          return [
            { id: `a-${Date.now()}`, time: new Date().toLocaleTimeString(), studentName: data.studentName, msg: alertMsg, severity: 'high' },
            ...prev
          ]
        })
      }
    }

    socket.on('risk-score-update', handleTelemetryData)
    socket.on('proctor:global-telemetry', handleTelemetryData)

    socket.on('faculty-alert', (data: any) => {
      if (data.studentId === 'fac-monitor-1' || data.studentName?.includes('Faculty Monitor')) return
      setAlerts(prev => [
        { id: `a-${Date.now()}`, time: new Date().toLocaleTimeString(), studentName: data.studentName, msg: data.message || `${data.warningType || 'Proctor Violation'} triggered`, severity: 'high' },
        ...prev
      ])
    })

    socket.on('proctor:student-online', (data: any) => {
      if (data.studentId === 'fac-monitor-1' || data.studentName?.includes('Faculty Monitor')) return
      setStudents(prev => {
        if (!prev.some(s => s.id === data.studentId)) {
          return [...prev, {
            id: data.studentId || `std-${Date.now()}`,
            name: data.studentName || 'Candidate',
            integrityScore: 100,
            riskCategory: 'Safe',
            cheatingProbabilityPct: 2,
            eyeFocusScore: 95,
            headOrientation: 'Center',
            warningsCount: 0,
            faceCount: 1,
            phoneDetected: false,
            noiseDb: 35,
            speechDetected: false,
            internetOnline: true,
            cameraActive: true,
            isPaused: false,
            answeredCount: 0,
            totalQuestions: 10,
          }]
        }
        return prev
      })
    })

    socket.on('exam:submitted', (data: any) => {
      if (data.studentId === 'fac-monitor-1' || data.studentName?.includes('Faculty Monitor')) return
      setStudents(prev => prev.filter(s => s.id !== data.studentId && s.id !== data.attemptId))
    })

    return () => {
      socket.off('risk-score-update', handleTelemetryData)
      socket.off('proctor:global-telemetry', handleTelemetryData)
      socket.off('faculty-alert')
      socket.off('proctor:student-online')
      socket.off('exam:submitted')
    }
  }, [selectedExamId])

  const handlePauseExam = (studentId: string) => {
    const socket = ProctorService.getSocket()
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const nextState = !s.isPaused
        socket.emit('faculty:action', { studentId, examId: selectedExamId, action: nextState ? 'pause' : 'resume' })
        return { ...s, isPaused: nextState }
      }
      return s
    }))
  }

  const handleTerminateExam = (studentId: string) => {
    if (!window.confirm('Are you sure you want to terminate this student\'s live proctored session immediately?')) return
    const socket = ProctorService.getSocket()
    socket.emit('faculty:action', { studentId, examId: selectedExamId, action: 'terminate' })
    setStudents(prev => prev.filter(s => s.id !== studentId))
  }

  const handleSendWarning = (studentId: string, studentName: string) => {
    const socket = ProctorService.getSocket()
    socket.emit('faculty:action', { studentId, examId: selectedExamId, action: 'warning', customMessage: 'Faculty proctor alert issued: Please refocus on your exam.' })
    setAlerts(prev => [
      { id: `a-${Date.now()}`, time: new Date().toLocaleTimeString(), studentName, msg: 'Manual faculty warning issued', severity: 'medium' },
      ...prev
    ])
  }

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Video style={{ color: 'var(--indigo)' }} /> Faculty Live Proctoring Command Center
          </h1>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            EduShield AI 25 Rules Proctoring Matrix — Real-Time Telemetry &amp; Remote Incident Response.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 p-2 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <label className="text-2xs font-bold uppercase tracking-wider pl-1" style={{ color: 'var(--indigo)' }}>Live Test:</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="select text-xs font-bold px-3 py-1.5 rounded-xl"
            >
              <option value="all">All Active Exams (Global Room)</option>
              {examsList.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.title} ({ex.subject || 'CS'})
                </option>
              ))}
            </select>
          </div>

          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border"
            style={{ background: 'var(--success-muted)', color: 'var(--success)', borderColor: 'color-mix(in srgb, var(--success) 30%, transparent)' }}
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
            Live EduShield AI
          </div>
        </div>
      </div>

      {/* Grid: Multi-student Feeds Left, Alerts Drawer Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Student Video Feeds (8 Cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading ? (
            <div className="sm:col-span-2 card p-12 text-center text-xs font-mono">
              Connecting to EduShield real-time proctoring telemetry feeds...
            </div>
          ) : students.length === 0 ? (
            <div className="sm:col-span-2 card p-12 text-center space-y-4 border-2 border-dashed rounded-2xl" style={{ borderColor: 'color-mix(in srgb, var(--indigo) 30%, transparent)' }}>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto border"
                style={{ background: 'var(--indigo-muted)', color: 'var(--indigo)', borderColor: 'color-mix(in srgb, var(--indigo) 30%, transparent)' }}
              >
                <Video size={32} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
                  No Active Candidates Taking Exams Right Now
                </h3>
                <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--muted-foreground)' }}>
                  There are currently no live students in proctored examination rooms. As soon as a candidate starts a test, their live video feed, eye-gaze telemetry, and session progress will display here automatically in real time.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-2xs font-mono" style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                <span className="w-2 h-2 rounded-full animate-ping" style={{ background: 'var(--success)' }} />
                Room Listener Active (0 Candidates Online)
              </div>
            </div>
          ) : (
            students.map((student) => (
              <motion.div
                key={student.id}
                whileHover={{ y: -2 }}
                className="card p-4 space-y-3 border-2"
                style={{
                  borderColor:
                    student.integrityScore < 50
                      ? 'var(--destructive)'
                      : student.integrityScore < 75
                      ? 'var(--warning)'
                      : 'var(--border)',
                }}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                    <User size={14} style={{ color: 'var(--indigo)' }} /> {student.name}
                  </div>
                  <span
                    className="text-2xs font-extrabold px-2.5 py-0.5 rounded-full border"
                    style={{
                      background:
                        student.integrityScore < 60
                          ? 'var(--destructive-muted)'
                          : student.integrityScore < 80
                          ? 'var(--warning-muted)'
                          : 'var(--success-muted)',
                      color:
                        student.integrityScore < 60
                          ? 'var(--destructive)'
                          : student.integrityScore < 80
                          ? 'var(--warning)'
                          : 'var(--success)',
                      borderColor: 'color-mix(in srgb, currentColor 30%, transparent)',
                    }}
                  >
                    {student.integrityScore}/100 ({student.riskCategory})
                  </span>
                </div>

                {/* Status Badges Row */}
                <div className="flex items-center gap-1.5 flex-wrap text-3xs font-mono">
                  <span className="px-1.5 py-0.5 rounded border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                    {student.faceCount === 1 ? '👤 Single Face' : student.faceCount > 1 ? '👥 Multi Face!' : '❌ No Face!'}
                  </span>
                  {student.phoneDetected && (
                    <span className="px-1.5 py-0.5 rounded border" style={{ background: 'var(--destructive-muted)', color: 'var(--destructive)' }}>
                      📱 Phone!
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                    👁 {student.headOrientation || 'Center'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                    🎤 {student.noiseDb}dB {student.speechDetected && '🗣'}
                  </span>
                </div>

                {/* Simulated Webcam Display Box */}
                <div className="relative aspect-video rounded-xl overflow-hidden border flex items-center justify-center" style={{ background: 'var(--elevated)', borderColor: 'var(--border)' }}>
                  <div className="text-center space-y-1 p-3">
                    <Camera size={26} className="mx-auto" style={{ color: 'var(--indigo)' }} />
                    <p className="text-2xs font-mono font-bold" style={{ color: 'var(--foreground)' }}>Live Video Telemetry Active</p>
                    <p className="text-3xs" style={{ color: 'var(--muted-foreground)' }}>Cheating Probability: <strong style={{ color: 'var(--amber)' }}>{student.cheatingProbabilityPct}%</strong></p>
                  </div>

                  {student.isPaused && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-red-400 font-extrabold text-xs">
                      Session Paused Remotely
                    </div>
                  )}
                </div>

                {/* Control Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                  <button
                    onClick={() => handleSendWarning(student.id, student.name)}
                    className="flex-1 py-1.5 rounded-lg text-2xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    style={{ background: 'var(--warning-muted)', color: 'var(--warning)', border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)' }}
                  >
                    <AlertTriangle size={12} /> Warn
                  </button>

                  <button
                    onClick={() => handlePauseExam(student.id)}
                    className="flex-1 py-1.5 rounded-lg text-2xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    style={{ background: 'var(--indigo-muted)', color: 'var(--indigo)', border: '1px solid color-mix(in srgb, var(--indigo) 30%, transparent)' }}
                  >
                    {student.isPaused ? <Play size={12} /> : <Pause size={12} />}
                    {student.isPaused ? 'Resume' : 'Pause'}
                  </button>

                  <button
                    onClick={() => handleTerminateExam(student.id)}
                    className="py-1.5 px-2 rounded-lg text-2xs font-bold transition-all cursor-pointer"
                    style={{ background: 'var(--destructive-muted)', color: 'var(--destructive)', border: '1px solid color-mix(in srgb, var(--destructive) 30%, transparent)' }}
                    title="Terminate Exam Session"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Live Red Alerts Stream Drawer (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-extrabold text-xs flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <Bell size={15} style={{ color: 'var(--amber)' }} /> Live Integrity Incident Stream
              </h2>
              <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--destructive-muted)', color: 'var(--destructive)' }}>
                {alerts.length} Alerts
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="p-8 text-center text-xs space-y-1" style={{ color: 'var(--muted-foreground)' }}>
                <p className="font-semibold">No Critical Incidents Flagged</p>
                <p className="text-2xs">Live exam telemetry stream is clean.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {alerts.map((al) => (
                  <div
                    key={al.id}
                    className="p-3 rounded-xl border text-xs space-y-1 font-mono"
                    style={{
                      background: 'var(--destructive-muted)',
                      borderColor: 'color-mix(in srgb, var(--destructive) 30%, transparent)',
                      color: 'var(--destructive)',
                    }}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{al.studentName}</span>
                      <span className="text-3xs opacity-80">{al.time}</span>
                    </div>
                    <p className="text-2xs opacity-90">{al.msg}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
