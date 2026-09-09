import api from './api'

export const jobService = {
  getJobs: async (params?: { type?: string; domain?: string; search?: string; location?: string; page?: number }) => {
    const res: any = await api.get('/jobs', { params })
    return res
  },

  createJob: async (data: any) => {
    const res: any = await api.post('/jobs', data)
    return res
  },

  applyForJob: async (id: string) => {
    const res: any = await api.put(`/jobs/${id}/apply`)
    return res
  },

  deleteJob: async (id: string) => {
    const res: any = await api.delete(`/jobs/${id}`)
    return res
  },
}
