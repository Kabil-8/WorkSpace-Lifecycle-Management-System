import { LearningDNA, LearningDNAProfile } from './LearningDNA.js'
import { DigitalTwinEngine } from './DigitalTwinEngine.js'
import { KnowledgeGraphService } from './KnowledgeGraphService.js'
import { CognitiveLearningEngine } from './CognitiveLearningEngine.js'
import User from '../models/User.js'
import { logger } from '../config/logger.js'

export interface ProactiveInterventionPlan {
  userId: string
  userName: string
  overallStatus: 'OPTIMAL' | 'ATTENTION_NEEDED' | 'CRITICAL_INTERVENTION'
  learningVelocity: 'accelerating' | 'steady' | 'slowing' | 'inactive'
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

    // 3. Extract weaknesses from User, Twin, and Quiz telemetry
    const rawWeakTopics: string[] = [
      ...(twin?.weakTopics || []),
      ...(user?.weakSubjects || []),
    ]
    const weakTopics = Array.from(new Set(rawWeakTopics.filter(Boolean)))
    if (weakTopics.length === 0) {
      weakTopics.push('Dynamic Programming', 'SQL')
    }

    // 4. Knowledge Graph Prerequisite Inference
    const kgResult = KnowledgeGraphService.inferPrerequisites(weakTopics)

    // 5. Automatic SM-2 Active Recall Scheduling for prerequisite gaps
    const scheduledInterventions: ProactiveInterventionPlan['scheduledInterventions'] = []

    for (const prereq of kgResult.inferredPrerequisites.slice(0, 3)) {
      // Schedule SM-2 review for this foundational concept
      const recallRes = await CognitiveLearningEngine.evaluateRecallPerformance(userId, prereq, 1)
      scheduledInterventions.push({
        topic: prereq,
        reason: `Foundational prerequisite for ${weakTopics[0] || 'core coursework'}. Scheduled review due in ${recallRes.nextReviewDays} day(s).`,
        sm2NextReviewDays: recallRes.nextReviewDays,
        actionableResource: `Interactive Practice & Active Recall: ${prereq}`,
      })
    }

    // 6. Attendance & Burnout Assessment
    const attendancePct = twin?.attendanceRate || (user as any)?.attendanceRate || 85
    const isShortageRisk = attendancePct < 75
    const classesNeededForTarget = isShortageRisk ? Math.max(1, Math.ceil((75 * 40 - attendancePct * 40) / 25)) : 0

    const overallStatus: ProactiveInterventionPlan['overallStatus'] =
      isShortageRisk || dnaProfile.learningVelocity === 'inactive' || twin?.burnoutRisk === 'High'
        ? 'CRITICAL_INTERVENTION'
        : dnaProfile.learningVelocity === 'slowing' || weakTopics.length > 2
        ? 'ATTENTION_NEEDED'
        : 'OPTIMAL'

    return {
      userId,
      userName,
      overallStatus,
      learningVelocity: dnaProfile.learningVelocity,
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
      timestamp: new Date(),
    }
  }
}
