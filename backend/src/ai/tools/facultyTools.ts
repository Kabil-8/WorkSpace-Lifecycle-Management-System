import Assignment from '../../models/Assignment.js'
import { CollegeCourse } from '../../models/CollegeCourse.js'
import { StudentAttendance } from '../../models/attendance/StudentAttendance.js'
import User from '../../models/User.js'
import { logger } from '../../config/logger.js'

export const facultyTools = [
  {
    name: 'get_my_courses_faculty',
    description: 'Fetch all courses assigned to this faculty member as instructor.',
    requiresAuth: true,
    allowedRoles: ['faculty', 'hod', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async (_args: any, userContext: any) => {
      try {
        const courses = await CollegeCourse.find({ instructorId: userContext.userId })
          .select('courseCode title department semester credits status')
          .lean()
        if (!courses || courses.length === 0) {
          return { hasData: false, message: 'No courses assigned to this faculty yet.' }
        }
        return {
          hasData: true,
          count: courses.length,
          courses: courses.map(c => ({
            code: c.courseCode,
            title: c.title,
            department: c.department,
            semester: c.semester,
            credits: c.credits,
            status: c.status,
          })),
        }
      } catch (err: any) {
        logger.error({ err: err.message }, '[facultyTools] get_my_courses_faculty error')
        return { hasData: false, message: 'Could not fetch courses.' }
      }
    },
  },

  {
    name: 'get_pending_submissions',
    description: 'Get all ungraded assignment submissions for assignments created by this faculty.',
    requiresAuth: true,
    allowedRoles: ['faculty', 'hod', 'admin'],
    parameters: {
      type: 'object',
      properties: {
        assignmentId: { type: 'string', description: 'Optional: specific assignment ID to check' },
      },
    },
    execute: async (args: any, userContext: any) => {
      try {
        const filter: any = { instructorId: userContext.userId }
        if (args?.assignmentId) filter._id = args.assignmentId

        const assignments = await Assignment.find(filter).lean()
        const pendingList: any[] = []

        for (const a of assignments) {
          const ungraded = (a.submissions || []).filter((s: any) => s.grade === undefined || s.grade === null)
          if (ungraded.length > 0) {
            pendingList.push({
              assignmentTitle: a.title,
              assignmentId: a._id,
              dueDate: a.dueDate,
              totalSubmissions: a.submissions.length,
              ungradedCount: ungraded.length,
              ungradedStudents: ungraded.map((s: any) => ({ name: s.studentName, submittedAt: s.submittedAt })),
            })
          }
        }

        return {
          hasData: pendingList.length > 0,
          totalPending: pendingList.reduce((acc, a) => acc + a.ungradedCount, 0),
          assignments: pendingList,
        }
      } catch (err: any) {
        logger.error({ err: err.message }, '[facultyTools] get_pending_submissions error')
        return { hasData: false, message: 'Could not fetch pending submissions.' }
      }
    },
  },

  {
    name: 'get_at_risk_students',
    description: 'Identify students with attendance below 75% or no assignment submissions in the department.',
    requiresAuth: true,
    allowedRoles: ['faculty', 'hod', 'admin'],
    parameters: {
      type: 'object',
      properties: {
        department: { type: 'string', description: 'Department to filter (optional, defaults to faculty department)' },
        threshold: { type: 'number', description: 'Attendance threshold percentage (default: 75)' },
      },
    },
    execute: async (args: any, userContext: any) => {
      try {
        const dept = args?.department || userContext.department || 'Computer Science'
        const threshold = args?.threshold || 75

        // Get all students in the department
        const students = await User.find({ role: 'student', department: dept, isActive: true })
          .select('_id name rollNumber semester cgpa')
          .lean()

        const atRisk: any[] = []

        for (const student of students.slice(0, 30)) { // cap at 30 for performance
          const records = await StudentAttendance.find({ studentId: student._id }).lean()
          if (records.length === 0) continue

          const present = records.filter((r: any) => r.status === 'Present' || r.status === 'present').length
          const pct = Math.round((present / records.length) * 100)

          if (pct < threshold) {
            atRisk.push({
              studentId: student._id,
              name: student.name,
              rollNumber: student.rollNumber,
              semester: student.semester,
              attendancePct: pct,
              classesNeeded: Math.ceil((threshold * records.length - present * 100) / (100 - threshold)),
            })
          }
        }

        atRisk.sort((a, b) => a.attendancePct - b.attendancePct) // most at-risk first

        return {
          hasData: atRisk.length > 0,
          department: dept,
          threshold,
          atRiskCount: atRisk.length,
          students: atRisk,
        }
      } catch (err: any) {
        logger.error({ err: err.message }, '[facultyTools] get_at_risk_students error')
        return { hasData: false, message: 'Could not compute at-risk students.' }
      }
    },
  },

  {
    name: 'get_class_attendance_report',
    description: 'Get attendance statistics for a specific course taught by this faculty.',
    requiresAuth: true,
    allowedRoles: ['faculty', 'hod', 'admin'],
    parameters: {
      type: 'object',
      properties: {
        courseId: { type: 'string', description: 'Course ID to get attendance for' },
      },
    },
    execute: async (args: any, userContext: any) => {
      try {
        const filter: any = {}
        if (args?.courseId) filter.courseId = args.courseId
        if (!args?.courseId && userContext.department) filter.department = userContext.department

        const records = await StudentAttendance.find(filter).lean()
        if (records.length === 0) {
          return { hasData: false, message: 'No attendance records found.' }
        }

        // Aggregate by student
        const byStudent: Record<string, { present: number; total: number; name?: string }> = {}
        for (const r of records as any[]) {
          const sid = r.studentId?.toString() || 'unknown'
          if (!byStudent[sid]) byStudent[sid] = { present: 0, total: 0, name: r.studentName }
          byStudent[sid].total++
          if (r.status === 'Present' || r.status === 'present') byStudent[sid].present++
        }

        const stats = Object.entries(byStudent).map(([id, s]) => ({
          studentId: id,
          name: s.name,
          attendancePct: Math.round((s.present / s.total) * 100),
          present: s.present,
          total: s.total,
        }))

        const avgAttendance = stats.reduce((acc, s) => acc + s.attendancePct, 0) / stats.length
        const below75 = stats.filter(s => s.attendancePct < 75).length

        return {
          hasData: true,
          totalStudents: stats.length,
          averageAttendance: Math.round(avgAttendance),
          below75Count: below75,
          students: stats.sort((a, b) => a.attendancePct - b.attendancePct),
        }
      } catch (err: any) {
        logger.error({ err: err.message }, '[facultyTools] get_class_attendance_report error')
        return { hasData: false, message: 'Could not get attendance report.' }
      }
    },
  },
]
