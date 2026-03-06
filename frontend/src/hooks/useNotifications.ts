import { useState, useCallback, useEffect } from 'react'

export interface Notification {
  id: string
  type: 'hotspot' | 'system' | 'success' | 'error'
  title: string
  message: string
  timestamp: Date
  count?: number
  data?: any
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // 添加通知
  const add = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = `notif-${Date.now()}-${Math.random()}`
    const newNotif: Notification = {
      ...notification,
      id,
      timestamp: new Date()
    }

    setNotifications(prev => [newNotif, ...prev.slice(0, 49)]) // 保留最多50条
    setUnreadCount(prev => prev + 1)

    // 自动清除成功/错误消息 (5秒后)
    if (notification.type === 'success' || notification.type === 'error') {
      setTimeout(() => {
        remove(id)
      }, 5000)
    }

    return id
  }, [])

  // 移除通知
  const remove = useCallback((id: string) => {
    setNotifications(prev => {
      const notif = prev.find(n => n.id === id)
      if (notif && !notif.data?.hasBeenRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      return prev.filter(n => n.id !== id)
    })
  }, [])

  // 标记为已读
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, data: { ...n.data, hasBeenRead: true } } : n
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  // 清空所有通知
  const clear = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  // 获取未读通知
  const getUnread = useCallback(() => {
    return notifications.filter(n => !n.data?.hasBeenRead)
  }, [notifications])

  // 添加热点通知
  const notifyNewHotspots = useCallback((count: number, hotspots: any[] = []) => {
    add({
      type: 'hotspot',
      title: `🔥 发现新热点`,
      message: `发现 ${count} 个新热点`,
      count,
      data: { hotspots }
    })
  }, [add])

  // 添加系统消息
  const notifySystem = useCallback((message: string, data?: any) => {
    add({
      type: 'system',
      title: '📢 系统消息',
      message,
      data
    })
  }, [add])

  // 添加成功消息
  const notifySuccess = useCallback((message: string) => {
    add({
      type: 'success',
      title: '✅ 成功',
      message
    })
  }, [add])

  // 添加错误消息
  const notifyError = useCallback((message: string, error?: any) => {
    add({
      type: 'error',
      title: '❌ 错误',
      message,
      data: error
    })
  }, [add])

  return {
    notifications,
    unreadCount,
    add,
    remove,
    markAsRead,
    clear,
    getUnread,
    notifyNewHotspots,
    notifySystem,
    notifySuccess,
    notifyError
  }
}
