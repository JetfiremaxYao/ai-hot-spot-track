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
  source: 'twitter' | 'google' | 'bing' | 'duckduckgo' | 'hackernews' | 'github' | 'reddit' | 'news' | 'rss'
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

export interface SourcePolicy {
  reliabilityMode: 'strict' | 'balanced'
  sources: {
    google: boolean
    bing: boolean
    duckduckgo: boolean
    hackernews: boolean
    twitter: boolean
  }
  paidProviders: {
    serpApi: boolean
    braveSearch: boolean
  }
  sourceQuota: {
    google: number
    bing: number
    duckduckgo: number
    hackernews: number
    twitter: number
  }
  twitterThresholds: {
    minLikes: number
    minReposts: number
    minReplies: number
    minFollowers: number
    allowReplies: boolean
    allowQuotes: boolean
  }
  qualityFilters: {
    recencyHours: number
    minTitleLength: number
    minContentLength: number
    maxPerDomain: number
    removeTrackingParams: boolean
  }
  domainRules: {
    denylist: string[]
    preferlist: string[]
  }
}
