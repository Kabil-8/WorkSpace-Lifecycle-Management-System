import { Request, Response } from 'express'
import mongoose from 'mongoose'
import RecallItem from '../models/RecallItem.js'
import { SM2Engine } from '../ai/SM2Engine.js'
import { logger } from '../config/logger.js'

// ─── Helper: resolve userId safely from JWT only ──────────────────────────────
function getUid(req: any): mongoose.Types.ObjectId | null {
  const raw = req.user?._id || req.user?.id
  return mongoose.Types.ObjectId.isValid(raw) ? new mongoose.Types.ObjectId(raw) : null
}

// ─── GET /api/v1/recall/today ─────────────────────────────────────────────────
/**
 * Returns topics due for review today, sorted by priority score.
 * Identity comes ONLY from req.user._id (JWT). No body/query userId trusted.
 */
export async function getTodayQueue(req: Request, res: Response) {
  try {
    const userId = getUid(req)
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })

    const now = new Date()

    // Fetch all items due (nextReviewAt <= now) for this user
    const dueItems = await RecallItem.find({
      userId,
      nextReviewAt: { $lte: now },
    }).lean()

    if (dueItems.length === 0) {
      return res.json({
        success: true,
        data: {
          queue: [],
          totalDue: 0,
          overdue: 0,
          hasData: false,
          message: 'No reviews due right now. Keep learning to build your recall schedule.',
        },
      })
    }

    // Enrich each item with live retention + priority score
    const enriched = dueItems.map(item => {
      const liveRetention = SM2Engine.estimateCurrentRetention({
        lastReviewedAt: item.lastReviewedAt,
        interval: item.interval,
        easeFactor: item.easeFactor,
        repetitions: item.repetitions,
      })

      const msOverdue = Math.max(0, now.getTime() - item.nextReviewAt.getTime())
      const daysOverdue = msOverdue / (24 * 60 * 60 * 1000)

      const { priorityScore, priorityReason } = SM2Engine.calculatePriority({
        nextReviewAt: item.nextReviewAt,
        retention: liveRetention,
        mistakeCount: item.mistakeCount,
        successCount: item.successCount,
        repetitions: item.repetitions,
      })

      return {
        _id: item._id,
        topicId: item.topicId,
        topicName: item.topicName,
        subjectName: item.subjectName,
        courseName: item.courseName,
        mastery: item.mastery,
        retention: liveRetention,
        easeFactor: item.easeFactor,
        repetitions: item.repetitions,
        interval: item.interval,
        lastReviewedAt: item.lastReviewedAt,
        nextReviewAt: item.nextReviewAt,
        overdueBy: Number(daysOverdue.toFixed(1)),
        isOverdue: daysOverdue > 0.1,
        priorityScore,
        priorityReason,
      }
    })

    // Sort: overdue first, then by highest priority score
    enriched.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      return b.priorityScore - a.priorityScore
    })

    const overdue = enriched.filter(i => i.isOverdue).length

    return res.json({
      success: true,
      data: {
        queue: enriched,
        totalDue: enriched.length,
        overdue,
        hasData: true,
      },
    })
  } catch (err: any) {
    logger.error({ err: err.message }, '[RecallController] getTodayQueue failed')
    return res.status(500).json({ success: false, message: err.message })
  }
}

// ─── POST /api/v1/recall/:topicId/review ──────────────────────────────────────
/**
 * Submits a recall quality rating and updates SM-2 state.
 * Body: { quality: 1|3|5, responseTime?: number }
 */
export async function submitReview(req: Request, res: Response) {
  try {
    const userId = getUid(req)
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })

    const { topicId } = req.params
    const { quality, responseTime = 0 } = req.body

    // Validate quality
    if (![1, 3, 5].includes(Number(quality))) {
      return res.status(400).json({ success: false, message: 'quality must be 1, 3, or 5' })
    }
    const q = Number(quality) as 1 | 3 | 5

    // Find recall item — enforce ownership (userId check prevents horizontal escalation)
    let item = await RecallItem.findOne({ userId, topicId })

    if (!item) {
      // Auto-create item on first manual review (never pre-seeded with fake data)
      const topicName = req.body.topicName || String(topicId).replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
      item = new RecallItem({
        userId,
        topicId,
        topicName,
        subjectName: req.body.subjectName || 'General',
        courseName: req.body.courseName || 'General',
        courseId: req.body.courseId || '',
        subjectId: req.body.subjectId || '',
        repetitions: 0,
        easeFactor: 2.5,
        interval: 1,
        retention: 0,
        mastery: 0,
        reviewHistory: [],
        lastReviewedAt: null,
        nextReviewAt: new Date(),
      })
    }

    // Security: ensure the item belongs to this user
    if (item.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    // Calculate new SM-2 state
    const sm2Result = SM2Engine.calculate({
      quality: q,
      repetitions: item.repetitions,
      easeFactor: item.easeFactor,
      interval: item.interval,
      lastReviewedAt: item.lastReviewedAt,
      reviewHistory: item.reviewHistory.map(r => ({
        quality: r.quality,
        reviewedAt: r.reviewedAt,
      })),
    })

    // Append to review history
    item.reviewHistory.push({
      reviewedAt: new Date(),
      quality: q,
      previousInterval: item.interval,
      newInterval: sm2Result.newInterval,
      previousEaseFactor: item.easeFactor,
      newEaseFactor: sm2Result.newEaseFactor,
      responseTime: Number(responseTime) || 0,
      correct: sm2Result.correct,
      source: 'manual',
    })

    // Cap history at 100 entries
    if (item.reviewHistory.length > 100) {
      item.reviewHistory = item.reviewHistory.slice(-100)
    }

    // Update SM-2 state on the document
    item.repetitions  = sm2Result.newRepetitions
    item.easeFactor   = sm2Result.newEaseFactor
    item.interval     = sm2Result.newInterval
    item.quality      = q
    item.retention    = sm2Result.retention
    item.mastery      = sm2Result.mastery
    item.confidence   = sm2Result.confidence
    item.lastReviewedAt = new Date()
    item.nextReviewAt   = sm2Result.nextReviewAt
    if (sm2Result.correct) {
      item.successCount += 1
    } else {
      item.mistakeCount += 1
    }

    await item.save()

    logger.info({
      userId: userId.toString(),
      topicId,
      quality: q,
      newInterval: sm2Result.newInterval,
      newEaseFactor: sm2Result.newEaseFactor,
      mastery: sm2Result.mastery,
      retention: sm2Result.retention,
    }, '[RecallController] SM-2 review saved ✓')

    return res.json({
      success: true,
      data: {
        topic: item.topicName,
        quality: q,
        mastery: sm2Result.mastery,
        retention: sm2Result.retention,
        confidence: sm2Result.confidence,
        easeFactor: sm2Result.newEaseFactor,
        repetitions: sm2Result.newRepetitions,
        interval: sm2Result.newInterval,
        nextReviewAt: sm2Result.nextReviewAt,
        correct: sm2Result.correct,
        message: sm2Result.correct
          ? `Well done! Next review in ${sm2Result.newInterval} day${sm2Result.newInterval !== 1 ? 's' : ''}.`
          : `No problem — this topic is scheduled again tomorrow to reinforce memory.`,
      },
    })
  } catch (err: any) {
    logger.error({ err: err.message }, '[RecallController] submitReview failed')
    return res.status(500).json({ success: false, message: err.message })
  }
}

// ─── GET /api/v1/recall/analytics ────────────────────────────────────────────
/**
 * Returns per-user aggregate analytics: totals, averages, streak.
 */
export async function getAnalytics(req: Request, res: Response) {
  try {
    const userId = getUid(req)
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })

    const items = await RecallItem.find({ userId }).lean()

    if (items.length === 0) {
      return res.json({
        success: true,
        data: {
          hasData: false,
          totalTracked: 0,
          dueToday: 0,
          overdue: 0,
          mastered: 0,
          avgRetention: 0,
          avgMastery: 0,
          reviewStreak: 0,
          totalSuccessful: 0,
          totalFailed: 0,
          message: 'No recall items yet. Complete a lesson or quiz to begin your memory schedule.',
        },
      })
    }

    const now = new Date()

    // Live retention for each item
    const enriched = items.map(item => ({
      ...item,
      liveRetention: SM2Engine.estimateCurrentRetention({
        lastReviewedAt: item.lastReviewedAt,
        interval: item.interval,
        easeFactor: item.easeFactor,
        repetitions: item.repetitions,
      }),
    }))

    const dueToday = enriched.filter(i => i.nextReviewAt <= now).length
    const overdue  = enriched.filter(i => {
      const msOverdue = now.getTime() - i.nextReviewAt.getTime()
      return msOverdue > 24 * 60 * 60 * 1000 // more than 1 day overdue
    }).length
    const mastered  = enriched.filter(i => i.mastery >= 80).length
    const avgRetention = enriched.reduce((s, i) => s + i.liveRetention, 0) / enriched.length
    const avgMastery   = enriched.reduce((s, i) => s + i.mastery, 0) / enriched.length
    const totalSuccessful = enriched.reduce((s, i) => s + i.successCount, 0)
    const totalFailed     = enriched.reduce((s, i) => s + i.mistakeCount, 0)

    // Review streak: consecutive days with at least 1 review
    const reviewStreak = computeReviewStreak(items)

    return res.json({
      success: true,
      data: {
        hasData: true,
        totalTracked: items.length,
        dueToday,
        overdue,
        mastered,
        avgRetention: Number(avgRetention.toFixed(1)),
        avgMastery: Number(avgMastery.toFixed(1)),
        reviewStreak,
        totalSuccessful,
        totalFailed,
      },
    })
  } catch (err: any) {
    logger.error({ err: err.message }, '[RecallController] getAnalytics failed')
    return res.status(500).json({ success: false, message: err.message })
  }
}

// ─── GET /api/v1/recall/items ─────────────────────────────────────────────────
/**
 * Returns all recall items for the authenticated user.
 */
export async function getAllItems(req: Request, res: Response) {
  try {
    const userId = getUid(req)
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })

    const items = await RecallItem.find({ userId })
      .sort({ nextReviewAt: 1 })
      .lean()

    const enriched = items.map(item => ({
      ...item,
      liveRetention: SM2Engine.estimateCurrentRetention({
        lastReviewedAt: item.lastReviewedAt,
        interval: item.interval,
        easeFactor: item.easeFactor,
        repetitions: item.repetitions,
      }),
    }))

    return res.json({
      success: true,
      data: {
        items: enriched,
        total: enriched.length,
        hasData: enriched.length > 0,
      },
    })
  } catch (err: any) {
    logger.error({ err: err.message }, '[RecallController] getAllItems failed')
    return res.status(500).json({ success: false, message: err.message })
  }
}

// ─── Helper: Compute consecutive review streak ────────────────────────────────
function computeReviewStreak(items: any[]): number {
  // Collect all review dates across all items
  const allDates: Date[] = []
  for (const item of items) {
    for (const r of item.reviewHistory || []) {
      allDates.push(new Date(r.reviewedAt))
    }
  }
  if (allDates.length === 0) return 0

  // Get unique calendar days
  const daySet = new Set(allDates.map(d => d.toISOString().split('T')[0]))
  const days = Array.from(daySet).sort().reverse()

  let streak = 0
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  for (const day of days) {
    const d = new Date(day)
    d.setHours(0, 0, 0, 0)
    const diff = (cursor.getTime() - d.getTime()) / (24 * 60 * 60 * 1000)

    if (diff <= 1.5) {
      streak++
      cursor = d
    } else {
      break
    }
  }

  return streak
}
