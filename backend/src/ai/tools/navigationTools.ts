import { DynamicApiExecutor } from '../DynamicApiExecutor.js'

export const navigationTools = [
  {
    name: 'open_module',
    description: 'Navigate the student interface to a target module (e.g. attendance, assignments, compiler, courses, dashboard).',
    parameters: {
      type: 'object',
      properties: {
        moduleName: { type: 'string', description: 'Name of the module to open' },
      },
      required: ['moduleName'],
    },
    requiresAuth: true,
    execute: async (args: any, userContext: any) => {
      return DynamicApiExecutor.execute('open_module', { moduleName: args.moduleName || args.target }, userContext)
    },
  },
]
