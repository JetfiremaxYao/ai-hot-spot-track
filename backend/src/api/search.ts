import { Router, Request, Response } from 'express'
import { prisma } from '../index.js'
import { ApiResponse } from '../types/index.js'
import crawlerService from '../services/crawler.js'
import aiAnalyzer from '../services/aiAnalyzer.js'
import titleTranslator from '../services/titleTranslator.js'

const router = Router()

// GET /api/search - 全网搜索
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q, mode = 'db', limit = '20' } = req.query

    if (!q || typeof q !== 'string' || q.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '搜索关键词不能为空'
      })
    }

    const query = q.trim()
    const take = Math.min(parseInt(limit as string) || 20, 50)

    // 模式: db (本地数据库), live (即时抓取)
    if (mode === 'live') {
      const articles = await crawlerService.crawlAll([query])

      const filtered = articles.filter(a =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        (a.content && a.content.toLowerCase().includes(query.toLowerCase()))
      )

      const sliced = filtered.slice(0, take)
      const analyzed = []

      for (const article of sliced) {
        try {
          const translatedTitle = await titleTranslator.translateTitle(article.title)
          const analysis = await aiAnalyzer.analyzeHotspot(
            article.title,
            article.content || article.title,
            [query]
          )

          analyzed.push({
            id: Date.now() + analyzed.length,
            title: translatedTitle,
            summary: analysis.summary,
            content: article.content || '',
            source: article.source,
            sourceUrl: article.url,
            relevanceScore: analysis.relevanceScore,
            hotnessScore: analysis.hotnessScore,
            credibilityScore: analysis.credibilityScore,
            publishedAt: article.publishedAt || new Date(),
            isRead: true,
            isSaved: false,
            viewCount: 0,
            likeCount: 0,
            keywords: []
          })
        } catch (error) {
          const translatedTitle = await titleTranslator.translateTitle(article.title)
          analyzed.push({
            id: Date.now() + analyzed.length,
            title: translatedTitle,
            summary: article.content?.substring(0, 200) || '',
            content: article.content || '',
            source: article.source,
            sourceUrl: article.url,
            relevanceScore: 5,
            hotnessScore: 5,
            credibilityScore: 7,
            publishedAt: article.publishedAt || new Date(),
            isRead: true,
            isSaved: false,
            viewCount: 0,
            likeCount: 0,
            keywords: []
          })
        }
      }

      const response: ApiResponse<any> = {
        success: true,
        data: {
          mode: 'live',
          query,
          results: analyzed
        }
      }

      return res.json(response)
    }

    // 默认从数据库搜索
    const hotspots = await prisma.hotspot.findMany({
      where: {
        keywords: {
          some: {
            status: 'active'
          }
        },
        OR: [
          { title: { contains: query } },
          { summary: { contains: query } },
          { content: { contains: query } }
        ]
      },
      include: { keywords: true },
      orderBy: { createdAt: 'desc' },
      take
    })

    const response: ApiResponse<any> = {
      success: true,
      data: {
        mode: 'db',
        query,
        results: hotspots
      }
    }

    res.json(response)
  } catch (error: any) {
    console.error('搜索失败:', error)
    res.status(500).json({
      success: false,
      error: '搜索失败'
    })
  }
})

export default router
