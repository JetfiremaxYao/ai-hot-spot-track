# AI热点监控系统 - 开发计划文档

## 开发进度概览

**项目周期**: 分2个阶段，共约2-3周（根据实际调整）

**当前阶段**: 第一阶段 - 网页版MVP

---

## 第一阶段：网页版MVP (2-2.5周)

### Phase 1: 项目初始化 (1-2天)

#### Item 1.1: 初始化项目结构
- [ ] 克隆/创建项目目录
- [ ] 创建frontend和backend子目录
- [ ] 初始化npm工作区或monorepo结构

#### Item 1.2: 初始化后端项目
```bash
cd backend
npm init -y
npm install express cors dotenv prisma @prisma/client socket.io axios cheerio node-cron bull
npm install -D typescript @types/node @types/express nodemon ts-node
```

**后端package.json**:
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

#### Item 1.3: 初始化前端项目
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install tailwindcss postcss autoprefixer
npm install shadcn-ui @radix-ui/react-icons
npx shadcn-ui@latest init
```

**前端package.json**:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

#### Item 1.4: 配置TailwindCSS
- 创建tailwind.config.js和postcss.config.js
- 配置深色模式
- 设置自定义主题色（独特UI风格）

#### Item 1.5: 配置TypeScript
- 根目录tsconfig.json
- backend和frontend各自的tsconfig.json

---

### Phase 2: 数据库设计和初始化 (1天)

#### Item 2.1: 设计Prisma Schema
创建`backend/prisma/schema.prisma`

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Keyword {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  description String?
  status    String   @default("active") // 'active' | 'paused'
  hotspots  Hotspot[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  lastCheckedAt DateTime?
  
  @@index([status])
  @@index([createdAt])
}

model Hotspot {
  id               Int      @id @default(autoincrement())
  title            String
  summary          String   @db.Text
  content          String   @db.Text
  source           String   // 'twitter' | 'github' | 'hackernews' | 'reddit' | 'news' | 'rss'
  sourceUrl        String   @unique
  
  relevanceScore   Float    @default(0) // 0-10
  hotnessScore     Float    @default(0) // 0-10
  credibilityScore Float    @default(0) // 0-10
  
  imageUrl         String?
  author           String?
  
  publishedAt      DateTime
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  isRead           Boolean  @default(false)
  isSaved          Boolean  @default(false)
  
  keywords         Keyword[]
  viewCount        Int      @default(0)
  likeCount        Int      @default(0)
  
  @@index([source])
  @@index([hotnessScore])
  @@index([createdAt])
  @@index([isRead])
}

model HotspotKeyword {
  hotspotId Int
  keywordId Int
  hotspot   Hotspot @relation(fields: [hotspotId], references: [id], onDelete: Cascade)
  keyword   Keyword @relation(fields: [keywordId], references: [id], onDelete: Cascade)
  
  @@id([hotspotId, keywordId])
}
```

#### Item 2.2: 初始化数据库
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

#### Item 2.3: 创建数据库种子脚本(可选)
```typescript
// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 创建默认关键词
  const keywords = ['GPT', 'Claude', 'AI Model', 'Machine Learning']
  
  for (const name of keywords) {
    await prisma.keyword.create({
      data: { name, status: 'active' }
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
```

---

### Phase 3: 后端核心服务开发 (4-5天)

#### Item 3.1: 项目基础设置
创建`backend/src/index.ts`

```typescript
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' }
})

// 中间件
app.use(cors())
app.use(express.json())

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// WebSocket连接
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id)
  
  socket.on('subscribe', (keyword) => {
    socket.join(`keyword:${keyword}`)
    console.log(`用户 ${socket.id} 订阅了 ${keyword}`)
  })
  
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id)
  })
})

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`)
})

export { io }
```

#### Item 3.2: 关键词管理API
创建`backend/src/api/keywords.ts`

```typescript
import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = Router()

// GET /api/keywords
router.get('/', async (req: Request, res: Response) => {
  try {
    const keywords = await prisma.keyword.findMany({
      include: { _count: { select: { hotspots: true } } }
    })
    res.json(keywords)
  } catch (e) {
    res.status(500).json({ error: '获取关键词失败' })
  }
})

// POST /api/keywords
router.post('/', async (req: Request, res: Response) => {
  const { name, description } = req.body
  
  if (!name) {
    return res.status(400).json({ error: '关键词名称不能为空' })
  }
  
  try {
    const keyword = await prisma.keyword.create({
      data: { name, description }
    })
    res.json(keyword)
  } catch (e: any) {
    if (e.code === 'P2002') {
      return res.status(400).json({ error: '关键词已存在' })
    }
    res.status(500).json({ error: '创建失败' })
  }
})

// PATCH /api/keywords/:id/status
router.patch('/:id/status', async (req: Request, res: Response) => {
  const { status } = req.body
  const id = parseInt(req.params.id)
  
  try {
    const keyword = await prisma.keyword.update({
      where: { id },
      data: { status }
    })
    res.json(keyword)
  } catch (e) {
    res.status(500).json({ error: '更新失败' })
  }
})

// DELETE /api/keywords/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  try {
    await prisma.keyword.delete({ where: { id } })
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: '删除失败' })
  }
})

export default router
```

#### Item 3.3: 热点API (基础)
创建`backend/src/api/hotspots.ts`

```typescript
import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = Router()

// GET /api/hotspots (带分页和筛选)
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      keyword,
      source,
      sortBy = 'hotness',
      limit = '20',
      offset = '0'
    } = req.query
    
    const where: any = {}
    
    if (keyword) {
      where.keywords = { some: { name: keyword as string } }
    }
    
    if (source) {
      where.source = source as string
    }
    
    const orderBy: any = {}
    switch (sortBy) {
      case 'hotness':
        orderBy.hotnessScore = 'desc'
        break
      case 'relevance':
        orderBy.relevanceScore = 'desc'
        break
      case 'time':
        orderBy.publishedAt = 'desc'
        break
    }
    
    const [hotspots, total] = await Promise.all([
      prisma.hotspot.findMany({
        where,
        orderBy,
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        include: { keywords: true }
      }),
      prisma.hotspot.count({ where })
    ])
    
    res.json({ hotspots, total })
  } catch (e) {
    res.status(500).json({ error: '获取热点失败' })
  }
})

// GET /api/hotspots/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const hotspot = await prisma.hotspot.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { keywords: true }
    })
    
    if (!hotspot) {
      return res.status(404).json({ error: '热点不存在' })
    }
    
    res.json(hotspot)
  } catch (e) {
    res.status(500).json({ error: '获取失败' })
  }
})

// PATCH /api/hotspots/:id/read
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const hotspot = await prisma.hotspot.update({
      where: { id: parseInt(req.params.id) },
      data: { isRead: true }
    })
    res.json(hotspot)
  } catch (e) {
    res.status(500).json({ error: '更新失败' })
  }
})

// PATCH /api/hotspots/:id/save
router.patch('/:id/save', async (req: Request, res: Response) => {
  try {
    const { isSaved } = req.body
    const hotspot = await prisma.hotspot.update({
      where: { id: parseInt(req.params.id) },
      data: { isSaved }
    })
    res.json(hotspot)
  } catch (e) {
    res.status(500).json({ error: '更新失败' })
  }
})

export default router
```

#### Item 3.4: 爬虫服务框架
创建`backend/src/services/crawler.ts`

```typescript
import axios from 'axios'
import { load } from 'cheerio'

interface Article {
  title: string
  content?: string
  url: string
  source: string
  publishedAt?: Date
  author?: string
}

class CrawlerService {
  async crawlHackerNews(): Promise<Article[]> {
    try {
      const response = await axios.get('https://news.ycombinator.com', {
        timeout: 10000
      })
      const $ = load(response.data)
      
      const articles: Article[] = []
      $('tr.athing').slice(0, 30).each((idx, el) => {
        const titleEl = $(el).find('.titleline > a').first()
        const title = titleEl.text()
        const url = titleEl.attr('href') || ''
        
        articles.push({
          title,
          url,
          source: 'hackernews',
          publishedAt: new Date()
        })
      })
      
      return articles
    } catch (error) {
      console.error('爬虫错误:', error)
      return []
    }
  }
  
  async crawlGithubTrending(): Promise<Article[]> {
    // 待实现
    return []
  }
}

export default new CrawlerService()
```

#### Item 3.5: AI分析服务
创建`backend/src/services/aiAnalyzer.ts`

```typescript
import axios from 'axios'

interface AnalysisResult {
  relevanceScore: number
  hotnessScore: number
  credibilityScore: number
  summary: string
}

class AIAnalyzerService {
  async analyzeHotspot(
    title: string,
    content: string,
    keywords: string[]
  ): Promise<AnalysisResult> {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'mistral-7b-instruct', // 开源模型节省成本
          messages: [
            {
              role: 'system',
              content: `You are an expert at analyzing AI and tech hotspots. 
Analyze the given content and provide JSON response with:
1. relevanceScore (0-10): How relevant is this to keywords ${keywords.join(', ')}
2. hotnessScore (0-10): How hot/important is this topic
3. credibilityScore (0-10): How credible is this information
4. summary (100-200 words): Brief summary in the original language`
            },
            {
              role: 'user',
              content: `Title: ${title}\n\nContent: ${content}`
            }
          ],
          temperature: 0.3,
          max_tokens: 800
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
          }
        }
      )
      
      const responseText = response.data.choices[0].message.content
      const parsed = JSON.parse(responseText)
      
      return {
        relevanceScore: Math.min(10, Math.max(0, parsed.relevanceScore)),
        hotnessScore: Math.min(10, Math.max(0, parsed.hotnessScore)),
        credibilityScore: Math.min(10, Math.max(0, parsed.credibilityScore)),
        summary: parsed.summary
      }
    } catch (error) {
      console.error('AI分析错误:', error)
      
      // 降级方案：返回默认评分
      return {
        relevanceScore: 5,
        hotnessScore: 5,
        credibilityScore: 7,
        summary: content.substring(0, 200)
      }
    }
  }
}

export default new AIAnalyzerService()
```

#### Item 3.6: 定时爬虫任务
创建`backend/src/jobs/hotspotFetcher.ts`

```typescript
import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import crawlerService from '../services/crawler'
import aiAnalyzer from '../services/aiAnalyzer'
import { io } from '../index'

const prisma = new PrismaClient()

// 每30分钟运行一次
cron.schedule('*/30 * * * *', async () => {
  console.log('开始爬取热点...')
  
  try {
    // 获取所有活跃关键词
    const activeKeywords = await prisma.keyword.findMany({
      where: { status: 'active' }
    })
    
    if (activeKeywords.length === 0) {
      console.log('没有活跃关键词')
      return
    }
    
    // 爬虫
    const [hnArticles, githubArticles] = await Promise.all([
      crawlerService.crawlHackerNews(),
      crawlerService.crawlGithubTrending()
    ])
    
    const allArticles = [...hnArticles, ...githubArticles]
    
    // 用第一个关键词作为参考（简化版）
    const keywords = activeKeywords.map(k => k.name)
    
    // 分析并保存
    for (const article of allArticles) {
      // 检查是否已存在
      const existing = await prisma.hotspot.findUnique({
        where: { sourceUrl: article.url }
      })
      
      if (existing) continue
      
      // AI分析
      const analysis = await aiAnalyzer.analyzeHotspot(
        article.title,
        article.content || article.title,
        keywords
      )
      
      // 保存到数据库
      const hotspot = await prisma.hotspot.create({
        data: {
          title: article.title,
          summary: analysis.summary,
          content: article.content || '',
          source: article.source,
          sourceUrl: article.url,
          relevanceScore: analysis.relevanceScore,
          hotnessScore: analysis.hotnessScore,
          credibilityScore: analysis.credibilityScore,
          publishedAt: article.publishedAt || new Date(),
          keywords: {
            connect: activeKeywords
              .filter(kw => 
                article.title.toLowerCase().includes(kw.name.toLowerCase())
              )
              .map(kw => ({ id: kw.id }))
          }
        },
        include: { keywords: true }
      })
      
      console.log(`保存了新热点: ${hotspot.title}`)
      
      // 推送给订阅用户（热度>6）
      if (hotspot.hotnessScore > 6) {
        hotspot.keywords.forEach(kw => {
          io.to(`keyword:${kw.name}`).emit('newHotspot', hotspot)
        })
      }
    }
    
    // 更新检查时间
    await prisma.keyword.updateMany({
      where: { status: 'active' },
      data: { lastCheckedAt: new Date() }
    })
    
    console.log('爬取完成')
  } catch (error) {
    console.error('爬虫任务错误:', error)
  }
})

export default {}
```

#### Item 3.7: 注册API路由
更新`backend/src/index.ts`

```typescript
import keywordRoutes from './api/keywords'
import hotspotRoutes from './api/hotspots'

// 注册路由
app.use('/api/keywords', keywordRoutes)
app.use('/api/hotspots', hotspotRoutes)

// 导入任务（自动启动）
import './jobs/hotspotFetcher'
```

---

### Phase 4: 前端UI开发 (4-5天)

#### Item 4.1: 前端项目结构
```
frontend/src/
├── components/
│   ├── KeywordManager/
│   │   ├── KeywordList.tsx
│   │   ├── AddKeywordForm.tsx
│   │   └── KeywordCard.tsx
│   ├── HotspotView/
│   │   ├── HotspotList.tsx
│   │   ├── HotspotCard.tsx
│   │   ├── HotspotDetail.tsx
│   │   └── HotspotFilters.tsx
│   ├── SearchBar.tsx
│   ├── Layout.tsx
│   └── Notification.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Search.tsx
│   └── Saved.tsx
├── hooks/
│   ├── useHotspots.ts
│   ├── useKeywords.ts
│   └── useHotspotSubscription.ts
├── services/
│   ├── api.ts
│   └── socket.ts
├── types/
│   └── index.ts
└── App.tsx
```

#### Item 4.2: 类型定义
创建`frontend/src/types/index.ts`

```typescript
export interface Keyword {
  id: number
  name: string
  description?: string
  status: 'active' | 'paused'
  createdAt: string
  updatedAt: string
  lastCheckedAt?: string
  _count?: { hotspots: number }
}

export interface Hotspot {
  id: number
  title: string
  summary: string
  content: string
  source: 'twitter' | 'github' | 'hackernews' | 'reddit' | 'news' | 'rss'
  sourceUrl: string
  relevanceScore: number
  hotnessScore: number
  credibilityScore: number
  imageUrl?: string
  author?: string
  publishedAt: string
  createdAt: string
  updatedAt: string
  isRead: boolean
  isSaved: boolean
  keywords: Keyword[]
  viewCount: number
  likeCount: number
}

export interface ApiResponse<T> {
  data: T
  error?: string
}
```

#### Item 4.3: API服务
创建`frontend/src/services/api.ts`

```typescript
import { Keyword, Hotspot } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// 关键词API
export const keywordService = {
  getAll: async () => {
    const res = await fetch(`${API_BASE_URL}/api/keywords`)
    return res.json() as Promise<Keyword[]>
  },
  
  create: async (name: string, description?: string) => {
    const res = await fetch(`${API_BASE_URL}/api/keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    })
    return res.json() as Promise<Keyword>
  },
  
  updateStatus: async (id: number, status: string) => {
    const res = await fetch(`${API_BASE_URL}/api/keywords/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    return res.json() as Promise<Keyword>
  },
  
  delete: async (id: number) => {
    await fetch(`${API_BASE_URL}/api/keywords/${id}`, {
      method: 'DELETE'
    })
  }
}

// 热点API
export const hotspotService = {
  getList: async (params: {
    keyword?: string
    source?: string
    sortBy?: string
    limit?: number
    offset?: number
  }) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.set(key, String(value))
    })
    
    const res = await fetch(`${API_BASE_URL}/api/hotspots?${query}`)
    return res.json() as Promise<{ hotspots: Hotspot[], total: number }>
  },
  
  getDetail: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/api/hotspots/${id}`)
    return res.json() as Promise<Hotspot>
  },
  
  markAsRead: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/api/hotspots/${id}/read`, {
      method: 'PATCH'
    })
    return res.json() as Promise<Hotspot>
  },
  
  toggleSave: async (id: number, isSaved: boolean) => {
    const res = await fetch(`${API_BASE_URL}/api/hotspots/${id}/save`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isSaved })
    })
    return res.json() as Promise<Hotspot>
  }
}
```

#### Item 4.4: WebSocket连接服务
创建`frontend/src/services/socket.ts`

```typescript
import { io, Socket } from 'socket.io-client'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

let socket: Socket | null = null

export const socketService = {
  connect: () => {
    if (!socket) {
      socket = io(API_BASE_URL)
    }
    return socket
  },
  
  subscribe: (keyword: string) => {
    socket?.emit('subscribe', keyword)
  },
  
  unsubscribe: (keyword: string) => {
    socket?.emit('unsubscribe', keyword)
  },
  
  onNewHotspot: (callback: (hotspot: any) => void) => {
    socket?.on('newHotspot', callback)
  },
  
  disconnect: () => {
    socket?.disconnect()
    socket = null
  }
}
```

#### Item 4.5: React Hooks
创建`frontend/src/hooks/useHotspots.ts`

```typescript
import { useState, useEffect } from 'react'
import { hotspotService } from '../services/api'
import { Hotspot } from '../types'

export function useHotspots(filters: any = {}) {
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  
  const fetchHotspots = async () => {
    setLoading(true)
    try {
      const result = await hotspotService.getList({
        ...filters,
        offset
      })
      setHotspots(result.hotspots)
      setTotal(result.total)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchHotspots()
  }, [filters, offset])
  
  return { hotspots, total, loading, offset, setOffset, refetch: fetchHotspots }
}
```

#### Item 4.6: 主页面组件
创建`frontend/src/pages/Dashboard.tsx`

```typescript
import { useEffect, useState } from 'react'
import { keywordService, hotspotService } from '../services/api'
import { socketService } from '../services/socket'
import KeywordList from '../components/KeywordManager/KeywordList'
import HotspotList from '../components/HotspotView/HotspotList'
import { Hotspot } from '../types'

export default function Dashboard() {
  const [keywords, setKeywords] = useState<any[]>([])
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)
  
  // 加载关键词和热点
  useEffect(() => {
    loadKeywords()
    loadHotspots()
    
    // 连接WebSocket
    const socket = socketService.connect()
    socketService.onNewHotspot((hotspot) => {
      setHotspots(prev => [hotspot, ...prev])
      showNotification(`新热点: ${hotspot.title}`)
    })
    
    return () => socketService.disconnect()
  }, [])
  
  const loadKeywords = async () => {
    const data = await keywordService.getAll()
    setKeywords(data)
  }
  
  const loadHotspots = async () => {
    const result = await hotspotService.getList({
      limit: 20,
      sortBy: 'hotness'
    })
    setHotspots(result.hotspots)
  }
  
  const handleSelectKeyword = (keyword: string) => {
    setSelectedKeyword(keyword)
    socketService.subscribe(keyword)
    loadHotspots()
  }
  
  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      {/* 左侧关键词列表 */}
      <div className="col-span-3">
        <KeywordList keywords={keywords} onSelect={handleSelectKeyword} />
      </div>
      
      {/* 右侧热点列表 */}
      <div className="col-span-9">
        <HotspotList hotspots={hotspots} keyword={selectedKeyword} />
      </div>
    </div>
  )
}
```

#### Item 4.7: UI组件实现（HotspotCard等）
- 创建热点卡片组件（展示标题、摘要、评分、源信息）
- 实现关键词管理UI
- 实现筛选和排序控件

#### Item 4.8: 样式优化
- 设置深色模式配色
- 实现独特的设计风格
- 响应式布局

---

### Phase 5: 测试和优化 (2-3天)

#### Item 5.1: 后端单元测试
- 关键词API测试
- 热点API测试
- 爬虫服务测试
- AI分析服务降级测试

#### Item 5.2: 前端交互测试
- 关键词添加/删除功能
- 热点列表加载和分页
- WebSocket实时推送
- 筛选和排序功能

#### Item 5.3: 集成测试
- 完整流程：添加关键词 → 爬虫识别 → AI分析 → WebSocket推送 → 前端展示

#### Item 5.4: 性能优化
- 数据库查询优化（添加索引）
- 前端代码分割
- 图片懒加载

#### Item 5.5: 错误处理和日志
- 完善错误提示
- 添加日志记录
- Sentry或类似工具集成（可选）

---

## 第二阶段：Agent Skills (1周)

### Phase 6: Skills封装

#### Item 6.1: 设计Skills接口
- 热点监控技能
- 热点分析技能
- 热点搜索技能

#### Item 6.2: 实现Skills SDK
#### Item 6.3: 编写Skills文档
#### Item 6.4: 测试和集成

---

## 验收清单

### MVP完成标准

- [ ] 关键词管理
  - [ ] 添加关键词
  - [ ] 激活/暂停关键词
  - [ ] 删除关键词
  - [ ] 列表展示

- [ ] 热点爬取和分析
  - [ ] HackerNews爬虫运行正常
  - [ ] GitHub Trending爬虫（至少一个其他源）
  - [ ] AI分析功能可用
  - [ ] 评分和摘要生成正确

- [ ] 前端功能
  - [ ] 热点列表展示
  - [ ] 多维度筛选可用
  - [ ] 排序功能正确
  - [ ] WebSocket推送实时可见

- [ ] UI/UX
  - [ ] 设计风格独特
  - [ ] 响应式布局
  - [ ] 深色模式支持
  - [ ] 性能良好（加载<2s）

- [ ] 代码质量
  - [ ] 核心功能有测试覆盖
  - [ ] 错误处理相对完善
  - [ ] 代码注释清晰
  - [ ] 文档编写完整

---

## 时间表估算

| 阶段 | 任务 | 预计时间 |
|------|------|--------|
| 1-2 | 项目初始化 + 数据库 | 1-2天 |
| 3 | 后端核心服务 | 4-5天 |
| 4 | 前端UI | 4-5天 |
| 5 | 测试优化 | 2-3天 |
| **第一阶段合计** | | **11-15天** |
| 6 | Skills封装 | 5-7天 |
| **项目总计** | | **16-22天** |

---

**下一步**: 确认计划后，开始Phase 1 项目初始化

