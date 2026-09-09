import api from './api'

export const notesService = {
  getAll: async (params?: { search?: string; tags?: string }) => {
    const res: any = await api.get('/notes', { params })
    return res?.data || res
  },

  getById: async (id: string) => {
    const res: any = await api.get(`/notes/${id}`)
    return res?.data || res
  },

  create: async (payload: { title: string; content: string; tags?: string[] }) => {
    const res: any = await api.post('/notes', payload)
    return res?.data || res
  },

  update: async (id: string, payload: { title?: string; content?: string; tags?: string[] }) => {
    const res: any = await api.put(`/notes/${id}`, payload)
    return res?.data || res
  },

  delete: async (id: string) => {
    const res: any = await api.delete(`/notes/${id}`)
    return res?.data || res
  },

  getAiSummary: async (id: string) => {
    const res: any = await api.post(`/notes/${id}/ai-summary`)
    return res?.data || res
  },

  share: async (id: string, userIds: string[]) => {
    const res: any = await api.post(`/notes/${id}/share`, { userIds })
    return res?.data || res
  },

  generateFlashcards: async (id: string) => {
    const res: any = await api.post(`/notes/${id}/flashcards`)
    return res?.data || res
  },

  generateQuiz: async (id: string) => {
    const res: any = await api.post(`/notes/${id}/quiz`)
    return res?.data || res
  },
}

export default notesService
