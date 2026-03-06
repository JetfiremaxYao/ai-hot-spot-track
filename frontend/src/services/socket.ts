import { io, Socket } from 'socket.io-client'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5001'

let socket: Socket | null = null

export const socketService = {
  connect: (): Socket => {
    if (!socket) {
      socket = io(API_BASE_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      })

      socket.on('connect', () => {
        console.log('[Socket] 连接成功:', socket?.id)
      })

      socket.on('disconnect', () => {
        console.log('[Socket] 连接断开')
      })

      socket.on('error', (error) => {
        console.error('[Socket] 错误:', error)
      })
    }
    return socket
  },

  subscribe: (keyword: string) => {
    const s = socketService.connect()
    s.emit('subscribe', keyword)
    console.log(`[Socket] 订阅: ${keyword}`)
  },

  unsubscribe: (keyword: string) => {
    const s = socketService.connect()
    s.emit('unsubscribe', keyword)
    console.log(`[Socket] 取消订阅: ${keyword}`)
  },

  onNewHotspot: (callback: (hotspot: any) => void) => {
    const s = socketService.connect()
    s.on('newHotspot', callback)
  },

  offNewHotspot: (callback: (hotspot: any) => void) => {
    if (socket) {
      socket.off('newHotspot', callback)
    }
  },

  on: (event: string, callback: (data: any) => void) => {
    const s = socketService.connect()
    s.on(event, callback)
  },

  off: (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.off(event, callback)
    }
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  }
}
