import api from './api'

export const hallOfFameService = {
  getAll: async () => {
    const res: any = await api.get('/hall-of-fame')
    return res?.data || res
  },
}
