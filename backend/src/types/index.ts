// 类型定义
export interface Article {
  title: string
  content?: string
  url: string
  source: string
  publishedAt?: Date
  author?: string
  domain?: string
  qualitySignals?: {
    likes?: number
    reposts?: number
    replies?: number
    followers?: number
    isReply?: boolean
    isQuote?: boolean
  }
}

export interface AnalysisResult {
  relevanceScore: number
  hotnessScore: number
  credibilityScore: number
  summary: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
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
