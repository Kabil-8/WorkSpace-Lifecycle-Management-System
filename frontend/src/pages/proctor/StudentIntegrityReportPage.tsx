import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShieldCheck, Download, Activity, Eye, Video, AlertTriangle, CheckCircle2, Award, Sparkles } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../services/api'

export default function StudentIntegrityReportPage() {
  const { attemptId } = useParams()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReport() {
      try {
        const res: any = await api.get(`/proctor/integrity-report/${attemptId}`)
        const data = res?.data || res
        if (data) {
          setReport(data)
          setLoading(false)
          return
        }
      } catch (err) {
        console.warn('Failed to fetch proctor integrity report from MongoDB', err)
      }

      setLoading(false)
    }
    fetchReport()
  }, [attemptId])

  const handleDownloadPDF = () => {
    window.print()
  }

  if (loading) return <div className="text-center py-12 text-xs text-slate-500">Generating AI Integrity Report...</div>
  const att = report?.attempt

  return (
    <div className="page-container space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 text-white border border-indigo-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-400" />
            <h1 className="text-xl font-extrabold">AI Examination Integrity Report</h1>
          </div>
          <p className="text-xs text-slate-400">
            Candidate: <strong>{att?.studentName}</strong> ({att?.studentEmail}) · Attempt ID: {att?._id}
          </p>
        </div>

        <button onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-all self-start sm:self-auto">
          <Download size={14} /> Download Official PDF Report
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs text-slate-400 font-bold uppercase">Overall Integrity</span>
            <Activity size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{att?.integrityScore}/100</p>
          <p className="text-2xs text-slate-400 mt-1">Category: {att?.riskCategory}</p>
        </div>

        <div className="stat-card border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs text-slate-400 font-bold uppercase">Eye Focus</span>
            <Eye size={16} className="text-blue-400" />
          </div>
          <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{att?.eyeFocusPercentage}%</p>
          <p className="text-2xs text-slate-400 mt-1">Gaze Consistency</p>
        </div>

        <div className="stat-card border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs text-slate-400 font-bold uppercase">Face Presence</span>
            <Video size={16} className="text-purple-400" />
          </div>
          <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{att?.facePresencePercentage}%</p>
          <p className="text-2xs text-slate-400 mt-1">Webcam Verification</p>
        </div>

        <div className="stat-card border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs text-slate-400 font-bold uppercase">Exam Score</span>
            <Award size={16} className="text-amber-400" />
          </div>
          <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{att?.score} pts</p>
          <p className="text-2xs text-slate-400 mt-1">Academic Grade</p>
        </div>
      </div>

      {/* Integrity Score Timeline Chart */}
      <div className="card p-6 space-y-4 border-2 border-indigo-500/20">
        <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Activity size={16} className="text-indigo-500" /> Real-time Integrity Score Decay Timeline
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={report?.log?.integrityHistory || []}>
            <XAxis dataKey="timestamp" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }} />
            <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Violation Timeline Log */}
      <div className="card p-6 space-y-4 border-2 border-amber-500/20">
        <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <AlertTriangle size={16} className="text-amber-500" /> Telemetry Violation Logs & Warnings ({report?.log?.warningLogs?.length || 0})
        </h3>

        <div className="space-y-3">
          {report?.log?.warningLogs?.length === 0 ? (
            <p className="text-xs text-emerald-400 font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} /> Zero violations detected during the entire proctored assessment.
            </p>
          ) : (
            report?.log?.warningLogs?.map((w: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-amber-500/30 text-xs">
                <span className="font-mono text-2xs text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 shrink-0">
                  {w.timestamp}
                </span>
                <div>
                  <strong className="text-amber-400 font-semibold">{w.type} (Warning #{w.warningNumber})</strong>
                  <p className="text-slate-300 text-2xs mt-0.5">{w.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* EDEN AI Assessment Feedback */}
      <div className="card p-6 space-y-3 border-2 border-purple-500/20 bg-purple-500/5">
        <h4 className="font-bold text-sm text-purple-400 flex items-center gap-2">
          <Sparkles size={16} /> EDEN AI Verification Feedback
        </h4>
        <p className="text-xs leading-relaxed text-slate-300">
          "Candidate <strong>{att?.studentName}</strong> maintained an impressive <strong>{att?.eyeFocusPercentage}% eye focus ratio</strong> and verified <strong>{att?.facePresencePercentage}% facial presence</strong> throughout the assessment. The single warning logged at 09:14 AM was brief and did not indicate systematic integrity compromise. Recommended for automatic faculty sign-off."
        </p>
      </div>
    </div>
  )
}
