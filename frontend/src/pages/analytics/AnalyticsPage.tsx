import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Target, BookOpen, Clock, Brain, Star, Loader2 } from 'lucide-react'
import { analyticsService } from '../../services/analyticsService'
import EmptyState from '../../components/common/EmptyState'

export default function AnalyticsPage() {
  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ['institutionalAnalytics'],
    queryFn: analyticsService.getInstitutionalAnalytics,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <p className="text-xs text-slate-400">Loading Institutional Analytics from MongoDB...</p>
        </div>
      </div>
    )
  }

  const d = analyticsRes || {}
  const monthlyData = d.monthlyEnrollments || []

  // Helper to format nullable values
  const formatValue = (value: number | null | undefined, suffix = '') => {
    if (value === null || value === undefined) return '—'
    return `${value}${suffix}`
  }

  return (
    <div className="page-container space-y-5">
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>Institutional Analytics &amp; Performance Intelligence</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Live platform analytics synced with MongoDB Atlas</p>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Retention Rate', value: formatValue(d.retentionRatePct, '%'), icon: Star, color: '#10B981' },
          { label: 'Graduation Rate', value: formatValue(d.graduationRatePct, '%'), icon: BookOpen, color: '#2563EB' },
          { label: 'Placement Rate', value: formatValue(d.placementRatePct, '%'), icon: Target, color: '#8B5CF6' },
          { label: 'Avg CGPA', value: formatValue(d.avgCgpa), icon: Brain, color: '#F59E0B' },
          { label: 'Enrolled Students', value: formatValue(d.enrolledStudentsCount), icon: Clock, color: '#06B6D4' },
          { label: 'Active Faculty', value: formatValue(d.activeFacultyCount), icon: TrendingUp, color: '#EF4444' },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} whileHover={{ y: -3 }} className="stat-card text-center border border-indigo-500/20">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ background: `${color}15` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-xl font-black" style={{ color: 'var(--foreground)' }}>{value}</p>
            <p className="text-2xs font-bold uppercase mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5 border border-indigo-500/20">
          <h3 className="font-extrabold text-sm mb-4" style={{ color: 'var(--foreground)' }}>Monthly Student Registrations</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyData}>
                <defs><linearGradient id="gpaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="studentsCount" stroke="#10B981" strokeWidth={2.5} fill="url(#gpaGrad)" dot={{ r: 4, fill: '#10B981' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No Monthly Data" description="No monthly registration records available." />
          )}
        </div>
        <div className="card p-5 border border-indigo-500/20">
          <h3 className="font-extrabold text-sm mb-4" style={{ color: 'var(--foreground)' }}>Monthly Revenue Telemetry ($)</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)', fontWeight: 'bold' }} />
                <Bar dataKey="revenue" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No Revenue Telemetry" description="No monthly revenue records available." />
          )}
        </div>
      </div>
    </div>
  )
}
