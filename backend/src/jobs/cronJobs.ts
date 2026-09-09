import cron from 'node-cron'
import { logger } from '../config/logger.js'
import Notification from '../models/Notification.js'
import Gamification from '../models/Gamification.js'
import { RedisCache } from '../cache/RedisCache.js'
import User from '../models/User.js'
import { EdenAutonomousAgent } from '../ai/EdenAutonomousAgent.js'

export function initCronJobs() {
  logger.info('[CronJobs] Initializing background jobs')

  // 1. Leaderboard recalculation every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    try {
      await RedisCache.del('gamification:leaderboard')
      logger.debug('[CronJobs] Leaderboard cache invalidated')
    } catch (err: any) {
      logger.error({ err: err.message }, '[CronJobs] Leaderboard job failed')
    }
  })

  // 2. Daily notification cleanup at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const result = await Notification.deleteMany({ isRead: true, createdAt: { $lt: thirtyDaysAgo } })
      logger.info({ deleted: result.deletedCount }, '[CronJobs] Old notifications cleaned up')
    } catch (err: any) {
      logger.error({ err: err.message }, '[CronJobs] Notification cleanup failed')
    }
  })

  // 3. Weekly analytics snapshot every Sunday at midnight
  cron.schedule('0 0 * * 0', async () => {
    try {
      const totalUsers = await User.countDocuments({ isActive: true })
      const totalStudents = await User.countDocuments({ role: 'student', isActive: true })
      logger.info({ totalUsers, totalStudents }, '[CronJobs] Weekly analytics snapshot created')
      await RedisCache.flush('admin:*')
    } catch (err: any) {
      logger.error({ err: err.message }, '[CronJobs] Weekly analytics failed')
    }
  })

  // 4. Daily streak check at 11:59 PM — reset streaks for inactive users
  cron.schedule('59 23 * * *', async () => {
    try {
      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000)
      const result = await Gamification.updateMany(
        { lastActiveDate: { $lt: yesterday }, streak: { $gt: 0 } },
        { streak: 0 }
      )
      logger.info({ updated: result.modifiedCount }, '[CronJobs] Streaks reset for inactive users')
    } catch (err: any) {
      logger.error({ err: err.message }, '[CronJobs] Streak reset failed')
    }
  })

  // 5. Cache flush for admin stats every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await RedisCache.del('admin:stats')
  })

  // 6. Daily dashboard cache flush at 6 AM (for fresh data)
  cron.schedule('0 6 * * *', async () => {
    try {
      await RedisCache.flush('dashboard:*')
      logger.info('[CronJobs] All dashboard caches flushed')
    } catch (err: any) {
      logger.error({ err: err.message }, '[CronJobs] Dashboard cache flush failed')
    }
  })

  // 7. Monthly XP counter reset on 1st of each month
  cron.schedule('0 1 1 * *', async () => {
    try {
      await Gamification.updateMany({}, { monthlyXp: 0 })
      logger.info('[CronJobs] Monthly XP counters reset')
    } catch (err: any) {
      logger.error({ err: err.message }, '[CronJobs] Monthly XP reset failed')
    }
  })

  // ── EDEN Autonomous Agent Jobs — Phase 12 ─────────────────────────────────

  // 8. Attendance Risk Alerts — daily at 8 PM (warn students below 75%)
  cron.schedule('0 20 * * *', async () => {
    await EdenAutonomousAgent.attendanceRiskAlert()
  })

  // 9. Assignment Deadline Reminders — daily at 9 AM (due in 24h)
  cron.schedule('0 9 * * *', async () => {
    await EdenAutonomousAgent.assignmentDeadlineReminders()
  })

  // 10. Placement Readiness Check — every Sunday at 9 AM (final-year students)
  cron.schedule('0 9 * * 0', async () => {
    await EdenAutonomousAgent.placementReadinessCheck()
  })

  logger.info('[CronJobs] ✅ All 10 background jobs initialized (7 platform + 3 EDEN Autonomous)')
}
