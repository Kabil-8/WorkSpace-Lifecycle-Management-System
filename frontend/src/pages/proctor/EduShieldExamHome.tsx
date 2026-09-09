import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Video, Lock, Clock, Play, AlertTriangle, Sparkles, CheckCircle2, ChevronRight, FileText } from 'lucide-react'
import { ProctorService } from '../../services/proctorService'
import { useAppSelector } from '../../hooks/useStore'

export default function EduShieldExamHome() {
  const navigate = useNavigate()
  const { user } = useAppSelector(s => s.auth)
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ProctorService.fetchExams().then(data => {
      setExams(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="page-container space-y-6">
      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-8 relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)', border: '1px solid rgba(99,102,241,0.3)' }}>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <ShieldCheck size={14} /> EduShield AI Proctored Engine Active
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Intelligent Proctored Assessment System</h1>
          <p className="text-sm max-w-2xl text-indigo-200/90 leading-relaxed">
            Welcome, <strong>{user?.name}</strong>. EduShield AI continuously monitors eye gaze, head pose orientation, browser lockdown, and audio levels to guarantee 100% examination integrity.
          </p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <Video size={14} className="text-emerald-400" /> MediaPipe Face Mesh Enabled
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <Lock size={14} className="text-blue-400" /> Secure Browser Lockdown
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <Sparkles size={14} className="text-amber-400" /> Real-time AI Risk Scoring
            </div>
          </div>
        </div>
      </motion.div>

      {/* Rules & Requirements Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 space-y-2 border-l-4 border-l-blue-500">
          <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Video size={16} className="text-blue-500" /> 1. Webcam & Lighting
          </h4>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Ensure your webcam is centered, well-lit, and your full face remains clearly visible throughout the entire exam.
          </p>
        </div>

        <div className="card p-5 space-y-2 border-l-4 border-l-purple-500">
          <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Lock size={16} className="text-purple-500" /> 2. Browser Lockdown
          </h4>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Right-click, copy-paste, tab switching, and window minimizing are strictly disabled and will issue automatic warnings.
          </p>
        </div>

        <div className="card p-5 space-y-2 border-l-4 border-l-amber-500">
          <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <AlertTriangle size={16} className="text-amber-500" /> 3. 3-Warning Rule
          </h4>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Receiving 3 warnings automatically flags your session for immediate faculty live review and possible exam termination.
          </p>
        </div>
      </div>

      {/* Available Exams Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FileText size={20} className="text-indigo-500" /> Assigned Proctored Examinations
          </h3>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500">
            {exams.length} Active Exams Available
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-500">Loading Proctored Examinations...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {exams.map((exam) => (
              <motion.div key={exam._id} whileHover={{ y: -4 }} className="card p-6 flex flex-col justify-between space-y-5 border-2 border-indigo-500/20">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-extrabold px-3 py-1 rounded-full uppercase bg-indigo-500/10 text-indigo-500">
                      {exam.department}
                    </span>
                    <span className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Clock size={14} /> {exam.durationMinutes} Minutes
                    </span>
                  </div>

                  <h4 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {exam.title}
                  </h4>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {exam.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-semibold pt-1" style={{ color: 'var(--text-muted)' }}>
                    <span>Questions: {exam.questions.length}</span>
                    <span>Total Points: {exam.totalPoints}</span>
                    <span>Passing: {exam.passingScore}%</span>
                  </div>
                </div>

                <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 text-2xs text-emerald-500 font-semibold">
                    <CheckCircle2 size={14} /> Identity Verification Required
                  </div>
                  <button onClick={() => navigate(`/proctor/verify/${exam._id}`)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-all">
                    <Play size={14} /> Start Verification <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
