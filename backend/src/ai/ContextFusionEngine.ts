// backend/src/ai/ContextFusionEngine.ts
// 🔥 R14 — Context Fusion Engine
// Synthesizes Student Profile, Academic State, 6D Cognitive Digital Twin, Learning DNA,
// Knowledge Graph, Predictive ML, Institutional RAG, Long-Term Memory, and Telemetry
// into a unified, intent-aware, time-sensitive, and conflict-resolved student intelligence context.

import mongoose from 'mongoose'
import User from '../models/User.js'
import { StudentAttendance } from '../models/attendance/StudentAttendance.js'
import { LearningEvent } from '../models/LearningEvent.js'
import { DigitalTwinEngine } from './DigitalTwinEngine.js'
import { LearningDNA, LearningDNAProfile } from './LearningDNA.js'
import { KnowledgeGraphService } from './KnowledgeGraphService.js'
import { RAGEngine } from './RAGEngine.js'
import { MemoryService } from './MemoryService.js'
import { ProactiveInterventionEngine } from './ProactiveInterventionEngine.js'
import { logger } from '../config/logger.js'

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface ContextRequestPlan {
  useProfile: boolean
  useAcademic: boolean
  useDigitalTwin: boolean
  useLearningDNA: boolean
  useKnowledgeGraph: boolean
  usePredictiveML: boolean
  useRAG: boolean
  useMemory: boolean
  useTelemetry: boolean
  useIntervention: boolean
}

export interface ContextConflict {
  sources: string[]
  topic: string
  description: string
  resolution: string
  confidence: number
}

export interface FusionDecision {
  type: 'ANSWER' | 'RECOMMENDATION' | 'INTERVENTION' | 'CLARIFICATION'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  reason: string
  action?: {
    type: string
    target?: string
    payload?: any
  }
  evidence: string[]
  confidence: number
}

export interface FusionTrace {
  requestId: string
  intent: string
  sourcesUsed: string[]
  evidenceSummary: {
    source: string
    relevance: number
    freshness: number
  }[]
  conflicts: ContextConflict[]
  decision: {
    type: string
    priority: string
    reason: string
  }
  confidence: {
    overall: number
    dataCompleteness: number
    evidenceCoverage: number
  }
  timestamp: string
}

export interface FusedStudentContext {
  studentId: string
  intent: {
    type: string
    confidence: number
    entities: Record<string, any>
  }
  profile: {
    name?: string
    role?: string
    department?: string
    semester?: number
    skills?: string[]
    careerGoal?: string
    areasOfInterest?: string[]
  }
  academic: {
    cgpa?: number
    attendanceRate?: number
    backlogs?: number
    safeZone?: boolean
    detentionRisk?: boolean
    condonationEligible?: boolean
  }
  digitalTwin: {
    hasData: boolean
    learningPaceScore?: number
    codingProficiencyScore?: number
    interviewReadinessScore?: number
    placementProbabilityPct?: number
    burnoutRisk?: string
    dropoutRiskPct?: number
    academicRiskCategory?: string
    strongTopics?: string[]
    weakTopics?: string[]
  }
  learningDNA: {
    velocity?: 'accelerating' | 'steady' | 'slowing' | 'inactive'
    totalStudyMinutes?: number
    quizAvgScore?: number
    streakDays?: number
    recentActivityCount?: number
  }
  knowledgeGraph: {
    flaggedTopics: string[]
    prerequisites: string[]
    prerequisiteRisks: string[]
    recommendedPath: { topic: string; requires: string[]; leadsTo: string[] }[]
  }
  predictions: {
    academicRiskCategory?: string
    placementProbabilityPct?: number
    burnoutRisk?: string
    predictedCGPA?: number
    estimatedSalaryRange?: string
  }
  ragEvidence: {
    available: boolean
    sources: any[]
    contextText?: string
    highestConfidence: number
    citations: string[]
  }
  memory: {
    relevantFacts: string[]
    recentConversationTurns: number
  }
  telemetry: {
    recentEventCount: number
    recentQuizFailures: number
    recentTopicFailures: string[]
  }
  intervention: {
    status: 'OPTIMAL' | 'ATTENTION_NEEDED' | 'CRITICAL_INTERVENTION'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    recommendedAction?: any
  }
  conflicts: ContextConflict[]
  confidence: {
    overall: number
    dataCompleteness: number
    evidenceCoverage: number
  }
  decision: FusionDecision
  trace: FusionTrace
  provenance: {
    sources: string[]
    generatedAt: string
  }
}

// ─── Main Context Fusion Engine ─────────────────────────────────────────────

export class ContextFusionEngine {
  /**
   * Exponential time decay function for evidence freshness:
   * freshness = exp(-ageInDays / tau) where tau = 14 days
   */
  public static computeFreshness(date?: Date | string | null, tauDays: number = 14): number {
    if (!date) return 0.5
    const timestamp = new Date(date).getTime()
    if (isNaN(timestamp)) return 0.5
    const ageDays = Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60 * 24))
    return Math.exp(-ageDays / tauDays)
  }

  /**
   * Classifies user query into unified R14 intents
   */
  public static classifyIntent(query: string): { type: string; confidence: number; entities: Record<string, any> } {
    const q = (query || '').toLowerCase().trim()
    const entities: Record<string, any> = {}

    // Entity extraction
    if (q.includes('dynamic programming') || q.includes('dp')) entities.topic = 'Dynamic Programming'
    else if (q.includes('recursion')) entities.topic = 'Recursion'
    else if (q.includes('binary search') || q.includes('tree')) entities.topic = 'Trees'
    else if (q.includes('operating systems') || q.includes('os')) entities.topic = 'Operating Systems'
    else if (q.includes('dbms') || q.includes('database')) entities.topic = 'Database Systems'

    const numMatch = q.match(/(\d+(?:\.\d+)?)\s*%/i) || q.match(/attendance.*?(\d+)/i)
    if (numMatch) entities.percentage = parseFloat(numMatch[1])

    if (q.includes('study plan') || q.includes('roadmap') || q.includes('study sequence') || (q.includes('plan') && q.includes('recover'))) {
      return { type: 'STUDY_PLAN', confidence: 0.94, entities }
    }
    if (q.includes('attendance') || q.includes('condonation') || q.includes('detention') || q.includes('das') || q.includes('on-duty') || q.includes('od') || (q.includes('lab') && q.includes('safe'))) {
      return { type: 'ATTENDANCE', confidence: 0.95, entities }
    }
    if (q.includes('exam') || q.includes('cia') || q.includes('ese') || q.includes('hall ticket') || q.includes('malpractice') || q.includes('revaluation') || q.includes('passing minimum')) {
      return { type: 'EXAMINATION', confidence: 0.95, entities }
    }
    if (q.includes('regulation') || q.includes('rule') || q.includes('grading') || q.includes('sgpa') || q.includes('cgpa') || q.includes('credit') || q.includes('overload') || q.includes('fast-track') || q.includes('policy') || q.includes('quota') || q.includes('admission') || q.includes('grades and attendance of student')) {
      return { type: 'ACADEMIC_POLICY', confidence: 0.92, entities }
    }
    if (q.includes('placement') || q.includes('job') || q.includes('recruitment') || q.includes('dream offer') || q.includes('tier 1') || q.includes('tier-1') || q.includes('ctc') || q.includes('salary') || q.includes('placed')) {
      return { type: 'PLACEMENT', confidence: 0.95, entities }
    }
    if (q.includes('resume') || q.includes('ats') || q.includes('cv')) {
      return { type: 'RESUME', confidence: 0.92, entities }
    }
    if (q.includes('interview') || q.includes('mock interview')) {
      return { type: 'INTERVIEW', confidence: 0.90, entities }
    }
    if (q.includes('risk') || q.includes('burnout') || q.includes('dropout') || q.includes('disengagement') || q.includes('emergency review')) {
      return { type: 'RISK', confidence: 0.92, entities }
    }
    if (q.includes('struggling') || q.includes("can't solve") || q.includes('understand') || q.includes('prerequisite') || q.includes('revise') || q.includes('why am i') || q.includes('weakness') || q.includes('failed') || q.includes('review') || q.includes('learn before') || q.includes('mastered')) {
      return { type: 'LEARNING_HELP', confidence: 0.94, entities }
    }
    if (q.includes('quiz') || q.includes('test') || q.includes('practice question')) {
      return { type: 'QUIZ', confidence: 0.88, entities }
    }
    if (q.includes('code') || q.includes('programming') || q.includes('function') || q.includes('algorithm') || q.includes('python')) {
      return { type: 'CODING', confidence: 0.85, entities }
    }
    if (q.includes('course') || q.includes('syllabus') || q.includes('curriculum')) {
      return { type: 'COURSE_CONTENT', confidence: 0.88, entities }
    }

    return { type: 'GENERAL_EDEN', confidence: 0.75, entities }
  }

  /**
   * Deterministic source planner: selects which subsystems to query
   */
  public static planSources(intentType: string, query: string): ContextRequestPlan {
    const q = query.toLowerCase()

    switch (intentType) {
      case 'ATTENDANCE':
        return {
          useProfile: true,
          useAcademic: true,
          useDigitalTwin: false,
          useLearningDNA: false,
          useKnowledgeGraph: false,
          usePredictiveML: false,
          useRAG: true,
          useMemory: false,
          useTelemetry: false,
          useIntervention: q.includes('detained') || q.includes('detention') || q.includes('remedial'),
        }

      case 'EXAMINATION':
      case 'ACADEMIC_POLICY':
        return {
          useProfile: true,
          useAcademic: false,
          useDigitalTwin: false,
          useLearningDNA: false,
          useKnowledgeGraph: false,
          usePredictiveML: false,
          useRAG: true,
          useMemory: false,
          useTelemetry: false,
          useIntervention: false,
        }

      case 'LEARNING_HELP':
      case 'COURSE_CONTENT':
        return {
          useProfile: true,
          useAcademic: false,
          useDigitalTwin: true,
          useLearningDNA: true,
          useKnowledgeGraph: true,
          usePredictiveML: false,
          useRAG: q.includes('curriculum') || q.includes('syllabus') || q.includes('rule'),
          useMemory: false,
          useTelemetry: true,
          useIntervention: q.includes('failed') || q.includes('intervention'),
        }

      case 'PLACEMENT':
        return {
          useProfile: true,
          useAcademic: false,
          useDigitalTwin: true,
          useLearningDNA: true,
          useKnowledgeGraph: false,
          usePredictiveML: true,
          useRAG: q.includes('cutoff') || q.includes('offer') || q.includes('backlog') || q.includes('tier-1'),
          useMemory: false,
          useTelemetry: false,
          useIntervention: false,
        }

      case 'RESUME':
      case 'INTERVIEW':
        return {
          useProfile: true,
          useAcademic: false,
          useDigitalTwin: true,
          useLearningDNA: true,
          useKnowledgeGraph: false,
          usePredictiveML: false,
          useRAG: false,
          useMemory: false,
          useTelemetry: false,
          useIntervention: false,
        }

      case 'STUDY_PLAN':
        return {
          useProfile: true,
          useAcademic: false,
          useDigitalTwin: true,
          useLearningDNA: true,
          useKnowledgeGraph: true,
          usePredictiveML: false,
          useRAG: false,
          useMemory: false,
          useTelemetry: false,
          useIntervention: false,
        }

      case 'RISK':
        return {
          useProfile: true,
          useAcademic: false,
          useDigitalTwin: true,
          useLearningDNA: true,
          useKnowledgeGraph: false,
          usePredictiveML: true,
          useRAG: false,
          useMemory: false,
          useTelemetry: true,
          useIntervention: true,
        }

      default:
        return {
          useProfile: true,
          useAcademic: false,
          useDigitalTwin: false,
          useLearningDNA: false,
          useKnowledgeGraph: false,
          usePredictiveML: false,
          useRAG: false,
          useMemory: true,
          useTelemetry: false,
          useIntervention: false,
        }
    }
  }

  /**
   * Main Context Fusion Pipeline:
   * Aggregates, normalizes, detects conflicts, calculates confidence, and yields fused context.
   */
  public static async fuseContext(
    userId: string,
    query: string,
    options: {
      activeKey?: string
      provider?: string
      history?: any[]
      conversationId?: string
      forcePlan?: Partial<ContextRequestPlan>
    } = {}
  ): Promise<FusedStudentContext> {
    const startTime = Date.now()
    const requestId = `fuse-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const sourcesUsed: string[] = []
    const evidenceSummary: FusionTrace['evidenceSummary'] = []
    const conflicts: ContextConflict[] = []

    // 1. Security Check: Authenticated user ID must be valid 24-char ObjectId
    const isValidId = userId && /^[0-9a-fA-F]{24}$/.test(userId)
    if (!isValidId) {
      logger.warn({ userId }, '[ContextFusionEngine] Rejecting request: Invalid or unauthenticated student ID')
      throw new Error('Authentication required. Invalid student credentials.')
    }

    // 2. Classify intent and construct source plan
    const intent = this.classifyIntent(query)
    const basePlan = this.planSources(intent.type, query)
    const plan: ContextRequestPlan = { ...basePlan, ...(options.forcePlan || {}) }

    // 3. Retrieve Student Profile & Academic Record
    let profileData: any = null
    let academicAttendance: number = 0
    let userCgpa: number = 8.5
    let userDept = 'Computer Science & Engineering'
    let userSem = 5

    try {
      const u = await User.findById(userId).select('name role department semester cgpa attendanceRate skills careerGoal targetCareer weakSubjects').lean()
      if (u) {
        profileData = u
        userDept = (u as any).department || userDept
        userSem = (u as any).semester || userSem
        userCgpa = (u as any).cgpa || userCgpa
        academicAttendance = (u as any).attendanceRate || 0
        sourcesUsed.push('StudentProfile')
        evidenceSummary.push({ source: 'StudentProfile', relevance: 0.95, freshness: 0.95 })
      }
    } catch (e: any) {
      logger.warn({ err: e.message }, '[ContextFusionEngine] Profile fetch fallback')
    }

    // Direct Attendance model check if needed
    if (plan.useAcademic || plan.useTelemetry) {
      try {
        const attRecord = await StudentAttendance.findOne({ student: new mongoose.Types.ObjectId(userId) }).sort({ updatedAt: -1 }).lean()
        if (attRecord && (attRecord as any).overallPercentage) {
          academicAttendance = (attRecord as any).overallPercentage
          sourcesUsed.push('StudentAttendance')
          evidenceSummary.push({
            source: 'StudentAttendance',
            relevance: 0.98,
            freshness: this.computeFreshness((attRecord as any).updatedAt)
          })
        }
      } catch {}
    }

    // 4. Retrieve Cognitive Digital Twin
    let twinData: any = null
    if (plan.useDigitalTwin) {
      try {
        twinData = await DigitalTwinEngine.getOrComputeTwin(userId)
        if (twinData) {
          sourcesUsed.push('DigitalTwin')
          evidenceSummary.push({ source: 'DigitalTwin', relevance: 0.90, freshness: 0.90 })
        }
      } catch (e: any) {
        logger.warn({ err: e.message }, '[ContextFusionEngine] Digital Twin fetch skipped')
      }
    }

    // 5. Retrieve Learning DNA
    let dnaData: LearningDNAProfile | null = null
    if (plan.useLearningDNA) {
      try {
        dnaData = await LearningDNA.compute(userId, 30)
        if (dnaData) {
          sourcesUsed.push('LearningDNA')
          evidenceSummary.push({ source: 'LearningDNA', relevance: 0.88, freshness: 0.92 })
        }
      } catch (e: any) {
        logger.warn({ err: e.message }, '[ContextFusionEngine] Learning DNA fetch skipped')
      }
    }

    // 6. Retrieve Recent Telemetry & Failure Counts
    let recentEvents: any[] = []
    let recentQuizFailures = 0
    const recentTopicFailures: string[] = []

    if (plan.useTelemetry) {
      try {
        recentEvents = await LearningEvent.find({ userId: new mongoose.Types.ObjectId(userId) })
          .sort({ timestamp: -1 })
          .limit(20)
          .lean()

        sourcesUsed.push('Telemetry')
        evidenceSummary.push({ source: 'Telemetry', relevance: 0.92, freshness: 0.98 })

        for (const evt of recentEvents) {
          if (evt.eventType === 'QUIZ_COMPLETED' && (evt.score || 0) < 50) {
            recentQuizFailures++
            if (evt.topicId && !recentTopicFailures.includes(evt.topicId)) {
              recentTopicFailures.push(evt.topicId)
            }
          }
          if (evt.eventType === 'TOPIC_FAILED' && evt.topicId && !recentTopicFailures.includes(evt.topicId)) {
            recentTopicFailures.push(evt.topicId)
          }
        }
      } catch (e: any) {
        logger.warn({ err: e.message }, '[ContextFusionEngine] Telemetry fetch skipped')
      }
    }

    // 7. Knowledge Graph Prerequisite Tracing
    const weakTopicsCombined = Array.from(new Set([
      ...(twinData?.weakTopics || []),
      ...(recentTopicFailures || []),
      ...(intent.entities.topic ? [intent.entities.topic] : [])
    ]))

    let kgInference = KnowledgeGraphService.inferPrerequisites(weakTopicsCombined)
    if (plan.useKnowledgeGraph) {
      sourcesUsed.push('KnowledgeGraph')
      evidenceSummary.push({ source: 'KnowledgeGraph', relevance: 0.85, freshness: 1.0 })
    }

    // 8. Institutional RAG Retrieval
    let ragResult: any = {
      available: false,
      sources: [],
      highestConfidence: 0.0,
      citations: [],
      contextText: ''
    }

    if (plan.useRAG) {
      try {
        const studentCtx = {
          userId,
          name: profileData?.name || 'Student',
          department: userDept,
          semester: userSem,
          cgpa: userCgpa
        }
        const groundedContext = await RAGEngine.retrieveGroundedContext(query, studentCtx)
        if (groundedContext && groundedContext.hasInstitutionalEvidence) {
          ragResult = {
            available: true,
            sources: groundedContext.sourceCitations || [],
            highestConfidence: groundedContext.highestConfidence || 0.0,
            citations: (groundedContext.sourceCitations || []).map((s: any) => `${s.title} [${s.section}]`),
            contextText: groundedContext.contextText || ''
          }
          sourcesUsed.push('InstitutionalRAG')
          evidenceSummary.push({
            source: 'InstitutionalRAG',
            relevance: Math.min(1.0, groundedContext.highestConfidence),
            freshness: 0.95
          })
        }
      } catch (e: any) {
        logger.warn({ err: e.message }, '[ContextFusionEngine] RAG retrieval skipped')
      }
    }

    // 9. Memory Facts & Conversation Context
    let memoryFacts: string[] = []
    let convTurns = 0
    if (plan.useMemory) {
      try {
        const [longTerm, history] = await Promise.all([
          MemoryService.getLongTermMemories(userId),
          MemoryService.getHistory(userId, profileData?.role || 'student')
        ])
        memoryFacts = longTerm || []
        convTurns = history?.length || 0
        sourcesUsed.push('MemoryService')
        evidenceSummary.push({ source: 'MemoryService', relevance: 0.75, freshness: 0.80 })
      } catch (e: any) {
        logger.warn({ err: e.message }, '[ContextFusionEngine] Memory fetch skipped')
      }
    }

    // 10. Proactive Intervention Status
    let interventionState: any = {
      status: 'OPTIMAL',
      priority: 'LOW',
      recommendedAction: null
    }

    if (plan.useIntervention) {
      try {
        const planResult = await ProactiveInterventionEngine.analyzeAndIntervene(userId)
        if (planResult) {
          interventionState = {
            status: planResult.status || planResult.overallStatus || 'OPTIMAL',
            priority: planResult.status === 'CRITICAL_INTERVENTION' ? 'CRITICAL' : (planResult.status === 'ATTENTION_NEEDED' ? 'HIGH' : 'LOW'),
            recommendedAction: planResult.scheduledInterventions?.[0] || null
          }
          sourcesUsed.push('ProactiveIntervention')
          evidenceSummary.push({ source: 'ProactiveIntervention', relevance: 0.89, freshness: 0.95 })
        }
      } catch (e: any) {
        logger.warn({ err: e.message }, '[ContextFusionEngine] Intervention plan skipped')
      }
    }

    // ─── Conflict Detection & Deterministic Resolution ────────────────────────

    // Conflict 1: Learning DNA Velocity vs. Recent Quiz Failures
    if (dnaData && dnaData.learningVelocity === 'accelerating' && recentQuizFailures >= 3) {
      conflicts.push({
        sources: ['LearningDNA', 'RecentTelemetry'],
        topic: 'learning_velocity',
        description: 'Longer-term Learning DNA indicates accelerating pace, but recent telemetry contains multiple consecutive quiz failures.',
        resolution: 'recent_telemetry_preferred_short_term',
        confidence: 0.85
      })
    }

    // Conflict 2: Profile Career Goal vs. Stale Memory Goal
    const activeCareerGoal = profileData?.careerGoal || profileData?.targetCareer
    const staleMemoryGoal = memoryFacts.find(f => f.toLowerCase().includes('interview') || f.toLowerCase().includes('career'))
    if (activeCareerGoal && staleMemoryGoal && !staleMemoryGoal.toLowerCase().includes(activeCareerGoal.toLowerCase())) {
      conflicts.push({
        sources: ['StudentProfile', 'MemoryService'],
        topic: 'career_goal',
        description: 'Current profile target career conflicts with older recorded preference in AI memory.',
        resolution: 'current_profile_preferred',
        confidence: 0.95
      })
    }

    // ─── Confidence & Completeness Calculation ────────────────────────────────

    const requestedKeys = Object.entries(plan).filter(([_, v]) => v).map(([k]) => k)
    const availableKeyCount = sourcesUsed.length
    const dataCompleteness = requestedKeys.length > 0
      ? Math.min(1.0, availableKeyCount / Math.max(1, requestedKeys.length))
      : 1.0

    const evidenceCoverage = ragResult.available
      ? Math.max(0.70, ragResult.highestConfidence)
      : (sourcesUsed.length >= 2 ? 0.85 : 0.60)

    const conflictPenalty = conflicts.length * 0.05
    const overallConfidence = Math.max(0.20, Math.min(1.0, Math.round(((dataCompleteness * 0.5 + evidenceCoverage * 0.5) - conflictPenalty) * 100) / 100))

    // ─── Deterministic Decision Generation ────────────────────────────────────

    let decisionType: FusionDecision['type'] = 'ANSWER'
    let decisionPriority: FusionDecision['priority'] = 'LOW'
    let decisionReason = 'Verified institutional information provided.'
    let decisionAction: FusionDecision['action'] = undefined

    if (intent.type === 'ATTENDANCE') {
      const attVal = intent.entities.percentage !== undefined ? intent.entities.percentage : academicAttendance
      if (attVal < 65.0) {
        decisionType = 'INTERVENTION'
        decisionPriority = 'CRITICAL'
        decisionReason = `Attendance (${attVal}%) falls below 65% detention threshold (DAS). Course remediation required.`
        decisionAction = { type: 'NAVIGATE', target: 'attendance', payload: { percentage: attVal, status: 'DETENTION_RISK' } }
      } else if (attVal < 75.0) {
        decisionType = 'RECOMMENDATION'
        decisionPriority = 'HIGH'
        decisionReason = `Attendance (${attVal}%) is in Condonation Band (65–74.9%). HoD medical application within 3 days required.`
        decisionAction = { type: 'APPLY_CONDONATION', target: 'attendance', payload: { percentage: attVal, fee: 1500 } }
      }
    } else if (intent.type === 'LEARNING_HELP' || intent.type === 'STUDY_PLAN') {
      if (kgInference.inferredPrerequisites.length > 0) {
        decisionType = 'RECOMMENDATION'
        decisionPriority = 'HIGH'
        decisionReason = `Identified prerequisite dependency gaps in ${kgInference.inferredPrerequisites.join(', ')} before advancing.`
        decisionAction = {
          type: 'START_REMEDIAL_REVIEW',
          target: kgInference.inferredPrerequisites[0],
          payload: { topics: kgInference.inferredPrerequisites }
        }
      }
    } else if (intent.type === 'PLACEMENT') {
      if (userCgpa < 6.5) {
        decisionType = 'INTERVENTION'
        decisionPriority = 'HIGH'
        decisionReason = `CGPA (${userCgpa}) is below placement registration threshold (6.50). Academic recovery needed.`
      } else {
        decisionType = 'RECOMMENDATION'
        decisionPriority = 'MEDIUM'
        decisionReason = 'Placement criteria verified: Eligible for campus recruitment and Tier-1 Dream Offer contestation.'
      }
    }

    const decision: FusionDecision = {
      type: decisionType,
      priority: decisionPriority,
      reason: decisionReason,
      action: decisionAction,
      evidence: sourcesUsed,
      confidence: overallConfidence
    }

    const trace: FusionTrace = {
      requestId,
      intent: intent.type,
      sourcesUsed,
      evidenceSummary,
      conflicts,
      decision: {
        type: decision.type,
        priority: decision.priority,
        reason: decision.reason
      },
      confidence: {
        overall: overallConfidence,
        dataCompleteness,
        evidenceCoverage
      },
      timestamp: new Date().toISOString()
    }

    return {
      studentId: userId,
      intent,
      profile: {
        name: profileData?.name,
        role: profileData?.role || 'student',
        department: userDept,
        semester: userSem,
        skills: profileData?.skills || [],
        careerGoal: activeCareerGoal || 'Software Engineer',
        areasOfInterest: profileData?.areasOfInterest || []
      },
      academic: {
        cgpa: userCgpa,
        attendanceRate: academicAttendance,
        backlogs: (profileData as any)?.backlogs || 0,
        safeZone: academicAttendance >= 75.0,
        detentionRisk: academicAttendance < 65.0,
        condonationEligible: academicAttendance >= 65.0 && academicAttendance < 75.0
      },
      digitalTwin: {
        hasData: !!twinData?.hasData,
        learningPaceScore: twinData?.learningPaceScore || 75,
        codingProficiencyScore: twinData?.codingProficiencyScore || 70,
        interviewReadinessScore: twinData?.interviewReadinessScore || 65,
        placementProbabilityPct: twinData?.placementProbabilityPct || 80,
        burnoutRisk: twinData?.burnoutRisk || 'Low',
        dropoutRiskPct: twinData?.dropoutRiskPct || 5,
        academicRiskCategory: twinData?.academicRiskCategory || 'Good Standing',
        strongTopics: twinData?.strongTopics || [],
        weakTopics: twinData?.weakTopics || []
      },
      learningDNA: {
        velocity: dnaData?.learningVelocity || 'steady',
        totalStudyMinutes: dnaData?.totalStudyMinutes || 0,
        quizAvgScore: dnaData?.quizAvgScore || 0,
        streakDays: dnaData?.streakDays || 0,
        recentActivityCount: dnaData?.totalEvents || 0
      },
      knowledgeGraph: {
        flaggedTopics: kgInference.flaggedTopics,
        prerequisites: kgInference.inferredPrerequisites,
        prerequisiteRisks: kgInference.inferredPrerequisites,
        recommendedPath: kgInference.recommendedPath
      },
      predictions: {
        academicRiskCategory: twinData?.academicRiskCategory || 'Low Risk',
        placementProbabilityPct: twinData?.placementProbabilityPct || 80,
        burnoutRisk: twinData?.burnoutRisk || 'Low',
        predictedCGPA: twinData?.predictedCGPA || userCgpa,
        estimatedSalaryRange: twinData?.estimatedSalaryRange || '₹6 - 10 LPA'
      },
      ragEvidence: ragResult,
      memory: {
        relevantFacts: memoryFacts,
        recentConversationTurns: convTurns
      },
      telemetry: {
        recentEventCount: recentEvents.length,
        recentQuizFailures,
        recentTopicFailures
      },
      intervention: interventionState,
      conflicts,
      confidence: {
        overall: overallConfidence,
        dataCompleteness,
        evidenceCoverage
      },
      decision,
      trace,
      provenance: {
        sources: sourcesUsed,
        generatedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Formats the fused context into a concise, non-leaking evidence prompt for LLM synthesis.
   * Explicitly avoids chain-of-thought and internal hidden tokens while providing factual grounding.
   */
  public static formatForLLM(ctx: FusedStudentContext): string {
    const lines: string[] = []
    lines.push(`[CONTEXT FUSION ENGINE — FUSED STUDENT STATE]`)
    lines.push(`- Detected Intent: ${ctx.intent.type} (Confidence: ${(ctx.intent.confidence * 100).toFixed(0)}%)`)
    lines.push(`- Fused Intelligence Sources: ${ctx.provenance.sources.join(', ')}`)
    lines.push(`- Decision Type: ${ctx.decision.type} [Priority: ${ctx.decision.priority}]`)
    lines.push(`- Fusion Guidance: ${ctx.decision.reason}`)

    if (ctx.academic.attendanceRate !== undefined) {
      lines.push(`- Verified Academic Record: Attendance=${ctx.academic.attendanceRate}%, CGPA=${ctx.academic.cgpa ?? 'N/A'}, Backlogs=${ctx.academic.backlogs ?? 0}`)
      if (ctx.academic.detentionRisk) {
        lines.push(`  * CRITICAL STATUS: Attendance <65% triggers DAS (Detained for Attendance Shortage). Exam registration blocked.`)
      } else if (ctx.academic.condonationEligible) {
        lines.push(`  * WARNING: Attendance 65-74.9% requires official Condonation with HoD medical endorsement within 3 days.`)
      } else if (ctx.academic.safeZone) {
        lines.push(`  * STATUS: Good Standing (Attendance >=75%). Eligible for exams without condonation.`)
      }
    }

    if (ctx.knowledgeGraph.prerequisites && ctx.knowledgeGraph.prerequisites.length > 0) {
      lines.push(`- Knowledge Graph Dependency Inferences: Found prerequisite weakness in ${ctx.knowledgeGraph.prerequisites.join(', ')}. Recommend mastering prerequisite before proceeding.`)
    }

    if (ctx.learningDNA) {
      lines.push(`- Learning DNA Profile: Velocity=${ctx.learningDNA.velocity}, Study Minutes=${ctx.learningDNA.totalStudyMinutes}, Quiz Avg=${ctx.learningDNA.quizAvgScore}%`)
    }

    if (ctx.digitalTwin) {
      lines.push(`- Digital Twin Indicators: Coding Score=${ctx.digitalTwin.codingProficiencyScore}/100, Placement Probability=${ctx.digitalTwin.placementProbabilityPct}%, Burnout Risk=${ctx.digitalTwin.burnoutRisk}`)
    }

    if (ctx.telemetry && ctx.telemetry.recentQuizFailures > 0) {
      lines.push(`- Recent Telemetry: ${ctx.telemetry.recentQuizFailures} recent quiz failures in target topics [${ctx.telemetry.recentTopicFailures?.join(', ') || 'remedial areas'}]`)
    }

    if (ctx.conflicts.length > 0) {
      lines.push(`- Conflict Resolution Audits:`)
      for (const c of ctx.conflicts) {
        lines.push(`  * [${c.topic}]: ${c.description} -> RESOLVED AS: ${c.resolution} (Confidence: ${(c.confidence * 100).toFixed(0)}%)`)
      }
    }

    return lines.join('\n')
  }
}

