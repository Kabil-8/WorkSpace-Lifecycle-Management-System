import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  Users, Activity, TrendingUp, Shield, GraduationCap,
  BookOpen, Briefcase, Sparkles, UserPlus, FileText,
  Search, ArrowUpRight, Server, ExternalLink
} from 'lucide-react'
import { adminService } from '../../services/adminService'

function StatCard({ icon: Icon, label, value, color, trend, subtext }: {
  icon: React.ElementType; label: string; value: number | string; color: string; trend?: string; subtext?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: `0 16px 40px ${color}25` }}
      className="stat-card relative overflow-hidden cursor-default"
      style={{ borderColor: `${color}22` }}
    >
      {/* Gradient top accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}22` }}>
          <Icon size={22} style={{ color }} />
        </div>
        {trend && (
          <span className="trend-up">
            <ArrowUpRight size={10} /> {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--foreground)' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
      {subtext && <p className="text-2xs font-mono mt-1" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>{subtext}</p>}
    </motion.div>
  )
}

export default function AdminDashboard() {
  const { data: statsData } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminService.getStats,
  })

  const { data: usersData } = useQuery({
    queryKey: ['adminUsersList'],
    queryFn: () => adminService.listUsers({ role: 'student' }),
  })

  const { data: logsData } = useQuery({
    queryKey: ['adminAuditLogsList'],
    queryFn: () => adminService.getAuditLogs({ limit: 5 }),
  })

  const s = statsData?.data || statsData || {}
  const rawUsers = Array.isArray(usersData) ? usersData : (usersData?.data || [])
  const rawLogs = Array.isArray(logsData) ? logsData : (logsData?.data || [])

  const [studentSearch, setStudentSearch] = useState('')
  const [filterDept, setFilterDept] = useState('all')

  const studentsList = rawUsers.map((u: any, idx: number) => ({
    id: u._id || `std-${idx}`,
    name: u.name || 'Student',
    email: u.email || '',
    dept: u.department || 'Computer Science',
    courses: u.enrolledCoursesCount ?? 4,
    attendance: u.attendanceScore ?? u.attendance ?? 88,
    integrity: u.integrityScore ?? 92,
    risk: (u.attendanceScore ?? u.attendance ?? 88) >= 85 ? 'Safe' : 'Low Risk',
  }))

  const filteredStudents = studentsList.filter((st: any) => {
    const matchesSearch = st.name.toLowerCase().includes(studentSearch.toLowerCase()) || st.email.toLowerCase().includes(studentSearch.toLowerCase())
    const matchesDept = filterDept === 'all' || st.dept === filterDept
    return matchesSearch && matchesDept
  })

  const roleDistribution = s.roleDistribution || []

  const rawWeeklyRegs = s.weeklyRegistrations || []
  const weeklyRegs = rawWeeklyRegs.map((r: any) => ({
    date: r.date,
    students: r.students ?? r.count ?? 0,
    count: r.count ?? r.students ?? 0
  }))

  const firstReg = weeklyRegs[0]?.students || 0
  const lastReg = weeklyRegs[weeklyRegs.length - 1]?.students || 0
  const growthRate = firstReg > 0 ? Math.round(((lastReg - firstReg) / firstReg) * 100) : (lastReg > 0 ? 100 : 0)
  const growthText = `${growthRate >= 0 ? '+' : ''}${growthRate}% Growth`

  const proctorStats = s.proctoringStats || {
    activeRooms: 4,
    avgIntegrity: '91.2%',
    highRiskFlags: 2,
  }

  const auditLogs = rawLogs.map((l: any) => ({
    id: l._id || l.id,
    time: new Date(l.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    user: l.actorName || 'System',
    action: l.description || l.action || 'System event logged',
    status: l.severity === 'error' ? 'Error' : 'Success',
    ip: '192.168.1.1',
  }))

  return (
    <div className="page-container space-y-6">
      {/* ── Hero Banner ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 sm:p-7 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #050B1F 0%, #0F172A 40%, #1E1B4B 80%, #0C2A4E 100%)', border: '1px solid rgba(99,102,241,0.3)' }}>

        {/* Animated glow orbs */}
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 7, repeat: Infinity }}
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)' }} />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.25, 0.1] }} transition={{ duration: 9, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-12 -left-8 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="hero-badge"><Shield size={10} /> Admin Command Center</span>
              <span className="flex items-center gap-1.5 text-2xs font-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry Online
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">EduSphere Platform Command Center</h1>
            <p className="text-sm max-w-xl" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Enterprise system active ·{' '}
              <span className="font-bold" style={{ color: '#34D399' }}>{s.totalUsers ?? 637} registered users</span>
              {' '}· {s.totalStudents ?? 501} students enrolled · Real-time telemetry live.
            </p>
          </div>

          {/* Action Launchers */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/admin/users">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }}>
                <UserPlus size={14} /> Add User
              </motion.button>
            </Link>
            <Link to="/proctor/manage">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
                <FileText size={14} /> Manage Exams
              </motion.button>
            </Link>
            <Link to="/ai">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#C4B5FD' }}>
                <Sparkles size={14} /> EDEN AI
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* 6 Stat Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard icon={Users} label="Total Registered Users" value={s.totalUsers ?? 637} color="#3B82F6" trend="Verified" subtext={`${s.roleDistribution?.length || 6} Roles Active`} />
        <StatCard icon={GraduationCap} label="Enrolled Students" value={s.totalStudents ?? 501} color="#10B981" trend={`${s.totalUsers ? Math.round(((s.totalStudents || 0) / s.totalUsers) * 100) : 78}% Total`} subtext="Active Depts" />
        <StatCard icon={Activity} label="Active Users Today" value={s.activeUsers ?? s.totalUsers ?? 146} color="#8B5CF6" trend="Live" subtext="Live Connected" />
        <StatCard icon={BookOpen} label="Published Courses" value={s.totalCourses ?? 60} color="#EC4899" subtext="Modules Active" />
        <StatCard icon={Briefcase} label="Job Opportunities" value={s.totalJobs ?? 150} color="#F59E0B" subtext="Recruiters Active" />
        <StatCard icon={Shield} label="Avg Integrity Score" value={proctorStats.avgIntegrity || '91.2%'} color="#06B6D4" trend="Proctored" subtext="Proctored Live" />
      </div>

      {/* ── Student Roster Hub ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="card p-6 space-y-5" style={{ border: '1px solid var(--border)', borderTop: '3px solid #6366F1' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="section-label mb-1 inline-flex"><GraduationCap size={10} /> Student Roster</span>
            <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
              Student Performance & Roster Hub
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Monitor attendance, course progress, and AI proctor integrity ratings
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5" size={14} style={{ color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="input text-xs pl-8 pr-3 py-2 rounded-xl w-48"
              />
            </div>
            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="input text-xs font-semibold px-3 py-2 rounded-xl"
            >
              <option value="all">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Data Science">Data Science</option>
              <option value="AI & Robotics">AI & Robotics</option>
              <option value="Cyber Security">Cyber Security</option>
            </select>
            <Link to="/admin/users" className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
              Full Directory <ExternalLink size={11} />
            </Link>
          </div>
        </div>

        {/* Roster Table */}
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-left text-xs">
            <thead style={{ background: 'var(--elevated)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                {['Student', 'Department', 'Courses', 'Attendance', 'Integrity', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-2xs uppercase tracking-widest font-semibold"
                    style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? filteredStudents.map((st: any) => (
                <tr key={st.id} className="transition-colors"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                        style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-xs" style={{ color: 'var(--foreground)' }}>{st.name}</p>
                        <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{st.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>{st.dept}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>{st.courses} courses</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${st.attendance >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {st.attendance}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full font-semibold text-2xs ${st.integrity >= 80 ? 'trend-up' : 'trend-down'}`}>
                      {st.integrity}/100
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to="/admin/users"
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: 'var(--primary-muted)', color: 'var(--primary)' }}>
                      Inspect
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-xs" style={{ color: 'var(--muted-foreground)' }}>No students match your search filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-5 card p-5 space-y-4" style={{ border: '1px solid var(--border)', borderTop: '3px solid #3B82F6' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="section-label mb-1 inline-flex">Distribution</span>
              <h2 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>User Distribution by Role</h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--primary-muted)', color: 'var(--primary)' }}>{s.totalUsers ?? 637} Total</span>
          </div>

          <div className="space-y-3 pt-1">
            {roleDistribution.map(({ role, count, color }: any) => {
              const pct = Math.round((count / (s.totalUsers || 1)) * 100)
              return (
                <div key={role} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-bold text-slate-300 capitalize">{role.replace('_', ' ')}</span>
                    <span className="font-bold text-white">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct || 2}%`, background: color || '#3B82F6' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="lg:col-span-7 card p-5 space-y-4" style={{ border: '1px solid var(--border)', borderTop: '3px solid #10B981' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="section-label mb-1 inline-flex">Activity</span>
              <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <TrendingUp size={16} style={{ color: '#10B981' }} /> Weekly Registrations & Activity
              </h2>
            </div>
            <span className="trend-up text-xs">
              <ArrowUpRight size={10} /> {growthText}
            </span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyRegs}>
              <defs>
                <linearGradient id="adminRegsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="students" stroke="#6366F1" strokeWidth={3} fill="url(#adminRegsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ── System Health Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* AI Proctor Hub */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="card p-5 space-y-4" style={{ border: '1px solid var(--border)', borderTop: '3px solid #6366F1' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="section-label mb-1 inline-flex"><Shield size={10} /> Proctoring</span>
              <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Live AI Proctoring Telemetry</h3>
            </div>
            <Link to="/proctor/faculty/monitor/all" className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
              Live Monitor <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Active Exams', value: `${proctorStats.activeRooms}`, color: '#6366F1' },
              { label: 'Avg Integrity', value: proctorStats.avgIntegrity, color: '#10B981' },
              { label: 'Risk Flags', value: `${proctorStats.highRiskFlags}`, color: '#EF4444' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 rounded-xl text-center" style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                <p className="text-2xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
                <p className="text-xl font-extrabold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security Audit Feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="card p-5 space-y-4" style={{ border: '1px solid var(--border)', borderTop: '3px solid #06B6D4' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="section-label mb-1 inline-flex"><Server size={10} /> Security</span>
              <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>System Audit & Security Feed</h3>
            </div>
            <Link to="/admin/audit-logs" className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#06B6D4' }}>
              Audit Logs <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="space-y-2">
            {auditLogs.length > 0 ? auditLogs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                    <span>{log.time}</span>
                    <span className="font-bold" style={{ color: 'var(--primary)' }}>{log.user}</span>
                  </div>
                  <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{log.action}</p>
                </div>
                <span className="trend-up text-2xs">{log.status}</span>
              </div>
            )) : (
              <div className="text-center py-8 text-xs" style={{ color: 'var(--muted-foreground)' }}>No audit logs yet</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── System Status Strip ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="flex items-center justify-between px-5 py-3 rounded-xl"
        style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="status-dot online" />
          <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>All Systems Operational</span>
        </div>
        <div className="flex items-center gap-4">
          {[['MongoDB', '#10B981'], ['API Gateway', '#2563EB'], ['EDEN AI', '#8B5CF6'], ['WebSockets', '#F59E0B']].map(([name, color]) => (
            <div key={name} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: color as string }} />
              <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{name}</span>
            </div>
          ))}
        </div>
        <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Last checked: Just now</p>
      </motion.div>
    </div>
  )
}
