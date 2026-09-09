import api from './api'

export interface StudentTelemetryUpdateData {
  cgpa?: number
  placementReadiness?: number
  learningPaceScore?: number
  codingProficiencyScore?: number
  weakSubjects?: string[] | string
  strongSubjects?: string[] | string
  attendanceRate?: number
  careerGoal?: string
  mentorNotes?: string
  burnoutRisk?: string
}

export const mentorshipService = {
  getMyStudentsAndMentees: async () => {
    const res = await api.get('/mentorship/my-students')
    return res.data
  },

  getAllocations: async () => {
    const res = await api.get('/mentorship/allocations')
    return res.data
  },

  getAvailableMentors: async () => {
    const res = await api.get('/mentorship/available-mentors')
    return res.data
  },

  getStudents: async () => {
    const res = await api.get('/mentorship/students')
    return res.data
  },

  getStudentTelemetry: async (studentId: string) => {
    const res = await api.get(`/mentorship/students/${studentId}/telemetry`)
    return res.data
  },

  updateStudentTelemetry: async (studentId: string, data: StudentTelemetryUpdateData) => {
    const res = await api.put(`/mentorship/students/${studentId}/telemetry`, data)
    return res.data
  },

  recalculateStudentML: async (studentId: string) => {
    const res = await api.post(`/mentorship/students/${studentId}/recalculate-ml`)
    return res.data
  },

  createAllocation: async (data: { mentorId: string; studentId?: string; topic?: string }) => {
    const res = await api.post('/mentorship/allocate', data)
    return res.data
  },
}
