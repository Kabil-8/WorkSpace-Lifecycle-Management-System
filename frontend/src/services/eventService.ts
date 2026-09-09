import api from './api'

export const eventService = {
  getEvents: async () => {
    const res: any = await api.get('/events')
    return res
  },

  createEvent: async (data: any) => {
    const res: any = await api.post('/events', data)
    return res
  },

  rsvpEvent: async (id: string) => {
    const res: any = await api.put(`/events/${id}/rsvp`)
    return res
  },

  deleteEvent: async (id: string) => {
    const res: any = await api.delete(`/events/${id}`)
    return res
  },
}
