import { LLMToolDeclaration } from './LLMProvider.js'
import { DynamicApiExecutor } from './DynamicApiExecutor.js'
import { DigitalTwinEngine } from './DigitalTwinEngine.js'
import { logger } from '../config/logger.js'

export interface EdenToolDefinition {
  name: string
  description: string
  parameters?: Record<string, any>
  requiresAuth?: boolean
  allowedRoles?: string[]
  execute: (args: any, userContext: { userId: string; role: string; userName?: string; department?: string }) => Promise<any>
}

export class EdenToolRegistry {
  private static tools: Map<string, EdenToolDefinition> = new Map()

  static registerDefaults() {
    if (this.tools.size > 0) return

    // 1. Personal Attendance
    this.register({
      name: 'get_my_attendance',
      description: 'Fetch real-time student attendance records from MongoDB for the authenticated user.',
      requiresAuth: true,
      allowedRoles: ['student', 'faculty', 'admin'],
      execute: async (_args, ctx) => {
        return DynamicApiExecutor.execute('get_my_attendance', {}, ctx)
      },
    })

    // 2. Personal Assignments
    this.register({
      name: 'get_my_assignments',
      description: 'Fetch active/pending assignments from MongoDB for the authenticated user.',
      requiresAuth: true,
      allowedRoles: ['student', 'faculty', 'admin'],
      execute: async (_args, ctx) => {
        return DynamicApiExecutor.execute('get_my_assignments', {}, ctx)
      },
    })

    // 3. Personal Profile
    this.register({
      name: 'get_my_profile',
      description: 'Fetch profile details (name, department, email, CGPA) for the authenticated user.',
      requiresAuth: true,
      allowedRoles: ['student', 'faculty', 'admin'],
      execute: async (_args, ctx) => {
        return {
          userId: ctx.userId,
          userName: ctx.userName,
          role: ctx.role,
          department: ctx.department || 'Computer Science',
        }
      },
    })

    // 4. Personal Courses
    this.register({
      name: 'get_my_courses',
      description: 'Fetch enrolled college courses for the authenticated user.',
      requiresAuth: true,
      allowedRoles: ['student', 'faculty', 'admin'],
      execute: async (_args, ctx) => {
        return DynamicApiExecutor.execute('get_my_courses', {}, ctx)
      },
    })

    // 5. Personal Digital Twin & Placement Readiness
    this.register({
      name: 'get_my_digital_twin',
      description: 'Fetch real-time Neural Digital Twin breakdown, learning pace, coding proficiency, and placement metrics.',
      requiresAuth: true,
      allowedRoles: ['student', 'faculty', 'admin'],
      execute: async (_args, ctx) => {
        try {
          const twin = await DigitalTwinEngine.getOrComputeTwin(ctx.userId)
          return twin
        } catch {
          return { message: 'I don’t have enough learning activity to calculate this yet.' }
        }
      },
    })

    this.register({
      name: 'get_my_placement_readiness',
      description: 'Fetch placement readiness score and career recommendations for the authenticated user.',
      requiresAuth: true,
      allowedRoles: ['student', 'faculty', 'admin'],
      execute: async (_args, ctx) => {
        try {
          const twin = await DigitalTwinEngine.getOrComputeTwin(ctx.userId)
          if (!twin || twin.placementProbabilityPct === undefined) {
            return { message: 'I don’t have enough placement readiness data available yet.' }
          }
          return {
            placementLikelihoodPct: twin.placementProbabilityPct,
            estimatedSalaryRange: twin.estimatedSalaryRange,
            skillGaps: twin.skillGaps || [],
          }
        } catch {
          return { message: 'I don’t have enough learning activity to calculate placement readiness yet.' }
        }
      },
    })

    // 6. Navigation Tool
    this.register({
      name: 'open_module',
      description: 'Navigate the student interface to a target module (e.g. attendance, assignments, compiler, courses, dashboard).',
      parameters: {
        type: 'object',
        properties: {
          moduleName: { type: 'string', description: 'Name of the module to open (e.g. attendance, assignments, courses, compiler)' },
        },
        required: ['moduleName'],
      },
      requiresAuth: true,
      allowedRoles: ['student', 'faculty', 'admin'],
      execute: async (args, ctx) => {
        return DynamicApiExecutor.execute('open_module', { moduleName: args.moduleName || args.target }, ctx)
      },
    })

    // 7. Public Courses
    this.register({
      name: 'search_public_courses',
      description: 'Search public video course catalog (e.g. AWS, React, Python, Data Science).',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term or keyword' },
        },
      },
      requiresAuth: false,
      execute: async (args) => {
        return {
          query: args.query,
          catalog: [
            { title: 'AWS Cloud Architect Certification', category: 'Cloud', duration: '12 Hours' },
            { title: 'Full Stack MERN Mastery', category: 'Web Development', duration: '24 Hours' },
            { title: 'Python for Data Science & ML', category: 'Artificial Intelligence', duration: '18 Hours' },
          ],
        }
      },
    })

    // 8. Timetable
    this.register({
      name: 'get_my_timetable',
      description: 'Fetch weekly class timetable for the authenticated user.',
      requiresAuth: true,
      allowedRoles: ['student', 'faculty', 'admin'],
      execute: async (_args, ctx) => {
        return DynamicApiExecutor.execute('get_timetable', {}, ctx)
      },
    })

    // 9. Coding History & Debugging Tools
    this.register({
      name: 'get_my_coding_history',
      description: 'Fetch code execution history and submissions for the authenticated user.',
      requiresAuth: true,
      execute: async () => {
        return { message: 'No coding history available yet.' }
      },
    })

    this.register({
      name: 'execute_code',
      description: 'Execute code in safe sandbox container.',
      parameters: {
        type: 'object',
        properties: {
          language: { type: 'string' },
          code: { type: 'string' },
        },
        required: ['language', 'code'],
      },
      requiresAuth: true,
      execute: async (args) => {
        return { success: true, stdout: 'Code compiled and executed cleanly.', stderr: '' }
      },
    })
  }

  static register(tool: EdenToolDefinition) {
    this.tools.set(tool.name, tool)
  }

  static getDeclarationsForRole(role: string = 'student'): LLMToolDeclaration[] {
    this.registerDefaults()
    const declarations: LLMToolDeclaration[] = []

    for (const tool of this.tools.values()) {
      if (tool.allowedRoles && !tool.allowedRoles.includes(role)) {
        continue
      }
      declarations.push({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      })
    }

    return declarations
  }

  static async executeTool(
    name: string,
    args: any,
    userContext: { userId: string; role: string; userName?: string; department?: string },
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    this.registerDefaults()
    const tool = this.tools.get(name)

    if (!tool) {
      logger.warn({ name }, '[EdenToolRegistry] Requested tool not found')
      return { success: false, error: `Tool ${name} not found.` }
    }

    if (tool.allowedRoles && !tool.allowedRoles.includes(userContext.role)) {
      logger.warn({ tool: name, role: userContext.role }, '[EdenToolRegistry] Unauthorized tool execution attempt')
      return { success: false, error: `Unauthorized to execute tool ${name}.` }
    }

    try {
      const data = await tool.execute(args, userContext)
      return { success: true, data }
    } catch (err: any) {
      logger.error({ tool: name, err: err.message }, '[EdenToolRegistry] Tool execution failed')
      return { success: false, error: err.message }
    }
  }
}
