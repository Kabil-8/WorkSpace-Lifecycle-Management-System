import api from './api'

export const collegeCourseService = {
  getCollegeCourses: async () => {
    const res: any = await api.get('/college-courses')
    return res?.data || res
  },

  getCollegeCourseById: async (id: string) => {
    const res: any = await api.get(`/college-courses/${id}`)
    return res?.data || res
  },

  createCollegeCourse: async (data: any) => {
    const res: any = await api.post('/college-courses', data)
    return res?.data || res
  },

  updateCollegeCourse: async (id: string, data: any) => {
    const res: any = await api.put(`/college-courses/${id}`, data)
    return res?.data || res
  },

  deleteCollegeCourse: async (id: string) => {
    const res: any = await api.delete(`/college-courses/${id}`)
    return res?.data || res
  },

  enrollInCourse: async (id: string) => {
    const res: any = await api.post(`/college-courses/${id}/enroll`)
    return res?.data || res
  },

  getCourseAssignments: async (id: string) => {
    const res: any = await api.get(`/college-courses/${id}/assignments`)
    return res?.data?.assignments || []
  },

  submitAssignment: async (courseId: string, assignmentId: string, payload: any) => {
    const res: any = await api.post(`/college-courses/${courseId}/assignments/${assignmentId}/submit`, payload)
    return res?.data || res
  },

  getCourseQuizzes: async (id: string) => {
    const res: any = await api.get(`/college-courses/${id}/quizzes`)
    return res?.data?.quizzes || []
  },

  submitQuiz: async (courseId: string, quizId: string, payload: any) => {
    const res: any = await api.post(`/college-courses/${courseId}/quizzes/${quizId}/submit`, payload)
    return res?.data || res
  },

  getCourseExams: async (id: string) => {
    const res: any = await api.get(`/college-courses/${id}/exams`)
    return res?.data?.exams || []
  },

  getCoursePerformance: async (id: string) => {
    const res: any = await api.get(`/college-courses/${id}/performance`)
    return res?.data || null
  },
}
