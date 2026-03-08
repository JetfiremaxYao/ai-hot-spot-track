import test from 'node:test'
import assert from 'node:assert/strict'
import { sortHotspots } from './hotspotRanking.js'

const samples = [
  {
    id: 1,
    hotnessScore: 9,
    relevanceScore: 6,
    credibilityScore: 7,
    likeCount: 4,
    viewCount: 80,
    publishedAt: new Date('2026-03-08T10:00:00Z'),
    createdAt: new Date('2026-03-08T10:30:00Z')
  },
  {
    id: 2,
    hotnessScore: 8,
    relevanceScore: 9,
    credibilityScore: 8,
    likeCount: 20,
    viewCount: 220,
    publishedAt: new Date('2026-03-08T08:00:00Z'),
    createdAt: new Date('2026-03-08T11:30:00Z')
  },
  {
    id: 3,
    hotnessScore: 6,
    relevanceScore: 7,
    credibilityScore: 9,
    likeCount: 12,
    viewCount: 140,
    publishedAt: new Date('2026-03-08T11:00:00Z'),
    createdAt: new Date('2026-03-08T11:00:00Z')
  },
  {
    id: 4,
    hotnessScore: 7,
    relevanceScore: 5,
    credibilityScore: 6,
    likeCount: 1,
    viewCount: 20,
    publishedAt: new Date('2026-03-07T08:00:00Z'),
    createdAt: new Date('2026-03-07T08:30:00Z')
  }
]

test('sortBy=hotness should rank by composite hotness signal', () => {
  const sorted = sortHotspots(samples, 'hotness')
  assert.deepEqual(sorted.map((item) => item.id), [2, 1, 3, 4])
})

test('sortBy=published should rank by latest published time', () => {
  const sorted = sortHotspots(samples, 'published')
  assert.deepEqual(sorted.map((item) => item.id), [3, 1, 2, 4])
})

test('sortBy=discovered should rank by latest discovery time', () => {
  const sorted = sortHotspots(samples, 'discovered')
  assert.deepEqual(sorted.map((item) => item.id), [2, 3, 1, 4])
})

test('sortBy=importance should rank by importance score', () => {
  const sorted = sortHotspots(samples, 'importance')
  assert.deepEqual(sorted.map((item) => item.id), [2, 3, 1, 4])
})

test('sortBy=relevance should rank by relevance score', () => {
  const sorted = sortHotspots(samples, 'relevance')
  assert.deepEqual(sorted.map((item) => item.id), [2, 3, 1, 4])
})
