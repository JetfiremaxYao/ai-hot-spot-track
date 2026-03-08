import { Hotspot } from '@prisma/client'

export type HotspotSortBy = 'hotness' | 'published' | 'discovered' | 'importance' | 'relevance' | 'time' | 'credibility'
export type HotspotImportance = 'all' | 'high' | 'medium' | 'low'
export type HotspotTimeRange = 'all' | '1h' | '6h' | '24h' | '3d' | '7d' | '30d'

export interface HotspotRankItem {
  hotnessScore: number
  relevanceScore: number
  credibilityScore: number
  likeCount: number
  viewCount: number
  publishedAt: Date | string
  createdAt: Date | string
}

function toMillis(value: Date | string): number {
  const millis = new Date(value).getTime()
  return Number.isFinite(millis) ? millis : 0
}

export function calculateImportanceScore(item: HotspotRankItem): number {
  const weighted = (
    item.hotnessScore * 0.35 +
    item.relevanceScore * 0.35 +
    item.credibilityScore * 0.3
  )

  const engagementBoost = Math.min(1, (item.likeCount * 0.08) + (item.viewCount * 0.002))
  return Number((weighted + engagementBoost).toFixed(3))
}

export function matchImportanceLevel(item: HotspotRankItem, level: HotspotImportance): boolean {
  if (level === 'all') return true

  const importanceScore = calculateImportanceScore(item)
  if (level === 'high') return importanceScore >= 7
  if (level === 'medium') return importanceScore >= 5 && importanceScore < 7
  return importanceScore < 5
}

export function matchTimeRange(item: HotspotRankItem, range: HotspotTimeRange): boolean {
  if (range === 'all') return true

  const now = Date.now()
  const publishedAt = toMillis(item.publishedAt)
  const rangeMap: Record<Exclude<HotspotTimeRange, 'all'>, number> = {
    '1h': 1,
    '6h': 6,
    '24h': 24,
    '3d': 24 * 3,
    '7d': 24 * 7,
    '30d': 24 * 30
  }

  return publishedAt >= now - (rangeMap[range] * 60 * 60 * 1000)
}

export function sortHotspots<T extends HotspotRankItem>(items: T[], sortBy: HotspotSortBy): T[] {
  const sorted = [...items]

  const compareByImportance = (a: T, b: T) => {
    const scoreDiff = calculateImportanceScore(b) - calculateImportanceScore(a)
    if (scoreDiff !== 0) return scoreDiff
    return toMillis(b.createdAt) - toMillis(a.createdAt)
  }

  switch (sortBy) {
    case 'published':
    case 'time':
      sorted.sort((a, b) => toMillis(b.publishedAt) - toMillis(a.publishedAt))
      break
    case 'discovered':
      sorted.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
      break
    case 'importance':
      sorted.sort(compareByImportance)
      break
    case 'relevance':
      sorted.sort((a, b) => {
        const relevanceDiff = b.relevanceScore - a.relevanceScore
        if (relevanceDiff !== 0) return relevanceDiff
        return compareByImportance(a, b)
      })
      break
    case 'credibility':
      sorted.sort((a, b) => {
        const credibilityDiff = b.credibilityScore - a.credibilityScore
        if (credibilityDiff !== 0) return credibilityDiff
        return compareByImportance(a, b)
      })
      break
    case 'hotness':
    default:
      sorted.sort((a, b) => {
        const compositeA = (
          a.hotnessScore * 0.45 +
          a.relevanceScore * 0.25 +
          a.credibilityScore * 0.2 +
          Math.min(1, (a.likeCount * 0.06) + (a.viewCount * 0.001))
        )
        const compositeB = (
          b.hotnessScore * 0.45 +
          b.relevanceScore * 0.25 +
          b.credibilityScore * 0.2 +
          Math.min(1, (b.likeCount * 0.06) + (b.viewCount * 0.001))
        )
        const scoreDiff = compositeB - compositeA
        if (scoreDiff !== 0) return scoreDiff
        return toMillis(b.publishedAt) - toMillis(a.publishedAt)
      })
      break
  }

  return sorted
}

export function toHotspotWithImportance<T extends Hotspot>(item: T): T & { importanceScore: number } {
  return {
    ...item,
    importanceScore: calculateImportanceScore(item)
  }
}
