import api from './api'

export const forumService = {
  getPosts: async (params?: { category?: string; search?: string; page?: number }) => {
    const res: any = await api.get('/forum/posts', { params })
    return res
  },

  createPost: async (data: any) => {
    const res: any = await api.post('/forum/posts', data)
    return res
  },

  replyToPost: async (id: string, payload: { content: string }) => {
    const res: any = await api.post(`/forum/posts/${id}/reply`, payload)
    return res
  },

  likePost: async (id: string) => {
    const res: any = await api.put(`/forum/posts/${id}/like`)
    return res
  },

  incrementViews: async (id: string) => {
    const res: any = await api.patch(`/forum/posts/${id}/view`)
    return res
  },
}
