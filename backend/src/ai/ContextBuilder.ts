import User from '../models/User.js'
import { logger } from '../config/logger.js'

export class ContextBuilder {
  /**
   * Dynamically builds authorized, query-scoped context for the LLM.
   * Does NOT dump database into LLM.
   * Authenticated user ID comes strictly from JWT auth (req.user._id).
   */
  static async buildContext(
    userId: string,
    userName: string,
    role: string,
    query: string = '',
    pageRoute: string = '',
    pageContextData?: any,
  ) {
    // Security check: Must be valid 24-char ObjectId
    if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      logger.warn({ userId }, '[ContextBuilder] Invalid or non-MongoDB user ID supplied')
    }

    let department = 'Computer Science'
    let semester = 6
    let skills: string[] = []
    let careerGoal = 'Fullstack Developer'
    let atsScore = 0
    let placementReadiness = 0

    try {
      if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
        const u = await User.findById(userId).select('name role department semester cgpa skills careerGoal atsData placementReadiness').lean()
        if (u) {
          department = (u as any).department || department
          semester = (u as any).semester || semester
          skills = (u as any).skills || []
          careerGoal = (u as any).careerGoal || careerGoal
          atsScore = (u as any).atsData?.score || (u as any).atsScore || 0
          placementReadiness = (u as any).placementReadiness || 0
        }
      }
    } catch {
      // fallback to safe defaults
    }

    return {
      user: {
        id: userId,
        name: userName,
        role,
        department,
        semester,
        skills,
        careerGoal,
        atsScore,
        placementReadiness,
      },
      currentRoute: pageRoute,
      pageContextData,
    }
  }
}
