import { useState, useRef, useEffect } from 'react'
import { Notification } from '../hooks/useNotifications'

interface NotificationCenterProps {
  notifications: Notification[]
  unreadCount: number
  onRemove: (id: string) => void
  onMarkAsRead: (id: string) => void
  onClear: () => void
}

export default function NotificationCenter({
  notifications,
  unreadCount,
  onRemove,
  onMarkAsRead,
  onClear
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }
  }, [isOpen])

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'hotspot':
        return '🔥'
      case 'system':
        return '📢'
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      default:
        return '📬'
    }
  }

  const getBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'hotspot':
        return 'border-orange-500/30 bg-orange-500/10'
      case 'system':
        return 'border-blue-500/30 bg-blue-500/10'
      case 'success':
        return 'border-emerald-500/30 bg-emerald-500/10'
      case 'error':
        return 'border-red-500/30 bg-red-500/10'
      default:
        return 'border-dark-600 bg-dark-700'
    }
  }

  return (
    <div className="relative">
      {/* 铃铛图标按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-dark-700"
        title="通知中心"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0018 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* 未读数字徽章 */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知面板 */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-12 w-96 max-h-96 overflow-y-auto rounded-lg border border-dark-700 bg-dark-800 shadow-lg z-50"
        >
          {/* 标题栏 */}
          <div className="sticky top-0 flex items-center justify-between border-b border-dark-700 bg-dark-800 px-4 py-3">
            <h3 className="font-semibold text-white">通知中心</h3>
            {notifications.length > 0 && (
              <button
                onClick={onClear}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                清空
              </button>
            )}
          </div>

          {/* 通知列表 */}
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm">暂无通知</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-700">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`border-l-4 p-4 transition-colors hover:bg-dark-700/50 cursor-pointer ${getBgColor(notif.type)}`}
                  onClick={() => !notif.data?.hasBeenRead && onMarkAsRead(notif.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getIcon(notif.type)}</span>
                        <h4 className="font-semibold text-white truncate">{notif.title}</h4>
                        {notif.count && (
                          <span className="ml-auto text-sm font-bold text-orange-400">
                            +{notif.count}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {notif.timestamp.toLocaleTimeString('zh-CN')}
                      </p>

                      {/* 热点列表预览 */}
                      {notif.type === 'hotspot' && notif.data?.hotspots?.length > 0 && (
                        <div className="mt-3 space-y-1 text-xs">
                          {notif.data.hotspots.slice(0, 2).map((h: any, idx: number) => (
                            <div key={idx} className="text-gray-300 line-clamp-1">
                              • {h.title.substring(0, 40)}...
                            </div>
                          ))}
                          {notif.data.hotspots.length > 2 && (
                            <div className="text-gray-500">+{notif.data.hotspots.length - 2} 更多</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 关闭按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemove(notif.id)
                      }}
                      className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
                      title="关闭"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
