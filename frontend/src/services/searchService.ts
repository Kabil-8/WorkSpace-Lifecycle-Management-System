import api from './api'

export const searchService = {
  globalSearch: async (q: string, types?: string) => {
    const res: any = await api.get('/search', { params: { q, types } })
    return res
  },
}
