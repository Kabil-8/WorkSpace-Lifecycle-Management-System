import { Request, Response } from 'express'
import { StudentAttendance } from '../models/attendance/StudentAttendance.js'
import { AttendanceSession } from '../models/attendance/AttendanceSession.js'
import { FacultyAttendance } from '../models/attendance/FacultyAttendance.js'
import { LeaveRequest } from '../models/attendance/LeaveRequest.js'
import User from '../models/User.js'
import { eventBus, Events } from '../events/eventBus.js'

export class AttendanceController {
  // ── Faculty -> Student Attendance APIs ────────────────────────────────
  static async startSession(req: Request, res: Response) {
    try {
      const { subject, department } = req.body
      const user = (req as any).user
      const qrToken = `QR_${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

      const session = await AttendanceSession.create({
        subject: subject || 'CS401: Algorithms & Data Structures',
        department: department || user?.department || 'Computer Science & Engineering',
        facultyId: user?._id,
        facultyName: user?.name,
        qrToken,
        otpCode,
      })

      return res.status(201).json({ success: true, data: session })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async markAttendance(req: Request, res: Response) {
    try {
      const { studentId, studentName, rollNo, subject, status, method, remarks } = req.body
      const user = (req as any).user
      const targetUserId = studentId || user?._id

      const log = await StudentAttendance.create({
        studentId: targetUserId,
        studentName: studentName || user?.name || 'Student Candidate',
        rollNo: rollNo || user?.rollNumber || 'N/A',
        subject: subject || 'Data Structures & Algorithms',
        status: status || 'Present',
        method: method || 'Manual',
        remarks: remarks || '',
        date: new Date(),
      })

      // Calculate new overall attendance % for event emission
      const totalLogs = await StudentAttendance.countDocuments({ studentId: targetUserId })
      const presentLogs = await StudentAttendance.countDocuments({ studentId: targetUserId, status: { $in: ['Present', 'present'] } })
      const attendancePct = totalLogs > 0 ? Math.round((presentLogs / totalLogs) * 100) : 100

      // Emit event for Digital Twin and notifications
      eventBus.emit(Events.ATTENDANCE_MARKED, {
        userId: targetUserId.toString(),
        studentId: targetUserId,
        subject: log.subject,
        status: log.status,
        attendancePct,
      })

      return res.status(201).json({ success: true, data: log })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async bulkMarkAttendance(req: Request, res: Response) {
    try {
      const { subject, attendanceList } = req.body
      const targetSubject = subject || 'Data Structures & Algorithms'

      const logs = await Promise.all(
        (attendanceList || []).map(async (item: any) => {
          const sId = item.studentId || item.id
          const log = await StudentAttendance.create({
            studentId: sId,
            studentName: item.studentName,
            rollNo: item.rollNo,
            subject: targetSubject,
            status: item.status || 'Present',
            method: 'Manual Grid',
            remarks: item.remarks || 'Bulk marked by faculty',
            date: new Date(),
          })

          // Calculate percentage for event notification
          const total = await StudentAttendance.countDocuments({ studentId: sId })
          const present = await StudentAttendance.countDocuments({ studentId: sId, status: { $in: ['Present', 'present'] } })
          const pct = total > 0 ? Math.round((present / total) * 100) : 100

          eventBus.emit(Events.ATTENDANCE_MARKED, {
            userId: sId.toString(),
            studentId: sId,
            subject: targetSubject,
            status: item.status || 'Present',
            attendancePct: pct,
          })

          return log
        })
      )

      return res.json({ success: true, count: logs.length, message: `Bulk attendance saved for ${logs.length} students.` })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async getClassSheet(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const filter: any = { role: 'student', isActive: true }
      if (user?.department) filter.department = user.department

      const students = await User.find(filter)
        .select('name email role department rollNumber avatarUrl')
        .limit(30)
        .lean()

      const classList = await Promise.all(students.map(async (s, idx) => {
        // Fetch latest attendance log if exists
        const latestLog: any = await StudentAttendance.findOne({ studentId: s._id }).sort({ date: -1 }).lean()
        return {
          id: s._id.toString(),
          rollNo: (s as any).rollNumber || `CS2021${String(idx + 1).padStart(3, '0')}`,
          studentName: s.name,
          photo: (s as any).avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
          status: latestLog?.status || 'Present',
          remarks: latestLog?.remarks || 'On time',
        }
      }))

      return res.json({ success: true, data: classList })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  // ── Admin -> Faculty Attendance APIs ──────────────────────────────────
  static async getFacultyDailyLogs(req: Request, res: Response) {
    try {
      const logs = await FacultyAttendance.find().lean()
      if (logs.length > 0) {
        return res.json({
          success: true,
          data: logs.map(l => ({
            id: l._id.toString(),
            facultyName: l.facultyName,
            department: l.department,
            checkInTime: l.checkInTime,
            checkOutTime: l.checkOutTime || '17:00',
            totalWorkingHours: l.totalWorkingHours,
            status: l.status,
            lateCount: l.status === 'Late' ? 1 : 0,
            punctualityScore: l.punctualityScore,
          })),
          departmentComparison: []
        })
      }

      const facultyMembers = await User.find({ role: 'faculty', isActive: true }).select('name department employeeId').lean()
      const dynamicLogs = facultyMembers.map((f) => ({
        id: f._id.toString(),
        facultyName: f.name,
        department: f.department || 'Computer Science & Engineering',
        checkInTime: '08:45 AM',
        checkOutTime: '05:15 PM',
        totalWorkingHours: 8.5,
        status: 'Present',
        lateCount: 0,
        punctualityScore: 100,
      }))

      const deptAgg = await StudentAttendance.aggregate([
        {
          $group: {
            _id: '$department',
            total: { $sum: 1 },
            present: { $sum: { $cond: [{ $in: ['$status', ['Present', 'present']] }, 1, 0] } }
          }
        },
        {
          $project: {
            dept: { $ifNull: ['$_id', 'CSE'] },
            attendance: {
              $cond: [
                { $gt: ['$total', 0] },
                { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] },
                0
              ]
            }
          }
        }
      ])

      return res.json({
        success: true,
        data: dynamicLogs,
        departmentComparison: deptAgg
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  // ── Leave Request APIs ────────────────────────────────────────────────
  static async getLeaveRequests(req: Request, res: Response) {
    try {
      const user = (req as any).user
      let filter: any = {}
      if (user?.role === 'student') filter.applicantId = user._id
      else if (user?.role === 'faculty') filter.$or = [{ applicantId: user._id }, { role: 'student' }]

      const leaves = await LeaveRequest.find(filter).sort({ createdAt: -1 }).lean()
      return res.json({ success: true, data: leaves })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async applyLeave(req: Request, res: Response) {
    try {
      const { applicantName, role, leaveType, startDate, endDate, reason } = req.body
      const user = (req as any).user

      const newLeave = await LeaveRequest.create({
        applicantId: user?._id,
        applicantName: applicantName || user?.name || 'Student Candidate',
        role: role || user?.role || 'student',
        leaveType: leaveType || 'Medical',
        startDate: startDate || new Date(),
        endDate: endDate || new Date(Date.now() + 86400000),
        reason: reason || 'Medical checkup and rest',
        status: 'Pending',
      })

      eventBus.emit(Events.LEAVE_APPLIED, {
        userId: user?._id?.toString(),
        leaveId: newLeave._id,
        leaveType: newLeave.leaveType,
      })

      return res.status(201).json({ success: true, data: newLeave, message: 'Leave request submitted successfully for review.' })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async reviewLeave(req: Request, res: Response) {
    try {
      const id = req.params.id || req.params.leaveId
      const { status, comments } = req.body
      const user = (req as any).user

      const updated = await LeaveRequest.findByIdAndUpdate(
        id,
        { status, comments, reviewedBy: user?.name || 'Faculty Admin' },
        { new: true }
      )

      return res.json({ success: true, data: updated, message: `Leave request ${status.toLowerCase()}.` })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  // ── Student Attendance Analytics APIs ─────────────────────────────────
  static async getStudentAnalytics(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const userId = user?._id?.toString()

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' })
      }

      // Query StudentAttendance records from MongoDB — ZERO synthetic auto-generation
      const logs = await StudentAttendance.find({ studentId: userId }).lean()

      if (logs.length === 0) {
        return res.json({
          success: true,
          data: {
            hasData: false,
            overallPercentage: 0,
            totalClasses: 0,
            attendedClasses: 0,
            lateCount: 0,
            leaveCount: 0,
            targetGoal: 90,
            requiredConsecutiveClasses: 0,
            subjects: [],
            forecastCurve: [],
            insights: ['No attendance records logged yet for your profile in MongoDB.'],
          }
        })
      }

      const totalClasses = logs.length
      const attendedClasses = logs.filter((l: any) => l.status === 'Present' || l.status === 'present').length
      const lateCount = logs.filter((l: any) => l.status === 'Late').length
      const leaveCount = logs.filter((l: any) => l.status === 'Medical Leave' || l.status === 'Excused').length

      const overallPercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0

      // Subject-wise aggregation
      const subjectMap: Record<string, { present: number; total: number }> = {}
      logs.forEach((l: any) => {
        const sub = l.subject || 'General'
        if (!subjectMap[sub]) subjectMap[sub] = { present: 0, total: 0 }
        subjectMap[sub].total += 1
        if (l.status === 'Present' || l.status === 'present') subjectMap[sub].present += 1
      })

      const subjects = Object.entries(subjectMap).map(([name, { present, total }]) => {
        const percentage = Math.round((present / total) * 100)
        const reqClassesTo75 = percentage < 75 ? Math.ceil((0.75 * total - present) / 0.25) : 0
        return {
          name,
          present,
          total,
          percentage,
          reqClassesTo75: Math.max(0, reqClassesTo75),
          critical: percentage < 75,
        }
      })

      const requiredConsecutiveClasses = overallPercentage < 90
        ? Math.ceil((0.9 * totalClasses - attendedClasses) / 0.1)
        : 0

      return res.json({
        success: true,
        data: {
          hasData: true,
          overallPercentage,
          totalClasses,
          attendedClasses,
          lateCount,
          leaveCount,
          targetGoal: 90,
          requiredConsecutiveClasses: Math.max(0, requiredConsecutiveClasses),
          subjects,
          forecastCurve: [
            { month: 'Sem Start', percent: 100 },
            { month: 'Current', percent: overallPercentage },
            { month: 'ML Target', percent: 90 },
          ],
          insights: [
            overallPercentage < 75
              ? `⚠️ Critical Warning: Overall attendance is ${overallPercentage}% (<75%). You need ${Math.max(0, Math.ceil((0.75 * totalClasses - attendedClasses) / 0.25))} more classes to reach 75%.`
              : `✅ Good standing: Overall attendance is ${overallPercentage}%. Maintain above 75% for semester end exams.`,
            `Total MongoDB attendance records: ${totalClasses} sessions (${attendedClasses} present, ${lateCount} late, ${leaveCount} excused).`,
          ]
        }
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  // ── EDEN Attendance Natural Language Query Handler ─────────────────────
  static async queryAttendance(req: Request, res: Response) {
    try {
      const { query, presentClasses, totalClasses, targetGoal = 90 } = req.body
      const q = (query || '').toLowerCase()

      const p = presentClasses || 0
      const t = totalClasses || 0
      const currentPct = t > 0 ? Math.round((p / t) * 100) : 0

      let answer = ''

      if (t === 0) {
        answer = `🎯 You currently have 0 logged classes in MongoDB. Attend upcoming sessions to track your ${targetGoal}% goal.`
      } else if (q.includes('miss') || q.includes('tomorrow') || q.includes('bunk')) {
        const newPct = Math.round((p / (t + 1)) * 100)
        answer = `⚠️ If you miss tomorrow's class, your attendance drops from ${currentPct}% to ${newPct}%. ${newPct < 75 ? 'This puts you in the critical risk zone (<75%)!' : 'You remain above the 75% threshold.'}`
      } else if (q.includes('target') || q.includes('goal') || q.includes('reach')) {
        const target = targetGoal / 100
        const needed = Math.ceil((target * t - p) / (1 - target))
        answer = `🎯 To reach your target goal of ${targetGoal}%, you must attend the next ${Math.max(0, needed)} consecutive classes without any absences.`
      } else {
        const needed75 = currentPct < 75 ? Math.ceil((0.75 * t - p) / 0.25) : 0
        answer = `📊 Status: ${currentPct}% overall (${p}/${t} classes). ${currentPct < 75 ? `You need ${needed75} consecutive classes to reach 75%.` : 'Your attendance meets institution eligibility rules.'}`
      }

      return res.json({ success: true, answer })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }
}
