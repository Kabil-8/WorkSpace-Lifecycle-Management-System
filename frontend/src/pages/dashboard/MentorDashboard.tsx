import { motion } from 'framer-motion'
import { Handshake, Users, Calendar, Star, Target, Loader2, ArrowUpRight, MessageSquare } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '../../hooks/useStore'
import { api } from '../../services/api'
import { Link } from 'react-router-dom'

const BRAND_COLOR = '#8B5CF6'
const BRAND_GRADIENT = 'linear-gradient(135deg, #0e0620 0%, #1e0f40 45%, #2e1860 80%, #3e2075 100%)'
const STAT_ICONS = [Users, Calendar, Star, Target]

export default function MentorDashboard() {
  const { user } = useAppSelector(s => s.auth)

  const { data: mentorData, isLoading } = useQuery({
    queryKey: ['mentorDashboardStats'],
    queryFn: async () => {
      const res: any = await api.get('/mentorship/allocations')
      return res?.data || res
    }
  })

  const mentees = Array.isArray(mentorData) ? mentorData : (mentorData?.mentees || [])
  const upcomingSessions = mentorData?.sessions || []

  const statsArr = [
    { label: 'Assigned Mentees', value: mentees.length || 0, sub: 'Active', color: BRAND_COLOR },
    { label: 'Sessions Scheduled', value: upcomingSessions.length || 0, sub: 'Upcoming', color: '#6366F1' },
    { label: 'Mentor Rating', value: '4.9 ★', sub: 'Avg feedback', color: '#F59E0B' },
    { label: 'Session Attendance', value: '100%', sub: 'All time', color: '#10B981' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-purple-500/20" />
            <Loader2 className="absolute inset-0 animate-spin text-purple-500 m-auto" size={28} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Loading Mentor Portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container space-y-6">

      {/* ── Hero Banner ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="hero-banner shadow-2xl"
        style={{ background: BRAND_GRADIENT, border: `1px solid ${BRAND_COLOR}35` }}
      >
        <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)' }} />

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="hero-badge"><Handshake size={10} /> Mentor Portal</span>
            <span className="flex items-center gap-1.5 text-2xs font-mono" style={{ color: 'rgba(255,255,255,0.65)' }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              Mentorship Platform Live
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Welcome, {user?.name?.split(' ')[0]}! 🤝
          </h1>
          <p className="text-sm max-w-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            You are guiding <strong style={{ color: '#C4B5FD' }}>{mentees.length} assigned students</strong> on EduSphere.
            Schedule sessions, track progress, and share knowledge.
          </p>
          <div className="flex gap-2 flex-wrap pt-1">
            {[
              { label: 'Mentorship Hub', path: '/mentorship', color: BRAND_COLOR },
              { label: 'Discussion Forum', path: '/forum', color: '#6366F1' },
            ].map(({ label, path, color }) => (
              <Link key={label} to={path}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: `${color}20`, border: `1px solid ${color}40`, color: '#fff' }}>
                  {label}
                </motion.button>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 items-start sm:items-end shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.35)', color: '#C4B5FD' }}>
            <Star size={14} /> Active Mentor
          </div>
          <p className="text-2xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </motion.div>

      {/* ── KPI Stats ────────────────────────────────────────── */}
      <div className="stat-grid">
        {statsArr.map((s, i) => {
          const Icon = STAT_ICONS[i]
          return (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4, boxShadow: `0 12px 40px ${s.color}20` }}
              className="stat-card relative overflow-hidden"
              style={{ borderColor: `${s.color}20` }}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: s.color }} />
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}>
                  <Icon size={20} style={{ color: s.color }} />
                </div>
                <span className="trend-up text-2xs"><ArrowUpRight size={10} /> {s.sub}</span>
              </div>
              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>{s.value}</p>
              <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* ── Panels ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sessions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="stat-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${BRAND_COLOR}18` }}>
                <Calendar size={16} style={{ color: BRAND_COLOR }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Upcoming Sessions</h3>
                <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{upcomingSessions.length} scheduled</p>
              </div>
            </div>
          </div>
          {upcomingSessions.length > 0 ? (
            <div className="space-y-2.5">
              {upcomingSessions.map((s: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{s.studentName || s.student}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{s.topic || 'General mentorship'}</p>
                  </div>
                  <span className="text-2xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: `${BRAND_COLOR}18`, color: BRAND_COLOR, border: `1px solid ${BRAND_COLOR}30` }}>
                    {s.date || 'Scheduled'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: 'var(--muted-foreground)' }}>
              <Calendar size={28} className="opacity-30" />
              <p className="text-sm font-medium">No sessions scheduled</p>
              <p className="text-xs text-center">Schedule mentorship sessions to guide your mentees</p>
            </div>
          )}
        </motion.div>

        {/* Mentees */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="stat-card space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${BRAND_COLOR}18` }}>
              <Users size={16} style={{ color: BRAND_COLOR }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Assigned Mentees</h3>
              <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{mentees.length} active</p>
            </div>
          </div>
          {mentees.length > 0 ? (
            <div className="space-y-2.5">
              {mentees.map((m: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${BRAND_COLOR}, #6366F1)` }}>
                      {(m.studentName || m.name || '?')[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{m.studentName || m.name}</p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Goal: {m.goal || 'Career Placement'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: '#10B981' }}>{m.progress || 0}%</p>
                    <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>progress</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: 'var(--muted-foreground)' }}>
              <MessageSquare size={28} className="opacity-30" />
              <p className="text-sm font-medium">No mentees assigned yet</p>
              <p className="text-xs text-center">Mentees will appear here once the platform allocates students to you</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
