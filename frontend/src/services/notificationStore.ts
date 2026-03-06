import { Notification } from '../hooks/useNotifications'

class NotificationStore {
  private notifications: Notification[] = []
  private listeners: Set<(notifications: Notification[]) => void> = new Set()

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.notifications))
  }

  add(notification: Omit<Notification, 'id' | 'timestamp'>) {
    const id = `notif-${Date.now()}-${Math.random()}`
    const newNotif: Notification = {
      ...notification,
      id,
      timestamp: new Date()
    }

    this.notifications = [newNotif, ...this.notifications.slice(0, 49)]
    this.notify()

    // 自动清除
    if (notification.type === 'success' || notification.type === 'error') {
      setTimeout(() => this.remove(id), 5000)
    }

    return id
  }

  remove(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id)
    this.notify()
  }

  markAsRead(id: string) {
    this.notifications = this.notifications.map(n =>
      n.id === id ? { ...n, data: { ...n.data, hasBeenRead: true } } : n
    )
    this.notify()
  }

  clear() {
    this.notifications = []
    this.notify()
  }

  getAll() {
    return [...this.notifications]
  }

  notifyNewHotspots(count: number, hotspots: any[] = []) {
    this.add({
      type: 'hotspot',
      title: `🔥 发现新热点`,
      message: `发现 ${count} 个新热点`,
      count,
      data: { hotspots }
    })
  }

  notifySuccess(message: string) {
    this.add({
      type: 'success',
      title: '✅ 成功',
      message
    })
  }

  notifyError(message: string, error?: any) {
    this.add({
      type: 'error',
      title: '❌ 错误',
      message,
      data: error
    })
  }

  notifySystem(message: string, data?: any) {
    this.add({
      type: 'system',
      title: '📢 系统消息',
      message,
      data
    })
  }
}

export const notificationStore = new NotificationStore()
