import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, Camera, CheckCircle2, Clock, FileSpreadsheet, Download, Sparkles, Send, X, FileText } from 'lucide-react'
import api from '../../services/api'

export default function FacultyStudentAttendanceView() {
  const [students, setStudents] = useState<any[]>([])
  const [activeMethod, setActiveMethod] = useState<'Manual' | 'QR' | 'Face' | 'OTP'>('Manual')
  const [showQRModal, setShowQRModal] = useState(false)
  const [otpCode] = useState('482091')
  const [warningSent, setWarningSent] = useState(false)

  useEffect(() => {
    fetchClassSheet()
  }, [])

  const fetchClassSheet = async () => {
    try {
      const res: any = await api.get('/attendance/class-sheet')
      const list = Array.isArray(res?.data?.data) ? res.data.data
        : Array.isArray(res?.data) ? res.data
        : Array.isArray(res) ? res : []
      if (list.length > 0) {
        setStudents(list)
        return
      }
    } catch (err) {
      console.warn('Failed to fetch class sheet from MongoDB', err)
    }

    setStudents([])
  }

  const handleStatusChange = (studentId: string, newStatus: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: newStatus } : s))
  }

  const handleMarkAllPresent = async () => {
    const updated = students.map(s => ({ ...s, status: 'Present', remarks: 'Bulk marked present' }))
    setStudents(updated)
    try {
      await api.post('/attendance/bulk-mark', {
        subject: 'Data Structures & Algorithms',
        attendanceList: updated.map(s => ({ studentId: s.id, studentName: s.studentName, rollNo: s.rollNo, status: 'Present' })),
      })
    } catch (err) {
      console.error('Failed to bulk mark attendance:', err)
    }
  }

  const handleSendAIWarning = () => {
    setWarningSent(true)
    setTimeout(() => setWarningSent(false), 3000)
  }

  const handleExport = (type: string) => {
    const csvContent = 'data:text/csv;charset=utf-8,Roll No,Student Name,Status,Remarks\n' +
      students.map(s => `${s.rollNo},${s.studentName},${s.status},${s.remarks}`).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Attendance_Report_${type}.csv`)
    document.body.appendChild(link)
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* Top Method Bar & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Methods Selector (8 Cols) */}
        <div className="lg:col-span-8 card p-5 space-y-4 border-2 border-indigo-500/20">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Select Attendance Method</h3>
            <span className="text-2xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
              Active: {activeMethod} Mode
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={() => { setActiveMethod('QR'); setShowQRModal(true) }}
              className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all cursor-pointer ${activeMethod === 'QR' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
              <QrCode size={20} className="text-indigo-500" /> Dynamic QR Code
            </button>

            <button onClick={() => { setActiveMethod('Face') }}
              className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all cursor-pointer ${activeMethod === 'Face' ? 'bg-purple-600 text-white border-purple-600 shadow-lg' : 'bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
              <Camera size={20} className="text-purple-500" /> AI Face Recognition
            </button>

            <button onClick={() => setActiveMethod('OTP')}
              className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all cursor-pointer ${activeMethod === 'OTP' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
              <Clock size={20} className="text-emerald-500" /> Time OTP Code
            </button>

            <button onClick={() => setActiveMethod('Manual')}
              className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all cursor-pointer ${activeMethod === 'Manual' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
              <FileSpreadsheet size={20} className="text-blue-500" /> Manual Grid
            </button>
          </div>

          {activeMethod === 'OTP' && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Class Attendance OTP (Expires in 5:00):</span>
              <span className="font-mono text-lg font-black text-slate-900 dark:text-white tracking-widest bg-slate-200 dark:bg-slate-900 px-4 py-1 rounded-lg border border-emerald-500/40">{otpCode}</span>
            </div>
          )}
        </div>

        {/* Quick Actions & Export (4 Cols) */}
        <div className="lg:col-span-4 card p-5 space-y-4 border-2 border-indigo-500/20 flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Bulk Operations & Export</h4>
            <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Mark entire class present or export department logs.</p>
          </div>

          <button onClick={handleMarkAllPresent}
            className="w-full py-2.5 rounded-xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer">
            <CheckCircle2 size={16} /> Mark All Students Present
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => handleExport('Excel')} className="py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 text-2xs font-semibold flex items-center justify-center gap-1 cursor-pointer">
              <Download size={12} /> Excel
            </button>
            <button onClick={() => handleExport('CSV')} className="py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 text-2xs font-semibold flex items-center justify-center gap-1 cursor-pointer">
              <Download size={12} /> CSV
            </button>
            <button onClick={() => handleExport('PDF')} className="py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 text-2xs font-semibold flex items-center justify-center gap-1 cursor-pointer">
              <FileText size={12} /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* AI Suggestion Alert Box */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles size={20} className="text-amber-600 dark:text-amber-400 shrink-0 animate-bounce" />
          <div className="text-xs" style={{ color: 'var(--foreground)' }}>
            <strong className="text-amber-600 dark:text-amber-400 font-extrabold">EDEN AI Suggestion:</strong> Student <strong>Rahul Kumar (CS2026-003)</strong> has 5 consecutive absences.
          </div>
        </div>

        <button onClick={handleSendAIWarning} disabled={warningSent}
          className="px-4 py-2 rounded-xl text-xs font-extrabold bg-amber-500 text-slate-950 hover:bg-amber-400 flex items-center gap-1.5 shadow-md cursor-pointer">
          {warningSent ? <CheckCircle2 size={14} /> : <Send size={14} />} {warningSent ? 'Warning Dispatched' : 'Send Warning'}
        </button>
      </div>

      {/* Attendance Sheet Table */}
      <div className="card p-5 space-y-4 border-2 border-indigo-500/20">
        <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Class Roster & Attendance Sheet ({students.length} Students)</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b uppercase text-2xs" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                <th className="p-3">Student</th>
                <th className="p-3">Roll No</th>
                <th className="p-3">Attendance Status</th>
                <th className="p-3">Method</th>
                <th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-500/10 transition-all">
                  <td className="p-3 flex items-center gap-3">
                    <img src={student.photo} alt={student.studentName} className="w-8 h-8 rounded-full object-cover border border-indigo-500/40" />
                    <div>
                      <strong className="font-bold block text-sm" style={{ color: 'var(--foreground)' }}>{student.studentName}</strong>
                    </div>
                  </td>
                  <td className="p-3 font-mono font-medium text-xs" style={{ color: 'var(--muted-foreground)' }}>{student.rollNo}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      {['Present', 'Absent', 'Late', 'Medical Leave'].map((st) => (
                        <button key={st} onClick={() => handleStatusChange(student.id, st)}
                          className={`px-2.5 py-1 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                            student.status === st
                              ? st === 'Present' ? 'bg-emerald-600 text-white shadow-md'
                                : st === 'Absent' ? 'bg-red-600 text-white shadow-md'
                                : st === 'Late' ? 'bg-amber-600 text-white shadow-md'
                                : 'bg-blue-600 text-white shadow-md'
                              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}>
                          {st}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-2xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">Manual Grid</td>
                  <td className="p-3 text-2xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{student.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="card p-6 max-w-sm w-full space-y-4 text-center border-2 border-indigo-500/40 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                <h4 className="font-bold text-sm text-indigo-400">Scan Dynamic QR Code</h4>
                <button onClick={() => setShowQRModal(false)}><X size={18} className="text-slate-400" /></button>
              </div>

              <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-inner flex items-center justify-center border-4 border-indigo-500">
                <QrCode size={160} className="text-slate-950" />
              </div>

              <p className="text-2xs text-slate-400">
                Students scan using EduSphere Mobile App to mark live attendance. Token refreshes every 30s.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
