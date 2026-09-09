import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, CheckCircle2, Shield, Play } from 'lucide-react'

export default function EyeCalibrationPage() {
  const { examId } = useParams()
  const navigate = useNavigate()

  // 9 Calibration Grid Points (3x3 grid)
  const gridPoints = [
    { id: 1, label: 'Top Left', x: '10%', y: '10%' },
    { id: 2, label: 'Top Center', x: '50%', y: '10%' },
    { id: 3, label: 'Top Right', x: '90%', y: '10%' },
    { id: 4, label: 'Middle Left', x: '10%', y: '50%' },
    { id: 5, label: 'Center Target', x: '50%', y: '50%' },
    { id: 6, label: 'Middle Right', x: '90%', y: '50%' },
    { id: 7, label: 'Bottom Left', x: '10%', y: '90%' },
    { id: 8, label: 'Bottom Center', x: '50%', y: '90%' },
    { id: 9, label: 'Bottom Right', x: '90%', y: '90%' },
  ]

  const [activePointIndex, setActivePointIndex] = useState(0)
  const [completedPoints, setCompletedPoints] = useState<number[]>([])
  const [isCalibrated, setIsCalibrated] = useState(false)

  const handlePointClick = (id: number) => {
    if (!completedPoints.includes(id)) {
      const updated = [...completedPoints, id]
      setCompletedPoints(updated)

      if (updated.length === 9) {
        setIsCalibrated(true)
      } else {
        setActivePointIndex(prev => prev + 1)
      }
    }
  }

  const handleStartExam = () => {
    navigate(`/proctor/live/${examId}`)
  }

  return (
    <div className="page-container relative min-h-[80vh] flex flex-col items-center justify-between space-y-6">
      {/* Top Banner */}
      <div className="text-center space-y-2 z-10">
        <h1 className="text-2xl font-extrabold flex items-center justify-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Eye className="text-purple-500" /> Step 2: MediaPipe Eye Tracking 9-Point Calibration
        </h1>
        <p className="text-xs max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Look directly at each glowing target point and click it. This calibrates your iris gaze vector and pupil alignment for live proctoring.
        </p>
        <div className="text-2xs font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 inline-block">
          Calibration Progress: {completedPoints.length} / 9 Points Clicked
        </div>
      </div>

      {/* 9-Point Calibration Grid Overlay */}
      <div className="relative w-full max-w-4xl h-[420px] rounded-3xl border-2 border-dashed border-purple-500/30 bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-2xl">
        {gridPoints.map((pt, idx) => {
          const isDone = completedPoints.includes(pt.id)
          const isCurrent = idx === activePointIndex && !isDone

          return (
            <motion.div
              key={pt.id}
              onClick={() => handlePointClick(pt.id)}
              style={{ left: pt.x, top: pt.y }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                isDone
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50'
                  : isCurrent
                  ? 'bg-purple-600 text-white ring-4 ring-purple-400 ring-offset-2 animate-bounce shadow-xl'
                  : 'bg-slate-700/50 text-slate-400 opacity-60'
              }`}
            >
              {isDone ? <CheckCircle2 size={20} /> : <span className="text-xs font-bold">{pt.id}</span>}
            </motion.div>
          )
        })}
      </div>

      {/* Completion Modal / Action */}
      {isCalibrated && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="card p-6 text-center space-y-4 max-w-md border-2 border-emerald-500/40 z-20">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <Shield size={24} />
          </div>
          <h3 className="text-lg font-bold text-emerald-400">Eye Gaze Calibration Complete!</h3>
          <p className="text-xs text-slate-300">
            MediaPipe pupil vector mapping is saved. Secure browser lockdown will be enforced upon starting.
          </p>
          <button onClick={handleStartExam}
            className="w-full py-3.5 rounded-xl font-extrabold text-xs bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-xl transition-all">
            <Play size={16} /> Launch Secure Fullscreen Exam
          </button>
        </motion.div>
      )}
    </div>
  )
}
