import api from './api'

export const dashboardService = {
  getDashboard: async () => {
    const res: any = await api.get('/dashboard')
    return res
  },
}
