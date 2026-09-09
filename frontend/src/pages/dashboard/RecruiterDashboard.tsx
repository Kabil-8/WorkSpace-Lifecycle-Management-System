import { motion } from 'framer-motion'
import { Briefcase, CheckCircle2, Loader2, Info } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../services/api'

export default function RecruiterDashboard() {

  const { data: recRes, isLoading } = useQuery({
    queryKey: ['recruiterDashboard'],
    queryFn: async () => {
      const res: any = await api.get('/dashboard/recruiter')
      return res?.data || res
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-cyan-500" size={32} />
          <p className="text-xs text-slate-400">Loading Corporate Recruiter Telemetry...</p>
        </div>
      </div>
    )
  }

  const d = recRes || {}
  const stats = d.stats || []
  const chartData = d.chartData || []
  const highlights = d.highlights || []

  return (
    <div className="page-container space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #021a24 0%, #063347 60%, #084c69 100%)', border: '1px solid rgba(6,182,212,0.25)' }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Recruiter Hiring Portal
              </span>
              <span className="text-2xs text-cyan-400 font-mono">Live Candidate ATS API</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Recruiter Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Job postings, student application screening, ATS scores, and interview management
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono text-cyan-300">ATS Scorer Online</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s: any, i: number) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="stat-card">
            <p className="text-xs font-mono text-slate-400">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color || 'var(--text-primary)' }}>{s.value}</p>
            {s.sub && <p className="text-2xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="stat-card lg:col-span-2">
          <h3 className="font-semibold mb-4 text-white">Hiring Drive Funnel (By Month)</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: 12 }} />
                <Bar dataKey="value" fill="#06B6D4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
              <Info size={16} className="mr-2" /> No job postings active yet.
            </div>
          )}
        </div>

        <div className="stat-card space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Briefcase size={16} className="text-cyan-400" /> Hiring Highlights
          </h3>
          <div className="space-y-2">
            {highlights.map((h: string, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-cyan-500/20 text-xs text-cyan-200 flex items-start gap-2">
                <CheckCircle2 size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
