import api from './api'

export const analyticsService = {
  getInstitutionalAnalytics: async () => {
    const res: any = await api.get('/analytics/institutional')
    return res?.data || res
  },
}
