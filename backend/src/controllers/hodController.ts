import { Response } from 'express'
import User from '../models/User.js'
import { CollegeCourse } from '../models/CollegeCourse.js'
import { StudentAttendance } from '../models/attendance/StudentAttendance.js'
import Assignment from '../models/Assignment.js'
import { logger } from '../config/logger.js'

export class HODController {
  /**
   * Department overview: students, faculty, courses, key metrics
   */
  static async getDepartmentOverview(req: any, res: Response) {
    try {
      const dept = req.user.department || req.query.department
      if (!dept) return res.status(400).json({ success: false, message: 'Department is required.' })

      const [students, faculty, courses] = await Promise.all([
        User.countDocuments({ role: 'student', department: dept, isActive: true }),
        User.countDocuments({ role: 'faculty', department: dept, isActive: true }),
        CollegeCourse.countDocuments({ department: dept, status: 'active' }),
      ])

      return res.json({
        success: true,
        data: {
          department: dept,
          totalStudents: students,
          totalFaculty: faculty,
          activeCourses: courses,
        },
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  /**
   * Attendance overview across the department
   */
  static async getDepartmentAttendanceStats(req: any, res: Response) {
    try {
      const dept = req.user.department || req.query.department

      const students = await User.find({ role: 'student', department: dept, isActive: true })
        .select('_id name rollNumber semester')
        .limit(100)
        .lean()

      const stats: any[] = []
      for (const student of students) {
        const records = await StudentAttendance.find({ studentId: student._id }).lean()
        if (records.length === 0) continue
        const present = records.filter((r: any) => r.status === 'Present' || r.status === 'present').length
        const pct = Math.round((present / records.length) * 100)
        stats.push({ name: (student as any).name, rollNumber: (student as any).rollNumber, semester: (student as any).semester, attendancePct: pct, isAtRisk: pct < 75 })
      }

      const avgAttendance = stats.length > 0 ? Math.round(stats.reduce((acc, s) => acc + s.attendancePct, 0) / stats.length) : 0
      const atRiskCount = stats.filter(s => s.isAtRisk).length

      return res.json({
        success: true,
        data: {
          department: dept,
          totalStudents: stats.length,
          avgAttendance,
          atRiskCount,
          atRiskStudents: stats.filter(s => s.isAtRisk).sort((a, b) => a.attendancePct - b.attendancePct),
        },
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  /**
   * Faculty workload: how many courses each faculty teaches
   */
  static async getFacultyWorkload(req: any, res: Response) {
    try {
      const dept = req.user.department || req.query.department

      const faculty = await User.find({ role: 'faculty', department: dept, isActive: true })
        .select('_id name employeeId')
        .lean()

      const workloads = await Promise.all(faculty.map(async (f) => {
        const courseCount = await CollegeCourse.countDocuments({ instructorId: f._id, status: 'active' })
        const pendingGrades = await Assignment.countDocuments({ instructorId: f._id, status: 'submitted' })
        return {
          facultyId: f._id,
          name: (f as any).name,
          employeeId: (f as any).employeeId,
          activeCourses: courseCount,
          pendingGrades,
        }
      }))

      return res.json({
        success: true,
        data: workloads.sort((a, b) => b.activeCourses - a.activeCourses),
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  /**
   * Department-wide CGPA and grade distribution
   */
  static async getDepartmentPerformanceStats(req: any, res: Response) {
    try {
      const dept = req.user.department || req.query.department

      const students = await User.find({ role: 'student', department: dept, isActive: true })
        .select('cgpa semester')
        .lean()

      const cgpas = students.map((s: any) => s.cgpa || 0).filter(c => c > 0)
      const avgCGPA = cgpas.length > 0 ? (cgpas.reduce((a, b) => a + b, 0) / cgpas.length).toFixed(2) : '0.00'

      // Grade bands
      const bands = {
        'O (≥9.0)': cgpas.filter(c => c >= 9.0).length,
        'A+ (8.0-8.9)': cgpas.filter(c => c >= 8.0 && c < 9.0).length,
        'A (7.0-7.9)': cgpas.filter(c => c >= 7.0 && c < 8.0).length,
        'B+ (6.0-6.9)': cgpas.filter(c => c >= 6.0 && c < 7.0).length,
        'B (5.0-5.9)': cgpas.filter(c => c >= 5.0 && c < 6.0).length,
        'Below 5': cgpas.filter(c => c < 5.0).length,
      }

      const placementEligible = cgpas.filter(c => c >= 6.5).length

      return res.json({
        success: true,
        data: {
          department: dept,
          totalStudents: students.length,
          averageCGPA: parseFloat(avgCGPA),
          gradeBands: bands,
          placementEligible,
          placementEligibilityPct: students.length > 0 ? Math.round((placementEligible / students.length) * 100) : 0,
        },
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }
}
