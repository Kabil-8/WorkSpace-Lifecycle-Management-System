import { motion } from 'framer-motion'
import { Bell, CheckCircle2, Loader2, Info } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '../../hooks/useStore'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import api from '../../services/api'

export default function ParentDashboard() {
  const { user } = useAppSelector(s => s.auth)

  const { data: parentRes, isLoading } = useQuery({
    queryKey: ['parentDashboard'],
    queryFn: async () => {
      const res: any = await api.get('/dashboard/parent')
      return res?.data || res
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
          <p className="text-xs text-slate-400">Loading Parent Portal Telemetry...</p>
        </div>
      </div>
    )
  }

  const d = parentRes || {}
  const stats = d.stats || []
  const chartData = d.chartData || []
  const highlights = d.highlights || []

  return (
    <div className="page-container space-y-5">
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #051d14 0%, #0a3a28 60%, #10573c 100%)', border: '1px solid rgba(16,185,129,0.25)' }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Parent Monitor
              </span>
              <span className="text-2xs text-emerald-400 font-mono">Live Telemetry</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome, {user?.name || 'Parent'}</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Real-time academic performance, attendance alerts, and fee status for your ward
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono text-emerald-300">Syncing with Institution DB</span>
          </div>
        </div>
      </motion.div>

      {/* Dynamic KPI Cards */}
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

      {/* Performance Trajectory Chart & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="stat-card lg:col-span-2">
          <h3 className="font-semibold mb-4 text-white">Ward Academic Trajectory</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0, 10]} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
              <Info size={16} className="mr-2" /> No GPA history recorded yet.
            </div>
          )}
        </div>

        {/* Live Academic Notifications & Status */}
        <div className="stat-card space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Bell size={16} className="text-emerald-400" /> System Highlights &amp; Alerts
          </h3>
          <div className="space-y-2">
            {highlights.map((h: string, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
