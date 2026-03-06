import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import NotificationCenter from './NotificationCenter.jsx'
import { Notification } from '../hooks/useNotifications'
import { notificationStore } from '../services/notificationStore.js'

export default function Layout() {
  const location = useLocation()
  const [notifications, setNotifications] = useState<Notification[]>([])

  // 订阅通知变化
  useEffect(() => {
    const unsubscribe = notificationStore.subscribe(setNotifications)
    return unsubscribe
  }, [])

  const isActive = (path: string) => location.pathname === path
  const unreadCount = notifications.filter(n => !n.data?.hasBeenRead).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-50 border-b border-dark-700 bg-dark-800/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & 应用名 */}
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600">
                <span className="text-sm font-bold text-white">AI</span>
              </div>
              <h1 className="text-xl font-bold text-white">AI热点监控</h1>
            </div>

            {/* 导航链接 */}
            <div className="flex space-x-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'text-gray-300 hover:text-white hover:bg-dark-700'
                }`}
              >
                热点
              </Link>
              <Link
                to="/keywords"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/keywords')
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'text-gray-300 hover:text-white hover:bg-dark-700'
                }`}
              >
                关键词
              </Link>
            </div>

            {/* 右侧按钮区域 */}
            <div className="flex items-center space-x-2">
              <NotificationCenter
                notifications={notifications}
                unreadCount={unreadCount}
                onRemove={(id) => notificationStore.remove(id)}
                onMarkAsRead={(id) => notificationStore.markAsRead(id)}
                onClear={() => notificationStore.clear()}
              />
              <button className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-gray-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* 页脚 */}
      <footer className="border-t border-dark-700 mt-16 bg-dark-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-400">
            <p>AI热点监控系统 © 2025 | 实时发现和分析AI领域的热点话题</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
