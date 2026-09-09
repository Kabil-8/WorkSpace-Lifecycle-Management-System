import { StudentAttendance } from '../../models/attendance/StudentAttendance.js'
import { AcademicResult } from '../../models/AcademicResult.js'
import Assignment from '../../models/Assignment.js'
import User from '../../models/User.js'
import { DigitalTwinEngine } from '../DigitalTwinEngine.js'
import { logger } from '../../config/logger.js'

export const studentTools = [
  {
    name: 'get_my_profile',
    description: 'Fetch profile details (name, department, email, CGPA) for the authenticated user.',
    requiresAuth: true,
    execute: async (_args: any, userContext: any) => {
      const u = await User.findById(userContext.userId).select('name role department semester cgpa email').lean()
      if (!u) return { hasData: false, status: 'INSUFFICIENT_DATA', message: 'No student profile record found.' }
      return {
        hasData: true,
        userName: u.name,
        email: u.email,
        role: u.role,
        department: u.department || 'Computer Science',
        semester: u.semester || 6,
        cgpa: u.cgpa || null,
      }
    },
  },
  {
    name: 'get_my_transcript',
    description: 'Fetch student official academic transcript, semester SGPA history, and cumulative CGPA from MongoDB.',
    requiresAuth: true,
    execute: async (_args: any, userContext: any) => {
      try {
        const results = await AcademicResult.find({ studentId: userContext.userId }).sort({ semester: 1 }).lean()
        if (!results || results.length === 0) {
          return { hasData: false, status: 'INSUFFICIENT_DATA', message: 'No official academic semester grades recorded yet in MongoDB.' }
        }
        const lastSem = results[results.length - 1]
        return {
          hasData: true,
          cgpa: lastSem.cgpa,
          latestSGPA: lastSem.sgpa,
          totalCreditsEarned: results.reduce((sum, r) => sum + r.totalCreditsEarned, 0),
          semestersCount: results.length,
          courseGrades: lastSem.courseGrades,
        }
      } catch (err: any) {
        return { hasData: false, status: 'INSUFFICIENT_DATA', message: 'No transcript records available.' }
      }
    },
  },
  {
    name: 'get_my_attendance',
    description: 'Fetch student attendance records from MongoDB for the authenticated user.',
    requiresAuth: true,
    execute: async (_args: any, userContext: any) => {
      try {
        const records = await StudentAttendance.find({ studentId: userContext.userId }).lean()
        if (!records || records.length === 0) {
          return { hasData: false, status: 'INSUFFICIENT_DATA', message: 'No attendance data is available yet.' }
        }
        const total = records.length
        const present = records.filter((r: any) => r.status === 'Present' || r.status === 'present').length
        const pct = Math.round((present / total) * 100)
        return {
          hasData: true,
          totalClasses: total,
          attendedClasses: present,
          attendancePct: pct,
          isShortage: pct < 75,
          records: records.slice(0, 10),
        }
      } catch (err: any) {
        logger.error({ err: err.message }, '[studentTools] Attendance retrieval error')
        return { hasData: false, status: 'INSUFFICIENT_DATA', message: 'No attendance data is available yet.' }
      }
    },
  },
  {
    name: 'get_my_assignments',
    description: 'Fetch active/pending assignments from MongoDB for the authenticated user.',
    requiresAuth: true,
    execute: async (_args: any, userContext: any) => {
      try {
        const assignments = await Assignment.find({
          $or: [
            { student: userContext.userId },
            { department: userContext.department || 'Computer Science' },
          ],
        }).limit(10).lean()

        if (!assignments || assignments.length === 0) {
          return { hasData: false, status: 'INSUFFICIENT_DATA', message: 'No pending assignment data is available yet.' }
        }
        return {
          hasData: true,
          count: assignments.length,
          assignments: assignments.map((a: any) => ({ title: a.title, dueDate: a.dueDate, courseName: a.courseName || a.department })),
        }
      } catch (err: any) {
        return { hasData: false, status: 'INSUFFICIENT_DATA', message: 'No assignment data is available yet.' }
      }
    },
  },
  {
    name: 'get_my_digital_twin',
    description: 'Fetch real-time Neural Digital Twin breakdown, learning pace, coding proficiency, and placement metrics.',
    requiresAuth: true,
    execute: async (_args: any, userContext: any) => {
      try {
        const twin = await DigitalTwinEngine.getOrComputeTwin(userContext.userId)
        if (!twin) return { hasData: false, status: 'INSUFFICIENT_DATA', message: 'I don’t have enough learning activity to calculate this yet.' }
        return {
          hasData: true,
          twin,
        }
      } catch {
        return { hasData: false, status: 'INSUFFICIENT_DATA', message: 'I don’t have enough learning activity to calculate this yet.' }
      }
    },
  },
  {
    name: 'get_my_placement_readiness',
    description: 'Fetch placement readiness score and career recommendations for the authenticated user.',
    requiresAuth: true,
    execute: async (_args: any, userContext: any) => {
      try {
        const twin = await DigitalTwinEngine.getOrComputeTwin(userContext.userId)
        if (!twin || twin.placementProbabilityPct === undefined) {
          return { hasData: false, status: 'INSUFFICIENT_DATA', message: 'I don’t have enough learning activity to calculate placement readiness yet.' }
        }
        return {
          hasData: true,
          placementLikelihoodPct: twin.placementProbabilityPct,
          estimatedSalaryRange: twin.estimatedSalaryRange || null,
          skillGaps: twin.skillGaps || [],
        }
      } catch {
        return { hasData: false, status: 'INSUFFICIENT_DATA', message: 'I don’t have enough learning activity to calculate placement readiness yet.' }
      }
    },
  },
  {
    name: 'get_my_proactive_intervention',
    description: 'Fetch the latest closed-loop AI proactive intervention plan, tracking Learning DNA velocity, prerequisite gaps via CS Knowledge Graph, and scheduled SM-2 active recall reviews.',
    requiresAuth: true,
    execute: async (_args: any, userContext: any) => {
      try {
        const { ProactiveInterventionEngine } = await import('../ProactiveInterventionEngine.js')
        const plan = await ProactiveInterventionEngine.analyzeAndIntervene(userContext.userId)
        return {
          hasData: true,
          plan,
        }
      } catch (err: any) {
        return { hasData: false, status: 'INSUFFICIENT_DATA', message: 'Unable to compute proactive intervention plan.' }
      }
    },
  },
]
