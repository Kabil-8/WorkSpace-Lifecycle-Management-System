import { PermissionLayer } from './PermissionLayer.js';
import { logger } from '../config/logger.js';
export class DynamicToolRegistry {
    /**
     * Generates dynamic Gemini function declarations based on the Auto-Discovered Project Index
     */
    static getDynamicToolsForRole(role) {
        const baseTools = PermissionLayer.getAllowedTools(role)[0]?.functionDeclarations || [];
        const discoveryTools = [
            {
                name: 'discover_project_api',
                description: 'Inspect auto-discovered backend routes, Mongoose models, and API parameters (Antigravity & Codex discovery mode).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        target: { type: 'STRING', description: 'models | endpoints | schemas | all' },
                    },
                },
            },
            {
                name: 'query_project_model',
                description: 'Dynamically query any discovered Mongoose model collection (User, Course, StudentAttendance, Assignment, Exam, Event, Job, Department, LeaveRequest) for live records.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        modelName: {
                            type: 'STRING',
                            description: 'Target Mongoose model: User | Course | StudentAttendance | Assignment | Exam | Event | Job | Department | LeaveRequest | AuditLog',
                        },
                        searchFilter: { type: 'STRING', description: 'Optional text query or subject filter' },
                        limit: { type: 'INTEGER', description: 'Number of records to return (default 5)' },
                    },
                    required: ['modelName'],
                },
            },
            {
                name: 'execute_api_action',
                description: 'Execute an API action or database mutation (create_quiz, schedule_event, create_assignment, apply_job, mark_attendance) with automatic transaction rollback on failure.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        actionName: { type: 'STRING', description: 'Action to execute: create_quiz | schedule_event | create_assignment | apply_job | mark_attendance | broadcast_announcement' },
                        payloadJson: { type: 'STRING', description: 'JSON string payload containing arguments for the action' },
                    },
                    required: ['actionName', 'payloadJson'],
                },
            },
        ];
        const mergedTools = [...baseTools];
        // Ensure no duplicate tool names
        for (const tool of discoveryTools) {
            if (!mergedTools.some((t) => t.name === tool.name)) {
                mergedTools.push(tool);
            }
        }
        logger.info({ role, toolsCount: mergedTools.length }, '[DynamicToolRegistry] Auto-generated Gemini tool declarations');
        return [{ functionDeclarations: mergedTools }];
    }
}
