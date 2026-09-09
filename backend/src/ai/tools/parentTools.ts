import { StudentAttendance } from '../../models/attendance/StudentAttendance.js'
import Assignment from '../../models/Assignment.js'
import User from '../../models/User.js'
import { logger } from '../../config/logger.js'

export const parentTools = [
  {
    name: 'get_linked_student_attendance',
    description: "Fetch the linked child's attendance records and percentage across all subjects.",
    requiresAuth: true,
    allowedRoles: ['parent'],
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async (_args: any, userContext: any) => {
      try {
        // Resolve linked student from parent user record
        const parentUser = await User.findById(userContext.userId)
          .select('linkedStudentId linkedStudentIds')
          .lean()

        const linkedId = (parentUser as any)?.linkedStudentId
          || ((parentUser as any)?.linkedStudentIds || [])[0]

        if (!linkedId) {
          return {
            hasData: false,
            message: 'No student account is linked to your parent profile. Please contact the admin to link your child\'s account.',
          }
        }

        // Fetch the linked student's profile
        const student = await User.findById(linkedId).select('name department semester rollNumber').lean()
        if (!student) {
          return { hasData: false, message: 'Linked student account not found.' }
        }

        // Fetch attendance records
        const records = await StudentAttendance.find({ studentId: linkedId }).lean()
        if (!records || records.length === 0) {
          return {
            hasData: true,
            studentName: (student as any).name,
            message: 'No attendance records found yet for your child.',
          }
        }

        const present = records.filter((r: any) => r.status === 'Present' || r.status === 'present').length
        const total = records.length
        const pct = Math.round((present / total) * 100)

        // Group by subject/course if available
        const bySubject: Record<string, { present: number; total: number }> = {}
        for (const r of records as any[]) {
          const subj = r.subject || r.courseId?.toString() || 'General'
          if (!bySubject[subj]) bySubject[subj] = { present: 0, total: 0 }
          bySubject[subj].total++
          if (r.status === 'Present' || r.status === 'present') bySubject[subj].present++
        }

        const subjects = Object.entries(bySubject).map(([name, s]) => ({
          subject: name,
          attendancePct: Math.round((s.present / s.total) * 100),
          present: s.present,
          total: s.total,
          isShortage: Math.round((s.present / s.total) * 100) < 75,
        }))

        return {
          hasData: true,
          studentName: (student as any).name,
          department: (student as any).department,
          rollNumber: (student as any).rollNumber,
          overallAttendance: pct,
          isShortage: pct < 75,
          classesPresent: present,
          totalClasses: total,
          subjects,
          message: pct < 75
            ? `⚠️ Attendance is below the required 75% threshold. Your child needs to attend more classes urgently.`
            : `✅ Attendance is satisfactory at ${pct}%.`,
        }
      } catch (err: any) {
        logger.error({ err: err.message }, '[parentTools] get_linked_student_attendance error')
        return { hasData: false, message: 'Could not fetch attendance data.' }
      }
    },
  },

  {
    name: 'get_linked_student_assignments',
    description: "Fetch the linked child's pending and completed assignments with submission status.",
    requiresAuth: true,
    allowedRoles: ['parent'],
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async (_args: any, userContext: any) => {
      try {
        const parentUser = await User.findById(userContext.userId).select('linkedStudentId linkedStudentIds').lean()
        const linkedId = (parentUser as any)?.linkedStudentId || ((parentUser as any)?.linkedStudentIds || [])[0]

        if (!linkedId) {
          return { hasData: false, message: 'No student account linked to your parent profile.' }
        }

        const student = await User.findById(linkedId).select('name department').lean()
        const assignments = await Assignment.find({
          department: (student as any)?.department,
        }).sort({ dueDate: 1 }).limit(10).lean()

        const withStatus = assignments.map((a: any) => {
          const submission = (a.submissions || []).find((s: any) =>
            s.studentId?.toString() === linkedId.toString()
          )
          return {
            title: a.title,
            dueDate: a.dueDate,
            maxMarks: a.maxMarks,
            submitted: !!submission,
            grade: submission?.grade ?? null,
            feedback: submission?.feedback ?? null,
            isOverdue: new Date(a.dueDate) < new Date() && !submission,
          }
        })

        const pending = withStatus.filter(a => !a.submitted)
        const submitted = withStatus.filter(a => a.submitted)

        return {
          hasData: true,
          studentName: (student as any)?.name,
          totalAssignments: withStatus.length,
          pendingCount: pending.length,
          submittedCount: submitted.length,
          pending,
          recent: submitted.slice(0, 5),
        }
      } catch (err: any) {
        logger.error({ err: err.message }, '[parentTools] get_linked_student_assignments error')
        return { hasData: false, message: 'Could not fetch assignment data.' }
      }
    },
  },
]
