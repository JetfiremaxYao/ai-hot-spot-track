export interface Keyword {
  id: number
  name: string
  description?: string
  status: 'active' | 'paused'
  hotspotCount: number
  createdAt: string
  updatedAt: string
  lastCheckedAt?: string
}

export interface Hotspot {
  id: number
  title: string
  summary: string
  content: string
  source: 'twitter' | 'github' | 'hackernews' | 'reddit' | 'news' | 'rss'
  sourceUrl: string
  relevanceScore: number
  hotnessScore: number
  credibilityScore: number
  imageUrl?: string
  author?: string
  publishedAt: string
  createdAt: string
  updatedAt: string
  isRead: boolean
  isSaved: boolean
  keywords: Keyword[]
  viewCount: number
  likeCount: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface HotspotsResponse {
  hotspots: Hotspot[]
  total: number
  page: number
  pageSize: number
}
