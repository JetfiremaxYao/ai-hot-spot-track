# AI 热点监控系统 (AI Hot Spot Monitoring System)

一个完整的实时 AI/ML 行业热点监控和分析系统，自动发现、分析并推送最新的 AI 相关热点话题。

## ✨ 核心功能

## 🖼️ 界面预览

项目界面如下，完整展示页见 [docs/PRODUCT_SHOWCASE.md](docs/PRODUCT_SHOWCASE.md)。

![AI Hot Spot 热点总览](docs/screenshots/hotspot_mainpage.jpg)

<p align="center">
  <img src="docs/screenshots/search_function.jpg" alt="搜索与检索体验" width="32%" />
  <img src="docs/screenshots/keywords_afteradd.jpg" alt="关键词管理与新增" width="32%" />
  <img src="docs/screenshots/settings.jpg" alt="采集策略设置" width="32%" />
</p>

热点发现、搜索检索、关键词管理与采集策略配置构成了项目的完整使用链路。

### 1. **智能热点发现** 🔍
- 多源数据采集（HackerNews、GitHub Trending、Reddit、Twitter）
- 每 30 分钟自动爬取和分析新热点
- 支持自定义关键词监控
- 智能去重和相关性匹配

### 2. **AI 驱动分析** 🤖
- 集成 OpenRouter API 进行内容分析
- 三维评分系统：
  - **关联度** (Relevance): 与关键词的相关程度
  - **热度** (Hotness): 话题的热门程度
  - **可信度** (Credibility): 信息的可信程度
- 三个评分维度均为 0-10 分制
- 支持无 API Key 的本地分析降级方案

### 3. **实时推送通知** 📢
- WebSocket 实时推送（Socket.io）
- 订阅具体关键词获取相关热点
- 热度 > 6 分的高热点自动推送
- 支持离线就绪消息轮询降级

### 4. **完整的用户交互** 👥
- 关键词管理（创建、删除、暂停/激活）
- 热点列表浏览（分页、过滤、排序）
- 标记已读、保存、点赞等交互
- 浅色主题 UI，支持响应式设计

### 5. **数据持久化** 💾
- SQLite 轻量级数据库
- Prisma ORM 类型安全数据操作
- 自动迁移和 seed 脚本
- 高效查询索引

## 🏗️ 系统架构

### 技术栈

```
前端:
├── React 19.2.0 + TypeScript
├── Vite 7.0.0 (快速开发和构建)
├── TailwindCSS v3 (浅色主题 + 自定义配色)
├── React Router v6 (页面路由)
├── Socket.io Client (实时推送)
└── Axios (HTTP 客户端)

后端:
├── Node.js v22.16.0
├── Express 5.x (RESTful API)
├── TypeScript (类型安全)
├── Socket.io (WebSocket 服务器)
├── Prisma v6.19.2 (ORM)
└── SQLite (轻量级数据库)

外部服务:
├── OpenRouter API (LLM 推理)
├── HackerNews (数据源)
├── GitHub API (趋势数据)
├── Reddit API (社区讨论)
└── Twitter/RSS (实时新闻)
```

### 项目结构

```
ai-hot-spot/
├── skills/                      # Agent Skills（新增，不影响现有业务代码）
│   ├── README.md
│   └── ai-hotspot-orchestrator/
│       ├── SKILL.md
│       ├── references/
│       └── evals/
│
├── backend/                    # Express 后端
│   ├── src/
│   │   ├── index.ts           # Express 服务器入口
│   │   ├── api/               # API 路由
│   │   │   ├── keywords.ts    # 关键词管理接口
│   │   │   └── hotspots.ts    # 热点列表接口
│   │   ├── services/          # 业务逻辑
│   │   │   ├── crawler.ts     # 多源爬虫服务
│   │   │   └── aiAnalyzer.ts  # AI 分析服务
│   │   ├── jobs/              # 定时任务
│   │   │   └── hotspotFetcher.ts # 每 30 分钟执行一次
│   │   ├── types/             # TypeScript 类型
│   │   └── utils/             # 工具函数
│   ├── prisma/
│   │   ├── schema.prisma      # 数据库 schema
│   │   └── seed.ts            # 初始化数据
│   ├── .env                   # 环境变量
│   └── package.json

└── frontend/                    # React 前端
    ├── src/
    │   ├── main.tsx           # React 入口
    │   ├── App.tsx            # 主应用组件
    │   ├── pages/             # 页面组件
    │   │   ├── HotspotsPage.tsx     # 热点列表页
    │   │   └── KeywordsPage.tsx     # 关键词管理页
    │   ├── components/        # 可复用组件
    │   │   ├── Layout.tsx     # 导航布局
    │   │   ├── HotspotCard.tsx     # 热点卡片
    │   │   └── KeywordList.tsx     # 关键词列表
    │   ├── hooks/             # React Hooks
    │   │   ├── useHotspots.ts # 热点数据管理
    │   │   └── useKeywords.ts # 关键词数据管理
    │   ├── services/          # API 服务
    │   │   ├── api.ts         # REST API 调用
    │   │   └── socket.ts      # WebSocket 连接
    │   ├── types/             # TypeScript 类型
    │   └── index.css          # 全局样式
    ├── index.html             # HTML 入口
    ├── vite.config.ts         # Vite 配置
    ├── tailwind.config.js     # TailwindCSS 配置
    ├── tsconfig.json          # TypeScript 配置
    └── package.json
```

## 🚀 快速开始

### 环境要求
- Node.js v22+
- npm v10+
- SQLite 3 (通常已包含)

### 1. 克隆项目

```bash
cd /Volumes/Data/Code_Repository/ai-hot-spot
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 3. 数据库初始化

```bash
cd backend

# 执行迁移
npm run prisma:migrate

# 插入初始数据
npm run db:seed
```

### 4. 配置环境变量

#### 后端 (`backend/.env`)
```env
PORT=5001
DATABASE_URL="file:./app.db"
OPENROUTER_API_KEY=你的OpenRouter API Key (可选)
FRONTEND_URL=http://localhost:3000

# SMTP（邮件推送必需，收件人地址单独在设置页填写）
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=your_sender@qq.com
SMTP_PASS=your_smtp_auth_code
SMTP_FROM=your_sender@qq.com
```

说明：
- 仅在设置页填写收件邮箱地址不能发信，必须同时配置后端 SMTP 发件账号。
- `SMTP_PASS` 是邮箱 SMTP 授权码，不是邮箱登录密码。

#### 前端 (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5001
```

### 5. 启动服务

#### 启动后端
```bash
cd backend
npm run dev
# 输出: 
# Server running on port 5001
# WebSocket server ready at ws://localhost:5001
```

#### 启动前端（新终端）
```bash
cd frontend
npm run dev
# 输出:
# VITE v5.4.21  ready in 147 ms
# ➜  Local:   http://localhost:3000/
```

### 6. 访问应用

打开浏览器访问：

- **前端**: http://localhost:3000
- **API 文档**: http://localhost:5001/api
- **WebSocket**: ws://localhost:5001

### 7. 快速配置清单（建议按此顺序）

1. 复制环境变量模板并填写：
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. 确认关键变量：
- `backend/.env`:
  - `PORT=5001`
  - `FRONTEND_URL=http://localhost:3000`
  - `DATABASE_URL="file:./app.db"`
  - `OPENROUTER_API_KEY=`（可空，空则自动降级本地分析）
- `frontend/.env`:
  - `VITE_API_BASE_URL=http://localhost:5001`

3. 初始化数据库：
```bash
cd backend
npm run prisma:migrate
npm run db:seed
```

4. 启动服务：
```bash
# 终端1
cd backend && npm run dev

# 终端2
cd frontend && npm run dev
```

5. 验证服务可用：
```bash
curl http://localhost:5001/api/health
```

### 8. 直接使用 Skills（Agent 模式）

Skills 已放在仓库目录：`skills/ai-hotspot-orchestrator/SKILL.md`。

建议用法：
1. 保持后端服务已启动（至少 `backend` 要运行）。
2. 在 Agent 对话中直接提出任务，技能会按现有 API 自动路由。
3. 若要查看技能规范与输入输出协议，先读：
   - `skills/README.md`
   - `skills/ai-hotspot-orchestrator/SKILL.md`
   - `skills/ai-hotspot-orchestrator/references/api-contract.md`

可直接复制的任务示例：
```text
帮我新增关键词 "Anthropic MCP"，然后刷新一次热点，并按热度返回前10条。
```

```text
请用实时模式搜索 "OpenAI Agents SDK"，并给我来源分布与后续监控建议。
```

```text
把 source-policy 调整为 strict，开启 google/bing/hackernews，并发送一次测试邮件。
```

## 📡 API 端点

### 关键词管理

```bash
# 获取所有关键词
GET /api/keywords
Response: { success: true, data: [Keyword[]] }

# 创建关键词
POST /api/keywords
Body: { name: string, description?: string }
Response: { success: true, data: Keyword }

# 更新关键词状态
PATCH /api/keywords/:id/status
Body: { status: 'active' | 'paused' }
Response: { success: true, data: Keyword }

# 删除关键词
DELETE /api/keywords/:id
Response: { success: true }
```

### 热点管理

```bash
# 获取热点列表（支持分页、过滤、排序）
GET /api/hotspots?keyword=GPT&sortBy=hotness&offset=0&limit=20
Response: { success: true, data: HotspotsResponse }

# 获取热点详情（标记已读）
GET /api/hotspots/:id
Response: { success: true, data: Hotspot }

# 标记为已读
PATCH /api/hotspots/:id/read
Response: { success: true, data: Hotspot }

# 保存/取消保存
PATCH /api/hotspots/:id/save
Body: { isSaved: boolean }
Response: { success: true, data: Hotspot }

# 点赞/取消点赞
PATCH /api/hotspots/:id/like
Body: { like: boolean }
Response: { success: true, data: Hotspot }
```

### 全站采集策略

```bash
# 获取当前全站采集策略
GET /api/config/source-policy
Response: { success: true, data: SourcePolicy }

# 更新全站采集策略（JSON 持久化）
PUT /api/config/source-policy
Body: SourcePolicy
Response: { success: true, data: SourcePolicy }

# 重置为默认策略
POST /api/config/source-policy/reset
Response: { success: true, data: SourcePolicy }

# 发送测试邮件（优先使用请求体邮箱；不传则使用已保存邮箱）
POST /api/config/email/test
Body: { recipientEmails?: string[] }
Response: { success: true, message: string }
```

## 🔄 热点发现流程

### 自动化工作流

```
┌─────────────────────────────────────────┐
│ 每 30 分钟执行一次 (Cron Job)          │
└──────────────┬──────────────────────────┘
               │
        ┌──────▼──────┐
        │ 获取活跃关键词 │
        └──────┬──────┘
               │
    ┌─ ─ ─ ─ ─ ▼ ─ ─ ─ ─ ─┬─────────┬──────────┐
    │                      │         │          │
┌───▼───┐  ┌──────────┐  ┌─▼──┐  ┌─▼──┐   ┌────▼─────┐
│Hacker │  │ GitHub   │  │ Red│  │Twit│   │ Other RSS │
│ News  │  │Trending  │  │ dit│  │ter │   │ Feeds     │
└───┬───┘  └────┬─────┘  └─┬──┘  └─┬──┘   └────┬─────┘
    │           │          │       │            │
    └───────────┴──────────┴───────┴────────────┘
               │
        ┌──────▼──────────┐
        │ 数据去重 (URL)   │
        └──────┬──────────┘
               │
        ┌──────▼────────────┐
        │ OpenRouter AI分析 │  (relevance, hotness, credibility)
        └──────┬────────────┘
               │
        ┌──────▼─────────────┐
        │ 存储到数据库        │
        │ (Hotspot Model)     │
        └──────┬─────────────┘
               │
    ┌──────────▼──────────────┐
    │ Hotness Score > 6?      │
    └──┬────────────────────┬─┘
       YES (推送)            NO (保存)
      │                      │
    ┌─▼──────────────┐     │
    │ WebSocket广播  │     │
    │ (高热度通知)    │     └─► 后台保存，待查阅
    └────────────────┘
```

## 🎨 用户界面

### 浅色主题配色

- **品牌色**: 蓝绿渐变点缀 + 中性灰层次
- **背景**: 白色与浅灰卡片分层
- **可读性**: 日间阅读优先，保持高对比文本

### 页面结构

#### 热点页面 (`/`)
- 实时热点列表卡片
- 高级过滤与排序
- 分页导航
- 一键保存、点赞、分享
- WebSocket 实时推送通知

#### 关键词页面 (`/keywords`)
- 关键词创建与管理
- 快速启用/禁用监控
- 热点数统计
- 最后更新时间

#### 设置页面 (`/settings`)
- 全站统一采集策略配置
- 免费来源开关（Google/Bing/DuckDuckGo/HackerNews）
- Twitter/X 高门槛过滤（默认关闭）
- 域名拒绝名单/优先名单
- 配置持久化到 `backend/data/source-policy.json`

## 📊 数据模型

### Keyword 模型
```typescript
{
  id: number
  name: string                    // 唯一，如 "GPT-4"
  description?: string            // 可选描述
  status: 'active' | 'paused'    // 监控状态
  hotspotCount: number           // 关联热点数（计算字段）
  lastCheckedAt?: DateTime        // 最后检查时间
  createdAt: DateTime
  updatedAt: DateTime
  hotspots: Hotspot[]            // 多对多关系
}
```

### Hotspot 模型
```typescript
{
  id: number
  title: string                   // 文章标题
  summary: string                 // 摘要
  content: string                 // 完整内容
  source: string                  // 数据源
  sourceUrl: string              // 唯一源链接
  relevanceScore: number (0-10)   // AI 关联度评分
  hotnessScore: number (0-10)     // AI 热度评分
  credibilityScore: number (0-10) // AI 可信度评分
  imageUrl?: string              // 预览图
  author?: string                // 作者信息
  publishedAt: DateTime           // 发布时间
  isRead: boolean                // 用户已读状态
  isSaved: boolean               // 用户已保存状态
  viewCount: number              // 浏览次数
  likeCount: number              // 点赞数
  createdAt: DateTime
  updatedAt: DateTime
  keywords: Keyword[]            // 多对多关系
}
```

## 🔧 配置选项

### 全站采集策略（推荐）

- 配置入口：前端 `设置` 页面 (`/settings`)
- 持久化文件：`backend/data/source-policy.json`
- 生效方式：保存后立即生效，服务重启后仍保留
- 默认策略：`strict`（可靠性优先）
- Twitter/X：默认关闭；同时要求 `ENABLE_TWITTER=true` 且配置 `TWITTERAPI_IO_KEY` 才会实际抓取

`source-policy.json` 示例：

```json
{
  "reliabilityMode": "strict",
  "sources": {
    "google": true,
    "bing": true,
    "duckduckgo": true,
    "hackernews": true,
    "twitter": false
  },
  "twitterThresholds": {
    "minLikes": 20,
    "minReposts": 5,
    "minReplies": 5,
    "minFollowers": 1000,
    "allowReplies": false,
    "allowQuotes": true
  }
}
```

### 爬虫配置 (`src/services/crawler.ts`)
```typescript
// 按策略控制来源开关、配额、域名规则
const policy = await sourcePolicyService.getPolicy()

// 可靠性过滤：域名规则 + 内容质量 + Twitter高门槛
const filtered = deduped.filter(article =>
  passesDomainRules(article, policy) &&
  passesQualityFilters(article, policy)
)
```

### AI 分析配置 (`src/services/aiAnalyzer.ts`)
```typescript
// OpenRouter 模型选择
MODEL = "mistral-7b-instruct"  // 低成本选项

// 生成参数
temperature = 0.3              // 更确定的回答
max_tokens = 500               // 限制输出长度
```

### 任务调度配置 (`src/jobs/hotspotFetcher.ts`)
```typescript
// 自动执行间隔
INTERVAL = "*/30 * * * *"      // 每 30 分钟

// 热点推送阈值
HOTNESS_THRESHOLD = 6          // 热度 > 6 分自动推送
```

## 🔐 环境变量说明

### 必需配置
- `DATABASE_URL`: SQLite 数据库路径
- `FRONTEND_URL`: 前端应用地址（CORS 配置）

### 可选配置
- `OPENROUTER_API_KEY`: OpenRouter API 密钥
  - 获取地址: https://openrouter.ai/
  - 支持 200+ 模型
  - 价格: 从 Mistral-7B (最便宜) 到 GPT-4 (更准确)
  - 不设置时自动使用本地分析降级方案

- `ENABLE_TWITTER`: 是否允许抓取 Twitter/X（默认建议 `false`）
- `TWITTERAPI_IO_KEY`: Twitter API Key（仅在启用 Twitter 时需要）

- `NODE_ENV`: 运行环境 (`development` | `production`)

## 📈 性能优化

### 数据库索引
```sql
-- 关键查询优化
CREATE INDEX idx_hotspots_hotnessScore ON Hotspot(hotnessScore DESC)
CREATE INDEX idx_hotspots_createdAt ON Hotspot(createdAt DESC)
CREATE INDEX idx_hotspots_isRead ON Hotspot(isRead)
CREATE INDEX idx_keywords_status ON Keyword(status)
CREATE UNIQUE INDEX idx_hotspots_sourceUrl ON Hotspot(sourceUrl)
```

### 前端优化
- Vite 快速模块热替换 (HMR)
- React 代码分割和懒加载
- TailwindCSS 按需编译
- Socket.io 自动重连和降级

### 后端优化
- 连接池（Prisma）
- 并行爬虫（Promise.all）
- 智能去重（sourceUrl 唯一索引）
- 事件驱动推送（WebSocket）

## 🐛 故障排查

### 前端连接失败
```bash
# 检查后端是否运行
curl http://localhost:5001/api/health

# 检查 CORS 配置
# 确保 frontend/.env 中的 VITE_API_BASE_URL 正确
```

### 数据库错误
```bash
# 重置数据库
cd backend
# 先删除 SQLite 文件再重新迁移
rm -f app.db
npm run prisma:migrate
npm run db:seed
```

### OpenRouter API 失败
```bash
# 检查 API Key
echo $OPENROUTER_API_KEY

# 系统会自动降级到本地分析
# 查看日志: [AIAnalyzer] Using fallback analysis
```

### WebSocket 连接断开
- 检查防火墙配置
- 确保后端运行在 localhost:5001
- 浏览器控制台查看连接错误

## 📝 开发指南

### 添加新的数据源

1. 在 `src/services/crawler.ts` 中添加新方法：

```typescript
async crawlNewSource() {
  try {
    const response = await axios.get('...')
    return response.data.map(item => ({
      title: item.title,
      url: item.url,
      content: item.description,
      source: 'new_source',
    }))
  } catch (err) {
    console.error('[CrawlerService] Error:', err)
    return []
  }
}
```

2. 在 `crawlAll()` 中注册：

```typescript
async crawlAll() {
  const sources = await Promise.all([
    this.crawlHackerNews(),
    this.crawlGithubTrending(),
    this.crawlReddit(),
    this.crawlNewSource(),  // ← 添加这里
  ])
  return sources.flat()
}
```

### 修改 AI 评分规则

编辑 `src/services/aiAnalyzer.ts` 的 prompt：

```typescript
const systemPrompt = `
你是 AI 热点分析专家。分析以下内容的:
1. 关联度 (0-10): 与关键词 [${keywords}] 的相关程度
2. 热度 (0-10): 话题在社区中的热门程度
3. 可信度 (0-10): 信息来源的可信程度

返回 JSON 格式: {"relevanceScore": X, "hotnessScore": Y, "credibilityScore": Z}
`
```

## 🚢 部署指南

### 生产环境构建

```bash
# 构建前端
cd frontend
npm run build
# 输出: dist/ 目录

# 构建后端
cd ../backend
npm run build

# 启动生产环境
NODE_ENV=production npm start
```

### Docker 部署

```dockerfile
# backend/Dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5001
CMD ["npm", "start"]
```

### 部署清单

- [ ] 设置生产级别的 OpenRouter API Key
- [ ] 配置 HTTPS 证书
- [ ] 设置数据库备份策略
- [ ] 配置监控和告警
- [ ] 启用请求速率限制
- [ ] 配置反向代理（nginx）

## 📚 相关资源

### 文档
- [React 官方文档](https://react.dev)
- [Vite 官方文档](https://vitejs.dev)
- [Express.js 指南](https://expressjs.com)
- [Prisma 数据库 ORM](https://www.prisma.io)
- [Socket.io 实时通信](https://socket.io)
- [TailwindCSS 样式框架](https://tailwindcss.com)

### API
- [OpenRouter API](https://openrouter.ai/) - 统一的 LLM API
- [HackerNews API](https://news.ycombinator.com/api) - Y Combinator 新闻
- [GitHub API](https://docs.github.com/en/rest) - 仓库和趋势
- [Reddit API](https://www.reddit.com/dev/api) - 社区讨论

## 📄 许可证

MIT License - 自由使用和修改

## 👨‍💻 贡献

欢迎提交 Issue 和 Pull Request！

```bash
# Fork 项目
# 创建特性分支 (git checkout -b feature/AmazingFeature)
# 提交更改 (git commit -m 'Add some AmazingFeature')
# 推送到分支 (git push origin feature/AmazingFeature)
# 开启 Pull Request
```

## 🎯 未来规划

- [ ] 用户账户系统与权限管理
- [ ] 高级分析和可视化仪表板
- [ ] 机器学习模型优化报告质量
- [ ] 移动应用适配 (React Native)
- [ ] 企业级部署支持
- [ ] 多语言支持
- [ ] 数据导出和报告生成

---

**最后更新**: 2026 年 3 月 8 日

如有问题，欢迎通过 GitHub Issues 反馈！🙏
