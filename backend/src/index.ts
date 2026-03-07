import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

// 导入路由
import keywordRoutes from './api/keywords.js'
import hotspotRoutes from './api/hotspots.js'
import searchRoutes from './api/search.js'
import configRoutes from './api/config.js'

// 导入任务
import './jobs/hotspotFetcher.js'

// 配置
dotenv.config()

const app = express()
const httpServer = createServer(app)
const prisma = new PrismaClient()

// WebSocket 配置
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 请求日志中间件
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// 健康检查
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// API 路由
app.use('/api/keywords', keywordRoutes)
app.use('/api/hotspots', hotspotRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/config', configRoutes)

// WebSocket 连接处理
io.on('connection', (socket: Socket) => {
  console.log(`[WebSocket] 用户连接: ${socket.id}`)

  // 用户订阅关键词
  socket.on('subscribe', (keyword: string) => {
    socket.join(`keyword:${keyword}`)
    console.log(`[WebSocket] ${socket.id} 订阅了关键词: ${keyword}`)
  })

  // 用户取消订阅
  socket.on('unsubscribe', (keyword: string) => {
    socket.leave(`keyword:${keyword}`)
    console.log(`[WebSocket] ${socket.id} 取消订阅: ${keyword}`)
  })

  // 断开连接
  socket.on('disconnect', () => {
    console.log(`[WebSocket] 用户断开连接: ${socket.id}`)
  })

  // 错误处理
  socket.on('error', (error: any) => {
    console.error(`[WebSocket] 错误 (${socket.id}):`, error)
  })
})

// 错误处理中间件
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err)
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || '服务器内部错误',
    timestamp: new Date().toISOString()
  })
})

// 404 处理
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: '资源不存在'
  })
})

// 启动服务器
const PORT = parseInt(process.env.PORT || '5000')

httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          🚀 AI Hot Spot Backend 服务启动成功             ║
║                                                            ║
║  📍 地址: http://localhost:${PORT}                       
║  🌐 WebSocket: ws://localhost:${PORT}                   
║  📚 文档: http://localhost:${PORT}/api/health            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `)
})

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n\n正在关闭服务器...')
  httpServer.close()
  await prisma.$disconnect()
  process.exit(0)
})

export { app, prisma }
