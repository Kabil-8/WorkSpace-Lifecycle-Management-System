import mongoose from 'mongoose'
import User from '../models/User.js'
import Gamification from '../models/Gamification.js'
import { logger } from '../config/logger.js'

export class StreakService {
  /**
   * Evaluates and updates a user's daily activity streak.
   *
   * Streak Rules:
   * 1. Activity on same calendar day: Streak remains unchanged.
   * 2. Activity on consecutive calendar day (yesterday): Streak increments by 1.
   * 3. Activity after missing 1+ days: Streak resets to 1.
   * 4. Syncs both User and Gamification documents atomically.
   */
  static async touchStreak(userId: mongoose.Types.ObjectId | string): Promise<{ streak: number; maxStreak: number; updated: boolean }> {
    try {
      const uId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null
      if (!uId) return { streak: 0, maxStreak: 0, updated: false }

      const user = await User.findById(uId)
      if (!user) return { streak: 0, maxStreak: 0, updated: false }

      const now = new Date()
      const todayStr = now.toISOString().split('T')[0] // 'YYYY-MM-DD'

      let gamification = await Gamification.findOne({ userId: uId })
      if (!gamification) {
        gamification = new Gamification({
          userId: uId,
          xp: user.xp || 0,
          level: user.level || 1,
          streak: user.streak || 0,
          maxStreak: user.maxStreak || 0,
          lastActiveDate: now,
        })
      }

      const lastActive = gamification.lastActiveDate || user.lastLoginAt
      let currentStreak = Math.max(user.streak || 0, gamification.streak || 0)
      let maxStreak = Math.max(user.maxStreak || 0, gamification.maxStreak || 0, currentStreak)
      let updated = false

      if (!lastActive) {
        // First activity ever
        currentStreak = 1
        maxStreak = Math.max(maxStreak, 1)
        updated = true
      } else {
        const lastActiveStr = new Date(lastActive).toISOString().split('T')[0]

        if (todayStr === lastActiveStr) {
          // Same calendar day — streak stays same, just update lastActiveDate timestamp
          updated = false
        } else {
          // Calculate calendar day difference
          const todayDate = new Date(todayStr)
          const lastDate = new Date(lastActiveStr)
          const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000))

          if (diffDays === 1) {
            // Consecutive calendar day -> Streak + 1
            currentStreak += 1
            maxStreak = Math.max(maxStreak, currentStreak)
            updated = true
            logger.info({ userId: uId.toString(), newStreak: currentStreak }, '[StreakService] 🔥 Streak incremented!')
          } else if (diffDays > 1) {
            // Missed 1 or more calendar days -> Reset streak to 1
            currentStreak = 1
            updated = true
            logger.info({ userId: uId.toString(), previousStreak: user.streak, diffDays }, '[StreakService] ⚡ Streak reset to 1 due to inactivity')
          }
        }
      }

      // Persist to User & Gamification models
      user.streak = currentStreak
      user.maxStreak = maxStreak
      user.lastLoginAt = now
      await user.save()

      gamification.streak = currentStreak
      gamification.maxStreak = maxStreak
      gamification.lastActiveDate = now
      await gamification.save()

      return { streak: currentStreak, maxStreak, updated }
    } catch (err: any) {
      logger.error({ userId, err: err.message }, '[StreakService] touchStreak error')
      return { streak: 0, maxStreak: 0, updated: false }
    }
  }
}
