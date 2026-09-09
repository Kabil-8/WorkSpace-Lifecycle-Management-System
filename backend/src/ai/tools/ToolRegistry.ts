import { studentTools } from './studentTools.js'
import { courseTools } from './courseTools.js'
import { navigationTools } from './navigationTools.js'
import { compilerTools } from './compilerTools.js'
import { facultyTools } from './facultyTools.js'
import { recruiterTools } from './recruiterTools.js'
import { parentTools } from './parentTools.js'
import { WebSearchTool } from './WebSearchTool.js'
import { logger } from '../../config/logger.js'

export interface RegisteredTool {
  name: string
  description: string
  parameters?: Record<string, any>
  requiresAuth?: boolean
  allowedRoles?: string[]
  execute: (args: any, userContext: any) => Promise<any>
}

// Role groups for easy permission assignment
const STUDENT_ROLES = ['student']
const FACULTY_ROLES = ['faculty', 'hod', 'admin', 'super_admin']
const RECRUITER_ROLES = ['recruiter', 'placement_officer', 'admin', 'super_admin']
const PARENT_ROLES = ['parent']

export class ToolRegistry {
  private static tools: Map<string, RegisteredTool> = new Map()

  static registerDefaults() {
    if (this.tools.size > 0) return

    const allTools: RegisteredTool[] = [
      // ── Student Personal Data Tools ──────────────────────────────────────────
      ...studentTools.map((t: any) => ({ ...t, allowedRoles: t.allowedRoles || STUDENT_ROLES })),

      // ── Course & Learning Tools (all roles) ──────────────────────────────────
      ...courseTools,

      // ── Navigation Tools (all roles) ─────────────────────────────────────────
      ...navigationTools,

      // ── Code Compiler Tools (students + faculty) ──────────────────────────────
      ...compilerTools,

      // ── Faculty Tools (faculty, HOD, admin) ──────────────────────────────────
      ...facultyTools,

      // ── Recruiter Tools (recruiter, placement officer, admin) ─────────────────
      ...recruiterTools,

      // ── Parent Tools (parent only) ────────────────────────────────────────────
      ...parentTools,

      // ── Web Research Tools (all roles) ────────────────────────────────────────
      {
        name: 'web_search',
        description: 'Perform real-time external web search for current information, latest documentation, pricing, release notes, or anything requiring live data.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The search query to execute' },
          },
          required: ['query'],
        },
        requiresAuth: false,
        execute: async (args: any) => {
          return WebSearchTool.search(args.query)
        },
      },
      {
        name: 'open_web_page',
        description: 'Fetch and read the full text content from a specific web page URL.',
        parameters: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'The full URL of the web page to read' },
          },
          required: ['url'],
        },
        requiresAuth: false,
        execute: async (args: any) => {
          return WebSearchTool.openWebPage(args.url)
        },
      },
    ]

    for (const tool of allTools) {
      this.tools.set(tool.name, tool)
    }

    logger.info({ toolCount: this.tools.size }, '[ToolRegistry] All tools registered')
  }

  /**
   * Returns tool declarations for the LLM, filtered by the user's role.
   * The LLM sees only tools it is authorized to call.
   */
  static getDeclarations(role: string = 'student') {
    this.registerDefaults()
    const declarations: any[] = []

    for (const tool of this.tools.values()) {
      // If tool has role restrictions, check if the user's role is allowed
      if (tool.allowedRoles && !tool.allowedRoles.includes(role)) continue

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
      return { success: false, error: `Tool '${name}' not found in registry.` }
    }

    // Role authorization check
    if (tool.allowedRoles && !tool.allowedRoles.includes(userContext.role)) {
      logger.warn({ tool: name, role: userContext.role, allowedRoles: tool.allowedRoles }, '[ToolRegistry] Unauthorized tool access blocked')
      return { success: false, error: `Role '${userContext.role}' is not authorized to use tool '${name}'.` }
    }

    // Auth check: requires valid MongoDB ObjectId
    if (tool.requiresAuth && (!userContext.userId || !/^[0-9a-fA-F]{24}$/.test(userContext.userId))) {
      return { success: false, error: `Tool '${name}' requires JWT authentication.` }
    }

    try {
      const data = await tool.execute(args, userContext)
      return { success: true, data }
    } catch (err: any) {
      logger.error({ tool: name, err: err.message }, '[ToolRegistry] Tool execution error')
      return { success: false, error: err.message }
    }
  }
}
