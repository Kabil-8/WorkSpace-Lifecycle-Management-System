import { Request, Response } from 'express'
import Notification from '../models/Notification.js'
import Assignment from '../models/Assignment.js'
import Course from '../models/Course.js'
import Job from '../models/Job.js'
import { StudentAttendance } from '../models/attendance/StudentAttendance.js'
import { Exam } from '../models/proctor/Exam.js'
import { RedisCache, CacheKeys, CacheTTL } from '../cache/RedisCache.js'
import { logger } from '../config/logger.js'

async function ensureDataDrivenNotifications(user: any) {
  try {
    const userId = user._id
    const existingCount = await Notification.countDocuments({ userId })
    if (existingCount >= 3) return

    const notificationsToCreate: any[] = []

    // 1. Data-driven Assignment Notification
    const pendingAssignment = await Assignment.findOne({
      $or: [{ department: user.department }, { department: 'All' }, { department: { $exists: false } }]
    }).sort({ dueDate: 1 })

    if (pendingAssignment) {
      const notifExists = await Notification.findOne({ userId, 'metadata.assignmentId': pendingAssignment._id })
      if (!notifExists) {
        notificationsToCreate.push({
          userId,
          title: `📋 Assignment Due: ${pendingAssignment.title}`,
          message: `Pending submission for ${pendingAssignment.courseName || 'your course'}. Due by ${new Date(pendingAssignment.dueDate).toLocaleDateString()}.`,
          type: 'assignment',
          priority: 'high',
          actionUrl: '/assignments',
          icon: '📋',
          metadata: { assignmentId: pendingAssignment._id },
        })
      }
    }

    // 2. Data-driven Attendance Notification
    const totalAttendance = await StudentAttendance.countDocuments({ studentId: userId })
    if (totalAttendance > 0) {
      const presentCount = await StudentAttendance.countDocuments({ studentId: userId, status: 'Present' })
      const pct = Math.round((presentCount / totalAttendance) * 100)
      const notifExists = await Notification.findOne({ userId, type: 'attendance' })
      if (!notifExists) {
        notificationsToCreate.push({
          userId,
          title: pct < 75 ? `⚠️ Attendance Alert (${pct}%)` : `📋 Attendance Status (${pct}%)`,
          message: pct < 75
            ? `Your overall attendance is ${pct}%, which is below the 75% requirement. Please ensure regular attendance.`
            : `Your attendance is currently at ${pct}%. Keep it up to maintain eligibility!`,
          type: 'attendance',
          priority: pct < 75 ? 'urgent' : 'medium',
          actionUrl: '/attendance',
          icon: '📋',
        })
      }
    } else {
      const notifExists = await Notification.findOne({ userId, type: 'attendance' })
      if (!notifExists) {
        notificationsToCreate.push({
          userId,
          title: '📋 Attendance Monitoring Active',
          message: 'Your attendance records will automatically sync here after each session.',
          type: 'attendance',
          priority: 'low',
          actionUrl: '/attendance',
          icon: '📋',
        })
      }
    }

    // 3. Data-driven Exam Notification
    const upcomingExam = await Exam.findOne({ isActive: true }).sort({ scheduledAt: 1 })
    if (upcomingExam) {
      const notifExists = await Notification.findOne({ userId, 'metadata.examId': upcomingExam._id })
      if (!notifExists) {
        notificationsToCreate.push({
          userId,
          title: `📊 Exam Scheduled: ${upcomingExam.title}`,
          message: `Scheduled proctored examination for ${upcomingExam.subject}. Prepare your setup in advance.`,
          type: 'exam',
          priority: 'high',
          actionUrl: '/proctor',
          icon: '📊',
          metadata: { examId: upcomingExam._id },
        })
      }
    }

    // 4. Data-driven Placement / Career Opportunity Notification
    const openJob = await Job.findOne({ isActive: true }).sort({ createdAt: -1 })
    if (openJob) {
      const notifExists = await Notification.findOne({ userId, 'metadata.jobId': openJob._id })
      if (!notifExists) {
        notificationsToCreate.push({
          userId,
          title: `💼 Career Opportunity: ${openJob.company}`,
          message: `Now hiring for ${openJob.title} (${openJob.location || 'Remote'}). Package: ${openJob.salary || 'Competitive'}.`,
          type: 'placement',
          priority: 'medium',
          actionUrl: '/career/jobs',
          icon: '💼',
          metadata: { jobId: openJob._id },
        })
      }
    }

    // 5. Data-driven Gamification & AI Learning Notification
    const notifExistsGamification = await Notification.findOne({ userId, type: 'gamification' })
    if (!notifExistsGamification) {
      notificationsToCreate.push({
        userId,
        title: '🏆 EDEN AI Learning Missions Ready',
        message: 'Daily learning missions updated! Complete challenges to gain XP and rank up on the leaderboard.',
        type: 'gamification',
        priority: 'low',
        actionUrl: '/gamification',
        icon: '🏆',
      })
    }

    if (notificationsToCreate.length > 0) {
      await Notification.insertMany(notificationsToCreate)
      logger.info({ userId, count: notificationsToCreate.length }, '[Notifications] Auto-generated per-user data-driven notifications')
    }
  } catch (err: any) {
    logger.warn({ err: err.message }, '[Notifications] Error auto-generating data-driven notifications')
  }
}

export class NotificationController {
  static async getMyNotifications(req: any, res: Response) {
    try {
      const { unreadOnly, page = '1', limit = '20' } = req.query as any

      // Ensure user has data-driven notifications initialized if history is sparse
      await ensureDataDrivenNotifications(req.user)

      const filters: any = { userId: req.user._id }
      if (unreadOnly === 'true') filters.isRead = false

      const cacheKey = CacheKeys.notifications(req.user._id.toString())
      if (unreadOnly !== 'true') {
        const cached = await RedisCache.get<any>(cacheKey)
        if (cached) return res.json({ success: true, ...cached, cached: true })
      }

      const skip = (parseInt(page) - 1) * parseInt(limit)
      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filters).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        Notification.countDocuments(filters),
        Notification.countDocuments({ userId: req.user._id, isRead: false }),
      ])

      const result = { data: notifications, total, unreadCount, page: parseInt(page) }
      if (unreadOnly !== 'true') await RedisCache.set(cacheKey, result, CacheTTL.notifications)
      return res.json({ success: true, ...result })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async markRead(req: any, res: Response) {
    try {
      const { notificationIds } = req.body
      if (Array.isArray(notificationIds) && notificationIds.length > 0) {
        await Notification.updateMany(
          { _id: { $in: notificationIds }, userId: req.user._id },
          { isRead: true, readAt: new Date() }
        )
      }
      await RedisCache.del(CacheKeys.notifications(req.user._id.toString()))
      return res.json({ success: true, message: 'Notifications marked as read.' })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async markAllRead(req: any, res: Response) {
    try {
      await Notification.updateMany(
        { userId: req.user._id, isRead: false },
        { isRead: true, readAt: new Date() }
      )
      await RedisCache.del(CacheKeys.notifications(req.user._id.toString()))
      return res.json({ success: true, message: 'All notifications marked as read.' })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async deleteNotification(req: any, res: Response) {
    try {
      const { id } = req.params
      await Notification.deleteOne({ _id: id, userId: req.user._id })
      await RedisCache.del(CacheKeys.notifications(req.user._id.toString()))
      return res.json({ success: true, message: 'Notification deleted.' })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async deleteOld(req: any, res: Response) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      await Notification.deleteMany({ userId: req.user._id, isRead: true, createdAt: { $lt: thirtyDaysAgo } })
      await RedisCache.del(CacheKeys.notifications(req.user._id.toString()))
      return res.json({ success: true, message: 'Old notifications cleared.' })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }
}

