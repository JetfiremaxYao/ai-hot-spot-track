import axios from 'axios'
import { load } from 'cheerio'
import sourcePolicyService from './sourcePolicy.js'
import { Article, SourcePolicy } from '../types/index.js'

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

type SourceKey = keyof SourcePolicy['sources']

class CrawlerService {
  private normalizeUrl(url: string, removeTrackingParams: boolean): string {
    try {
      const parsed = new URL(url)
      parsed.hash = ''

      if (removeTrackingParams) {
        const trackingPrefixes = ['utm_', 'spm', 'fbclid', 'gclid', 'mc_']
        for (const key of Array.from(parsed.searchParams.keys())) {
          const lower = key.toLowerCase()
          if (trackingPrefixes.some((prefix) => lower.startsWith(prefix))) {
            parsed.searchParams.delete(key)
          }
        }
      }

      if (
        (parsed.protocol === 'http:' && parsed.port === '80') ||
        (parsed.protocol === 'https:' && parsed.port === '443')
      ) {
        parsed.port = ''
      }

      return parsed.toString().replace(/\/$/, '')
    } catch {
      return url
    }
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.toLowerCase()
    } catch {
      return ''
    }
  }

  private normalizeArticle(article: Article, policy: SourcePolicy): Article {
    const normalizedUrl = this.normalizeUrl(article.url, policy.qualityFilters.removeTrackingParams)
    return {
      ...article,
      url: normalizedUrl,
      domain: this.extractDomain(normalizedUrl)
    }
  }

  private passesDomainRules(article: Article, policy: SourcePolicy): boolean {
    if (!article.domain) return false
    const denylist = policy.domainRules.denylist || []

    if (denylist.some((rule) => article.domain?.includes(rule))) {
      return false
    }

    return true
  }

  private passesQualityFilters(article: Article, policy: SourcePolicy): boolean {
    const title = (article.title || '').trim()
    const content = (article.content || '').trim()

    if (title.length < policy.qualityFilters.minTitleLength) {
      return false
    }

    if (content.length > 0 && content.length < policy.qualityFilters.minContentLength) {
      return false
    }

    // 极端短句或乱码会被剔除
    if (!/\w{3,}/.test(title)) {
      return false
    }

    return true
  }

  private passesRecencyWindow(article: Article, policy: SourcePolicy): boolean {
    if (!article.publishedAt) return true

    const publishedTime = article.publishedAt instanceof Date
      ? article.publishedAt.getTime()
      : new Date(article.publishedAt).getTime()

    if (!Number.isFinite(publishedTime)) {
      return false
    }

    const windowMs = policy.qualityFilters.recencyHours * 60 * 60 * 1000
    const cutoff = Date.now() - windowMs
    return publishedTime >= cutoff
  }

  private sourceToKey(source: string): SourceKey | null {
    const mapping: Record<string, SourceKey> = {
      google: 'google',
      bing: 'bing',
      duckduckgo: 'duckduckgo',
      hackernews: 'hackernews',
      twitter: 'twitter'
    }

    return mapping[source] || null
  }

  private applySourceQuota(articles: Article[], policy: SourcePolicy): Article[] {
    const sourceCounts: Record<string, number> = {}
    const domainCounts: Record<string, number> = {}
    const result: Article[] = []

    for (const article of articles) {
      const sourceKey = this.sourceToKey(article.source)
      const sourceQuota = sourceKey ? policy.sourceQuota[sourceKey] : 10
      const sourceCount = sourceCounts[article.source] || 0

      if (sourceCount >= sourceQuota) {
        continue
      }

      const domain = article.domain || 'unknown'
      const domainCount = domainCounts[domain] || 0
      if (domainCount >= policy.qualityFilters.maxPerDomain) {
        continue
      }

      sourceCounts[article.source] = sourceCount + 1
      domainCounts[domain] = domainCount + 1
      result.push(article)
    }

    return result
  }

  private parseTwitterCount(value: any): number {
    const n = Number(value)
    return Number.isFinite(n) && n > 0 ? n : 0
  }

  private passesTwitterThresholds(article: Article, policy: SourcePolicy): boolean {
    const thresholds = policy.twitterThresholds
    const signals = article.qualitySignals || {}

    if (!thresholds.allowReplies && signals.isReply) {
      return false
    }

    if (!thresholds.allowQuotes && signals.isQuote) {
      return false
    }

    if ((signals.likes || 0) < thresholds.minLikes) {
      return false
    }

    if ((signals.reposts || 0) < thresholds.minReposts) {
      return false
    }

    if ((signals.replies || 0) < thresholds.minReplies) {
      return false
    }

    if ((signals.followers || 0) < thresholds.minFollowers) {
      return false
    }

    return true
  }

  // Bing 搜索（无需 API）
  async crawlBing(keywords: string[] = []): Promise<Article[]> {
    const query = keywords.length > 0
      ? keywords.join(' OR ') + ' AI'
      : 'AI artificial intelligence news'

    try {
      const response = await axios.get('https://www.bing.com/news/search', {
        params: { q: query, FORM: 'HDRSC6' },
        timeout: 12000,
        headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' }
      })

      const $ = load(response.data)
      const articles: Article[] = []

      $('div.news-card, a.news-card').slice(0, 25).each((_, el) => {
        try {
          const titleEl = $(el).find('a.title, div.title')
          const title = titleEl.text()?.trim() || $(el).attr('aria-label') || ''
          const url = titleEl.attr('href') || $(el).attr('href') || ''
          const snippet = $(el).find('.snippet, .description').text()?.trim() || ''
          const source = $(el).find('.source').text()?.trim() || ''

          if (title && url && url.startsWith('http')) {
            articles.push({
              title,
              url,
              source: 'bing',
              publishedAt: new Date(),
              content: snippet ? `${source} - ${snippet}` : title
            })
          }
        } catch {
          // skip item
        }
      })

      if (articles.length === 0) {
        const resp2 = await axios.get('https://www.bing.com/search', {
          params: { q: query },
          timeout: 12000,
          headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' }
        })
        const $2 = load(resp2.data)
        $2('#b_results li.b_algo').slice(0, 20).each((_, el) => {
          try {
            const a = $2(el).find('h2 a')
            const title = a.text()?.trim() || ''
            const url = a.attr('href') || ''
            const snippet = $2(el).find('.b_caption p, .b_lineclamp2').text()?.trim() || ''

            if (title && url && url.startsWith('http')) {
              articles.push({ title, url, source: 'bing', publishedAt: new Date(), content: snippet })
            }
          } catch {
            // skip item
          }
        })
      }

      console.log(`✓ 爬取 Bing: ${articles.length} 条结果`)
      return articles
    } catch (error: any) {
      console.error('❌ 爬虫错误 (Bing):', error.message)
      return []
    }
  }

  // Google 搜索（无需 API）
  async crawlGoogle(keywords: string[] = []): Promise<Article[]> {
    const query = keywords.length > 0
      ? keywords.join(' OR ') + ' AI news'
      : 'AI artificial intelligence latest news'

    try {
      const response = await axios.get('https://www.google.com/search', {
        params: { q: query, num: 20, hl: 'en', tbm: 'nws' },
        timeout: 30000,
        headers: {
          'User-Agent': UA,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      })

      const $ = load(response.data)
      const articles: Article[] = []

      $('div.SoaBEf, div.xuvV6b, div.dbsr').slice(0, 20).each((_, el) => {
        try {
          const a = $(el).find('a').first()
          const url = a.attr('href') || ''
          const title = $(el).find('div.MBeuO, div.n0jPhd, div.JheGif').text()?.trim()
            || a.text()?.trim() || ''
          const snippet = $(el).find('div.GI74Re, div.Y3v8qd').text()?.trim() || ''

          if (title && url && url.startsWith('http')) {
            articles.push({ title, url, source: 'google', publishedAt: new Date(), content: snippet })
          }
        } catch {
          // skip item
        }
      })

      if (articles.length === 0) {
        $('div.g, div.tF2Cxc').slice(0, 20).each((_, el) => {
          try {
            const a = $(el).find('a').first()
            const url = a.attr('href') || ''
            const title = $(el).find('h3').text()?.trim() || ''
            const snippet = $(el).find('.VwiC3b, .IsZvec').text()?.trim() || ''

            if (title && url && url.startsWith('http')) {
              articles.push({ title, url, source: 'google', publishedAt: new Date(), content: snippet })
            }
          } catch {
            // skip item
          }
        })
      }

      console.log(`✓ 爬取 Google: ${articles.length} 条结果`)
      return articles
    } catch (error: any) {
      console.error('❌ 爬虫错误 (Google):', error.message)
      return []
    }
  }

  // DuckDuckGo 搜索（无需 API）
  async crawlDuckDuckGo(keywords: string[] = []): Promise<Article[]> {
    const query = keywords.length > 0
      ? keywords.join(' ') + ' AI'
      : 'AI artificial intelligence news'

    try {
      const response = await axios.get('https://html.duckduckgo.com/html/', {
        params: { q: query },
        timeout: 30000,
        headers: {
          'User-Agent': UA,
          'Accept': 'text/html',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      })

      const $ = load(response.data)
      const articles: Article[] = []

      $('div.result, div.web-result').slice(0, 25).each((_, el) => {
        try {
          const a = $(el).find('a.result__a')
          const title = a.text()?.trim() || ''
          let url = a.attr('href') || ''
          const snippet = $(el).find('.result__snippet, a.result__snippet').text()?.trim() || ''

          if (url.includes('uddg=')) {
            const match = url.match(/uddg=([^&]+)/)
            if (match) url = decodeURIComponent(match[1])
          }

          if (title && url && url.startsWith('http')) {
            articles.push({ title, url, source: 'duckduckgo', publishedAt: new Date(), content: snippet })
          }
        } catch {
          // skip item
        }
      })

      console.log(`✓ 爬取 DuckDuckGo: ${articles.length} 条结果`)
      return articles
    } catch (error: any) {
      console.error('❌ 爬虫错误 (DuckDuckGo):', error.message)
      return []
    }
  }

  // HackerNews
  async crawlHackerNews(): Promise<Article[]> {
    try {
      const response = await axios.get('https://news.ycombinator.com', {
        timeout: 30000,
        headers: { 'User-Agent': UA }
      })

      const $ = load(response.data)
      const articles: Article[] = []

      $('tr.athing').slice(0, 30).each((_, el) => {
        try {
          const titleEl = $(el).find('.titleline > a').first()
          const title = titleEl.text()
          const url = titleEl.attr('href') || ''

          const nextRow = $(el).next()
          const scoreText = nextRow.find('.score').text()
          const points = parseInt(scoreText, 10) || 0

          if (title && url) {
            articles.push({
              title,
              url: url.startsWith('http') ? url : `https://news.ycombinator.com/${url}`,
              source: 'hackernews',
              publishedAt: new Date(),
              content: `Points: ${points}`
            })
          }
        } catch {
          // skip item
        }
      })

      console.log(`✓ 爬取 HackerNews: ${articles.length} 篇文章`)
      return articles
    } catch (error: any) {
      console.error('❌ 爬虫错误 (HackerNews):', error.message)
      return []
    }
  }

  // Twitter/X（默认关闭，通过配置页开启）
  async crawlTwitter(keywords: string[] = [], policy?: SourcePolicy): Promise<Article[]> {
    const currentPolicy = policy || await sourcePolicyService.getPolicy()

    if (!currentPolicy.sources.twitter) {
      console.log('⏭️  跳过 Twitter/X (配置中已关闭)')
      return []
    }

    const enableTwitterEnv = process.env.ENABLE_TWITTER === 'true'
    if (!enableTwitterEnv) {
      console.log('⏭️  跳过 Twitter/X (ENABLE_TWITTER !== true)')
      return []
    }

    const apiKey = process.env.TWITTERAPI_IO_KEY
    if (!apiKey) {
      console.log('⚠️ 跳过 Twitter/X (未配置 TWITTERAPI_IO_KEY)')
      return []
    }

    try {
      const query = keywords.length > 0
        ? keywords.map((k) => `"${k}"`).join(' OR ')
        : 'AI OR GPT OR LLM'

      const response = await axios.get('https://api.twitterapi.io/twitter/tweet/advanced_search', {
        params: { query, queryType: 'Latest' },
        headers: { 'x-api-key': apiKey },
        timeout: 15000
      })

      const tweets = response.data?.tweets || []
      const articles: Article[] = tweets.map((t: any) => {
        const likes = this.parseTwitterCount(t.likeCount ?? t.favoriteCount ?? t.favorite_count)
        const reposts = this.parseTwitterCount(t.retweetCount ?? t.repostCount ?? t.retweet_count)
        const replies = this.parseTwitterCount(t.replyCount ?? t.reply_count)
        const followers = this.parseTwitterCount(
          t.author?.followers ??
          t.author?.followersCount ??
          t.author?.followers_count ??
          t.user?.followers_count
        )

        return {
          title: t.text?.slice(0, 120) || 'Tweet',
          url: t.url || `https://twitter.com/i/web/status/${t.id}`,
          source: 'twitter',
          publishedAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          content: t.text || '',
          author: t.author?.userName || t.author?.name || t.user?.screen_name,
          qualitySignals: {
            likes,
            reposts,
            replies,
            followers,
            isReply: Boolean(t.inReplyToStatusId || t.inReplyToStatusIdStr || t.inReplyToTweetId),
            isQuote: Boolean(t.isQuoteStatus || t.is_quote_status)
          }
        }
      })

      const filtered = articles.filter((article) => this.passesTwitterThresholds(article, currentPolicy))

      console.log(`✓ 爬取 Twitter/X: ${articles.length} 条，过滤后 ${filtered.length} 条`)
      return filtered
    } catch (error: any) {
      console.error('❌ 爬虫错误 (Twitter/X):', error.message)
      return []
    }
  }

  // 爬取所有源
  async crawlAll(keywords: string[] = []): Promise<Article[]> {
    const policy = await sourcePolicyService.getPolicy()

    const [bingArticles, googleArticles, hnArticles, ddgArticles, twitterArticles] = await Promise.all([
      policy.sources.bing ? this.crawlBing(keywords) : Promise.resolve([]),
      policy.sources.google ? this.crawlGoogle(keywords) : Promise.resolve([]),
      policy.sources.hackernews ? this.crawlHackerNews() : Promise.resolve([]),
      policy.sources.duckduckgo ? this.crawlDuckDuckGo(keywords) : Promise.resolve([]),
      this.crawlTwitter(keywords, policy)
    ])

    const all = [...bingArticles, ...googleArticles, ...hnArticles, ...ddgArticles, ...twitterArticles]

    const normalized = all
      .filter((article) => Boolean(article.url && article.title))
      .map((article) => this.normalizeArticle(article, policy))

    const seen = new Set<string>()
    const deduped = normalized.filter((article) => {
      const key = `${article.url}|${article.title.toLowerCase().trim()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    const qualityFiltered = deduped.filter((article) =>
      this.passesDomainRules(article, policy) &&
      this.passesQualityFilters(article, policy) &&
      this.passesRecencyWindow(article, policy)
    )

    const prioritized = qualityFiltered.sort((a, b) => {
      const aPreferred = policy.domainRules.preferlist.some((domain) => a.domain?.includes(domain)) ? 1 : 0
      const bPreferred = policy.domainRules.preferlist.some((domain) => b.domain?.includes(domain)) ? 1 : 0
      return bPreferred - aPreferred
    })

    const finalResult = this.applySourceQuota(prioritized, policy)

    console.log(`📊 合计: ${all.length} 条 → 去重后 ${deduped.length} 条 → 过滤后 ${qualityFiltered.length} 条 → 配额后 ${finalResult.length} 条`)
    return finalResult
  }
}

export default new CrawlerService()
