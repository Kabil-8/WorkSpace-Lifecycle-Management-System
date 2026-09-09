import api from './api'

export const gamificationService = {
  getMe: async () => {
    const res: any = await api.get('/gamification/me')
    return res
  },

  getLeaderboard: async (params?: { timeframe?: string; department?: string; limit?: number }) => {
    const res: any = await api.get('/gamification/leaderboard', { params })
    return res
  },

  completeMission: async (missionId: string) => {
    const res: any = await api.post('/gamification/mission-complete', { missionId })
    return res
  },

  awardXp: async (userId: string, amount: number, reason: string) => {
    const res: any = await api.post('/gamification/award-xp', { userId, amount, reason })
    return res
  },
}
