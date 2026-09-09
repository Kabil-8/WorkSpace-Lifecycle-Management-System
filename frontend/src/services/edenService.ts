import api from './api'

export const edenService = {
  getCompanionState: async () => {
    const res: any = await api.get('/eden/me')
    return res?.data || res
  },

  sendMessage: async (message: string, mode?: string) => {
    const res: any = await api.post('/eden/chat', { message, mode })
    return res?.data || res
  },

  getInsights: async () => {
    const res: any = await api.get('/eden/insights')
    return res?.data || res
  },

  triggerEvolution: async () => {
    const res: any = await api.post('/eden/evolve')
    return res?.data || res
  },

  getMemory: async () => {
    const res: any = await api.get('/eden/memory')
    return res?.data || res
  },

  updatePersonality: async (personality: string) => {
    const res: any = await api.put('/eden/personality', { personality })
    return res?.data || res
  },

  analyzeDocument: async (formData: FormData) => {
    const res: any = await api.post('/eden/analyze-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res?.data || res
  },

  generateStudyPlan: async (subjects: string[], examDates: Record<string, string>) => {
    const res: any = await api.post('/eden/study-plan', { subjects, examDates })
    return res?.data || res
  },

  reviewCode: async (code: string, language: string) => {
    const res: any = await api.post('/eden/review-code', { code, language })
    return res?.data || res
  },

  getDigitalTwin: async (userId: string) => {
    const res: any = await api.get(`/digital-twin/${userId}`)
    return res?.data || res
  },
}

export default edenService
