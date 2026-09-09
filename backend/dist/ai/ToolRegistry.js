import { PermissionLayer } from './PermissionLayer.js';
import { logger } from '../config/logger.js';
export class ToolRegistry {
    static tools = new Map();
    /**
     * Register a new tool into the registry
     */
    static registerTool(tool) {
        ToolRegistry.tools.set(tool.name, tool);
        logger.info({ name: tool.name }, '[ToolRegistry] Registered dynamic tool');
    }
    /**
     * Get all registered tool definitions for Gemini payload
     */
    static getToolsForRole(role) {
        return PermissionLayer.getAllowedTools(role);
    }
    /**
     * Execute a registered tool by name
     */
    static async executeTool(name, args, context) {
        const tool = ToolRegistry.tools.get(name);
        if (tool && tool.handler) {
            return await tool.handler(args, context);
        }
        return null;
    }
}
