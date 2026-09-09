import { useState, useEffect } from 'react'
import { AlertTriangle, Building2, Calendar, Check, X } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../services/api'

export default function AdminFacultyAttendanceView() {
  const [facultyLogs, setFacultyLogs] = useState<any[]>([])
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [deptData, setDeptData] = useState<any[]>([])

  useEffect(() => {
    fetchFacultyLogs()
    fetchLeaveRequests()
  }, [])

  const fetchFacultyLogs = async () => {
    try {
      const res: any = await api.get('/attendance/faculty/daily')
      const payload = res?.data?.data ? res.data : res
      const logs = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
      if (logs.length > 0) setFacultyLogs(logs)
      if (payload?.departmentComparison) setDeptData(payload.departmentComparison)
    } catch (err) {
      console.warn('Failed to fetch faculty logs from MongoDB', err)
    }
  }

  const fetchLeaveRequests = async () => {
    try {
      const res: any = await api.get('/attendance/leaves')
      const list = Array.isArray(res?.data?.data) ? res.data.data
        : Array.isArray(res?.data) ? res.data
        : Array.isArray(res) ? res : []
      if (list.length > 0) setLeaveRequests(list)
    } catch (err) {
      console.warn('Failed to fetch leave requests', err)
    }
  }

  const handleReviewLeave = async (leaveId: string, newStatus: string) => {
    try {
      await api.put(`/attendance/leave/${leaveId}/status`, { status: newStatus })
      fetchLeaveRequests()
    } catch (e) {
      console.error(e)
    }
    setLeaveRequests(prev => prev.map(l => (l._id === leaveId || l.id === leaveId) ? { ...l, status: newStatus } : l))
  }

  return (
    <div className="space-y-6">
      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card border-l-4 border-l-indigo-500">
          <p className="text-2xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Total Faculty Staff</p>
          <p className="text-2xl font-black mt-1" style={{ color: 'var(--text-primary)' }}>48 Active</p>
        </div>

        <div className="stat-card border-l-4 border-l-emerald-500">
          <p className="text-2xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Avg Work Hours</p>
          <p className="text-2xl font-black text-emerald-500 dark:text-emerald-400 mt-1">8.4 hrs/day</p>
        </div>

        <div className="stat-card border-l-4 border-l-amber-500">
          <p className="text-2xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Late Arrivals Today</p>
          <p className="text-2xl font-black text-amber-500 dark:text-amber-400 mt-1">3 Faculty</p>
        </div>

        <div className="stat-card border-l-4 border-l-purple-500">
          <p className="text-2xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Faculty Score Index</p>
          <p className="text-2xl font-black text-purple-500 dark:text-purple-400 mt-1">92.4% Avg</p>
        </div>
      </div>

      {/* Grid: Work Hours Bar & Dept Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Department Attendance Comparison (6 Cols) */}
        <div className="lg:col-span-6 card p-5 space-y-4 border border-indigo-500/20">
          <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Building2 size={16} className="text-indigo-500 dark:text-indigo-400" /> Department Attendance Comparison
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptData}>
              <XAxis dataKey="dept" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[80, 100]} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)' }} />
              <Bar dataKey="attendance" fill="#6366F1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Late Arrival Leaderboard (6 Cols) — Clean White Card Rows */}
        <div className="lg:col-span-6 card p-5 space-y-4 border border-amber-500/20">
          <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <AlertTriangle size={16} className="text-amber-500" /> Late Arrival & Punctuality Leaderboard
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs shadow-xs">
              <span className="font-bold text-amber-950 dark:text-white">Prof. Grace Hopper (CSE)</span>
              <span className="font-mono text-2xs font-extrabold text-amber-700 dark:text-amber-400 bg-amber-200/60 dark:bg-amber-500/20 px-3 py-1 rounded-lg border border-amber-300 dark:border-amber-500/30">4 Late Check-Ins</span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs shadow-xs">
              <span className="font-bold text-slate-800 dark:text-slate-100">Prof. Barbara Liskov (ECE)</span>
              <span className="font-mono text-2xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-600">2 Late Check-Ins</span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs shadow-xs">
              <span className="font-bold text-slate-800 dark:text-slate-100">Dr. Claude Shannon (IT)</span>
              <span className="font-mono text-2xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-600">1 Late Check-In</span>
            </div>
          </div>
        </div>
      </div>

      {/* Faculty Attendance Table */}
      <div className="card p-5 space-y-4 border border-indigo-500/20">
        <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Faculty Attendance & Work Hour Logs</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b uppercase text-2xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <th className="p-3">Faculty Staff</th>
                <th className="p-3">Department</th>
                <th className="p-3">Check-In</th>
                <th className="p-3">Check-Out</th>
                <th className="p-3">Total Working Hours</th>
                <th className="p-3">Status</th>
                <th className="p-3">Faculty Score</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {facultyLogs.map((fac) => (
                <tr key={fac.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all">
                  <td className="p-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{fac.facultyName}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{fac.department}</td>
                  <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{fac.checkInTime}</td>
                  <td className="p-3 font-mono text-blue-600 dark:text-blue-400 font-bold">{fac.checkOutTime}</td>
                  <td className="p-3 font-bold" style={{ color: 'var(--text-primary)' }}>{fac.totalWorkingHours} Hours</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-2xs font-extrabold ${fac.status === 'Present' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : fac.status === 'Late' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30'}`}>
                      {fac.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">{fac.performanceScore}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Faculty Leave Request Approval Section — Pure White Cards with High Contrast Text */}
      <div className="card p-5 space-y-4 border border-purple-500/20">
        <h3 className="font-bold text-sm flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
          <span className="flex items-center gap-2"><Calendar size={16} className="text-purple-500 dark:text-purple-400" /> Pending Faculty Leave Applications</span>
          <span className="text-2xs font-mono bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full font-bold border border-purple-200 dark:border-purple-500/30">{leaveRequests.filter(l => l.status === 'Pending').length} Pending</span>
        </h3>

        <div className="space-y-3">
          {leaveRequests.map((leave) => (
            <div key={leave.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">{leave.applicantName}</strong>
                  <span className="text-2xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-500/30">{leave.leaveType}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-xs">{leave.reason} ({leave.startDate} to {leave.endDate})</p>
              </div>

              <div className="flex items-center gap-2">
                {leave.status === 'Pending' ? (
                  <>
                    <button onClick={() => handleReviewLeave(leave.id, 'Approved')} className="px-3.5 py-1.5 rounded-lg text-2xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 shadow-xs">
                      <Check size={12} /> Approve
                    </button>
                    <button onClick={() => handleReviewLeave(leave.id, 'Rejected')} className="px-3.5 py-1.5 rounded-lg text-2xs font-bold bg-red-600 text-white hover:bg-red-700 flex items-center gap-1 shadow-xs">
                      <X size={12} /> Reject
                    </button>
                  </>
                ) : (
                  <span className={`px-3 py-1 rounded-lg text-2xs font-bold ${leave.status === 'Approved' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30'}`}>
                    {leave.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
