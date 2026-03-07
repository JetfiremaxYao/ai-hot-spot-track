import { Router, Request, Response } from 'express'
import { prisma, io } from '../index.js'
import { ApiResponse } from '../types/index.js'
import crawlerService from '../services/crawler.js'
import aiAnalyzer from '../services/aiAnalyzer.js'

const router = Router()

// GET /api/hotspots - 获取热点列表（支持分页和筛选）
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      keyword,
      source,
      minHotness = '0',
      maxHotness = '10',
      sortBy = 'hotness',
      limit = '20',
      offset = '0',
      isRead,
      isSaved
    } = req.query

    // 构建where条件
    const where: any = {}

    if (keyword && typeof keyword === 'string') {
      where.keywords = {
        some: {
          status: 'active',
          name: {
            contains: keyword,
            mode: 'insensitive'
          }
        }
      }
    } else {
      // 默认只展示仍关联活跃关键词的热点
      where.keywords = {
        some: {
          status: 'active'
        }
      }
    }

    if (source && typeof source === 'string') {
      where.source = source
    }

    if (minHotness !== undefined || maxHotness !== undefined) {
      where.hotnessScore = {
        gte: parseFloat(minHotness as string) || 0,
        lte: parseFloat(maxHotness as string) || 10
      }
    }

    if (isRead === 'true') {
      where.isRead = true
    } else if (isRead === 'false') {
      where.isRead = false
    }

    if (isSaved === 'true') {
      where.isSaved = true
    } else if (isSaved === 'false') {
      where.isSaved = false
    }

    // 排序
    const orderBy: any = {}
    switch (sortBy) {
      case 'relevance':
        orderBy.relevanceScore = 'desc'
        break
      case 'credibility':
        orderBy.credibilityScore = 'desc'
        break
      case 'time':
        orderBy.publishedAt = 'desc'
        break
      case 'hotness':
      default:
        orderBy.hotnessScore = 'desc'
    }

    const [hotspots, total] = await Promise.all([
      prisma.hotspot.findMany({
        where,
        orderBy,
        take: Math.min(parseInt(limit as string) || 20, 100),
        skip: parseInt(offset as string) || 0,
        include: {
          keywords: true
        }
      }),
      prisma.hotspot.count({ where })
    ])

    const response: ApiResponse<any> = {
      success: true,
      data: {
        hotspots,
        total,
        page: Math.floor((parseInt(offset as string) || 0) / (parseInt(limit as string) || 20)) + 1,
        pageSize: parseInt(limit as string) || 20
      }
    }

    res.json(response)
  } catch (error: any) {
    console.error('获取热点列表失败:', error)
    res.status(500).json({
      success: false,
      error: '获取热点列表失败'
    })
  }
})

// POST /api/hotspots/refresh - 手动刷新所有热点
router.post('/refresh', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'started',
      message: '刷新任务已启动'
    }
  })

  void (async () => {
    try {
      const startTime = Date.now()
      console.log('\n📲 手动刷新热点 -', new Date().toLocaleString())

      // 1. 获取所有活跃关键词
      const activeKeywords = await prisma.keyword.findMany({
        where: { status: 'active' }
      })

      if (activeKeywords.length === 0) {
        io.emit('refresh:done', {
          newCount: 0,
          totalProcessed: 0,
          message: '没有活跃关键词'
        })
        return
      }

      // 2. 处理文章
      const keywordNames = activeKeywords.map(k => k.name)

      // 3. 爬取所有源
      const allArticles = await crawlerService.crawlAll(keywordNames)
      if (allArticles.length === 0) {
        io.emit('refresh:done', {
          newCount: 0,
          totalProcessed: 0,
          message: '未爬取到任何文章'
        })
        return
      }

      console.log(`✓ 爬取到 ${allArticles.length} 篇文章`)

      // 4. 关键词初筛，减少无关分析
      const keywordSet = keywordNames.map(k => k.toLowerCase())
      const candidates = allArticles.filter(article => {
        const text = `${article.title} ${article.content || ''}`.toLowerCase()
        return keywordSet.some(k => text.includes(k))
      })

      const maxToProcess = parseInt(process.env.MAX_ARTICLES_PER_RUN || '50')
      const toProcess = candidates.slice(0, maxToProcess)

      console.log(`🔎 关键词匹配: ${candidates.length} 篇，实际处理 ${toProcess.length} 篇`)

      // 5. 处理文章
      let newHotspotCount = 0
      const newHotspots = []

      for (const article of toProcess) {
        try {
          // 检查重复
          const existing = await prisma.hotspot.findUnique({
            where: { sourceUrl: article.url }
          })

          if (existing) continue

          // AI 分析
          const analysis = await aiAnalyzer.analyzeHotspot(
            article.title,
            article.content || article.title,
            keywordNames
          )

          // 匹配关键词
          const matchedKeywords = activeKeywords.filter(kw =>
            article.title.toLowerCase().includes(kw.name.toLowerCase()) ||
            (article.content && article.content.toLowerCase().includes(kw.name.toLowerCase()))
          )

          // 创建热点
          const hotspot = await prisma.hotspot.create({
            data: {
              title: article.title.substring(0, 500),
              summary: analysis.summary,
              content: (article.content || '').substring(0, 2000),
              source: article.source as any,
              sourceUrl: article.url,
              relevanceScore: analysis.relevanceScore,
              credibilityScore: analysis.credibilityScore,
              keywords: {
                connect: matchedKeywords.map(kw => ({ id: kw.id }))
              },
              publishedAt: article.publishedAt || new Date()
            },
            include: { keywords: true }
          })

          newHotspotCount++
          newHotspots.push(hotspot)
        } catch (error) {
          console.error('❌ 处理文章失败:', error)
        }
      }

      // 6. 通过 WebSocket 广播新热点
      if (newHotspotCount > 0) {
        io.emit('hotspot:new', {
          count: newHotspotCount,
          hotspots: newHotspots,
          timestamp: new Date().toISOString()
        })
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`✅ 完成! 发现 ${newHotspotCount} 个新热点 (耗时 ${duration}s)`)

      io.emit('refresh:done', {
        newCount: newHotspotCount,
        totalProcessed: allArticles.length,
        message: `成功发现 ${newHotspotCount} 个新热点`
      })
    } catch (error) {
      console.error('❌ 刷新失败:', error)
      io.emit('refresh:done', {
        newCount: 0,
        totalProcessed: 0,
        message: '刷新失败'
      })
    }
  })()
})

// GET /api/hotspots/:id - 获取热点详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const hotspot = await prisma.hotspot.findUnique({
      where: { id: parseInt(id) },
      include: { keywords: true }
    })

    if (!hotspot) {
      return res.status(404).json({
        success: false,
        error: '热点不存在'
      })
    }

    // 增加浏览次数
    await prisma.hotspot.update({
      where: { id: parseInt(id) },
      data: { viewCount: { increment: 1 } }
    })

    res.json({
      success: true,
      data: hotspot
    })
  } catch (error: any) {
    console.error('获取热点详情失败:', error)
    res.status(500).json({
      success: false,
      error: '获取热点详情失败'
    })
  }
})

// PATCH /api/hotspots/:id/read - 标记为已读
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const hotspot = await prisma.hotspot.update({
      where: { id: parseInt(id) },
      data: { isRead: true }
    })

    res.json({
      success: true,
      data: hotspot,
      message: '已标记为已读'
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: '热点不存在'
      })
    }

    res.status(500).json({
      success: false,
      error: '标记失败'
    })
  }
})

// PATCH /api/hotspots/:id/save - 收藏/取消收藏
router.patch('/:id/save', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { isSaved } = req.body

    const hotspot = await prisma.hotspot.update({
      where: { id: parseInt(id) },
      data: { isSaved: Boolean(isSaved) }
    })

    res.json({
      success: true,
      data: hotspot,
      message: isSaved ? '已收藏' : '已取消收藏'
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: '热点不存在'
      })
    }

    res.status(500).json({
      success: false,
      error: '更新失败'
    })
  }
})

// PATCH /api/hotspots/:id/like - 点赞/取消点赞
router.patch('/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { like } = req.body

    const hotspot = await prisma.hotspot.update({
      where: { id: parseInt(id) },
      data: {
        likeCount: like ? { increment: 1 } : { decrement: 1 }
      }
    })

    res.json({
      success: true,
      data: hotspot
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: '热点不存在'
      })
    }

    res.status(500).json({
      success: false,
      error: '更新失败'
    })
  }
})

export default router
