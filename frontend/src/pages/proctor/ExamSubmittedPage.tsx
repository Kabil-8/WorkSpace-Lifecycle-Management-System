import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, FileText, ChevronRight } from 'lucide-react'

export default function ExamSubmittedPage() {
  const { attemptId } = useParams()
  const navigate = useNavigate()

  return (
    <div className="page-container max-w-xl mx-auto py-12 text-center space-y-6">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="card p-8 space-y-5 border-2 border-emerald-500/40 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 size={36} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-emerald-400">Exam Successfully Submitted!</h2>
          <p className="text-xs text-slate-300">
            Your examination answers and AI proctoring logs have been compiled and encrypted.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-2xs space-y-1.5 text-left font-mono">
          <p className="text-indigo-300">Attempt ID: <span className="text-white">{attemptId || 'att-101'}</span></p>
          <p className="text-indigo-300">Proctor Integrity Verification: <span className="text-emerald-400 font-bold">COMPLETED</span></p>
          <p className="text-indigo-300">Timestamp: <span className="text-white">{new Date().toLocaleString()}</span></p>
        </div>

        <button onClick={() => navigate(`/proctor/report/${attemptId || 'att-101'}`)}
          className="w-full py-4 rounded-xl font-extrabold text-xs bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-xl transition-all">
          <FileText size={16} /> View AI Post-Exam Integrity Report <ChevronRight size={16} />
        </button>
      </motion.div>
    </div>
  )
}
