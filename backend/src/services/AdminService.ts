import User from '../models/User.js'
import { StudentAttendance } from '../models/attendance/StudentAttendance.js'
import AuditLog from '../models/AuditLog.js'
import Department from '../models/Department.js'
import Notification from '../models/Notification.js'
import mongoose from 'mongoose'
import { logger } from '../config/logger.js'

export class AdminService {
  static async getContextData(userId: string) {
    try {
      const user = await User.findById(userId).lean()
      if (!user) {
        return {
          user: { id: userId, name: 'Administrator', role: 'admin' },
          error: 'Admin user profile not found in database',
        }
      }

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const [
        totalUsers,
        activeStudents,
        activeFaculty,
        todayAttendance,
        departments,
        recentAuditLogs,
        recentAlerts,
        notifications,
      ] = await Promise.all([
        User.countDocuments({ isActive: { $ne: false } }).catch(() => 0),
        User.countDocuments({ role: 'student', isActive: { $ne: false } }).catch(() => 0),
        User.countDocuments({ role: { $in: ['faculty', 'teacher'] }, isActive: { $ne: false } }).catch(() => 0),
        StudentAttendance.countDocuments({ createdAt: { $gte: todayStart } }).catch(() => 0),
        Department.find({ isActive: { $ne: false } }).select('name code studentCount').limit(10).lean().catch(() => []),
        AuditLog.find({ severity: { $in: ['warning', 'critical'] } })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
          .catch(() => []),
        AuditLog.find({ severity: 'critical' })
          .sort({ createdAt: -1 })
          .limit(3)
          .lean()
          .catch(() => []),
        Notification.find({ userId: new mongoose.Types.ObjectId(userId), isRead: false })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
          .catch(() => []),
      ])

      return {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department || 'Central Administration',
        },
        platformStats: {
          totalUsers,
          activeStudents,
          activeFaculty,
          todayAttendanceRecords: todayAttendance,
          totalDepartments: departments.length,
          systemStatus: 'Operational',
        },
        departments: departments.map((d: any) => ({
          name: d.name,
          code: d.code,
          studentCount: d.studentCount || 0,
        })),
        recentAuditAlerts: recentAuditLogs.map((log: any) => ({
          action: log.action,
          actorName: log.actorName,
          description: log.description,
          severity: log.severity,
          timestamp: log.createdAt,
        })),
        criticalAlerts: recentAlerts.map((log: any) => ({
          action: log.action,
          description: log.description,
          timestamp: log.createdAt,
        })),
        notifications: notifications.map((n: any) => ({
          title: n.title,
          message: n.message,
          type: n.type,
          priority: n.priority,
        })),
      }
    } catch (err: any) {
      logger.error({ userId, err: err.message }, '[AdminService] Error fetching context')
      return null
    }
  }
}
