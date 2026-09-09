import { EventEmitter } from 'events'
import { logger } from '../config/logger.js'

class EduSphereEventBus extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(100)
  }

  emit(event: string, ...args: any[]): boolean {
    logger.debug({ event, payload: args[0] }, '[EventBus] Emitting event')
    return super.emit(event, ...args)
  }
}

export const eventBus = new EduSphereEventBus()

// ── Event Type Constants ────────────────────────────────────────────────────
export const Events = {
  // Academic events
  ATTENDANCE_MARKED: 'attendance:marked',
  ASSIGNMENT_SUBMITTED: 'assignment:submitted',
  ASSIGNMENT_GRADED: 'assignment:graded',
  COURSE_GRADE_RECORDED: 'course:grade_recorded',
  TRANSCRIPT_GENERATED: 'transcript:generated',
  EXAM_STARTED: 'exam:started',
  EXAM_SUBMITTED: 'exam:submitted',
  EXAM_GRADED: 'exam:graded',
  QUIZ_STARTED: 'quiz:started',
  QUIZ_COMPLETED: 'quiz:completed',
  COURSE_ENROLLED: 'course:enrolled',
  NOTE_CREATED: 'note:created',
  RECALL_SESSION: 'recall:session',

  // Career events
  INTERVIEW_COMPLETED: 'interview:completed',
  RESUME_UPDATED: 'resume:updated',
  JOB_APPLIED: 'job:applied',

  // Platform events
  USER_LOGIN: 'user:login',
  XP_AWARDED: 'xp:awarded',
  ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
  NOTIFICATION_CREATED: 'notification:created',
  LEAVE_APPLIED: 'leave:applied',
  FORUM_POST_CREATED: 'forum:post:created',
  WARNING_ISSUED: 'proctor:warning',

  // Learning activity events
  VIDEO_STARTED: 'video:started',
  VIDEO_COMPLETED: 'video:completed',
  CODE_EXECUTED: 'code:executed',
  QUESTION_ASKED: 'question:asked',

  // Finance events
  FEE_DUE: 'fee:due',
  FEE_PAID: 'fee:paid',
} as const

export type EventType = typeof Events[keyof typeof Events]

// ── Background Digital Twin Event Listeners ─────────────────────────────────
const setupDigitalTwinListeners = () => {
  const telemetryEvents: EventType[] = [
    Events.ATTENDANCE_MARKED,
    Events.ASSIGNMENT_SUBMITTED,
    Events.ASSIGNMENT_GRADED,
    Events.EXAM_SUBMITTED,
    Events.QUIZ_COMPLETED,
    Events.XP_AWARDED,
    Events.COURSE_ENROLLED,
    Events.VIDEO_COMPLETED,
    Events.CODE_EXECUTED,
    Events.RECALL_SESSION,
    Events.INTERVIEW_COMPLETED,
  ]

  telemetryEvents.forEach((eventType) => {
    eventBus.on(eventType, async (data: any) => {
      const userId = data?.userId || data?.studentId
      if (userId) {
        logger.info({ eventType, userId }, '[EventBus] Telemetry event → Digital Twin background refresh')
        import('../ai/DigitalTwinEngine.js')
          .then(({ DigitalTwinEngine }) => DigitalTwinEngine.getOrComputeTwin(userId.toString()))
          .catch((err) => logger.warn({ err: err.message }, '[EventBus] Digital Twin background sync error'))
      }
    })
  })
}

// ── Learning Event Persistence Listener ─────────────────────────────────────
const setupLearningEventListeners = () => {
  // Map bus events → LearningEvent types
  const eventTypeMap: Partial<Record<EventType, string>> = {
    [Events.ATTENDANCE_MARKED]: 'ATTENDANCE_MARKED',
    [Events.ASSIGNMENT_SUBMITTED]: 'ASSIGNMENT_SUBMITTED',
    [Events.ASSIGNMENT_GRADED]: 'ASSIGNMENT_GRADED',
    [Events.COURSE_GRADE_RECORDED]: 'COURSE_GRADE_RECORDED',
    [Events.EXAM_SUBMITTED]: 'EXAM_COMPLETED',
    [Events.QUIZ_COMPLETED]: 'QUIZ_COMPLETED',
    [Events.QUIZ_STARTED]: 'QUIZ_STARTED',
    [Events.COURSE_ENROLLED]: 'COURSE_ENROLLED',
    [Events.NOTE_CREATED]: 'NOTE_CREATED',
    [Events.CODE_EXECUTED]: 'CODE_EXECUTED',
    [Events.USER_LOGIN]: 'LOGIN',
    [Events.XP_AWARDED]: 'XP_AWARDED',
    [Events.ACHIEVEMENT_UNLOCKED]: 'ACHIEVEMENT_UNLOCKED',
    [Events.VIDEO_STARTED]: 'VIDEO_STARTED',
    [Events.VIDEO_COMPLETED]: 'VIDEO_COMPLETED',
    [Events.INTERVIEW_COMPLETED]: 'INTERVIEW_COMPLETED',
    [Events.RESUME_UPDATED]: 'RESUME_UPDATED',
    [Events.RECALL_SESSION]: 'RECALL_SESSION',
    [Events.FORUM_POST_CREATED]: 'FORUM_POST',
  }

  for (const [busEvent, learningType] of Object.entries(eventTypeMap)) {
    eventBus.on(busEvent, async (data: any) => {
      const userId = data?.userId || data?.studentId
      if (!userId) return

      try {
        const { LearningEvent } = await import('../models/LearningEvent.js')
        await LearningEvent.create({
          userId,
          eventType: learningType,
          courseId: data?.courseId,
          topicId: data?.topicId,
          subject: data?.subject,
          score: data?.score,
          duration: data?.duration,
          metadata: data?.metadata || {},
        })
        logger.debug({ userId, eventType: learningType }, '[EventBus] LearningEvent persisted')
      } catch (err: any) {
        logger.warn({ err: err.message, userId }, '[EventBus] LearningEvent persistence skipped')
      }
    })
  }
}

setupDigitalTwinListeners()
setupLearningEventListeners()
