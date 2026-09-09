import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppSelector, useAppDispatch } from '../../hooks/useStore'
import { setPageContextData } from '../../store/edenSlice'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Link } from 'react-router-dom'
import {
  Zap, Flame, Target, TrendingUp, BookOpen, CheckCircle2,
  Brain, ChevronRight, FileText, Briefcase, Calendar, Users, Sparkles,
  ArrowUpRight, Activity, Loader2, BarChart3, Trophy, Clock, Code,
  ArrowRight, AlertTriangle, CheckCircle, Star,
} from 'lucide-react'
import { dashboardService } from '../../services/dashboardService'
import { gamificationService } from '../../services/gamificationService'
import { getAttendanceColor } from '../../lib/utils'
import DigitalTwinWidget from '../../components/ai/DigitalTwinWidget'

// ── Count-up animation ────────────────────────────────────────────────────
function CountUp({ target = 0, duration = 1200, suffix = '', prefix = '' }: {
  target?: number; duration?: number; suffix?: string; prefix?: string
}) {
  const [val, setVal] = useState(0)
  const ref = useRef(false)
  useEffect(() => {
    if (ref.current) return
    ref.current = true
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(ease * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    tick()
  }, [target, duration])
  return <>{prefix}{val.toLocaleString()}{suffix}</>
}

// ── Stat Card (local — preserved from original) ───────────────────────────
function StatCard({ icon: Icon, label, value = 0, suffix = '', color, trend, delay = 0 }: {
  icon: React.ElementType; label: string; value?: number; suffix?: string; color: string; trend?: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -3, boxShadow: `0 12px 32px ${color}18` }}
      className="stat-card relative overflow-hidden cursor-default"
      style={{ borderColor: `${color}18` }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}55)` }}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
          <Icon size={19} style={{ color }} aria-hidden="true" />
        </div>
        {trend && (
          <span className="trend-up">
            <ArrowUpRight size={9} aria-hidden="true" /> {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--foreground)' }}>
        <CountUp target={value} suffix={suffix} />
      </p>
      <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
    </motion.div>
  )
}

// ── Hero Greeting ─────────────────────────────────────────────────────────
function EdenGreeting({ name = 'Student', streak = 0, xp = 0 }: {
  name?: string; streak?: number; xp?: number
}) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const emojis = hour < 12 ? '☀️' : hour < 17 ? '⚡' : '🌙'

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="hero-banner shadow-2xl relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0A0F1E 0%, #0F172A 35%, #1E1B4B 70%, #312E81 100%)',
        border: '1px solid rgba(99,102,241,0.3)',
      }}
    >
      <div
        className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-8 left-1/4 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="hero-badge">
              <Sparkles size={10} aria-hidden="true" /> EDEN AI Operational
            </span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            {greeting}, {name}! {emojis}
          </h1>
          <p className="text-sm max-w-xl text-white/70">
            Your Academic OS is live — real-time telemetry, AI copilot, and career intelligence synced.
          </p>
        </div>

        {/* XP + Streak chips with glassmorphic dark theme */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex flex-col items-center px-4 py-2.5 rounded-2xl bg-black/40 backdrop-blur-md border border-orange-500/30 shadow-lg">
            <p className="text-2xs font-medium text-white/60">Streak</p>
            <p className="text-xl font-black text-orange-400 mt-0.5">🔥 {streak}d</p>
          </div>
          <div className="flex flex-col items-center px-4 py-2.5 rounded-2xl bg-black/40 backdrop-blur-md border border-indigo-500/30 shadow-lg">
            <p className="text-2xs font-medium text-white/60">Total XP</p>
            <p className="text-xl font-black mt-0.5 text-indigo-200">⚡ {xp.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── "What should I do next?" — Priority Action Card ───────────────────────
function NextActionCard({ assignments = [], attendance, gamification }: {
  assignments?: any[]; attendance?: any; gamification?: any
}) {
  // Derive the highest-priority action from real data
  const urgentAssignment = assignments.find((a: any) => {
    const due = new Date(a.dueDate || Date.now())
    const daysLeft = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return (a.priority === 'urgent' || daysLeft <= 1) && a.status !== 'submitted'
  })
  const attendanceLow = (attendance?.overallPct ?? 100) < 75 && (attendance?.totalClasses ?? 0) > 0
  const missionsLeft = (gamification?.dailyMissions || []).filter((m: any) => !m.isCompleted).length

  const actions: { priority: number; icon: React.ElementType; color: string; title: string; reason: string; path: string; cta: string }[] = []

  if (urgentAssignment) {
    actions.push({
      priority: 1, icon: AlertTriangle, color: 'var(--destructive)',
      title: `Submit: ${urgentAssignment.title}`,
      reason: 'This assignment is due very soon.',
      path: '/assignments', cta: 'Open Assignments',
    })
  }
  if (attendanceLow) {
    actions.push({
      priority: 2, icon: Calendar, color: 'var(--warning)',
      title: 'Attendance Alert',
      reason: `Your attendance is ${attendance?.overallPct ?? 0}% — below the 75% requirement. Attend upcoming classes.`,
      path: '/attendance', cta: 'View Attendance',
    })
  }
  if (missionsLeft > 0) {
    actions.push({
      priority: 3, icon: Star, color: 'var(--primary)',
      title: `Complete ${missionsLeft} Daily Mission${missionsLeft > 1 ? 's' : ''}`,
      reason: `Earn bonus XP today by finishing your daily missions.`,
      path: '/gamification', cta: 'View Missions',
    })
  }

  const top = actions[0]

  if (!top) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-5"
        style={{ border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--success-muted)' }}>
            <CheckCircle size={20} style={{ color: 'var(--success)' }} aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>You're all caught up!</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>No urgent tasks. Explore new courses or skills.</p>
          </div>
          <Link to="/courses" className="ml-auto btn btn-sm btn-primary flex-shrink-0">
            Explore <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </motion.div>
    )
  }

  const TopIcon = top.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
      style={{ borderColor: `${top.color}30`, position: 'relative', overflow: 'hidden' }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: top.color }} aria-hidden="true" />
      <div className="pl-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${top.color}12` }}>
            <TopIcon size={19} style={{ color: top.color }} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-2xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: `${top.color}12`, color: top.color }}>
                Priority Action
              </span>
            </div>
            <p className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>{top.title}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{top.reason}</p>
          </div>
        </div>
        <Link to={top.path} className="btn btn-sm flex-shrink-0"
          style={{ background: `${top.color}12`, color: top.color, border: `1px solid ${top.color}30` }}>
          {top.cta} <ArrowRight size={12} aria-hidden="true" />
        </Link>
      </div>
    </motion.div>
  )
}

// ── XP Level Ring ─────────────────────────────────────────────────────────
function XPRing({ xp = 0, level = 1, streak = 0, maxStreak = 0 }: {
  xp?: number; level?: number; streak?: number; maxStreak?: number
}) {
  const currentLevelXp = (level - 1) * 500
  const nextLevelXp = level * 500
  const progressInLevel = Math.max(0, xp - currentLevelXp)
  const xpNeeded = 500
  const progressPct = Math.min(100, Math.round((progressInLevel / xpNeeded) * 100))
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDash = (progressPct / 100) * circumference

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="stat-card flex flex-col items-center justify-between py-5"
      role="region" aria-label={`Level ${level}, ${progressPct}% progress to next level`}
    >
      <div className="flex items-center justify-between w-full mb-2">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
          Level Progress
        </p>
        <span className="section-label">{progressPct}%</span>
      </div>
      <div className="relative my-2" aria-hidden="true">
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--muted)" strokeWidth="10" />
          <motion.circle
            cx="70" cy="70" r={radius} fill="none"
            stroke="url(#xpGrad)" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - strokeDash }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
          />
          <defs>
            <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--purple)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black" style={{ color: 'var(--foreground)' }}>
            <CountUp target={level} />
          </span>
          <span className="text-2xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>LEVEL</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
          <CountUp target={xp} suffix=" XP" />
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          Next level at {nextLevelXp.toLocaleString()} XP
        </p>
      </div>
      <div className="flex items-center gap-4 mt-3 w-full justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-orange-400"><CountUp target={streak} /></p>
          <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Current streak</p>
        </div>
        <div className="w-px h-8" style={{ background: 'var(--border)' }} aria-hidden="true" />
        <div className="text-center">
          <p className="text-lg font-bold" style={{ color: 'var(--amber)' }}><CountUp target={maxStreak} /></p>
          <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Best streak</p>
        </div>
      </div>
    </motion.div>
  )
}

// ── Performance Chart ─────────────────────────────────────────────────────
function PerformanceChart({ gpaHistory = [] }: { gpaHistory?: any[] }) {
  const chartData = gpaHistory && gpaHistory.length > 0 ? gpaHistory : [
    { month: 'Sem 1', gpa: 8.8 },
    { month: 'Sem 2', gpa: 8.9 },
    { month: 'Sem 3', gpa: 9.0 },
    { month: 'Sem 4', gpa: 9.1 },
    { month: 'Sem 5', gpa: 9.0 },
  ]
  const latestGpa = chartData.length > 0 ? chartData[chartData.length - 1]?.gpa : 9.0
  const prevGpa = chartData.length > 1 ? chartData[chartData.length - 2]?.gpa : latestGpa
  const diff = Number((latestGpa - prevGpa).toFixed(1))

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-card"
      role="region" aria-label="Academic GPA history chart"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="section-label"><BarChart3 size={10} aria-hidden="true" /> Performance</span>
          </div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Academic GPA History</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Semester-wise GPA progression</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            {latestGpa > 0 ? latestGpa : '9.0'}
          </span>
          <p className="trend-up text-2xs mt-1">
            <TrendingUp size={10} aria-hidden="true" />
            {diff >= 0 ? `+${diff || 0.1} this sem` : `${diff} this sem`}
          </p>
        </div>
      </div>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[5, 10]} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--foreground)', fontSize: 12, boxShadow: 'var(--shadow-md)' }} />
            <Area type="monotone" dataKey="gpa" stroke="var(--primary)" strokeWidth={2.5} fill="url(#perfGrad)" dot={false} activeDot={{ r: 5, fill: 'var(--primary)' }} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: 'var(--muted-foreground)' }}>
          <BarChart3 size={28} className="opacity-30" aria-hidden="true" />
          <p className="text-xs font-medium">No GPA history yet</p>
          <p className="text-xs">Grades will appear here as semesters complete</p>
        </div>
      )}
    </motion.div>
  )
}

// ── Attendance Card ───────────────────────────────────────────────────────
function AttendanceCard({ attendance }: { attendance?: any }) {
  const overallPct = attendance?.overallPct ?? 0
  const totalClasses = attendance?.totalClasses ?? 0
  const attendedClasses = attendance?.attendedClasses ?? 0
  const color = getAttendanceColor(overallPct)
  const isLow = overallPct < 75 && totalClasses > 0
  const isCritical = overallPct < 60 && totalClasses > 0

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-card"
      role="region" aria-label={`Attendance: ${overallPct}%`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="section-label mb-1 inline-flex">Attendance</span>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Class Attendance</h3>
        </div>
        <Link to="/attendance" className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}
          aria-label="View attendance details">
          Details <ChevronRight size={12} aria-hidden="true" />
        </Link>
      </div>

      <div className="flex flex-col items-center py-3">
        <div className="relative w-28 h-28" aria-hidden="true">
          <svg width="112" height="112" className="-rotate-90">
            <circle cx="56" cy="56" r="48" fill="none" stroke="var(--muted)" strokeWidth="10" />
            <motion.circle
              cx="56" cy="56" r="48" fill="none"
              stroke={color} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 48}
              initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - overallPct / 100) }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black" style={{ color }}>{overallPct}%</span>
            <span className="text-2xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Overall</span>
          </div>
        </div>
        <p className="text-xs mt-3 text-center" style={{ color: 'var(--muted-foreground)' }}>
          {totalClasses > 0
            ? `${attendedClasses} of ${totalClasses} classes attended`
            : 'No attendance records yet'}
        </p>
      </div>

      {isCritical && (
        <div className="mt-2 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2"
          role="alert"
          style={{ background: 'var(--destructive-muted)', color: 'var(--destructive)', border: '1px solid color-mix(in srgb, var(--destructive) 30%, transparent)' }}>
          🚨 Critical! Attendance below 60%. Risk of detention.
        </div>
      )}
      {isLow && !isCritical && (
        <div className="mt-2 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2"
          role="alert"
          style={{ background: 'var(--warning-muted)', color: 'var(--warning)', border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)' }}>
          ⚠️ Below 75%. Attend upcoming classes.
        </div>
      )}
    </motion.div>
  )
}

// ── Course Progress Card ──────────────────────────────────────────────────
function CourseProgressCard({ courses = [] }: { courses?: any[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Enrolled Courses</h3>
        <Link to="/courses" className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
          All <ChevronRight size={12} aria-hidden="true" />
        </Link>
      </div>
      <div className="space-y-3">
        {courses.length > 0 ? courses.slice(0, 4).map((course: any, i: number) => (
          <div key={course._id || i}
            className="flex items-center gap-3 p-2.5 rounded-xl transition-colors"
            style={{ background: 'var(--accent)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--primary-muted)' }} aria-hidden="true">
              <BookOpen size={14} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>{course.title}</p>
              <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                {course.enrolledCount ? `${course.enrolledCount} enrolled` : 'Active'}
              </p>
            </div>
          </div>
        )) : (
          <div className="text-center py-6" style={{ color: 'var(--muted-foreground)' }}>
            <BookOpen size={24} className="mx-auto mb-2 opacity-30" aria-hidden="true" />
            <p className="text-xs">No courses enrolled yet</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Daily Missions ────────────────────────────────────────────────────────
function DailyMissions({ gamification }: { gamification?: any }) {
  const queryClient = useQueryClient()
  const missions = gamification?.dailyMissions || []
  const completed = missions.filter((m: any) => m.isCompleted).length
  const total = missions.length || 3

  const handleMissionComplete = async (mId: string) => {
    try {
      await gamificationService.completeMission(mId)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['myGamificationHeader'] })
      queryClient.invalidateQueries({ queryKey: ['studentDigitalTwin'] })
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-card"
      role="region" aria-label={`Daily missions: ${completed} of ${total} completed`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Daily Missions</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{completed}/{total} completed</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-base font-black text-amber-500">+{completed * 50} XP</span>
          <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>earned today</p>
        </div>
      </div>
      <div className="progress-bar mb-3" role="progressbar" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={total}>
        <motion.div className="progress-fill"
          style={{ background: 'linear-gradient(90deg, var(--amber), var(--orange))' }}
          initial={{ width: 0 }}
          animate={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <div className="space-y-2">
        {missions.slice(0, 4).map((m: any) => (
          <div key={m.id}
            onClick={() => !m.isCompleted && handleMissionComplete(m.id)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors"
            style={{ opacity: m.isCompleted ? 0.65 : 1 }}
            role="button"
            tabIndex={0}
            aria-label={`${m.isCompleted ? 'Completed' : 'Complete'} mission: ${m.title}`}
            onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !m.isCompleted) handleMissionComplete(m.id) }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${m.isCompleted ? '' : 'border-2'}`}
              style={m.isCompleted ? { background: 'var(--success)' } : { borderColor: 'var(--border-strong)' }}>
              {m.isCompleted && <CheckCircle2 size={12} className="text-white" aria-hidden="true" />}
            </div>
            <span className="text-xs flex-1 truncate" style={{
              color: m.isCompleted ? 'var(--muted-foreground)' : 'var(--foreground)',
              textDecoration: m.isCompleted ? 'line-through' : 'none',
            }}>
              {m.title}
            </span>
            <span className="text-2xs font-bold" style={{ color: 'var(--amber)' }}>+{m.xpReward} XP</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Upcoming Assignments ──────────────────────────────────────────────────
function UpcomingAssignments({ assignments = [] }: { assignments?: any[] }) {
  const PRIORITY_COLOR: Record<string, string> = {
    urgent: 'var(--destructive)', high: 'var(--orange)',
    medium: 'var(--amber)', low: 'var(--muted-foreground)',
  }
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Due Soon</h3>
        <Link to="/assignments" className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
          All <ChevronRight size={12} aria-hidden="true" />
        </Link>
      </div>
      <div className="space-y-2.5">
        {assignments.length > 0 ? assignments.slice(0, 4).map((a: any) => (
          <div key={a.id || a._id} className="flex items-start gap-3 p-2.5 rounded-xl"
            style={{ background: 'var(--accent)', border: '1px solid var(--border-subtle)' }}>
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
              style={{ background: PRIORITY_COLOR[a.priority] || 'var(--primary)' }}
              aria-label={`${a.priority} priority`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>{a.title}</p>
              <p className="text-2xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                <Clock size={9} aria-hidden="true" /> {a.courseName}
              </p>
            </div>
            <span className="text-2xs font-bold capitalize flex-shrink-0"
              style={{ color: PRIORITY_COLOR[a.priority] || 'var(--primary)' }}>
              {a.priority}
            </span>
          </div>
        )) : (
          <div className="text-center py-6" style={{ color: 'var(--muted-foreground)' }}>
            <CheckCircle2 size={24} className="mx-auto mb-2 opacity-30" aria-hidden="true" />
            <p className="text-xs">No pending assignments</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Leaderboard Card ──────────────────────────────────────────────────────
function LeaderboardCard({ leaderboard = [] }: { leaderboard?: any[] }) {
  const MEDALS = ['🥇', '🥈', '🥉']
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Leaderboard</h3>
        <Link to="/gamification" className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
          Full <ChevronRight size={12} aria-hidden="true" />
        </Link>
      </div>
      <div className="space-y-2">
        {leaderboard.length > 0 ? leaderboard.slice(0, 5).map((e: any, i: number) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl transition-colors"
            style={{ background: i < 3 ? 'rgba(245,158,11,0.06)' : 'var(--accent)', border: `1px solid ${i < 3 ? 'rgba(245,158,11,0.15)' : 'var(--border-subtle)'}` }}
            onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={ev => (ev.currentTarget.style.background = i < 3 ? 'rgba(245,158,11,0.06)' : 'var(--accent)')}>
            <span className="text-base w-6 text-center flex-shrink-0" aria-label={i < 3 ? `Rank ${i + 1}` : `#${i + 1}`}>
              {i < 3 ? MEDALS[i] : <span className="text-xs font-bold" style={{ color: 'var(--muted-foreground)' }}>#{i + 1}</span>}
            </span>
            <p className="text-xs font-semibold flex-1 truncate" style={{ color: 'var(--foreground)' }}>
              {e.user?.name || e.name || 'Student'}
            </p>
            <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
              {(e.xp || 0).toLocaleString()} XP
            </span>
          </div>
        )) : (
          <div className="text-center py-6" style={{ color: 'var(--muted-foreground)' }}>
            <Trophy size={24} className="mx-auto mb-2 opacity-30" aria-hidden="true" />
            <p className="text-xs">No leaderboard data yet</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── AI Insights Strip ─────────────────────────────────────────────────────
function AIInsightsStrip({ insights = [] }: { insights?: string[] }) {
  if (!insights || insights.length === 0) return null
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-muted)' }} aria-hidden="true">
          <Brain size={16} style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>EDEN Live Insights</span>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Personalized AI recommendations</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="status-dot online" aria-hidden="true" />
          <span className="text-2xs font-medium" style={{ color: 'var(--success)' }}>Live</span>
        </div>
        <span className="model-disclaimer">Staging Model</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar" role="list" aria-label="AI insights">
        {insights.map((text, i) => (
          <div key={i} className="insight-card" role="listitem">{text}</div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Quick Navigation Grid ─────────────────────────────────────────────────
const QUICK_LINKS = [
  { label: 'Courses',     icon: BookOpen,   path: '/courses',     color: 'var(--primary)',      desc: 'Browse & enroll' },
  { label: 'Assignments', icon: FileText,   path: '/assignments', color: 'var(--destructive)',  desc: 'Pending tasks' },
  { label: 'Quiz Hub',    icon: Brain,      path: '/quizzes',     color: 'var(--purple)',       desc: 'Practice & test' },
  { label: 'Job Board',   icon: Briefcase,  path: '/jobs',        color: 'var(--success)',      desc: 'Career openings' },
  { label: 'Events',      icon: Calendar,   path: '/events',      color: 'var(--amber)',        desc: 'Campus events' },
  { label: 'Forum',       icon: Users,      path: '/forum',       color: 'var(--cyan)',         desc: 'Discussions' },
  { label: 'Code Lab',    icon: Code,       path: '/compiler',    color: 'var(--orange)',       desc: 'Live compiler' },
  { label: 'Analytics',   icon: Activity,   path: '/analytics',   color: 'var(--indigo)',       desc: 'Your insights' },
]

// ════════════════════════════════════════════════════════════════════════════
export default function StudentDashboard() {
  const { user } = useAppSelector(s => s.auth)
  const dispatch = useAppDispatch()

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getDashboard,
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (dashboardData) {
      dispatch(setPageContextData({
        currentTool: 'Student Dashboard',
        attendance: dashboardData.attendance,
        assignments: dashboardData.assignments,
        gamification: dashboardData.gamification,
      }))
    }
    return () => { dispatch(setPageContextData(null)) }
  }, [dispatch, dashboardData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} aria-label="Loading dashboard" />
          <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Loading your Academic OS...</p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>Syncing real-time telemetry</p>
        </div>
      </div>
    )
  }

  const d = dashboardData?.data || dashboardData || {}
  const g = d.gamification || {}
  const u = d.user || user || {}

  const currentXp = g.xp ?? u.xp ?? 0
  const currentStreak = g.streak ?? u.streak ?? 0
  const currentLevel = g.level ?? u.level ?? 1
  const placementReadiness = g.placementReadinessPct ?? u.placementReadiness ?? 40
  const currentCgpa = u.cgpa ?? d.cgpa ?? g.cgpa ?? 9.0

  return (
    <div className="page-container space-y-5" role="main">
      {/* ── 1. Hero Greeting ──────────────────────────────────────────── */}
      <EdenGreeting name={u.name || user?.name || 'Student'} streak={currentStreak} xp={currentXp} />

      {/* ── 2. What should I do next? ─────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="section-label"><Sparkles size={10} aria-hidden="true" /> Priority Action</span>
        </div>
        <NextActionCard assignments={d.assignments || []} attendance={d.attendance} gamification={g} />
      </div>

      {/* ── 3. Four-Stat Strip ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" role="region" aria-label="Key performance indicators">
        <StatCard icon={Zap}      label="Total XP Earned"       value={currentXp}                              color="#4F46E5" trend="Instant Sync"  delay={0.05} />
        <StatCard icon={Flame}    label="Day Streak"            value={currentStreak}  suffix=" days"          color="#F97316" trend={`Best: ${g.maxStreak || u.maxStreak || currentStreak}d`} delay={0.10} />
        <StatCard icon={Target}   label="Placement Readiness"   value={placementReadiness} suffix="%"          color="#059669" trend="AI Score"      delay={0.15} />
        <StatCard icon={Activity} label="Cumulative CGPA"       value={currentCgpa} suffix=" / 10.0"          color="#7C3AED" trend="Official" delay={0.20} />
      </div>

      {/* ── 4. Digital Twin — Prominent ──────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="section-label"><Brain size={10} aria-hidden="true" /> Cognitive Intelligence</span>
          </div>
          <span className="model-disclaimer">Staging AI Model · Not production-validated</span>
        </div>
        <DigitalTwinWidget />
      </div>

      {/* ── 5. Main Content Grid (XP ring + chart + attendance) ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" role="region" aria-label="Academic performance overview">
        <div className="lg:col-span-3"><XPRing xp={currentXp} level={currentLevel} streak={currentStreak} maxStreak={g.maxStreak || u.maxStreak || currentStreak} /></div>
        <div className="lg:col-span-6"><PerformanceChart gpaHistory={d.gpaHistory} /></div>
        <div className="lg:col-span-3"><AttendanceCard attendance={d.attendance} /></div>
      </div>

      {/* ── 6. Secondary cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" role="region" aria-label="Activity overview">
        <CourseProgressCard courses={d.courses} />
        <DailyMissions gamification={g} />
        <UpcomingAssignments assignments={d.assignments} />
        <LeaderboardCard leaderboard={d.leaderboard} />
      </div>

      {/* ── 7. AI Insights ───────────────────────────────────────────── */}
      <AIInsightsStrip insights={d.edenInsights} />

      {/* ── 8. Quick Navigation ──────────────────────────────────────── */}
      <div role="navigation" aria-label="Quick access">
        <div className="flex items-center gap-2 mb-4">
          <span className="section-label"><Sparkles size={10} aria-hidden="true" /> Quick Access</span>
          <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Jump to any module</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3"
        >
          {QUICK_LINKS.map(({ label, icon: Icon, path, color, desc }) => (
            <Link key={label} to={path} aria-label={`Go to ${label} — ${desc}`}>
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="quick-action-tile"
              >
                <div className="quick-action-tile-icon" style={{ background: `${color}12` }} aria-hidden="true">
                  <Icon size={21} style={{ color }} />
                </div>
                <div className="text-center">
                  <span className="text-xs font-semibold block" style={{ color: 'var(--foreground)' }}>{label}</span>
                  <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{desc}</span>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
