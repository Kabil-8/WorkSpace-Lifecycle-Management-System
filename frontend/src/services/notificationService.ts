import api from './api'

export const notificationService = {
  getMyNotifications: async (params?: { unreadOnly?: boolean; page?: number; limit?: number }) => {
    const res: any = await api.get('/notifications', { params })
    return res
  },

  markRead: async (notificationIds: string[]) => {
    const res: any = await api.put('/notifications/mark-read', { notificationIds })
    return res
  },

  markAllRead: async () => {
    const res: any = await api.put('/notifications/mark-all-read')
    return res
  },

  deleteNotification: async (id: string) => {
    const res: any = await api.delete(`/notifications/${id}`)
    return res
  },

  clearOld: async () => {
    const res: any = await api.delete('/notifications/old')
    return res
  },
}
