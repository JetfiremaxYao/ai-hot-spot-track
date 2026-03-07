import fs from 'fs/promises'
import path from 'path'
import { SourcePolicy } from '../types/index.js'

const POLICY_PATH = path.resolve(process.cwd(), 'data/source-policy.json')

const DEFAULT_POLICY: SourcePolicy = {
  reliabilityMode: 'strict',
  sources: {
    google: true,
    bing: true,
    duckduckgo: true,
    hackernews: true,
    twitter: false
  },
  paidProviders: {
    serpApi: false,
    braveSearch: false
  },
  sourceQuota: {
    google: 20,
    bing: 20,
    duckduckgo: 20,
    hackernews: 15,
    twitter: 5
  },
  twitterThresholds: {
    minLikes: 20,
    minReposts: 5,
    minReplies: 5,
    minFollowers: 1000,
    allowReplies: false,
    allowQuotes: true
  },
  qualityFilters: {
    recencyHours: 24,
    minTitleLength: 16,
    minContentLength: 40,
    maxPerDomain: 3,
    removeTrackingParams: true
  },
  domainRules: {
    denylist: [
      't.co',
      'bit.ly',
      'tinyurl.com',
      'spam',
      'clickbait'
    ],
    preferlist: [
      'openai.com',
      'anthropic.com',
      'ai.google.dev',
      'blog.google',
      'research.google',
      'microsoft.com',
      'meta.com',
      'huggingface.co',
      'arxiv.org',
      'github.com',
      'theverge.com',
      'techcrunch.com'
    ]
  }
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

function mergeDeep<T extends object>(base: T, patch: DeepPartial<T>): T {
  const output: any = Array.isArray(base) ? [...(base as any)] : { ...base }

  for (const [key, value] of Object.entries(patch || {})) {
    if (value === undefined) continue
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      key in output &&
      output[key] &&
      typeof output[key] === 'object' &&
      !Array.isArray(output[key])
    ) {
      output[key] = mergeDeep(output[key], value as any)
    } else {
      output[key] = value
    }
  }

  return output as T
}

function toNumber(value: any, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function clampInteger(value: any, fallback: number, min = 0, max = 10000): number {
  const n = Math.floor(toNumber(value, fallback))
  return Math.min(max, Math.max(min, n))
}

function toBoolean(value: any, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

function normalizeStringList(value: any, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback
  return Array.from(
    new Set(
      value
        .map((item) => (typeof item === 'string' ? item.trim().toLowerCase() : ''))
        .filter(Boolean)
    )
  )
}

function sanitizePolicy(input: DeepPartial<SourcePolicy>): SourcePolicy {
  const merged = mergeDeep(DEFAULT_POLICY, input)

  return {
    reliabilityMode: merged.reliabilityMode === 'balanced' ? 'balanced' : 'strict',
    sources: {
      google: toBoolean(merged.sources.google, DEFAULT_POLICY.sources.google),
      bing: toBoolean(merged.sources.bing, DEFAULT_POLICY.sources.bing),
      duckduckgo: toBoolean(merged.sources.duckduckgo, DEFAULT_POLICY.sources.duckduckgo),
      hackernews: toBoolean(merged.sources.hackernews, DEFAULT_POLICY.sources.hackernews),
      twitter: toBoolean(merged.sources.twitter, DEFAULT_POLICY.sources.twitter)
    },
    paidProviders: {
      serpApi: toBoolean(merged.paidProviders.serpApi, DEFAULT_POLICY.paidProviders.serpApi),
      braveSearch: toBoolean(merged.paidProviders.braveSearch, DEFAULT_POLICY.paidProviders.braveSearch)
    },
    sourceQuota: {
      google: clampInteger(merged.sourceQuota.google, DEFAULT_POLICY.sourceQuota.google, 0, 100),
      bing: clampInteger(merged.sourceQuota.bing, DEFAULT_POLICY.sourceQuota.bing, 0, 100),
      duckduckgo: clampInteger(merged.sourceQuota.duckduckgo, DEFAULT_POLICY.sourceQuota.duckduckgo, 0, 100),
      hackernews: clampInteger(merged.sourceQuota.hackernews, DEFAULT_POLICY.sourceQuota.hackernews, 0, 100),
      twitter: clampInteger(merged.sourceQuota.twitter, DEFAULT_POLICY.sourceQuota.twitter, 0, 100)
    },
    twitterThresholds: {
      minLikes: clampInteger(merged.twitterThresholds.minLikes, DEFAULT_POLICY.twitterThresholds.minLikes, 0, 100000),
      minReposts: clampInteger(merged.twitterThresholds.minReposts, DEFAULT_POLICY.twitterThresholds.minReposts, 0, 100000),
      minReplies: clampInteger(merged.twitterThresholds.minReplies, DEFAULT_POLICY.twitterThresholds.minReplies, 0, 100000),
      minFollowers: clampInteger(merged.twitterThresholds.minFollowers, DEFAULT_POLICY.twitterThresholds.minFollowers, 0, 10000000),
      allowReplies: toBoolean(merged.twitterThresholds.allowReplies, DEFAULT_POLICY.twitterThresholds.allowReplies),
      allowQuotes: toBoolean(merged.twitterThresholds.allowQuotes, DEFAULT_POLICY.twitterThresholds.allowQuotes)
    },
    qualityFilters: {
      recencyHours: clampInteger(merged.qualityFilters.recencyHours, DEFAULT_POLICY.qualityFilters.recencyHours, 1, 168),
      minTitleLength: clampInteger(merged.qualityFilters.minTitleLength, DEFAULT_POLICY.qualityFilters.minTitleLength, 4, 120),
      minContentLength: clampInteger(merged.qualityFilters.minContentLength, DEFAULT_POLICY.qualityFilters.minContentLength, 0, 3000),
      maxPerDomain: clampInteger(merged.qualityFilters.maxPerDomain, DEFAULT_POLICY.qualityFilters.maxPerDomain, 1, 50),
      removeTrackingParams: toBoolean(merged.qualityFilters.removeTrackingParams, DEFAULT_POLICY.qualityFilters.removeTrackingParams)
    },
    domainRules: {
      denylist: normalizeStringList(merged.domainRules.denylist, DEFAULT_POLICY.domainRules.denylist),
      preferlist: normalizeStringList(merged.domainRules.preferlist, DEFAULT_POLICY.domainRules.preferlist)
    }
  }
}

class SourcePolicyService {
  private cache: SourcePolicy | null = null

  private async ensurePolicyFile() {
    const dir = path.dirname(POLICY_PATH)
    await fs.mkdir(dir, { recursive: true })

    try {
      await fs.access(POLICY_PATH)
    } catch {
      await fs.writeFile(POLICY_PATH, JSON.stringify(DEFAULT_POLICY, null, 2), 'utf8')
    }
  }

  async getPolicy(forceReload = false): Promise<SourcePolicy> {
    if (this.cache && !forceReload) {
      return this.cache
    }

    await this.ensurePolicyFile()

    try {
      const raw = await fs.readFile(POLICY_PATH, 'utf8')
      const parsed = JSON.parse(raw)
      const policy = sanitizePolicy(parsed)
      this.cache = policy
      return policy
    } catch (error) {
      console.warn('[SourcePolicy] 配置读取失败，回退默认配置')
      this.cache = DEFAULT_POLICY
      return DEFAULT_POLICY
    }
  }

  async updatePolicy(input: DeepPartial<SourcePolicy>): Promise<SourcePolicy> {
    const current = await this.getPolicy()
    const merged = sanitizePolicy(mergeDeep(current, input))
    await this.ensurePolicyFile()
    await fs.writeFile(POLICY_PATH, JSON.stringify(merged, null, 2), 'utf8')
    this.cache = merged
    return merged
  }

  getDefaultPolicy(): SourcePolicy {
    return DEFAULT_POLICY
  }
}

export default new SourcePolicyService()
