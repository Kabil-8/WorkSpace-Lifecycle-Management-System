import api from './api'

export interface CourseFilterParams {
  department?: string
  level?: string
  search?: string
  page?: number
  limit?: number
}

export const courseService = {
  getCourses: async (params?: CourseFilterParams) => {
    const res: any = await api.get('/courses', { params })
    return res
  },

  getCourseById: async (id: string) => {
    const res: any = await api.get(`/courses/${id}`)
    return res
  },

  createCourse: async (data: any) => {
    const res: any = await api.post('/courses', data)
    return res
  },

  updateCourse: async (id: string, data: any) => {
    const res: any = await api.put(`/courses/${id}`, data)
    return res
  },

  deleteCourse: async (id: string) => {
    const res: any = await api.delete(`/courses/${id}`)
    return res
  },

  getCourseProgress: async (id: string) => {
    const res: any = await api.get(`/courses/${id}/progress`)
    return res?.data || res
  },

  updateCourseProgress: async (id: string, data: { lessonKey: string; isCompleted: boolean; totalLessons?: number }) => {
    const res: any = await api.post(`/courses/${id}/progress`, data)
    return res?.data || res
  },
}
