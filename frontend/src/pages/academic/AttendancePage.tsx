import { motion } from 'framer-motion'
import { Sparkles, UserCheck, User, Settings } from 'lucide-react'
import { useAppSelector } from '../../hooks/useStore'
import FacultyStudentAttendanceView from '../../components/attendance/FacultyStudentAttendanceView'
import AdminFacultyAttendanceView from '../../components/attendance/AdminFacultyAttendanceView'
import StudentAttendanceAnalyticsView from '../../components/attendance/StudentAttendanceAnalyticsView'

export default function AttendancePage() {
  const { user } = useAppSelector(s => s.auth)
  const role = user?.role || 'student'

  const isAdmin = role === 'admin' || role === 'super_admin'
  const isFaculty = role === 'faculty' || role === 'hod' || role === 'mentor'

  return (
    <div className="page-container space-y-6">
      {/* Header Banner — Rich Midnight Indigo Gradient with GUARANTEED White Title Text in Light & Dark Mode */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)', border: '1px solid rgba(99,102,241,0.3)' }}>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-2xs font-semibold"
            style={{ background: 'rgba(99, 102, 241, 0.25)', color: '#A5B4FC', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
            <Sparkles size={12} /> AI Smart Attendance Engine Active
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#FFFFFF', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            {isAdmin
              ? 'Admin Portal — Faculty Attendance & Work Hours Control'
              : isFaculty
              ? 'Faculty Portal — Student Attendance & Class Roster'
              : 'Student Portal — AI Attendance Analytics & Goal Setter'}
          </h1>

          <p className="text-xs max-w-xl leading-relaxed" style={{ color: 'rgba(226, 232, 240, 0.95)' }}>
            {isAdmin
              ? 'Monitor faculty staff check-ins, work hour analytics, late arrival leaderboards, and approve leave applications.'
              : isFaculty
              ? 'Take class attendance via QR, Face Recognition, or OTP, mark bulk attendance, correct entries, and issue AI warnings.'
              : 'Track your subject-wise attendance %, set target goals, view ML forecast curves, and ask EDEN AI attendance queries.'}
          </p>
        </div>

        {/* Portal Badge Indicator */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs self-start sm:self-auto shrink-0 shadow"
          style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#C7D2FE', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
          {isAdmin ? <Settings size={16} /> : isFaculty ? <UserCheck size={16} /> : <User size={16} />}
          <span>{isAdmin ? 'Admin View' : isFaculty ? 'Faculty View' : 'Student View'}</span>
        </div>
      </motion.div>

      {/* Render Role-Specific Attendance Portal View */}
      {isAdmin && <AdminFacultyAttendanceView />}
      {isFaculty && !isAdmin && <FacultyStudentAttendanceView />}
      {!isAdmin && !isFaculty && <StudentAttendanceAnalyticsView />}
    </div>
  )
}
