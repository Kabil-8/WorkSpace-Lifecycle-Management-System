import { motion } from 'framer-motion'
import { Globe, Microscope, Loader2, Info } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '../../hooks/useStore'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import api from '../../services/api'

export default function ResearcherDashboard() {
  const { user } = useAppSelector(s => s.auth)

  const { data: resRes, isLoading } = useQuery({
    queryKey: ['researcherDashboard'],
    queryFn: async () => {
      const res: any = await api.get('/dashboard/researcher')
      return res?.data || res
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
          <p className="text-xs text-slate-400">Loading Research Portal Telemetry...</p>
        </div>
      </div>
    )
  }

  const d = resRes || {}
  const stats = d.stats || []
  const chartData = d.chartData || []
  const highlights = d.highlights || []

  return (
    <div className="page-container space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #090924 0%, #151547 60%, #202068 100%)', border: '1px solid rgba(99,102,241,0.25)' }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Research &amp; Innovation Desk
              </span>
              <span className="text-2xs text-indigo-400 font-mono">IEEE / Springer Synced</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Researcher Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Publications, citations, h-index, and grant tracking for {user?.name || 'Researcher'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
            <span className="text-xs font-mono text-indigo-300">Grant Tracking Active</span>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s: any, i: number) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="stat-card"
          >
            <p className="text-xs font-mono text-slate-400">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color || 'var(--text-primary)' }}>{s.value}</p>
            {s.sub && <p className="text-2xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>}
          </motion.div>
        ))}
      </div>

      {/* Citation Growth Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="stat-card lg:col-span-2">
          <h3 className="font-semibold mb-4 text-white">Publication &amp; Citation Progress</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: 12 }} />
                <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
              <Info size={16} className="mr-2" /> No publication data recorded yet.
            </div>
          )}
        </div>

        <div className="stat-card space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Microscope size={16} className="text-indigo-400" /> Research Highlights
          </h3>
          <div className="space-y-2">
            {highlights.map((h: string, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2">
                <Globe size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
