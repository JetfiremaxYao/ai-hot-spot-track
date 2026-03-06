import axios from 'axios'
import { load } from 'cheerio'
import { Article } from '../types/index.js'

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

class CrawlerService {

  // ─── Bing 搜索（无需 API） ───────────────────────────────

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

      // Bing News card 结构
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
        } catch (e) { /* skip */ }
      })

      // 备用选择器 — Bing 普通搜索结果
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
          } catch (e) { /* skip */ }
        })
      }

      console.log(`✓ 爬取 Bing: ${articles.length} 条结果`)
      return articles
    } catch (error: any) {
      console.error('❌ 爬虫错误 (Bing):', error.message)
      return []
    }
  }

  // ─── Google 搜索（无需 API） ──────────────────────────────

  async crawlGoogle(keywords: string[] = []): Promise<Article[]> {
    const query = keywords.length > 0
      ? keywords.join(' OR ') + ' AI news'
      : 'AI artificial intelligence latest news'

    try {
      // 使用 Google 轻量 HTML 页面（不易被 block）
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

      // Google News 搜索结果
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
        } catch (e) { /* skip */ }
      })

      // 备用: 普通搜索结果
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
          } catch (e) { /* skip */ }
        })
      }

      console.log(`✓ 爬取 Google: ${articles.length} 条结果`)
      return articles
    } catch (error: any) {
      console.error('❌ 爬虫错误 (Google):', error.message)
      return []
    }
  }

  // ─── DuckDuckGo 搜索（无需 API） ─────────────────────────

  async crawlDuckDuckGo(keywords: string[] = []): Promise<Article[]> {
    const query = keywords.length > 0
      ? keywords.join(' ') + ' AI'
      : 'AI artificial intelligence news'

    try {
      // DuckDuckGo HTML 版本，对爬虫非常友好
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

          // DuckDuckGo 有时会用重定向 URL
          if (url.includes('uddg=')) {
            const match = url.match(/uddg=([^&]+)/)
            if (match) url = decodeURIComponent(match[1])
          }

          if (title && url && url.startsWith('http')) {
            articles.push({ title, url, source: 'duckduckgo', publishedAt: new Date(), content: snippet })
          }
        } catch (e) { /* skip */ }
      })

      console.log(`✓ 爬取 DuckDuckGo: ${articles.length} 条结果`)
      return articles
    } catch (error: any) {
      console.error('❌ 爬虫错误 (DuckDuckGo):', error.message)
      return []
    }
  }

  // ─── HackerNews（保留） ───────────────────────────────────

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
          const points = parseInt(scoreText) || 0

          if (title && url) {
            articles.push({
              title,
              url: url.startsWith('http') ? url : `https://news.ycombinator.com/${url}`,
              source: 'hackernews',
              publishedAt: new Date(),
              content: `Points: ${points}`
            })
          }
        } catch (e) { /* skip */ }
      })

      console.log(`✓ 爬取 HackerNews: ${articles.length} 篇文章`)
      return articles
    } catch (error: any) {
      console.error('❌ 爬虫错误 (HackerNews):', error.message)
      return []
    }
  }

  // ─── Twitter/X（默认关闭，通过 ENABLE_TWITTER=true 开启） ──

  async crawlTwitter(keywords: string[] = []): Promise<Article[]> {
    // 默认关闭，需要通过环境变量 ENABLE_TWITTER=true 开启
    const enableTwitter = process.env.ENABLE_TWITTER === 'true'
    if (!enableTwitter) {
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
        ? keywords.map(k => `"${k}"`).join(' OR ')
        : 'AI OR GPT OR LLM'

      const response = await axios.get('https://api.twitterapi.io/twitter/tweet/advanced_search', {
        params: { query, queryType: 'Latest' },
        headers: { 'x-api-key': apiKey },
        timeout: 15000
      })

      const tweets = response.data?.tweets || []
      const articles: Article[] = tweets.map((t: any) => ({
        title: t.text?.slice(0, 120) || 'Tweet',
        url: t.url || `https://twitter.com/i/web/status/${t.id}`,
        source: 'twitter',
        publishedAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        content: t.text || ''
      }))

      console.log(`✓ 爬取 Twitter/X: ${articles.length} 条`)
      return articles
    } catch (error: any) {
      console.error('❌ 爬虫错误 (Twitter/X):', error.message)
      return []
    }
  }

  // ─── 爬取所有源 ───────────────────────────────────────────

  async crawlAll(keywords: string[] = []): Promise<Article[]> {
    // 主要信息源：Bing、Google、HackerNews、DuckDuckGo（均无需 API）
    // Twitter 通过 ENABLE_TWITTER=true 开关控制
    const [bingArticles, googleArticles, hnArticles, ddgArticles, twitterArticles] = await Promise.all([
      this.crawlBing(keywords),
      this.crawlGoogle(keywords),
      this.crawlHackerNews(),
      this.crawlDuckDuckGo(keywords),
      this.crawlTwitter(keywords)
    ])

    const all = [...bingArticles, ...googleArticles, ...hnArticles, ...ddgArticles, ...twitterArticles]

    // 按 URL 去重
    const seen = new Set<string>()
    const deduped = all.filter(a => {
      if (seen.has(a.url)) return false
      seen.add(a.url)
      return true
    })

    console.log(`📊 合计: ${all.length} 条 → 去重后 ${deduped.length} 条`)
    return deduped
  }
}

export default new CrawlerService()
