import { motion } from 'framer-motion'
import { Building2, CheckCircle2, Loader2, Info } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../services/api'

export default function IndustryDashboard() {

  const { data: indRes, isLoading } = useQuery({
    queryKey: ['industryDashboard'],
    queryFn: async () => {
      const res: any = await api.get('/dashboard/industry_partner')
      return res?.data || res
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-lime-500" size={32} />
          <p className="text-xs text-slate-400">Loading Industry Portal Telemetry...</p>
        </div>
      </div>
    )
  }

  const d = indRes || {}
  const stats = d.stats || []
  const chartData = d.chartData || []
  const highlights = d.highlights || []

  return (
    <div className="page-container space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #102003 0%, #204006 60%, #305c09 100%)', border: '1px solid rgba(132,204,22,0.25)' }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-lime-500/20 text-lime-300 border border-lime-500/30">
                Industry Partner Portal
              </span>
              <span className="text-2xs text-lime-400 font-mono">Talent Pool Connected</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Industry Partner Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Campus talent acquisition, R&amp;D lab projects, and hackathon sponsorship metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-ping" />
            <span className="text-xs font-mono text-lime-300">Live Hiring Synced</span>
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
          <h3 className="font-semibold mb-4 text-white">Talent Acquisition Funnel Progress</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: 12 }} />
                <Bar dataKey="value" fill="#84CC16" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
              <Info size={16} className="mr-2" /> No talent acquisition data available.
            </div>
          )}
        </div>

        <div className="stat-card space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Building2 size={16} className="text-lime-400" /> Industry Highlights
          </h3>
          <div className="space-y-2">
            {highlights.map((h: string, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-lime-500/20 text-xs text-lime-200 flex items-start gap-2">
                <CheckCircle2 size={14} className="text-lime-400 flex-shrink-0 mt-0.5" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
