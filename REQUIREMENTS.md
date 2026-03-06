# AI热点监控系统 - 需求文档

## 项目概述

构建一个智能热点监控和发现系统，通过AI自动监控关键词、抓取分析热点数据、提供实时推送和多维度查询，帮助用户第一时间了解AI大模型等领域的最新动态。

## 核心功能需求

### 1. 关键词管理
**目标**: 让用户灵活管理监控的关键词

- **添加关键词**: 用户手动输入关键词，系统开始自动监控
- **激活/暂停**: 支持对关键词的激活和暂停（无需删除）
- **删除关键词**: 删除不再需要的关键词
- **关键词列表**: 展示所有关键词及其状态、最后更新时间、热点数量

**数据模型**:
```
Keyword {
  id: string
  name: string
  description?: string
  status: 'active' | 'paused'
  createdAt: timestamp
  updatedAt: timestamp
  lastCheckedAt?: timestamp
  hotspotCount: number
}
```

### 2. AI热点监控和发现
**目标**: 自动发现、分析和评估热点信息

- **定时爬取**: 每隔一段时间（推荐30分钟）从多个信息源爬取数据
- **多源数据**: 支持从以下来源爬取
  - Twitter/X API
  - GitHub Trending
  - Hacker News
  - Reddit (r/MachineLearning等)
  - Tech新闻网站 (TechCrunch, VentureBeat等)
  - RSS源 (OpenAI Blog, Anthropic Blog等)
  
- **AI分析**: 使用OpenRouter API进行以下分析
  - **真假识别**: 识别虚假或误导信息
  - **相关性分析**: 根据关键词判断信息与用户兴趣的相关程度 (0-10)
  - **热度评分**: 基于传播量、讨论量等综合评分 (0-10)
  - **智能摘要**: 生成100-200字的热点摘要
  - **关键信息提取**: 提取时间、关键人物、关键数据等
  
- **去重处理**: 避免同一热点被重复记录

**数据模型**:
```
Hotspot {
  id: string
  title: string
  summary: string
  content: string
  source: string // 'twitter' | 'github' | 'hackernews' | 'reddit' | 'news' | 'rss'
  sourceUrl: string
  keywords: string[] // 匹配的关键词列表
  
  // AI分析结果
  relevanceScore: number // 0-10，与关键词的相关性
  hotnessScore: number // 0-10，热度综合评分
  credibilityScore: number // 0-10，真实性评分
  
  // 元数据
  publishedAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
  viewCount?: number
  likeCount?: number
  shareCount?: number
  commentCount?: number
  
  // 其他
  imageUrl?: string
  author?: string
  tags: string[]
  isRead: boolean
  isSaved: boolean
}
```

### 3. 热点浏览和查看
**目标**: 提供直观的热点查看体验

- **实时推送**: 通过WebSocket推送新的高热度热点 (热度>6)
- **历史记录**: 浏览已有的所有热点数据
- **详情页**: 点击热点查看完整内容、源链接、AI分析结果
- **已读状态**: 标记热点为已读
- **收藏功能**: 收藏重要的热点方便后续查阅

### 4. 多维度筛选和排序
**目标**: 帮助用户快速定位需要的信息

**筛选维度**:
- 关键词（单选/多选）
- 信息源（多选）: Twitter, GitHub, HackerNews, Reddit, News, RSS
- 热度范围: [min, max]
- 相关性范围: [min, max]
- 时间范围: 最近N小时/天
- 真实性评分: 低/中/高
- 已读状态: 全部/已读/未读
- 已保存状态: 全部/已保存/未保存

**排序方式**:
- 默认: 热度 (降序)
- 相关性 (降序)
- 发布时间 (最新优先)
- 综合评分 (多维度综合)

### 5. 全网搜索
**目标**: 除了监控，也支持用户主动搜索

- 搜索输入框: 输入任意关键词进行一次性搜索
- 快速搜索: 直接搜索而无需添加到监控列表
- 搜索结果: 返回相关热点，支持同样的筛选和排序

### 6. 实时通知
**目标**: 重要信息不错过

**WebSocket实时推送**:
- 连接到后端WebSocket
- 推送新增的高热度热点 (热度>6) 或重要热点
- 显示通知徽章或浮窗提醒

**邮件/高级通知**:
- 配置条件: 关键词 + 热度阈值 (如>8)
- 发送方式: 邮件、或其他推送方式
- 每日摘要: 可选的每日热点摘要邮件

### 7. Agent Skills（第二阶段）
**目标**: 将系统功能封装为其他AI能使用的技能

- **热点监控技能**: 其他Agent可以调用此技能监控特定关键词
- **热点分析技能**: 分析给定文本内容中的热点信息
- **热点搜索技能**: 搜索特定关键词相关的热点
- 标准化输入输出，便于集成

## 非功能需求

### 性能
- 前端页面加载时间 < 2s
- 热点列表分页加载，每页20条
- WebSocket延迟 < 1s
- API响应时间 < 2s

### 可用性
- 前端界面独特、不千篇一律
- 响应式设计，支持PC和移动端
- 深色模式支持
- 暗黑友好的配色方案

### 可靠性
- 数据持久化到SQLite
- 错误恢复机制
- 爬虫失败重试

### 安全性
- API密钥安全存储（环境变量）
- 用户输入验证
- 基础访问控制（可选）

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 19 + TypeScript | 现代UI框架 |
| 前端构建 | Vite 5+ | 极速开发体验 |
| 样式 | TailwindCSS v3 | 原子化CSS框架 |
| UI组件库 | Shadcn/UI | 高质量组件库 |
| 后端 | Node.js + Express 5.x | 轻量级API服务 |
| 数据库 | SQLite + Prisma ORM | 轻量存储、类型安全 |
| AI服务 | OpenRouter API | 多模型支持 |
| 实时通信 | WebSocket / Socket.io | 实时推送 |
| 数据爬取 | Cheerio + Axios | HTML解析和HTTP请求 |
| 定时任务 | node-cron + Bull | 后台任务调度 |

## 项目结构

```
ai-hot-spot/
├── frontend/
│   ├── src/
│   │   ├── components/          # React组件
│   │   ├── pages/               # 页面组件
│   │   ├── hooks/               # 自定义hooks
│   │   ├── utils/               # 工具函数
│   │   ├── services/            # API调用
│   │   ├── types/               # TypeScript类型
│   │   ├── styles/              # 全局样式
│   │   └── App.tsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── keywords/        # 关键词API
│   │   │   ├── hotspots/        # 热点API
│   │   │   └── search/          # 搜索API
│   │   ├── services/
│   │   │   ├── crawler/         # 爬虫服务
│   │   │   ├── ai/              # AI分析服务
│   │   │   └── websocket/       # WebSocket服务
│   │   ├── jobs/                # 定时任务
│   │   ├── utils/               # 工具函数
│   │   ├── prisma/              # Prisma schema
│   │   ├── middleware/          # Express中间件
│   │   └── index.ts             # 入口文件
│   ├── .env.example
│   └── package.json
│
├── REQUIREMENTS.md
├── TECHNICAL_PLAN.md
├── DEVELOPMENT_PLAN.md
└── docker-compose.yml (可选)
```

## 开发阶段规划

### 第一阶段：网页版MVP
1. 项目初始化 + 数据库设计
2. 后端核心服务
3. 前端UI开发
4. 集成测试和优化

**完成条件**: 网页版能完整演示所有功能

### 第二阶段：Agent Skills
5. 技能包装和文档化
6. 集成测试

**完成条件**: Skills可被其他Agent调用

## 验收标准

- ✅ 关键词管理功能完整可用
- ✅ 热点自动爬取和AI分析正常运行
- ✅ 多维度筛选和排序功能有效
- ✅ WebSocket实时推送功能正常
- ✅ 前端UI独特美观，响应灵敏
- ✅ 所有关键功能都有基础测试覆盖
- ✅ Agent Skills文档完善，可被调用

---

**文档版本**: v1.0  
**更新时间**: 2026年3月6日
