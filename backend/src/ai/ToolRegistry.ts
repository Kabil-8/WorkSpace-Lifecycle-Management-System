import { PermissionLayer } from './PermissionLayer.js'
import { logger } from '../config/logger.js'

export interface RegisteredTool {
  name: string
  description: string
  parameters: any
  handler: (args: any, context?: any) => Promise<any>
}

export class ToolRegistry {
  private static tools: Map<string, RegisteredTool> = new Map()

  /**
   * Register a new tool into the registry
   */
  static registerTool(tool: RegisteredTool) {
    ToolRegistry.tools.set(tool.name, tool)
    logger.info({ name: tool.name }, '[ToolRegistry] Registered dynamic tool')
  }

  /**
   * Get all registered tool definitions for Gemini payload
   */
  static getToolsForRole(role: string): any[] {
    return PermissionLayer.getAllowedTools(role)
  }

  /**
   * Execute a registered tool by name
   */
  static async executeTool(name: string, args: any, context?: any): Promise<any> {
    const tool = ToolRegistry.tools.get(name)
    if (tool && tool.handler) {
      return await tool.handler(args, context)
    }
    return null
  }
}
