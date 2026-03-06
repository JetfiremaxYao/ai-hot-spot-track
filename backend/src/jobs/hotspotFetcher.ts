import cron from 'node-cron'
import { prisma, io } from '../index.js'
import crawlerService from '../services/crawler.js'
import aiAnalyzer from '../services/aiAnalyzer.js'

/**
 * 定时爬虫任务 - 每30分钟运行一次
 */
cron.schedule('*/30 * * * *', async () => {
  const startTime = Date.now()
  console.log('\n='.repeat(60))
  console.log(`[爬虫任务] 开始爬取热点 - ${new Date().toLocaleString()}`)
  console.log('='.repeat(60))

  try {
    // 1. 获取所有活跃关键词
    const activeKeywords = await prisma.keyword.findMany({
      where: { status: 'active' }
    })

    if (activeKeywords.length === 0) {
      console.log('⚠️  没有活跃关键词，跳过爬取')
      return
    }

    console.log(`📌 找到 ${activeKeywords.length} 个活跃关键词`)

    // 2. 关键词用于匹配（简化版，你可以改进）
    const keywordNames = activeKeywords.map(k => k.name)

    // 3. 爬取所有源
    console.log('🕷️  正在爬取数据源...')
    const allArticles = await crawlerService.crawlAll(keywordNames)

    if (allArticles.length === 0) {
      console.log('⚠️  未爬取到任何文章')
      return
    }

    console.log(`✓ 共爬取 ${allArticles.length} 篇文章`)

    // 4. 关键词初筛，减少无关分析
    const keywordSet = keywordNames.map(k => k.toLowerCase())
    const candidates = allArticles.filter(article => {
      const text = `${article.title} ${article.content || ''}`.toLowerCase()
      return keywordSet.some(k => text.includes(k))
    })

    const maxToProcess = parseInt(process.env.MAX_ARTICLES_PER_RUN || '50')
    const toProcess = candidates.slice(0, maxToProcess)

    console.log(`🔎 关键词匹配: ${candidates.length} 篇，实际处理 ${toProcess.length} 篇`)

    // 5. 处理每篇文章
    let newHotspotCount = 0
    let duplicateCount = 0

    for (const article of toProcess) {
      try {
        // 检查是否已存在（通过URL）
        const existing = await prisma.hotspot.findUnique({
          where: { sourceUrl: article.url }
        })

        if (existing) {
          duplicateCount++
          continue
        }

        // AI分析
        console.log(`🤖 分析: ${article.title.substring(0, 50)}...`)
        const analysis = await aiAnalyzer.analyzeHotspot(
          article.title,
          article.content || article.title,
          keywordNames
        )

        // 匹配相关关键词
        const matchedKeywords = activeKeywords.filter(kw =>
          article.title.toLowerCase().includes(kw.name.toLowerCase()) ||
          (article.content && article.content.toLowerCase().includes(kw.name.toLowerCase()))
        )

        // 创建热点记录
        const hotspot = await prisma.hotspot.create({
          data: {
            title: article.title.substring(0, 500),
            summary: analysis.summary,
            content: (article.content || '').substring(0, 2000),
            source: article.source as any,
            sourceUrl: article.url,
            relevanceScore: analysis.relevanceScore,
            hotnessScore: analysis.hotnessScore,
            credibilityScore: analysis.credibilityScore,
            publishedAt: article.publishedAt || new Date(),
            author: article.author || null,
            keywords: {
              connect: matchedKeywords.length > 0
                ? matchedKeywords.map(kw => ({ id: kw.id }))
                : activeKeywords.slice(0, 1).map(kw => ({ id: kw.id })) // 至少关联第一个关键词
            }
          },
          include: { keywords: true }
        })

        newHotspotCount++

        // 推送给订阅用户（热度 > 6）
        if (hotspot.hotnessScore > 6) {
          hotspot.keywords.forEach((kw: any) => {
            io.to(`keyword:${kw.name}`).emit('newHotspot', {
              id: hotspot.id,
              title: hotspot.title,
              summary: hotspot.summary,
              hotnessScore: hotspot.hotnessScore,
              source: hotspot.source,
              sourceUrl: hotspot.sourceUrl,
              createdAt: hotspot.createdAt
            })
          })

          console.log(
            `📢 推送到 ${hotspot.keywords.map((k: any) => k.name).join(', ')} - 热度: ${hotspot.hotnessScore.toFixed(1)}`
          )
        }
      } catch (articleError) {
        console.error('❌ 处理文章失败:', articleError)
        continue
      }
    }

    // 5. 更新关键词的最后检查时间
    await prisma.keyword.updateMany({
      where: { status: 'active' },
      data: { lastCheckedAt: new Date() }
    })

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log('\n' + '='.repeat(60))
    console.log(`✓ 爬虫任务完成`)
    console.log(`  新增热点: ${newHotspotCount}`)
    console.log(`  重复记录: ${duplicateCount}`)
    console.log(`  用时: ${duration}秒`)
    console.log('='.repeat(60) + '\n')
  } catch (error) {
    console.error('❌ 爬虫任务出错:', error)
  }
})

// 首次启动延迟执行（以免与服务器启动冲突）
setTimeout(() => {
  console.log('\n💡 爬虫任务已启动，将每30分钟执行一次')
  console.log('⏱️  首次执行将在30分钟内进行\n')
}, 5000)

export default {}
