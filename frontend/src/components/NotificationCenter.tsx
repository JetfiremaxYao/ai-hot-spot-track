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
      case 'hotspot': return '🔥'
      case 'system': return '📢'
      case 'success': return '✅'
      case 'error': return '❌'
      default: return '📬'
    }
  }

  const getAccent = (type: Notification['type']) => {
    switch (type) {
      case 'hotspot': return 'border-l-orange-400 bg-orange-50/50'
      case 'system': return 'border-l-accent-400 bg-accent-50/50'
      case 'success': return 'border-l-emerald-400 bg-emerald-50/50'
      case 'error': return 'border-l-rose-400 bg-rose-50/50'
      default: return 'border-l-slate-300 bg-slate-50'
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
        title="通知中心"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0018 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 w-96 max-h-[28rem] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg z-50">
          <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-t-xl">
            <h3 className="font-semibold text-slate-800 text-sm">通知中心</h3>
            {notifications.length > 0 && (
              <button onClick={onClear} className="text-xs text-slate-400 hover:text-rose-500 transition-colors">
                清空
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400">
              <svg className="w-10 h-10 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm">暂无通知</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`border-l-[3px] p-4 transition-colors hover:bg-slate-50 cursor-pointer ${getAccent(notif.type)}`}
                  onClick={() => !notif.data?.hasBeenRead && onMarkAsRead(notif.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{getIcon(notif.type)}</span>
                        <h4 className="font-medium text-slate-700 text-sm truncate">{notif.title}</h4>
                        {notif.count && (
                          <span className="ml-auto text-xs font-bold text-orange-500">+{notif.count}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1.5">{notif.timestamp.toLocaleTimeString('zh-CN')}</p>

                      {notif.type === 'hotspot' && notif.data?.hotspots?.length > 0 && (
                        <div className="mt-2 space-y-0.5 text-xs">
                          {notif.data.hotspots.slice(0, 2).map((h: any, idx: number) => (
                            <div key={idx} className="text-slate-500 line-clamp-1">• {h.title.substring(0, 40)}...</div>
                          ))}
                          {notif.data.hotspots.length > 2 && (
                            <div className="text-slate-400">+{notif.data.hotspots.length - 2} 更多</div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemove(notif.id) }}
                      className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 text-sm"
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
