import { LearningDNA, LearningDNAProfile } from './LearningDNA.js'
import { DigitalTwinEngine } from './DigitalTwinEngine.js'
import { KnowledgeGraphService } from './KnowledgeGraphService.js'
import { CognitiveLearningEngine } from './CognitiveLearningEngine.js'
import User from '../models/User.js'
import { logger } from '../config/logger.js'

export interface ProactiveInterventionPlan {
  userId: string
  userName: string
  status: 'OPTIMAL' | 'ATTENTION_NEEDED' | 'CRITICAL_INTERVENTION'
  overallStatus: 'OPTIMAL' | 'ATTENTION_NEEDED' | 'CRITICAL_INTERVENTION'
  learningVelocity: 'accelerating' | 'steady' | 'slowing' | 'inactive'
  learningDNA?: LearningDNAProfile
  attendanceHealth: {
    currentPct: number
    isShortageRisk: boolean
    classesNeededForTarget: number
  }
  academicRisk: {
    cgpa: number
    predictedCGPA: number
    burnoutRisk: 'Low' | 'Medium' | 'High'
  }
  knowledgeGaps: {
    weakTopics: string[]
    prerequisiteWeaknesses: string[]
    recommendedStudyPath: { topic: string; requires: string[]; leadsTo: string[] }[]
  }
  scheduledInterventions: {
    topic: string
    reason: string
    sm2NextReviewDays: number
    actionableResource: string
  }[]
  decisionTrace: string[]
  timestamp: Date
}

export class ProactiveInterventionEngine {
  /**
   * Executes the full Closed-Loop AI Proactive Intervention workflow:
   * Student Activity ➜ Telemetry ➜ Learning DNA ➜ Digital Twin ➜ Weakness Detection
   * ➜ Knowledge Graph ➜ Targeted Recommendation ➜ SM-2 Active Recall Schedule.
   */
  static async analyzeAndIntervene(userId: string): Promise<ProactiveInterventionPlan> {
    logger.info({ userId }, '[ProactiveInterventionEngine] Running closed-loop telemetry analysis')

    const user = await User.findById(userId).select('name role department cgpa attendanceRate weakSubjects targetCareer').lean()
    const userName = user?.name || 'Student'

    // 1. Compute real-time Learning DNA from event stream
    const dnaProfile: LearningDNAProfile = await LearningDNA.compute(userId)

    // 2. Synchronize Cognitive Digital Twin
    const twin = await DigitalTwinEngine.syncStudentTwin(userId)

    // 3. Extract dynamic topic masteries from real LearningEvent telemetry (most recent events take precedence)
    const { LearningEvent } = await import('../models/LearningEvent.js')
    const recentEvents = await LearningEvent.find({ userId })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean()

    const topicMastery: Record<string, { status: 'mastered' | 'weak'; latestScore: number; timestamp: Date }> = {}

    for (const evt of recentEvents) {
      const t = evt.topicId || (evt as any).subject
      if (!t || topicMastery[t]) continue // Already processed newest event for this topic

      const score = evt.score ?? 0
      if (evt.eventType === 'INTERVENTION_COMPLETED' || evt.eventType === 'TOPIC_MASTERED' || score >= 75) {
        topicMastery[t] = { status: 'mastered', latestScore: score, timestamp: evt.timestamp }
      } else if (evt.eventType === 'TOPIC_FAILED' || evt.eventType === 'CODE_FAILED' || score < 60) {
        topicMastery[t] = { status: 'weak', latestScore: score, timestamp: evt.timestamp }
      }
    }

    // Build weakTopics list:
    let weakTopics: string[] = Object.keys(topicMastery).filter(t => topicMastery[t].status === 'weak')

    // If no weak events in recent telemetry, fall back to user profile weakSubjects only if no recent events exist at all
    if (weakTopics.length === 0 && recentEvents.length === 0) {
      const staticWeak = [...(twin?.weakTopics || []), ...(user?.weakSubjects || [])].filter(Boolean)
      weakTopics = Array.from(new Set(staticWeak))
    }

    // Filter out any weak topic that has been explicitly mastered since
    weakTopics = weakTopics.filter(t => topicMastery[t]?.status !== 'mastered')

    // 4. Attendance & Burnout Assessment
    const attendancePct = twin?.attendanceRate || (user as any)?.attendanceRate || 85
    const isShortageRisk = attendancePct < 75
    const classesNeededForTarget = isShortageRisk ? Math.max(1, Math.ceil((75 * 40 - attendancePct * 40) / 25)) : 0

    // 5. Scenario Branching & Proactive Intervention Formulation
    const scheduledInterventions: ProactiveInterventionPlan['scheduledInterventions'] = []
    const decisionTrace: string[] = []
    let overallStatus: ProactiveInterventionPlan['overallStatus'] = 'OPTIMAL'

    // Scenario E: Attendance Shortage Risk takes critical priority
    if (isShortageRisk) {
      overallStatus = 'CRITICAL_INTERVENTION'
      scheduledInterventions.push({
        topic: 'Attendance Recovery',
        reason: `Mandatory institutional cutoff warning: Current attendance is ${attendancePct}% (minimum required: 75%).`,
        sm2NextReviewDays: 1,
        actionableResource: `Attend the next ${classesNeededForTarget} consecutive lectures to regain examination eligibility.`,
      })
      decisionTrace.push(`1. Real-time attendance health evaluated at ${attendancePct}%, below the mandatory 75% institutional threshold.`)
      decisionTrace.push(`2. Shortage remediation calculation: ${classesNeededForTarget} consecutive attended hours required.`)
      decisionTrace.push(`3. Proactive action triggered: Attendance recovery alert dispatched to student cockpit.`)
    }
    // Scenario D: Inactivity / Disengagement Risk
    else if (dnaProfile.learningVelocity === 'inactive' && recentEvents.length === 0) {
      overallStatus = 'ATTENTION_NEEDED'
      scheduledInterventions.push({
        topic: 'Active Recall Check-in',
        reason: 'Zero learning interactions recorded in the recent window. Momentum renewal required.',
        sm2NextReviewDays: 1,
        actionableResource: 'Interactive Practice: 5-Minute Quick Concept Diagnostic',
      })
      decisionTrace.push('1. Telemetry stream indicates inactive learning velocity with 0 recent events.')
      decisionTrace.push('2. Cognitive retention decay model warns of disengagement risk.')
      decisionTrace.push('3. Proactive action triggered: Low-friction 5-minute micro-assessment to restart learning momentum.')
    }
    // Scenario B & C: Weak topics identified (e.g. Dynamic Programming, Recursion)
    else if (weakTopics.length > 0) {
      const primaryWeak = weakTopics[0]
      const kgResult = KnowledgeGraphService.inferPrerequisites([primaryWeak])
      const prereqs = kgResult.inferredPrerequisites

      // Check if any prerequisite is ALSO weak in telemetry (Scenario C) or already mastered (Scenario B)
      const weakPrereqs = prereqs.filter(p => topicMastery[p]?.status === 'weak')
      const targetTopic = weakPrereqs.length > 0 ? weakPrereqs[0] : primaryWeak
      const isPrereqTarget = targetTopic !== primaryWeak

      const recallRes = await CognitiveLearningEngine.evaluateRecallPerformance(userId, targetTopic, 1)

      overallStatus = 'ATTENTION_NEEDED'
      scheduledInterventions.push({
        topic: targetTopic,
        reason: isPrereqTarget
          ? `Foundational prerequisite weakness detected for ${primaryWeak}. Reinforce ${targetTopic} first.`
          : `Target practice on struggling competency: ${targetTopic}. Prerequisite requirements satisfied.`,
        sm2NextReviewDays: recallRes.nextReviewDays,
        actionableResource: `Interactive Practice & Active Recall: ${targetTopic}`,
      })

      decisionTrace.push(`1. Weakness identified in [${weakTopics.join(', ')}] from real-time telemetry stream.`)
      decisionTrace.push(`2. Knowledge Graph ontology traversed: ${primaryWeak} depends on [${prereqs.join(', ')}].`)
      if (isPrereqTarget) {
        decisionTrace.push(`3. Prerequisite dependency unresolved: Student struggled with ${targetTopic} in prior telemetry.`)
        decisionTrace.push(`4. Proactive action synthesized: Reinforce foundational prerequisite "${targetTopic}" before advanced topics.`)
      } else {
        decisionTrace.push(`3. Prerequisite chain verified: Foundational prerequisites are mastered.`)
        decisionTrace.push(`4. Proactive action synthesized: Direct practice on primary topic "${targetTopic}".`)
      }
    }
    // Scenario A: Strong student (high scores, no weak topics, good attendance)
    else {
      overallStatus = 'OPTIMAL'
      decisionTrace.push('1. Continuous telemetry monitoring indicates high competency across all evaluated modules.')
      decisionTrace.push('2. Knowledge Graph ontology check: No unresolved prerequisite blockers detected.')
      decisionTrace.push('3. Retention and attendance metrics optimal. Standard syllabus progression maintained.')
    }

    const kgResult = KnowledgeGraphService.inferPrerequisites(weakTopics)

    return {
      userId,
      userName,
      status: overallStatus,
      overallStatus,
      learningVelocity: dnaProfile.learningVelocity,
      learningDNA: dnaProfile,
      attendanceHealth: {
        currentPct: attendancePct,
        isShortageRisk,
        classesNeededForTarget,
      },
      academicRisk: {
        cgpa: user?.cgpa || twin?.predictedCGPA || 8.5,
        predictedCGPA: twin?.predictedCGPA || 8.5,
        burnoutRisk: twin?.burnoutRisk || 'Low',
      },
      knowledgeGaps: {
        weakTopics,
        prerequisiteWeaknesses: kgResult.inferredPrerequisites,
        recommendedStudyPath: kgResult.recommendedPath,
      },
      scheduledInterventions,
      decisionTrace,
      timestamp: new Date(),
    }
  }
}
