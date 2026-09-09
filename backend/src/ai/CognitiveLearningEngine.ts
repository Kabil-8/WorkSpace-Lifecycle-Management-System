import RecallItem from '../models/RecallItem.js'
import { SM2Engine } from './SM2Engine.js'
import { logger } from '../config/logger.js'
import mongoose from 'mongoose'

/**
 * CognitiveLearningEngine
 *
 * Bridges the old /digital-twin/cognitive-recall endpoint with the new
 * dedicated RecallItem collection and SM2Engine.
 *
 * Backward-compatible: still returns the same shape as before for the
 * existing frontend, but now persists to RecallItem (not StudentDigitalTwin).
 */
export class CognitiveLearningEngine {
  /**
   * Evaluates user recall performance on a topic using the SM-2 algorithm.
   * Persists the result to the RecallItem collection.
   *
   * @param userId  Authenticated user's ID (from JWT — never trusted from client)
   * @param topic   Topic name
   * @param quality 1 = Forgot, 3 = Good, 5 = Perfect
   */
  static async evaluateRecallPerformance(
    userId: string,
    topic: string,
    quality: number
  ): Promise<{ nextReviewDays: number; easeFactor: number; message: string; mastery: number; retention: number }> {
    try {
      const uId = mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : null
      if (!uId) throw new Error('Invalid User ID')

      // Clamp quality to valid SM-2 values: 1, 3, or 5
      let q: 1 | 3 | 5 = 3
      if (quality <= 1)      q = 1
      else if (quality >= 5) q = 5
      else                   q = 3

      // Build a slug for topicId
      const topicId = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

      // Find or create the RecallItem for this user+topic
      let item = await RecallItem.findOne({ userId: uId, topicId })
      if (!item) {
        item = new RecallItem({
          userId: uId,
          topicId,
          topicName: topic,
          subjectName: 'Core Concept',
          courseName: 'General',
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

      // Run SM-2 calculation
      const result = SM2Engine.calculate({
        quality: q,
        repetitions: item.repetitions,
        easeFactor: item.easeFactor,
        interval: item.interval,
        lastReviewedAt: item.lastReviewedAt,
        reviewHistory: item.reviewHistory.map(r => ({ quality: r.quality, reviewedAt: r.reviewedAt })),
      })

      // Append review history
      item.reviewHistory.push({
        reviewedAt: new Date(),
        quality: q,
        previousInterval: item.interval,
        newInterval: result.newInterval,
        previousEaseFactor: item.easeFactor,
        newEaseFactor: result.newEaseFactor,
        responseTime: 0,
        correct: result.correct,
        source: 'manual',
      })
      if (item.reviewHistory.length > 100) item.reviewHistory = item.reviewHistory.slice(-100)

      // Persist SM-2 state
      item.repetitions   = result.newRepetitions
      item.easeFactor    = result.newEaseFactor
      item.interval      = result.newInterval
      item.quality       = q
      item.retention     = result.retention
      item.mastery       = result.mastery
      item.confidence    = result.confidence
      item.lastReviewedAt = new Date()
      item.nextReviewAt   = result.nextReviewAt
      if (result.correct) item.successCount += 1
      else                item.mistakeCount += 1

      await item.save()

      logger.info(
        { userId, topic: topicId, quality: q, newInterval: result.newInterval, mastery: result.mastery },
        '[CognitiveLearningEngine] SM-2 updated via RecallItem ✓'
      )

      return {
        nextReviewDays: result.newInterval,  // ← Fixed: was returning old intervalDays
        easeFactor: result.newEaseFactor,
        mastery: result.mastery,
        retention: result.retention,
        message: result.correct
          ? `Great active recall! Topic scheduled for review in ${result.newInterval} day${result.newInterval !== 1 ? 's' : ''}.`
          : `Topic marked for review tomorrow (1 day interval).`,
      }
    } catch (err: any) {
      logger.error({ userId, err: err.message }, '[CognitiveLearningEngine] Recall evaluation failed')
      return { nextReviewDays: 1, easeFactor: 2.5, mastery: 0, retention: 0, message: 'Recall logged.' }
    }
  }
}
