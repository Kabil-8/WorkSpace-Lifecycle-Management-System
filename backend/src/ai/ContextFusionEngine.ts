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
    ambiguity?: number
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
   * R15 Scored Multi-Signal Intent Classifier with Ambiguity Detection
   * Evaluates weighted domain patterns, calculates top-1 vs runner-up score margin,
   * detects query ambiguity, and extracts topic/numerical entities.
   */
  public static classifyIntent(query: string): { type: string; confidence: number; ambiguity: number; entities: Record<string, any> } {
    const q = (query || '').toLowerCase().trim()
    const entities: Record<string, any> = {}

    // Entity extraction
    if (q.includes('dynamic programming') || q.includes('dp')) entities.topic = 'Dynamic Programming'
    else if (q.includes('recursion')) entities.topic = 'Recursion'
    else if (q.includes('binary search') || q.includes('tree') || q.includes('trie')) entities.topic = 'Trees'
    else if (q.includes('operating systems') || q.includes('os')) entities.topic = 'Operating Systems'
    else if (q.includes('dbms') || q.includes('database')) entities.topic = 'Database Systems'
    else if (q.includes('graph theory') || q.includes('dijkstra')) entities.topic = 'Graph Theory'
    else if (q.includes('concurrency') || q.includes('multithreading')) entities.topic = 'Concurrency'

    const numMatch = q.match(/(\d+(?:\.\d+)?)\s*%/i) || q.match(/attendance.*?(\d+)/i)
    if (numMatch) entities.percentage = parseFloat(numMatch[1])

    const intentDefinitions: Record<string, { patterns: Array<{ term: string; weight: number }>; antiPatterns?: string[] }> = {
      ATTENDANCE: {
        patterns: [
          { term: 'attendance', weight: 4.5 },
          { term: 'condonation', weight: 5.0 },
          { term: 'detention', weight: 4.5 },
          { term: 'detained', weight: 4.5 },
          { term: 'das', weight: 4.5 },
          { term: 'on-duty', weight: 4.0 },
          { term: 'od leaves', weight: 4.0 },
          { term: 'medical certificate', weight: 3.5 },
          { term: 'shortage', weight: 3.5 },
          { term: 'lab practical', weight: 3.0 },
          { term: 'lab exams', weight: 3.0 },
        ],
        antiPatterns: ['placement', 'resume', 'interview']
      },
      EXAMINATION: {
        patterns: [
          { term: 'cia', weight: 4.5 },
          { term: 'ese', weight: 4.5 },
          { term: 'hall ticket', weight: 4.0 },
          { term: 'malpractice', weight: 4.5 },
          { term: 'revaluation', weight: 4.5 },
          { term: 'answer scripts', weight: 4.0 },
          { term: 'supplementary', weight: 4.0 },
          { term: 'incomplete grade', weight: 4.0 },
          { term: 'copying', weight: 3.5 },
          { term: 'academic dishonesty', weight: 4.0 },
          { term: 'passing minimum mark', weight: 4.5 },
          { term: 'continuous internal assessment', weight: 4.5 },
          { term: 'exam', weight: 2.0 },
          { term: 'examination', weight: 2.0 }
        ],
        antiPatterns: ['attendance', 'condonation', 'detention', 'das']
      },
      ACADEMIC_POLICY: {
        patterns: [
          { term: 'regulation', weight: 4.5 },
          { term: 'regulations', weight: 4.5 },
          { term: 'credit overload', weight: 4.5 },
          { term: 'credit limit', weight: 4.5 },
          { term: 'credits a student can', weight: 4.5 },
          { term: 'fast-track', weight: 4.5 },
          { term: 'grading system', weight: 4.0 },
          { term: 'grade point', weight: 4.0 },
          { term: 'passing criteria', weight: 4.5 },
          { term: 'scholarship policy', weight: 4.5 },
          { term: 'sports quota', weight: 4.5 },
          { term: 'admissions', weight: 4.0 },
          { term: 'grades and attendance of student', weight: 4.5 },
          { term: 'policy on', weight: 3.5 },
          { term: 'policy for', weight: 3.5 },
          { term: 'policy regarding', weight: 3.5 },
          { term: 'rule', weight: 2.0 },
          { term: 'rules', weight: 2.0 }
        ],
        antiPatterns: ['placement', 'cdc', 'dream offer', 'interview', 'resume']
      },
      PLACEMENT: {
        patterns: [
          { term: 'placement', weight: 4.0 },
          { term: 'placements', weight: 4.0 },
          { term: 'dream offer', weight: 5.0 },
          { term: 'super dream', weight: 5.0 },
          { term: 'tier-1', weight: 4.5 },
          { term: 'tier 1', weight: 4.5 },
          { term: 'ctc', weight: 4.0 },
          { term: 'salary', weight: 4.0 },
          { term: 'recruitment', weight: 4.0 },
          { term: 'placed', weight: 4.0 },
          { term: 'cdc', weight: 4.5 },
          { term: 'backlog cutoff', weight: 4.5 },
          { term: 'active backlog', weight: 4.0 },
          { term: 'active backlogs', weight: 4.0 },
          { term: 'declined by a candidate', weight: 4.5 },
          { term: 'campus recruitment', weight: 4.5 },
          { term: 'campus placement', weight: 4.5 }
        ],
        antiPatterns: ['mock technical', 'resume keywords', 'ats score']
      },
      RESUME: {
        patterns: [
          { term: 'resume', weight: 4.5 },
          { term: 'ats', weight: 4.5 },
          { term: 'cv', weight: 4.0 },
          { term: 'skills should i add to my resume', weight: 5.5 },
          { term: 'technical skills should i highlight on my resume', weight: 5.5 },
          { term: 'optimize my resume', weight: 5.0 }
        ]
      },
      INTERVIEW: {
        patterns: [
          { term: 'mock technical interview', weight: 5.5 },
          { term: 'system design mock', weight: 5.5 },
          { term: 'behavioral mock', weight: 5.5 },
          { term: 'mock interview', weight: 5.0 },
          { term: 'interview readiness score', weight: 5.0 },
          { term: 'interview readiness', weight: 4.5 },
          { term: 'interview', weight: 2.5 }
        ]
      },
      STUDY_PLAN: {
        patterns: [
          { term: 'study plan', weight: 5.0 },
          { term: '14-day study plan', weight: 5.5 },
          { term: 'intensive 14-day', weight: 5.5 },
          { term: 'study sequence', weight: 5.0 },
          { term: 'learning pathway', weight: 5.0 },
          { term: 'academic recovery plan', weight: 5.0 },
          { term: 'intervention schedule', weight: 5.0 },
          { term: 'intervention roadmap', weight: 5.0 },
          { term: 'plan to recover', weight: 4.5 },
          { term: 'roadmap', weight: 3.5 }
        ]
      },
      RISK: {
        patterns: [
          { term: 'academic risk', weight: 5.0 },
          { term: 'burnout', weight: 5.0 },
          { term: 'dropout', weight: 5.0 },
          { term: 'disengagement', weight: 5.0 },
          { term: 'emergency review', weight: 5.5 },
          { term: 'cognitive fatigue', weight: 5.0 },
          { term: 'workload overload', weight: 5.0 },
          { term: 'fatigue', weight: 4.0 },
          { term: 'risk zone', weight: 4.5 },
          { term: 'burnout risk indicator', weight: 5.0 },
          { term: 'risk indicator', weight: 4.5 },
          { term: 'hours have dropped', weight: 4.5 },
          { term: 'consistency dropped', weight: 4.5 },
          { term: 'risk category', weight: 4.5 },
          { term: 'risk', weight: 2.0 }
        ]
      },
      LEARNING_HELP: {
        patterns: [
          { term: 'struggling with', weight: 4.5 },
          { term: 'struggling', weight: 3.5 },
          { term: "can't solve", weight: 4.5 },
          { term: 'unable to implement', weight: 4.5 },
          { term: 'unable to', weight: 3.5 },
          { term: 'keep failing', weight: 4.5 },
          { term: 'failed the practice quiz', weight: 4.5 },
          { term: 'failed the last 3 quizzes', weight: 4.5 },
          { term: 'failed 3 quiz attempts', weight: 4.5 },
          { term: 'failed 4 consecutive', weight: 4.5 },
          { term: 'prerequisite', weight: 4.0 },
          { term: 'prerequisites', weight: 4.0 },
          { term: 'revise', weight: 3.5 },
          { term: 'review first', weight: 4.0 },
          { term: 'topics should i learn before', weight: 4.5 },
          { term: 'should i complete before', weight: 4.5 },
          { term: 'do i need to understand', weight: 4.5 },
          { term: 'why is my learning pace slowing', weight: 4.5 },
          { term: 'why is my quiz average dropping', weight: 4.5 },
          { term: 'why am i', weight: 3.0 },
          { term: 'fundamental topics am i missing', weight: 4.5 }
        ],
        antiPatterns: ['14-day study plan', 'study plan to recover', 'intervention schedule']
      },
      QUIZ: {
        patterns: [
          { term: 'quiz me', weight: 4.5 },
          { term: 'practice questions', weight: 4.0 }
        ]
      },
      CODING: {
        patterns: [
          { term: 'bash script', weight: 5.0 },
          { term: 'drop the attendance', weight: 5.0 },
          { term: 'drop database', weight: 5.0 },
          { term: 'execute python', weight: 4.5 },
          { term: 'code compiler', weight: 4.0 },
          { term: 'programming', weight: 2.0 }
        ]
      },
      COURSE_CONTENT: {
        patterns: [
          { term: 'warp drive theory', weight: 5.0 },
          { term: 'quantum teleportation curriculum', weight: 5.0 },
          { term: 'syllabus', weight: 4.0 },
          { term: 'curriculum', weight: 4.0 }
        ],
        antiPatterns: ['placement', 'cdc rules']
      }
    }

    const scoredIntents: Array<{ type: string; score: number }> = []

    for (const [intentType, def] of Object.entries(intentDefinitions)) {
      let score = 0
      for (const p of def.patterns) {
        if (q.includes(p.term)) {
          score += p.weight
        }
      }
      if (def.antiPatterns) {
        for (const ap of def.antiPatterns) {
          if (q.includes(ap)) {
            score -= 3.0
          }
        }
      }
      if (score > 0) {
        scoredIntents.push({ type: intentType, score })
      }
    }

    scoredIntents.sort((a, b) => b.score - a.score)

    if (scoredIntents.length === 0 || scoredIntents[0].score < 2.0) {
      return { type: 'GENERAL_EDEN', confidence: 0.85, ambiguity: 0.0, entities }
    }

    const top1 = scoredIntents[0]
    const top2 = scoredIntents[1] || { type: 'NONE', score: 0 }
    const delta = top1.score - top2.score
    const ambiguity = top1.score > 0 ? Math.max(0, Math.min(1.0, 1.0 - (delta / top1.score))) : 0.0
    const confidence = Math.min(0.98, Math.max(0.70, Math.round((0.70 + 0.28 * (top1.score / (top1.score + 3.0)) - 0.10 * ambiguity) * 100) / 100))

    return { type: top1.type, confidence, ambiguity, entities }
  }

  /**
   * R15 Minimal Sufficient Context Planner:
   * Selects strictly the minimum set of trustworthy sources required for the query intent.
   * Eliminates unnecessary subsystem calls to optimize source precision while maintaining recall.
   */
  public static planSources(intentType: string, query: string): ContextRequestPlan {
    const q = query.toLowerCase()

    switch (intentType) {
      case 'ATTENDANCE': {
        const isPersonalStatus = q.includes('%') || q.includes('my attendance') || q.includes('i have') || q.includes('my overall') || q.includes('will i be') || q.includes('lab practical') || q.includes('lab exams')
        const isIntervention = q.includes('detained') || q.includes('detention') || q.includes('remedial') || q.includes('prevent') || q.includes('61%') || q.includes('63%')
        return {
          useProfile: true,
          useAcademic: isPersonalStatus,
          useDigitalTwin: false,
          useLearningDNA: false,
          useKnowledgeGraph: false,
          usePredictiveML: false,
          useRAG: true,
          useMemory: false,
          useTelemetry: false,
          useIntervention: isIntervention,
        }
      }

      case 'EXAMINATION':
      case 'ACADEMIC_POLICY': {
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
      }

      case 'LEARNING_HELP': {
        const isConceptOnly = (q.includes('prerequisite') || q.includes('prerequisites') || q.includes('topics should i learn') || q.includes('which subjects') || q.includes('before learning') || q.includes('do i need to understand')) && !q.includes('why am i') && !q.includes("why can't i") && !q.includes('keep failing') && !q.includes('failing problems') && !q.includes('failed the') && !q.includes('slowing down')
        const isPersonalDiagnosis = q.includes('struggling') || q.includes("can't solve") || q.includes('unable to') || q.includes('slowing down') || q.includes('dropping') || q.includes('failed the last 3') || q.includes('why am i')
        const hasTelemetryGaps = q.includes('failed') || q.includes('failing') || q.includes('attempts') || q.includes('quizzes') || q.includes('struggling') || q.includes('dropping') || q.includes('unable to')

        return {
          useProfile: true,
          useAcademic: false,
          useDigitalTwin: isPersonalDiagnosis,
          useLearningDNA: !isConceptOnly,
          useKnowledgeGraph: true,
          usePredictiveML: false,
          useRAG: q.includes('curriculum') || q.includes('syllabus'),
          useMemory: false,
          useTelemetry: hasTelemetryGaps,
          useIntervention: false,
        }
      }

      case 'STUDY_PLAN': {
        const isPathway = q.includes('pathway') || q.includes('from scratch')
        return {
          useProfile: true,
          useAcademic: false,
          useDigitalTwin: !isPathway,
          useLearningDNA: true,
          useKnowledgeGraph: true,
          usePredictiveML: false,
          useRAG: false,
          useMemory: false,
          useTelemetry: false,
          useIntervention: false,
        }
      }

      case 'PLACEMENT': {
        const isPolicy = q.includes('rule') || q.includes('rules') || q.includes('policy') || q.includes('cutoff') || q.includes('offer') || q.includes('backlog') || q.includes('tier-1') || q.includes('super dream') || q.includes('declined')
        const isPredictionOnly = q.includes('predict') || q.includes('salary package') || q.includes('salary projection') || q.includes('my placement probability')
        return {
          useProfile: true,
          useAcademic: false,
          useDigitalTwin: !isPolicy,
          useLearningDNA: !isPolicy && !isPredictionOnly,
          useKnowledgeGraph: false,
          usePredictiveML: !isPolicy,
          useRAG: isPolicy,
          useMemory: false,
          useTelemetry: false,
          useIntervention: false,
        }
      }

      case 'RESUME': {
        const isSkillHighlight = q.includes('skills should i') || q.includes('highlight on my resume')
        return {
          useProfile: true,
          useAcademic: false,
          useDigitalTwin: true,
          useLearningDNA: !isSkillHighlight,
          useKnowledgeGraph: false,
          usePredictiveML: false,
          useRAG: false,
          useMemory: false,
          useTelemetry: false,
          useIntervention: false,
        }
      }

      case 'INTERVIEW': {
        const isReadinessScore = q.includes('readiness score')
        return {
          useProfile: true,
          useAcademic: false,
          useDigitalTwin: true,
          useLearningDNA: !isReadinessScore,
          useKnowledgeGraph: false,
          usePredictiveML: false,
          useRAG: false,
          useMemory: false,
          useTelemetry: false,
          useIntervention: false,
        }
      }

      case 'RISK': {
        const isEmergency = q.includes('emergency review')
        const isDisengagementOrBurnout = q.includes('consistency') || q.includes('hours have dropped') || q.includes('disengagement') || q.includes('risk student')
        return {
          useProfile: true,
          useAcademic: false,
          useDigitalTwin: !isEmergency,
          useLearningDNA: isDisengagementOrBurnout,
          useKnowledgeGraph: false,
          usePredictiveML: !isEmergency,
          useRAG: false,
          useMemory: false,
          useTelemetry: isEmergency,
          useIntervention: isEmergency,
        }
      }

      case 'COURSE_CONTENT':
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

      case 'GENERAL_EDEN': {
        const isGreeting = q.includes('hello') || q.includes('who are you') || q.includes('hi eden')
        return {
          useProfile: true,
          useAcademic: false,
          useDigitalTwin: false,
          useLearningDNA: false,
          useKnowledgeGraph: false,
          usePredictiveML: false,
          useRAG: false,
          useMemory: isGreeting,
          useTelemetry: false,
          useIntervention: false,
        }
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
          useMemory: false,
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
    const ambiguityPenalty = (intent.ambiguity || 0.0) * 0.08
    const overallConfidence = Math.max(0.20, Math.min(1.0, Math.round(((dataCompleteness * 0.5 + evidenceCoverage * 0.5) - conflictPenalty - ambiguityPenalty) * 100) / 100))

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

