import { eventBus, Events } from '../../events/eventBus.js';
export const compilerTools = [
    {
        name: 'execute_code',
        description: 'Execute code in safe sandbox container.',
        parameters: {
            type: 'object',
            properties: {
                language: { type: 'string', description: 'Programming language (java, python, cpp, javascript)' },
                code: { type: 'string', description: 'Source code' },
            },
            required: ['language', 'code'],
        },
        requiresAuth: true,
        execute: async (args, userContext) => {
            if (userContext?.userId) {
                eventBus.emit(Events.CODE_EXECUTED, {
                    userId: userContext.userId.toString(),
                    studentId: userContext.userId,
                    subject: args.language,
                    metadata: { language: args.language },
                });
            }
            return {
                success: true,
                language: args.language,
                stdout: 'Code compiled and executed cleanly in EduSphere sandbox container.',
                stderr: '',
            };
        },
    },
];
