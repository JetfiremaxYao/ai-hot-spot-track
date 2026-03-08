import test from 'node:test'
import assert from 'node:assert/strict'
import crawlerService from './crawler.js'

const basePolicy: any = {
  reliabilityMode: 'strict',
  twitterThresholds: {
    minLikes: 0,
    minReposts: 0,
    minReplies: 0,
    minFollowers: 0,
    allowReplies: false,
    allowQuotes: true
  }
}

test('twitter filter should reject likely reply text when replies are not allowed', () => {
  const article: any = {
    title: '@someone I totally agree with this',
    content: '@someone I totally agree with this',
    qualitySignals: {
      likes: 200,
      reposts: 50,
      replies: 10,
      followers: 5000,
      isReply: false,
      isQuote: false,
      isRetweet: false
    }
  }

  // @ts-expect-error test private method access through runtime object
  const pass = crawlerService.passesTwitterThresholds(article, basePolicy)
  assert.equal(pass, false)
})

test('twitter filter should reject low-engagement tweets in strict mode even if custom thresholds are zero', () => {
  const article: any = {
    title: 'Random thought about AI',
    content: 'Random thought about AI',
    qualitySignals: {
      likes: 1,
      reposts: 0,
      replies: 0,
      followers: 120,
      isReply: false,
      isQuote: false,
      isRetweet: false
    }
  }

  // @ts-expect-error test private method access through runtime object
  const pass = crawlerService.passesTwitterThresholds(article, basePolicy)
  assert.equal(pass, false)
})

test('twitter filter should reject retweets', () => {
  const article: any = {
    title: 'Important AI news',
    content: 'Important AI news',
    qualitySignals: {
      likes: 100,
      reposts: 80,
      replies: 20,
      followers: 50000,
      isReply: false,
      isQuote: false,
      isRetweet: true
    }
  }

  // @ts-expect-error test private method access through runtime object
  const pass = crawlerService.passesTwitterThresholds(article, basePolicy)
  assert.equal(pass, false)
})
