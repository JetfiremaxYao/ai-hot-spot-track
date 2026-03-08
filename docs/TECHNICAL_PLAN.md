# AI热点监控系统 - 技术方案文档

## 版本信息和库选型

基于2026年3月最新库文档研究，以下是选定的版本和理由：

### 前端技术栈

#### React 19 (Facebook/React v19.2.0)
**选择理由**:
- React 官方文档已迁至react.dev，采用Hooks-first教学
- v19支持Server Components，适合未来扩展
- 2833+代码示例，文档最新完善
- 支持TypeScript全类型推导

**关键特性**:
```typescript
// React 19 新特性
// 1. use() Hook
const data = use(promise);

// 2. useTransition 优化
const [isPending, startTransition] = useTransition();

// 3. useOptimistic 乐观更新
const [optimisticTodos, addOptimisticTodo] = useOptimistic(todos);
```

#### Vite 7.0.0 (vitejs/vite)
**选择理由**:
- 极速HMR，开发体验最佳
- 官方支持React插件
- 生产构建使用Rollup，产物优化
- 711个代码示例，Benchmark Score 86.2

**配置亮点**:
```javascript
// vite.config.ts
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5001'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
```

#### TailwindCSS v3 (websites/v3_tailwindcss)
**选择理由**:
- 功能完整，性能优化
- Benchmark Score 88.3，文档完善
- 1760+代码示例
- 支持JIT模式，零运行时

**关键概念**:
- 原子化CSS：直接在HTML中组合工具类实现设计
- Content配置扫描模板文件，按需生成CSS
- 无需写自定义CSS，通过@layer扩展

#### Shadcn/UI
**选择理由**:
- 基于TailwindCSS和Radix UI
- 高质量的可访问性组件
- 支持深色模式
- 开发者友好，可复制组件源码修改

**核心组件**:
- Button, Input, Card, Dialog, Dropdown, Search等

### 后端技术栈

#### Node.js + Express 5.x (expressjs/express v5.1.0)
**选择理由**:
- Benchmark Score 94.1，最成熟稳定
- 支持V5最新特性（ESM、Promise支持等）
- 轻量级，适合轻量化项目
- 中间件生态丰富

**架构设计**:
```typescript
// 使用Express 5中间件标准模式
app.use(express.json());
app.use(cors());

// 路由模块化
app.use('/api/keywords', keywordRoutes);
app.use('/api/hotspots', hotspotRoutes);
app.use('/api/search', searchRoutes);

// 错误处理中间件（4个参数）
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

#### SQLite + Prisma ORM (websites/prisma_io v6.19.x)
**选择理由**:
- Benchmark Score 85.3，8274+文档示例
- 类型安全的数据库访问
- 自动迁移管理
- 开发友好：Prisma Studio可视化数据

**Prisma Schema设计**:
```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Keyword {
  id        Int     @id @default(autoincrement())
  name      String  @unique
  status    String  // 'active' | 'paused'
  hotspots  Hotspot[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Hotspot {
  id               Int     @id @default(autoincrement())
  title            String
  summary          String  @db.Text
  content          String  @db.Text
  source           String  // 'twitter', 'github', etc
  sourceUrl        String  @unique
  
  // AI评分
  relevanceScore   Float   // 0-10
  hotnessScore     Float   // 0-10
  credibilityScore Float   // 0-10
  
  keywords         Keyword[]
  publishedAt      DateTime
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  isRead           Boolean @default(false)
  isSaved          Boolean @default(false)
}
```

### AI服务集成

#### OpenRouter API (websites/openrouter_ai - Benchmark Score 77.9)
**特点**:
- 统一API访问200+个LLM模型
- 支持自动降级和成本优化
- 提供Token计数和使用统计

**集成方案**:
```typescript
// services/ai.ts
import axios from 'axios';

interface AnalysisResult {
  relevanceScore: number;
  hotnessScore: number;
  credibilityScore: number;
  summary: string;
}

async function analyzeHotspot(
  title: string, 
  content: string, 
  keywords: string[]
): Promise<AnalysisResult> {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'gpt-4-turbo', // 或使用开源模型节省成本
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing hotspot trends and AI news.
Analyze the given content and provide:
1. Relevance score (0-10) to these keywords: ${keywords.join(', ')}
2. Hotness score (0-10) based on potential impact and discussion
3. Credibility score (0-10) based on source reliability
4. A 100-200 word summary in JSON format`
        },
        {
          role: 'user',
          content: `Title: ${title}\n\nContent: ${content}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
      }
    }
  );

  const content = response.data.choices[0].message.content;
  return JSON.parse(content);
}
```

**模型选择策略**:
- 默认: `gpt-4-turbo` (高质量分析)
- 成本优化: `mistral-7b` (开源，足够满足基础分析)
- 高速: `claude-3-haiku` (快速响应)

### 实时通信

#### WebSocket + Socket.io
**需求**:
- 实时推送新增热点
- 用户订阅特定关键词的更新

**实现方案**:
```typescript
// 后端 WebSocket处理
import { Server } from 'socket.io';

io.on('connection', (socket) => {
  // 用户订阅关键词
  socket.on('subscribe', (keyword) => {
    socket.join(`keyword:${keyword}`);
  });

  socket.on('unsubscribe', (keyword) => {
    socket.leave(`keyword:${keyword}`);
  });
});

// 爬虫发现新热点时广播
function broadcastNewHotspot(hotspot: Hotspot) {
  hotspot.keywords.forEach(kw => {
    io.to(`keyword:${kw.name}`).emit('newHotspot', hotspot);
  });
}

// 前端 React hook
function useHotspotSubscription(keyword: string) {
  const [hotspot, setHotspot] = useState<Hotspot | null>(null);
  
  useEffect(() => {
    socket.emit('subscribe', keyword);
    
    socket.on('newHotspot', (data) => {
      setHotspot(data);
      // 触发通知
      showNotification(`新热点: ${data.title}`);
    });
    
    return () => socket.emit('unsubscribe', keyword);
  }, [keyword]);
  
  return hotspot;
}
```

### 数据爬取

#### Cheerio + Axios
**为什么选择**:
- 轻量级jQuery-like语法
- 无浏览器开销
- 适合爬取静态HTML

**爬虫架构**:
```typescript
// services/crawler/index.ts
import axios from 'axios';
import { load } from 'cheerio';

class CrawlerService {
  async crawlHackerNews(): Promise<Article[]> {
    const response = await axios.get('https://news.ycombinator.com');
    const $ = load(response.data);
    
    const articles: Article[] = [];
    $('tr.athing').slice(0, 30).each((idx, el) => {
      const title = $(el).find('.titleline > a').text();
      const url = $(el).find('.titleline > a').attr('href');
      const points = $(el).next().find('.score').text();
      
      articles.push({
        title,
        url,
        source: 'hackernews',
        metadata: { points: parseInt(points) }
      });
    });
    
    return articles;
  }
  
  async crawlGithubTrending(): Promise<Article[]> {
    // 实现GitHub Trending爬虫
    // trending API: https://github.com/trending
  }
}
```

### 定时任务

#### node-cron + Bull
**架构**:
```typescript
// jobs/hotspotFetcher.ts
import cron from 'node-cron';
import Queue from 'bull';

// 创建任务队列
const crawlQueue = new Queue('hotspot-crawl', {
  redis: { host: 'localhost', port: 6379 }
});

// 处理爬虫任务
crawlQueue.process(async (job) => {
  const { source } = job.data;
  
  if (source === 'hackernews') {
    return await crawlerService.crawlHackerNews();
  } else if (source === 'github') {
    return await crawlerService.crawlGithubTrending();
  }
});

// 定时触发
cron.schedule('*/30 * * * *', async () => {
  // 每30分钟）触发一次爬虫
  await crawlQueue.add({
    source: 'hackernews'
  });
  
  await crawlQueue.add({
    source: 'github'
  });
});

// 监听完成事件
crawlQueue.on('completed', async (job) => {
  const articles = job.returnvalue;
  
  // 分析并保存
  for (const article of articles) {
    const analysis = await aiService.analyzeHotspot(
      article.title,
      article.content,
      userKeywords
    );
    
    const hotspot = await prisma.hotspot.create({
      data: {
        title: article.title,
        content: article.content,
        source: article.source,
        sourceUrl: article.url,
        ...analysis,
        keywords: { connect: matchedKeywords }
      }
    });
    
    // 推送给订阅用户
    broadcastNewHotspot(hotspot);
  }
});
```

## 数据流架构

```
┌─────────────────────────────────────────────────────────────┐
│ 定时任务 (node-cron, 每30分钟)                               │
└────────────────┬────────────────────────────────────────────┘
                 │ 触发爬虫
┌────────────────▼────────────────────────────────────────────┐
│ 爬虫服务 (Cheerio + Axios)                                   │
│ - HackerNews, GitHub Trending, Twitter, Reddit等             │
└────────────────┬────────────────────────────────────────────┘
                 │ 原始数据
┌────────────────▼────────────────────────────────────────────┐
│ AI分析引擎 (OpenRouter)                                     │
│ - 真假识别、相关性评分、热度评分、摘要生成                   │
└────────────────┬────────────────────────────────────────────┘
                 │ 分析结果
┌────────────────▼────────────────────────────────────────────┐
│ 去重和存储 (Prisma + SQLite)                                │
│ - 检查重复、关联关键词、保存到数据库                         │
└────────────────┬────────────────────────────────────────────┘
                 │ 新热点
┌────────────────▼────────────────────────────────────────────┐
│ WebSocket广播 (Socket.io)                                   │
│ - 推送给订阅用户、邮件通知（可选）                           │
└────────────────┬────────────────────────────────────────────┘
                 │ 实时通知
         ┌───────▼────────┐
         │ 前端用户界面   │
         └────────────────┘
```

## API端点设计

### 关键词API

```
POST   /api/keywords              # 添加关键词
GET    /api/keywords              # 获取所有关键词
PATCH  /api/keywords/:id/status   # 激活/暂停关键词
DELETE /api/keywords/:id          # 删除关键词
```

### 热点API

```
GET    /api/hotspots              # 分页获取热点
  ?keyword=ai
  &source=twitter
  &sortBy=hotness
  &limit=20
  &offset=0

GET    /api/hotspots/:id          # 获取热点详情
PATCH  /api/hotspots/:id/read     # 标记已读
PATCH  /api/hotspots/:id/save     # 收藏/取消收藏
```

### 搜索API

```
GET    /api/search                # 全网搜索
  ?q=AI+models
  &limit=20
```

### WebSocket事件

```
// 客户端发送
socket.emit('subscribe', 'GPT')        # 订阅关键词
socket.emit('unsubscribe', 'GPT')      # 取消订阅

// 服务器推送
socket.on('newHotspot', hotspot)       # 新热点推送
socket.on('notification', message)     # 通知
```

## 性能优化策略

### 前端优化
- **代码分割**: React.lazy + Suspense按路由分割
- **图片优化**: WebP格式，srcset响应式
- **虚拟化列表**: 长列表使用react-window
- **缓存**: React Query缓存API响应

### 后端优化
- **数据库索引**: 在keyword, source, createdAt等字段建索引
- **Redis缓存**: 缓存频繁查询结果
- **分页**: 所有列表API支持分页
- **异步处理**: 爬虫和AI分析用异步队列

### 代码示例
```typescript
// 前端：虚拟列表
import { FixedSizeList } from 'react-window';

function HotspotList({ hotspots }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={hotspots.length}
      itemSize={80}
    >
      {({ index, style }) => (
        <div style={style}>
          <HotspotCard hotspot={hotspots[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}

// 后端：数据库索引
prisma.hotspot.findMany({
  where: {
    keywords: { some: { name: 'GPT' } },
    hotnessScore: { gte: 6 },
    createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  },
  orderBy: { hotnessScore: 'desc' },
  take: 20,
  skip: offset
});
```

## 部署和运行

### 开发环境

```bash
# 前端
cd frontend
npm install
npm run dev          # http://localhost:3000

# 后端
cd backend
npm install
npm run prisma:migrate      # SQLite迁移
npm run db:seed             # 初始化种子数据
npm run dev          # http://localhost:5001
```

### 环境变量

```bash
# .env.local (前端)
VITE_API_BASE_URL=http://localhost:5001

# .env (后端)
DATABASE_URL="file:./app.db"
OPENROUTER_API_KEY=your_key_here
NODE_ENV=development
PORT=5001
```

### Docker部署（可选）

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5001:5001"
    volumes:
      - ./backend/app.db:/app/app.db
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
```

## 安全性考虑

1. **API密钥管理**: 使用.env文件，不版本控制
2. **CORS配置**: 限制跨域请求
3. **输入验证**: Zod或joi验证用户输入
4. **访问控制**: 基础认证（optional）
5. **率限制**: Express-rate-limit防止滥用

## 监控和日志

```typescript
// 日志服务
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// 爬虫日志
logger.info(`Crawled ${articles.length} articles from HackerNews`);
logger.error(`Failed to fetch from source: ${e.message}`);
```

---

**文档版本**: v1.0  
**基于库版本日期**: 2026年3月  
**下一步**: 查看DEVELOPMENT_PLAN.md进行分步骤开发
