import mongoose from 'mongoose';
import { ProjectDiscoveryEngine } from './ProjectDiscoveryEngine.js';
import { ActionExecutor } from './ActionExecutor.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import Event from '../models/Event.js';
import Job from '../models/Job.js';
import Department from '../models/Department.js';
import { StudentAttendance } from '../models/attendance/StudentAttendance.js';
import { Exam } from '../models/proctor/Exam.js';
import { logger } from '../config/logger.js';
export class DynamicApiExecutor {
    /**
     * Resolves and executes dynamic discovery tools requested by Gemini
     */
    static async execute(functionName, args, userContext) {
        try {
            logger.info({ functionName, args }, '[DynamicApiExecutor] Resolving dynamic tool call');
            if (functionName === 'discover_project_api') {
                const index = ProjectDiscoveryEngine.generateProjectIndex();
                const target = args.target || 'all';
                if (target === 'models') {
                    return { success: true, models: index.models };
                }
                else if (target === 'endpoints') {
                    return { success: true, endpoints: index.endpoints };
                }
                return { success: true, projectIndex: index };
            }
            if (functionName === 'query_project_model') {
                const modelName = (args.modelName || '').trim();
                const searchFilter = (args.searchFilter || '').trim();
                const limit = args.limit || 5;
                const modelMap = {
                    User,
                    Course,
                    Assignment,
                    Event,
                    Job,
                    Department,
                    StudentAttendance,
                    Exam,
                };
                const TargetModel = modelMap[modelName] || (mongoose.models[modelName] ? mongoose.model(modelName) : null);
                if (!TargetModel) {
                    // Fallback query via collection name match
                    return ActionExecutor.execute('query_database', { collection: modelName.toLowerCase(), filterSubject: searchFilter }, userContext);
                }
                const count = await TargetModel.countDocuments().catch(() => 0);
                let queryFilter = {};
                if (searchFilter) {
                    queryFilter = {
                        $or: [
                            { title: { $regex: searchFilter, $options: 'i' } },
                            { name: { $regex: searchFilter, $options: 'i' } },
                            { subject: { $regex: searchFilter, $options: 'i' } },
                            { department: { $regex: searchFilter, $options: 'i' } },
                        ],
                    };
                }
                const records = await TargetModel.find(queryFilter).limit(limit).lean().catch(() => []);
                const formattedList = records
                    .map((r) => `- **${r.title || r.name || r.code || r._id}** ${r.instructor ? `(Instructor: ${r.instructor})` : ''} ${r.role ? `[${r.role.toUpperCase()}]` : ''}`)
                    .join('\n');
                return {
                    success: true,
                    modelName,
                    totalRecords: count,
                    returnedCount: records.length,
                    message: records.length > 0
                        ? `Found **${count} ${modelName} records** in MongoDB:\n\n${formattedList}`
                        : `No matching records found in ${modelName} collection for query "${searchFilter}".`,
                    records,
                };
            }
            if (functionName === 'execute_api_action') {
                let payload = {};
                try {
                    payload = typeof args.payloadJson === 'string' ? JSON.parse(args.payloadJson) : args.payloadJson || {};
                }
                catch {
                    payload = args;
                }
                return ActionExecutor.execute(args.actionName, payload, userContext);
            }
            // Delegate to standard ActionExecutor
            return ActionExecutor.execute(functionName, args, userContext);
        }
        catch (err) {
            logger.error({ functionName, err: err.message }, '[DynamicApiExecutor] Error executing tool');
            return {
                success: false,
                message: `⚠️ Dynamic Tool Execution \`${functionName}\` failed: ${err.message}`,
            };
        }
    }
}
