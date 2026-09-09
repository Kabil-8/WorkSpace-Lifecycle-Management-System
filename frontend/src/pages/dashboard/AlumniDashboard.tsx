import { motion } from 'framer-motion'
import { Globe, Award, Users, Briefcase, TrendingUp, CheckCircle2, Loader2, Network, BookOpen, ArrowUpRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '../../hooks/useStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../../services/api'
import { Link } from 'react-router-dom'

const BRAND_COLOR = '#F59E0B'
const BRAND_GRADIENT = 'linear-gradient(135deg, #1c1502 0%, #3a2a06 45%, #5c400a 80%, #7c5a14 100%)'
const STAT_ICONS = [Globe, Users, Briefcase, Award]
const DEFAULT_STATS = [
  { label: 'Network Connections', value: '—', sub: 'LinkedIn synced', color: '#F59E0B' },
  { label: 'Mentees Active', value: '—', sub: 'Guiding students', color: '#10B981' },
  { label: 'Referrals Submitted', value: '—', sub: 'This semester', color: '#6366F1' },
  { label: 'Events Attended', value: '—', sub: 'Campus & virtual', color: '#06B6D4' },
]

const QUICK_ACTIONS = [
  { label: 'Mentorship', path: '/mentorship', icon: Users, color: '#F59E0B' },
  { label: 'Job Board', path: '/jobs', icon: Briefcase, color: '#10B981' },
  { label: 'Events', path: '/events', icon: BookOpen, color: '#6366F1' },
]

const TOOLTIP_STYLE = {
  background: 'var(--elevated)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  color: 'var(--foreground)',
  fontSize: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
}

export default function AlumniDashboard() {
  const { user } = useAppSelector(s => s.auth)

  const { data: alumniRes, isLoading } = useQuery({
    queryKey: ['alumniDashboard'],
    queryFn: async () => {
      const res: any = await api.get('/dashboard/alumni')
      return res?.data || res
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-amber-500/20" />
            <Loader2 className="absolute inset-0 animate-spin text-amber-500 m-auto" size={28} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Loading Alumni Network...</p>
        </div>
      </div>
    )
  }

  const d = alumniRes || {}
  const rawStats = d.stats?.length > 0 ? d.stats : DEFAULT_STATS
  const chartData = d.chartData || []
  const highlights = d.highlights || []

  return (
    <div className="page-container space-y-6">

      {/* ── Hero Banner ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="hero-banner shadow-2xl"
        style={{ background: BRAND_GRADIENT, border: `1px solid ${BRAND_COLOR}30` }}
      >
        {/* Decorative orbs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-12 -left-8 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)' }} />

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="hero-badge">
              <Globe size={10} /> Alumni Network Portal
            </span>
            <span className="flex items-center gap-1.5 text-2xs font-mono" style={{ color: 'rgba(255,255,255,0.65)' }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Global Network Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Welcome back, {user?.name?.split(' ')[0]}! 🎓
          </h1>
          <p className="text-sm max-w-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Your mentorship engagements, student referrals, and campus networking hub. Stay connected with EduSphere.
          </p>
          <div className="flex gap-2 flex-wrap pt-1">
            {QUICK_ACTIONS.map(({ label, path, icon: Icon, color }) => (
              <Link key={label} to={path}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: `${color}20`, border: `1px solid ${color}35`, color: '#fff' }}>
                  <Icon size={12} /> {label}
                </motion.button>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 items-start sm:items-end shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.35)', color: '#FCD34D' }}>
            <Network size={14} />
            <span>Mentorship Synced</span>
          </div>
          <p className="text-2xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </motion.div>

      {/* ── KPI Stat Cards ───────────────────────────────────── */}
      <div className="stat-grid">
        {rawStats.map((s: any, i: number) => {
          const Icon = STAT_ICONS[i] || Globe
          const color = s.color || BRAND_COLOR
          return (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              whileHover={{ y: -4, boxShadow: `0 12px 40px ${color}20` }}
              className="stat-card relative overflow-hidden cursor-default"
              style={{ borderColor: `${color}20` }}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                {s.sub && (
                  <span className="trend-up text-2xs">
                    <ArrowUpRight size={10} /> {s.sub}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>{s.value}</p>
              <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* ── Charts & Highlights ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="stat-card lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Alumni Engagement Progress</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Monthly network activity & referrals</p>
            </div>
            <span className="section-label">6 months</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" fill={BRAND_COLOR} radius={[6, 6, 0, 0]} opacity={0.9} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 gap-3" style={{ color: 'var(--muted-foreground)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--muted)' }}>
                <Globe size={22} />
              </div>
              <p className="text-sm font-medium">No engagement data yet</p>
              <p className="text-xs">Connect with mentees and attend events to see your metrics</p>
            </div>
          )}
        </motion.div>

        {/* Highlights */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="stat-card space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${BRAND_COLOR}18` }}>
              <Award size={16} style={{ color: BRAND_COLOR }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Alumni Highlights</h3>
              <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Recent activities</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {highlights.length > 0 ? highlights.map((h: string, idx: number) => (
              <motion.div key={idx}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + idx * 0.05 }}
                className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: `${BRAND_COLOR}10`, border: `1px solid ${BRAND_COLOR}25` }}>
                <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" style={{ color: BRAND_COLOR }} />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--foreground)' }}>{h}</p>
              </motion.div>
            )) : (
              <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
                <TrendingUp size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs">No highlights yet. Engage with mentees and events!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
