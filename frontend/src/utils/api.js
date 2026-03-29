const BASE = import.meta.env.VITE_API_URL || ''

export const api = {
  async get(path) {
    const res = await fetch(`${BASE}${path}`)
    if (!res.ok) throw new Error(`API ${path}: ${res.status}`)
    return res.json()
  },

  getMeta: () => api.get('/api/meta'),

  getMatches: (map, date) => {
    const params = new URLSearchParams()
    if (map && map !== 'all') params.set('map', map)
    if (date && date !== 'all') params.set('date', date)
    const qs = params.toString()
    return api.get(`/api/matches${qs ? '?' + qs : ''}`)
  },

  getMatch: (matchId) => api.get(`/api/match/${matchId}`),

  getHeatmap: (map, type, date) => {
    const params = new URLSearchParams({ map, type })
    if (date && date !== 'all') params.set('date', date)
    return api.get(`/api/heatmap?${params}`)
  },

  getInsights: (mapId) => api.get(`/api/insights/${mapId}`),

  minimapUrl: (mapId) => `${BASE}/minimap/${mapId}`,
}
