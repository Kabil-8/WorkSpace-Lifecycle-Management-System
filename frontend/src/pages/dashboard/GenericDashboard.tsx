import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ROLE_CONFIGS } from '../../types'
import { XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Loader2 } from 'lucide-react'
import api from '../../services/api'
import EmptyState from '../../components/common/EmptyState'

function GenericDashboard({ role }: { role: string }) {
  const cfg = ROLE_CONFIGS[role as keyof typeof ROLE_CONFIGS] || {
    label: role,
    emoji: '📊',
    color: '#6366F1',
    description: `${role} platform overview`,
    permissions: [],
  }

  const { data: dashboardRes, isLoading } = useQuery({
    queryKey: ['roleDashboard', role],
    queryFn: async () => {
      const res: any = await api.get(`/dashboard/${role}`)
      return res?.data || res
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
          <p className="text-xs text-slate-400">Loading {cfg.label} Live Telemetry...</p>
        </div>
      </div>
    )
  }

  const data = dashboardRes?.stats ? dashboardRes : null

  if (!data) {
    return <EmptyState title={`${cfg.label} Dashboard Empty`} description="No MongoDB telemetry records logged for this role profile yet." />
  }

  return (
    <div className="page-container space-y-5">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6"
        style={{ background: `linear-gradient(135deg, ${cfg.color}10, ${cfg.color}05)`, border: `1px solid ${cfg.color}25` }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{cfg.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">{cfg.label} Dashboard</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cfg.description}</p>
          </div>
        </div>
        <div className="mt-4 space-y-1">
          {(data.highlights || []).map((h: string) => (
            <p key={h} className="text-sm" style={{ color: 'var(--text-secondary)' }}>• {h}</p>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(data.stats || []).map(({ label, value, color }: any) => (
          <motion.div key={label} whileHover={{ y: -3 }} className="stat-card">
            <div className="w-8 h-8 rounded-lg mb-3" style={{ background: `${color}15` }} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="stat-card">
          <h3 className="font-semibold text-white mb-4">6-Month Telemetry Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data.chartData || []}>
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(var(--rgb-white),0.08)', borderRadius: '10px' }} />
              <Line type="monotone" dataKey="value" stroke={cfg.color} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-card flex flex-col justify-center items-center gap-4">
          <div className="text-6xl">{cfg.emoji}</div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{cfg.label}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{cfg.description}</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {(cfg.permissions || []).slice(0, 4).map((p: string) => (
              <span key={p} className="text-2xs px-2 py-1 rounded-lg" style={{ background: `${cfg.color}10`, color: cfg.color }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GenericDashboard
