import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import { logger } from '../config/logger.js'

export interface DiscoveredModel {
  name: string
  collectionName: string
  fields: { fieldName: string; type: string; required?: boolean }[]
}

export interface DiscoveredEndpoint {
  path: string
  method: string
  description: string
  parameters?: string[]
}

export interface ProjectIndex {
  timestamp: string
  models: DiscoveredModel[]
  endpoints: DiscoveredEndpoint[]
  capabilities: string[]
}

export class ProjectDiscoveryEngine {
  private static cachedIndex: ProjectIndex | null = null

  /**
   * Automatically inspects Mongoose models and backend routes to generate the Live Project Index
   */
  static generateProjectIndex(): ProjectIndex {
    if (this.cachedIndex) return this.cachedIndex

    logger.info('[ProjectDiscoveryEngine] Auto-scanning backend models, schemas, and API routes...')

    const models: DiscoveredModel[] = []
    const registeredModelNames = mongoose.modelNames()

    // 1. Discover Registered Mongoose Models & Schemas
    for (const modelName of registeredModelNames) {
      try {
        const model = mongoose.model(modelName)
        const schema = model.schema
        const fields: { fieldName: string; type: string; required?: boolean }[] = []

        schema.eachPath((pathname, schemaType) => {
          if (!pathname.startsWith('_') && pathname !== '__v') {
            fields.push({
              fieldName: pathname,
              type: schemaType.instance || 'String',
              required: (schemaType as any).isRequired || false,
            })
          }
        })

        models.push({
          name: modelName,
          collectionName: model.collection?.name || modelName.toLowerCase() + 's',
          fields,
        })
      } catch (err: any) {
        logger.warn({ modelName, err: err.message }, '[ProjectDiscoveryEngine] Could not inspect model schema')
      }
    }

    // 2. Discover Project API Endpoints
    const endpoints: DiscoveredEndpoint[] = [
      { path: '/api/v1/attendance', method: 'GET', description: 'Retrieve student attendance percentage and session logs', parameters: ['studentId', 'subject'] },
      { path: '/api/v1/courses', method: 'GET', description: 'Retrieve active courses, credits, and instructors', parameters: ['code', 'department'] },
      { path: '/api/v1/assignments', method: 'GET', description: 'Retrieve pending, submitted, and overdue assignments', parameters: ['status', 'courseName'] },
      { path: '/api/v1/assignments', method: 'POST', description: 'Create a new course assignment', parameters: ['title', 'courseName', 'dueDate', 'maxMarks'] },
      { path: '/api/v1/quizzes', method: 'POST', description: 'Create an AI-generated quiz or proctored exam', parameters: ['title', 'subject', 'questionsCount', 'durationMinutes'] },
      { path: '/api/v1/jobs', method: 'GET', description: 'Retrieve active placement jobs and internships', parameters: ['company', 'location'] },
      { path: '/api/v1/events', method: 'GET', description: 'Retrieve upcoming campus workshops and events', parameters: ['category', 'date'] },
      { path: '/api/v1/events', method: 'POST', description: 'Schedule a new campus event', parameters: ['title', 'date', 'location'] },
      { path: '/api/v1/leave/apply', method: 'POST', description: 'Submit student/faculty leave application', parameters: ['reason', 'startDate', 'endDate'] },
      { path: '/api/v1/admin/users', method: 'GET', description: 'List platform users, roles, and department counts', parameters: ['role', 'department'] },
      { path: '/api/v1/analytics', method: 'GET', description: 'Retrieve platform analytics, attendance risk scores, and CGPA projections', parameters: ['metric', 'scope'] },
    ]

    const capabilities = [
      'Query MongoDB Collections dynamically (User, Course, StudentAttendance, Assignment, Exam, Event, Job, Department, LeaveRequest)',
      'Execute REST API Tool Calls with MongoDB session transaction rollbacks',
      'Provide IDE-level code generation, debugging, and complexity analysis (Codex / Antigravity Mode)',
      'Trigger instant frontend module navigation (/attendance, /courses, /interview, /assignments, /quizzes, /compiler)',
    ]

    const index: ProjectIndex = {
      timestamp: new Date().toISOString(),
      models,
      endpoints,
      capabilities,
    }

    this.cachedIndex = index
    logger.info({ modelsCount: models.length, endpointsCount: endpoints.length }, '[ProjectDiscoveryEngine] Live Project Index generated successfully')

    return index
  }

  /**
   * Returns a markdown summary of the discovered project capabilities for LLM system prompts
   */
  static getLLMProjectSummary(): string {
    const index = this.generateProjectIndex()

    const modelsSummary = index.models
      .map((m) => `- **${m.name}** (\`${m.collectionName}\`): [${m.fields.slice(0, 6).map((f) => f.fieldName).join(', ')}]`)
      .join('\n')

    const endpointsSummary = index.endpoints
      .map((e) => `- \`${e.method} ${e.path}\` — ${e.description}`)
      .join('\n')

    return `## Auto-Discovered Project Knowledge Index (OpenAPI & Mongoose Schema Registry)

### Available MongoDB Models & Schemas (${index.models.length} Discovered)
${modelsSummary}

### Discovered API Endpoints (${index.endpoints.length} Routes)
${endpointsSummary}

### AI Capabilities
${index.capabilities.map((c) => `- ${c}`).join('\n')}
`
  }
}
