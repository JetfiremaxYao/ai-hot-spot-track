// 类型定义
export interface Article {
  title: string
  content?: string
  url: string
  source: string
  publishedAt?: Date
  author?: string
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
