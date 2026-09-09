import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '../../hooks/useStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import {
  Users, BookOpen, ClipboardList, Star, AlertTriangle,
  CheckCircle2, MessageSquare, Loader2, ArrowUpRight, BarChart3,
  Brain, Calendar, Sparkles, TrendingUp, Shield,
} from 'lucide-react'
import api from '../../services/api'

const BRAND_COLOR = '#10B981'
const BRAND_GRADIENT = 'linear-gradient(135deg, #021a12 0%, #052e16 40%, #064e3b 75%, #0a7a5c 100%)'

const TOOLTIP_STYLE = {
  background: 'var(--elevated)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  color: 'var(--foreground)',
  fontSize: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
}

const SHORTCUT_ACTIONS = [
  { label: 'Create Quiz', path: '/quizzes', icon: Brain, color: '#8B5CF6' },
  { label: 'Grade Work', path: '/assignments', icon: ClipboardList, color: '#F59E0B' },
  { label: 'Attendance', path: '/attendance', icon: Users, color: '#10B981' },
  { label: 'Schedule Class', path: '/timetable', icon: Calendar, color: '#06B6D4' },
  { label: 'Live Exams', path: '/proctor/manage', icon: Shield, color: '#EF4444' },
  { label: 'AI Copilot', path: '/ai', icon: Sparkles, color: '#6366F1' },
]

const DEFAULT_STATS = [
  { label: 'Total Students', value: 0, color: '#10B981', sub: 'Enrolled' },
  { label: 'Active Courses', value: 0, color: '#2563EB', sub: 'Running' },
  { label: 'Pending Grades', value: 0, color: '#F59E0B', sub: 'To grade' },
  { label: 'Avg Rating', value: '—/5', color: '#8B5CF6', sub: 'Feedback' },
]
const STAT_ICONS = [Users, BookOpen, ClipboardList, Star]

function StatCard({ icon: Icon, label, value, color, sub, delay = 0 }: {
  icon: React.ElementType; label: string; value: string | number; color: string; sub?: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, boxShadow: `0 16px 40px ${color}25` }}
      className="stat-card relative overflow-hidden cursor-default"
      style={{ borderColor: `${color}22` }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}22` }}>
          <Icon size={22} style={{ color }} />
        </div>
        {sub && <span className="trend-up"><ArrowUpRight size={10} /> {sub}</span>}
      </div>
      <p className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>{value}</p>
      <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
    </motion.div>
  )
}

export default function FacultyDashboard() {
  const navigate = useNavigate()
  const { user } = useAppSelector(s => s.auth)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const { data: facultyRes, isLoading } = useQuery({
    queryKey: ['facultyDashboard'],
    queryFn: async () => {
      const res: any = await api.get('/dashboard/faculty')
      return res?.data || res
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-2 border-emerald-500/20" />
            <Loader2 className="absolute inset-0 animate-spin text-emerald-500 m-auto" size={32} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Loading Faculty Command Center...</p>
        </div>
      </div>
    )
  }

  const d = facultyRes || {}
  const stats = d.stats?.length > 0 ? d.stats : DEFAULT_STATS
  const submissionData = d.submissionData || []
  const radarData = d.radarData || []
  const atRiskStudents = d.atRiskStudents || []
  const mentees = d.mentees || []

  return (
    <div className="page-container space-y-6">

      {/* ── Hero Banner ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 sm:p-7 shadow-2xl"
        style={{ background: BRAND_GRADIENT, border: `1px solid ${BRAND_COLOR}35` }}
      >
        {/* Background glows */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 7, repeat: Infinity }}
          className="absolute -top-16 -right-16 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${BRAND_COLOR}35 0%, transparent 70%)` }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="hero-badge"><TrendingUp size={10} /> Faculty Portal</span>
              <span className="flex items-center gap-1.5 text-2xs font-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Academic Control Operational
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {greeting}, {user?.name?.split(' ')[0]}! 👨‍🏫
              </h1>
              <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Your department telemetry is live. Manage courses, grade assignments, and monitor student progress.
              </p>
            </div>
            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {SHORTCUT_ACTIONS.map(({ label, path, icon: Icon, color }) => (
                <motion.button key={label}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(path)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: `${color}20`, border: `1px solid ${color}35`, color: '#fff' }}>
                  <Icon size={12} /> {label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Engagement metric chips */}
          <div className="flex flex-col gap-3 items-start sm:items-end flex-shrink-0">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Active Now', value: `${atRiskStudents.length} alerts`, color: atRiskStudents.length > 0 ? '#EF4444' : '#10B981' },
                { label: 'Mentees', value: `${mentees.length} assigned`, color: '#8B5CF6' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center px-4 py-2.5 rounded-xl"
                  style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
                  <p className="text-2xs text-white/60">{label}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>
            <p className="text-2xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Stats Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s: any, idx: number) => (
          <StatCard
            key={idx}
            icon={STAT_ICONS[idx] || Users}
            label={s.label}
            value={s.value}
            color={s.color || BRAND_COLOR}
            sub={s.sub}
            delay={idx * 0.08}
          />
        ))}
      </div>

      {/* ── Charts Row ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Submission Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="stat-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="section-label mb-1 inline-flex"><BarChart3 size={10} /> Submissions</span>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Assignment Submission Trends</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>On-time, pending & late breakdowns</p>
            </div>
            <Link to="/assignments" className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
              View All <ArrowUpRight size={11} />
            </Link>
          </div>
          {submissionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={submissionData} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="submitted" fill="#10B981" radius={[4, 4, 0, 0]} name="Submitted" />
                <Bar dataKey="pending" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Pending" />
                <Bar dataKey="late" fill="#EF4444" radius={[4, 4, 0, 0]} name="Late" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3" style={{ color: 'var(--muted-foreground)' }}>
              <BarChart3 size={28} className="opacity-30" />
              <p className="text-sm font-medium">No submission data yet</p>
              <p className="text-xs text-center">Submission trends will appear as students submit work</p>
            </div>
          )}
          {/* Legend */}
          {submissionData.length > 0 && (
            <div className="flex items-center gap-4 pt-1">
              {[{ color: '#10B981', label: 'Submitted' }, { color: '#F59E0B', label: 'Pending' }, { color: '#EF4444', label: 'Late' }].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Radar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="stat-card space-y-4">
          <div>
            <span className="section-label mb-1 inline-flex"><Brain size={10} /> AI Analysis</span>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Student Performance Radar</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>AI-generated skill distribution analysis</p>
          </div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} outerRadius={80}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                <Radar dataKey="A" stroke="#2563EB" fill="#2563EB" fillOpacity={0.18} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3" style={{ color: 'var(--muted-foreground)' }}>
              <Brain size={28} className="opacity-30" />
              <p className="text-sm font-medium">No radar data yet</p>
              <p className="text-xs text-center">Student skill metrics will appear after assessments</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── At-Risk & Mentorship Row ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* At-Risk Students */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="stat-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
                <AlertTriangle size={16} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>At-Risk Students</h3>
                <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>EDEN AI Alerts</p>
              </div>
            </div>
            {atRiskStudents.length > 0 && (
              <span className="badge badge-danger">{atRiskStudents.length} Active</span>
            )}
          </div>

          {atRiskStudents.length > 0 ? (
            <div className="space-y-2.5">
              {atRiskStudents.map((s: any, idx: number) => (
                <motion.div key={s.roll || idx}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + idx * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #EF4444, #B91C1C)' }}>
                      {(s.name || 'S')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{s.name}</p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{s.roll} · {s.issue}</p>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-ghost" style={{ color: 'var(--destructive)' }}>
                    <MessageSquare size={13} /> Contact
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: 'var(--muted-foreground)' }}>
              <CheckCircle2 size={28} className="text-emerald-400 opacity-80" />
              <p className="text-sm font-semibold text-emerald-400">All students on track</p>
              <p className="text-xs text-center">No students are below the 75% attendance cutoff</p>
            </div>
          )}
        </motion.div>

        {/* Mentorship Hub */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="stat-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
                <Users size={16} className="text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Mentee Hub</h3>
                <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Your assigned mentees</p>
              </div>
            </div>
            <Link to="/mentorship" className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
              <CheckCircle2 size={11} /> {mentees.length > 0 ? 'Active' : 'View'}
            </Link>
          </div>

          {mentees.length > 0 ? (
            <div className="space-y-2.5">
              {mentees.map((m: any, idx: number) => (
                <div key={m.name || idx} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
                      {(m.name || 'M')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                        {m.name} <span className="text-2xs font-normal" style={{ color: 'var(--muted-foreground)' }}>({m.level})</span>
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>GPA: {m.gpa} · {m.status}</p>
                    </div>
                  </div>
                  <button className="btn btn-icon btn-ghost">
                    <MessageSquare size={14} style={{ color: 'var(--primary)' }} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: 'var(--muted-foreground)' }}>
              <Users size={28} className="opacity-30" />
              <p className="text-sm font-medium">No mentees assigned yet</p>
              <p className="text-xs text-center">Students will be allocated to your mentorship profile</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
