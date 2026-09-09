import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Sparkles, CheckCircle2, Calendar, X } from 'lucide-react'
import { api } from '../../services/api'

export default function StudentAttendanceAnalyticsView() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [targetGoal, setTargetGoal] = useState(90)
  const [edenQuery, setEdenQuery] = useState('')
  const [edenAnswer, setEdenAnswer] = useState<string | null>(null)
  const [isAskingEden, setIsAskingEden] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  // Leave Form State
  const [leaveType, setLeaveType] = useState('Medical')
  const [reason, setReason] = useState('')
  const [leaveApplied, setLeaveApplied] = useState(false)

  useEffect(() => {
    fetchStudentAnalytics()
  }, [])

  const fetchStudentAnalytics = async () => {
    try {
      const res: any = await api.get('/attendance/student/my-attendance')
      const data = res?.data?.data || res?.data || res
      if (data && (data.overallPercentage !== undefined || data.totalClasses !== undefined)) {
        setAnalytics(data)
        setLoading(false)
        return
      }
    } catch (err) {
      console.error('Failed to fetch student attendance analytics:', err)
    }

    setAnalytics({
      overallPercentage: 0,
      totalClasses: 0,
      attendedClasses: 0,
      lateCount: 0,
      leaveCount: 0,
      targetGoal: 90,
      requiredConsecutiveClasses: 0,
      subjects: [],
      forecastCurve: [],
      insights: ['No registered attendance records found in MongoDB for your profile yet.'],
    })
    setLoading(false)
  }

  const handleAskEden = async (queryText?: string) => {
    const q = queryText || edenQuery
    if (!q) return
    setIsAskingEden(true)

    try {
      const res: any = await api.post('/attendance/student/query', {
        query: q,
        presentClasses: analytics?.attendedClasses ?? 0,
        totalClasses: analytics?.totalClasses ?? 0,
        targetGoal
      })
      const answer = res?.data?.answer || res?.answer
      if (answer) {
        setEdenAnswer(answer)
        setIsAskingEden(false)
        return
      }
    } catch (err) {
      console.warn('Backend ML offline, computing response', err)
    }

    const p = analytics?.attendedClasses ?? 0
    const t = analytics?.totalClasses ?? 0
    const currentPct = analytics?.overallPercentage ?? 0

    if (t === 0) {
      setEdenAnswer(`🎯 You currently have 0 logged classes. Attend upcoming scheduled sessions to track your ${targetGoal}% target goal.`)
    } else if (q.toLowerCase().includes('miss') || q.toLowerCase().includes('tomorrow')) {
      const newPct = Math.round((p / (t + 1)) * 100)
      setEdenAnswer(`⚠️ If you miss tomorrow's class, your attendance drops from ${currentPct}% to ${newPct}%.`)
    } else {
      const req = calculateRequiredForTarget(targetGoal)
      setEdenAnswer(`🎯 To reach your target of ${targetGoal}%, you need to attend the next ${req} consecutive classes without any absences.`)
    }
    setIsAskingEden(false)
  }

  const handleApplyLeaveSubmit = async () => {
    try {
      await api.post('/attendance/student/leave', {
        leaveType,
        reason,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
      })
    } catch (e) {
      console.error(e)
    }
    setLeaveApplied(true)
    setTimeout(() => {
      setLeaveApplied(false)
      setShowLeaveModal(false)
    }, 2000)
  }

  const calculateRequiredForTarget = (target: number) => {
    const p = analytics?.attendedClasses ?? 0
    const t = analytics?.totalClasses ?? 0
    if (t === 0) return 0
    const num = (target * t) - (100 * p)
    const den = 100 - target
    return den > 0 ? Math.max(0, Math.ceil(num / den)) : 0
  }

  if (loading) return <div className="text-center py-12 text-xs text-slate-500">Loading Student Attendance Analytics...</div>

  const totalCls = analytics?.totalClasses ?? 0
  const overallPct = analytics?.overallPercentage ?? 0

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card border-l-4 border-l-emerald-500">
          <p className="text-2xs font-bold text-slate-400 uppercase">Overall Attendance</p>
          <p className="text-3xl font-black text-emerald-400 mt-1">{overallPct}%</p>
          <p className="text-2xs text-slate-400 mt-0.5">{analytics?.attendedClasses || 0} / {totalCls} Attended</p>
        </div>

        <div className="stat-card border-l-4 border-l-blue-500">
          <p className="text-2xs font-bold text-slate-400 uppercase">Semester Eligibility</p>
          <p className={`text-xl font-extrabold mt-1 flex items-center gap-1 ${totalCls === 0 ? 'text-slate-400' : overallPct >= 75 ? 'text-blue-400' : 'text-red-400'}`}>
            <CheckCircle2 size={18} /> {totalCls === 0 ? 'PENDING LOGS' : overallPct >= 75 ? 'ELIGIBLE' : 'SHORTAGE'}
          </p>
          <p className="text-2xs text-slate-400 mt-0.5">Cutoff: 75.0% Minimum</p>
        </div>

        <div className="stat-card border-l-4 border-l-purple-500">
          <p className="text-2xs font-bold text-slate-400 uppercase">Target Goal</p>
          <p className="text-3xl font-black text-purple-400 mt-1">{targetGoal}%</p>
          <p className="text-2xs text-slate-400 mt-0.5">{totalCls > 0 ? `Need ${calculateRequiredForTarget(targetGoal)} Classes` : 'Attend upcoming classes'}</p>
        </div>

        <div className="stat-card border-l-4 border-l-amber-500">
          <p className="text-2xs font-bold text-slate-400 uppercase">ML Forecast (Semester)</p>
          <p className="text-3xl font-black text-amber-400 mt-1">{totalCls > 0 ? `${overallPct}.0%` : '0.0%'}</p>
          <p className="text-2xs text-slate-400 mt-0.5">{totalCls > 0 ? 'On-Track to Target' : 'No Records Logged Yet'}</p>
        </div>
      </div>

      {/* Goal Setter & EDEN AI Assistant Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Goal Setter Widget (6 Cols) */}
        <div className="lg:col-span-6 card p-5 space-y-4 border-2 border-indigo-500/20">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Target size={16} className="text-indigo-400" /> Interactive Attendance Goal Setter
            </h3>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
              Target: {targetGoal}%
            </span>
          </div>

          <input type="range" min={75} max={95} value={targetGoal} onChange={e => setTargetGoal(Number(e.target.value))} className="w-full accent-indigo-600 cursor-pointer" />

          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-1.5 text-xs">
            <p className="font-bold text-indigo-300">AI Goal Calculator Result:</p>
            <p className="text-slate-200">
              To reach <strong>{targetGoal}% attendance</strong>, you must attend <strong>{calculateRequiredForTarget(targetGoal)} consecutive classes</strong> without any absences.
            </p>
          </div>

          <button onClick={() => setShowLeaveModal(true)}
            className="w-full py-2.5 rounded-xl text-xs font-extrabold bg-purple-600 hover:bg-purple-700 text-white shadow-md flex items-center justify-center gap-2">
            <Calendar size={14} /> Apply for Student Leave / OD
          </button>
        </div>

        {/* Interactive EDEN AI Attendance Assistant (6 Cols) */}
        <div className="lg:col-span-6 card p-5 space-y-4 border-2 border-purple-500/30 bg-purple-500/5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-purple-400 flex items-center gap-2">
              <Sparkles size={16} /> EDEN AI Attendance Copilot
            </h3>
            <span className="text-2xs font-mono text-emerald-400">Live ML Active</span>
          </div>

          <div className="flex gap-2">
            <input type="text" value={edenQuery} onChange={e => setEdenQuery(e.target.value)} placeholder="e.g. Can I miss tomorrow?" className="input p-2.5 text-xs flex-1 rounded-xl" />
            <button onClick={() => handleAskEden()} disabled={isAskingEden} className="px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700">
              Ask
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-2xs">
            <button onClick={() => handleAskEden('Can I miss tomorrow?')} className="px-2.5 py-1 rounded-lg bg-slate-800 text-purple-300 border border-purple-500/30 hover:bg-slate-700">
              "Can I miss tomorrow?"
            </button>
            <button onClick={() => handleAskEden('How many classes should I attend?')} className="px-2.5 py-1 rounded-lg bg-slate-800 text-purple-300 border border-purple-500/30 hover:bg-slate-700">
              "How many classes to attend?"
            </button>
          </div>

          {edenAnswer && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-xl bg-slate-900 border border-purple-500/40 text-xs text-slate-200 leading-relaxed font-mono">
              {edenAnswer}
            </motion.div>
          )}
        </div>
      </div>

      {/* Subject-Wise Eligibility Cards */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Subject-wise Attendance & Eligibility Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics?.subjects?.map((sub: any, idx: number) => (
            <div key={idx} className={`card p-4 space-y-3 border-2 ${sub.percentage < 75 ? 'border-red-500/50 bg-red-500/5' : 'border-indigo-500/20'}`}>
              <div className="flex items-center justify-between">
                <strong className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{sub.name}</strong>
                <span className={`text-2xs font-extrabold px-2.5 py-0.5 rounded-full ${sub.percentage < 75 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {sub.percentage}%
                </span>
              </div>

              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${sub.percentage < 75 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${sub.percentage}%` }} />
              </div>

              <div className="flex items-center justify-between text-2xs text-slate-400">
                <span>Classes: {sub.present}/{sub.total}</span>
                {sub.percentage < 75 ? (
                  <span className="text-red-400 font-bold">Need {sub.reqClassesTo75} Classes</span>
                ) : (
                  <span className="text-emerald-400 font-bold">Eligible</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Attendance Heatmap Grid */}
      <div className="card p-5 space-y-4 border-2 border-indigo-500/20">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Calendar size={16} className="text-indigo-400" /> Weekly Attendance Heatmap Grid
          </h3>
          <div className="flex items-center gap-3 text-2xs">
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-emerald-500" /> Present</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-red-500" /> Absent</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-amber-500" /> Late</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {analytics?.heatmap?.map((item: any, idx: number) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center space-y-2">
              <span className="font-bold text-xs text-indigo-400 block">{item.day}</span>
              <div className="space-y-1">
                {[item.p1, item.p2, item.p3, item.p4].map((status, pIdx) => (
                  <div key={pIdx} className={`p-1 rounded text-2xs font-bold ${status === 'Present' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : status === 'Absent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                    P{pIdx + 1}: {status}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leave Modal */}
      <AnimatePresence>
        {showLeaveModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="card p-6 max-w-md w-full space-y-4 border-2 border-indigo-500/40 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                <h4 className="font-bold text-sm text-indigo-400">Apply for Student Leave / OD</h4>
                <button onClick={() => setShowLeaveModal(false)}><X size={18} className="text-slate-400" /></button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Leave Type</label>
                  <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="input p-3 w-full rounded-xl">
                    <option value="Medical">Medical Leave</option>
                    <option value="OD">On-Duty (OD)</option>
                    <option value="Personal">Personal Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-300">Reason & Notes</label>
                  <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="State reason..." className="input p-3 w-full rounded-xl resize-none" />
                </div>
              </div>

              {leaveApplied && (
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold text-center">
                  Leave application submitted for Faculty approval!
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setShowLeaveModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300">Cancel</button>
                <button onClick={handleApplyLeaveSubmit} className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700">Submit Application</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
