import api from './api'

export const assignmentService = {
  getAssignments: async (params?: { department?: string; status?: string; page?: number }) => {
    const res: any = await api.get('/assignments', { params })
    return res
  },

  getAssignmentById: async (id: string) => {
    const res: any = await api.get(`/assignments/${id}`)
    return res
  },

  createAssignment: async (data: any) => {
    const res: any = await api.post('/assignments', data)
    return res
  },

  updateAssignment: async (id: string, data: any) => {
    const res: any = await api.put(`/assignments/${id}`, data)
    return res
  },

  deleteAssignment: async (id: string) => {
    const res: any = await api.delete(`/assignments/${id}`)
    return res
  },

  submitAssignment: async (id: string, payload: { content?: string; fileUrl?: string; fileName?: string }) => {
    const res: any = await api.put(`/assignments/${id}/submit`, payload)
    return res
  },

  gradeSubmission: async (id: string, payload: { submissionId: string; grade: number; feedback?: string }) => {
    const res: any = await api.put(`/assignments/${id}/grade`, payload)
    return res
  },
}
