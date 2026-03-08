import {
  Keyword,
  Hotspot,
  ApiResponse,
  HotspotsResponse,
  SourcePolicy,
  HotspotImportance,
  HotspotSortBy,
  HotspotTimeRange
} from '../types/index.js'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5001'

export const keywordService = {
  getAll: async () => {
    const res = await fetch(`${API_BASE_URL}/api/keywords`)
    if (!res.ok) throw new Error('Failed to fetch keywords')
    const data: ApiResponse<Keyword[]> = await res.json()
    return data.data || []
  },

  create: async (name: string, description?: string) => {
    const res = await fetch(`${API_BASE_URL}/api/keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    })
    if (!res.ok) throw new Error('Failed to create keyword')
    const data: ApiResponse<Keyword> = await res.json()
    return data.data
  },

  updateStatus: async (id: number, status: 'active' | 'paused') => {
    const res = await fetch(`${API_BASE_URL}/api/keywords/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    if (!res.ok) throw new Error('Failed to update keyword')
    const data: ApiResponse<Keyword> = await res.json()
    return data.data
  },

  delete: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/api/keywords/${id}`, {
      method: 'DELETE'
    })
    if (!res.ok) throw new Error('Failed to delete keyword')
  }
}

export const hotspotService = {
  getList: async (params: {
    keyword?: string
    source?: string
    sortBy?: HotspotSortBy
    importance?: HotspotImportance
    timeRange?: HotspotTimeRange
    limit?: number
    offset?: number
    isRead?: boolean
    isSaved?: boolean
  }) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.set(key, String(value))
    })

    const res = await fetch(`${API_BASE_URL}/api/hotspots?${query}`)
    if (!res.ok) throw new Error('Failed to fetch hotspots')
    const data: ApiResponse<HotspotsResponse> = await res.json()
    return data.data || { hotspots: [], total: 0, page: 1, pageSize: 20 }
  },

  getDetail: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/api/hotspots/${id}`)
    if (!res.ok) throw new Error('Failed to fetch hotspot')
    const data: ApiResponse<Hotspot> = await res.json()
    return data.data
  },

  markAsRead: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/api/hotspots/${id}/read`, {
      method: 'PATCH'
    })
    if (!res.ok) throw new Error('Failed to mark as read')
    const data: ApiResponse<Hotspot> = await res.json()
    return data.data
  },

  toggleSave: async (id: number, isSaved: boolean) => {
    const res = await fetch(`${API_BASE_URL}/api/hotspots/${id}/save`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isSaved })
    })
    if (!res.ok) throw new Error('Failed to save hotspot')
    const data: ApiResponse<Hotspot> = await res.json()
    return data.data
  },

  toggleLike: async (id: number, like: boolean) => {
    const res = await fetch(`${API_BASE_URL}/api/hotspots/${id}/like`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ like })
    })
    if (!res.ok) throw new Error('Failed to like hotspot')
    const data: ApiResponse<Hotspot> = await res.json()
    return data.data
  },

  refreshAll: async () => {
    const res = await fetch(`${API_BASE_URL}/api/hotspots/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    if (!res.ok) throw new Error('Failed to refresh hotspots')
    const data: ApiResponse<any> = await res.json()
    return data.data
  }
}

export const searchService = {
  search: async (query: string, mode: 'db' | 'live' = 'db') => {
    const params = new URLSearchParams({ q: query, mode })
    const res = await fetch(`${API_BASE_URL}/api/search?${params}`)
    if (!res.ok) throw new Error('Failed to search')
    const data: ApiResponse<any> = await res.json()
    return data.data
  }
}

export const configService = {
  getSourcePolicy: async () => {
    const res = await fetch(`${API_BASE_URL}/api/config/source-policy`)
    if (!res.ok) throw new Error('Failed to fetch source policy')
    const data: ApiResponse<SourcePolicy> = await res.json()
    if (!data.data) throw new Error('Source policy is empty')
    return data.data
  },

  updateSourcePolicy: async (policy: SourcePolicy) => {
    const res = await fetch(`${API_BASE_URL}/api/config/source-policy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy)
    })
    if (!res.ok) throw new Error('Failed to update source policy')
    const data: ApiResponse<SourcePolicy> = await res.json()
    if (!data.data) throw new Error('Invalid source policy response')
    return data.data
  },

  resetSourcePolicy: async () => {
    const res = await fetch(`${API_BASE_URL}/api/config/source-policy/reset`, {
      method: 'POST'
    })
    if (!res.ok) throw new Error('Failed to reset source policy')
    const data: ApiResponse<SourcePolicy> = await res.json()
    if (!data.data) throw new Error('Invalid source policy response')
    return data.data
  },

  sendTestEmail: async (smtpProfiles?: SourcePolicy['notification']['smtpProfiles']) => {
    const res = await fetch(`${API_BASE_URL}/api/config/email/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smtpProfiles })
    })

    const data: ApiResponse<any> = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || '发送测试邮件失败')
    }

    return data
  }
}
