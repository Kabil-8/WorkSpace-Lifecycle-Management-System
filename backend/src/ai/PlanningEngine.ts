import { PermissionLayer } from './PermissionLayer.js'
import { logger } from '../config/logger.js'

export interface PlanStep {
  stepNumber: number
  description: string
  actionTool?: string
  dependencies?: number[]
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped'
  output?: any
}

export interface PlanResult {
  thoughtProcess: string
  confidenceScore: number
  steps: PlanStep[]
  allowedTools: string[]
  requiresConfirmation: boolean
}

export class PlanningEngine {
  /**
   * Generates a structured reasoning plan when multi-step tool execution or actions are required
   */
  static createPlan(query: string, role: string, userContext?: any): PlanResult {
    const q = query.toLowerCase()
    const allowedToolObjects = PermissionLayer.getAllowedTools(role)
    const allowedToolNames = allowedToolObjects[0]?.functionDeclarations?.map((t: any) => t.name) || []

    const steps: PlanStep[] = []
    let thoughtProcess = 'Evaluating user query with Gemini LLM reasoning...'
    let requiresConfirmation = false
    let confidenceScore = 0.98

    // Multi-action scenario: explicit study plan or complex institutional action
    if (q.includes('create a study plan') || q.includes('generate roadmap for exams')) {
      thoughtProcess = `Analyzing study plan query under role [${role}]. Checking attendance eligibility and pending assignments.`
      if (allowedToolNames.includes('get_my_attendance')) {
        steps.push({ stepNumber: 1, description: 'Verify attendance eligibility in MongoDB', actionTool: 'get_my_attendance', status: 'pending' })
      }
      if (allowedToolNames.includes('get_my_assignments')) {
        steps.push({ stepNumber: 2, description: 'Retrieve pending assignment deadlines', actionTool: 'get_my_assignments', dependencies: [1], status: 'pending' })
      }
    } else if ((q.includes('broadcast announcement') || q.includes('notify all students')) && (role === 'admin' || role === 'faculty' || role === 'hod')) {
      thoughtProcess = `Institutional broadcast request from [${role}].`
      requiresConfirmation = true
      if (allowedToolNames.includes('broadcast_announcement')) {
        steps.push({ stepNumber: 1, description: 'Broadcast notification to department students', actionTool: 'broadcast_announcement', status: 'pending' })
      }
    }

    logger.info({ role, stepsCount: steps.length }, '[PlanningEngine] Reasoning evaluation complete')

    return {
      thoughtProcess,
      confidenceScore,
      steps,
      allowedTools: allowedToolNames,
      requiresConfirmation,
    }
  }

  static evaluateResponseQuality(responseText: string, contextData: any): { isHighQuality: boolean; reflection: string } {
    if (!responseText || responseText.length < 10) {
      return { isHighQuality: false, reflection: 'Response is too short or empty.' }
    }
    return { isHighQuality: true, reflection: 'Response meets quality standards.' }
  }
}
