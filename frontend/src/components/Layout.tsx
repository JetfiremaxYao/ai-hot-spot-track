import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import NotificationCenter from './NotificationCenter.jsx'
import { Notification } from '../hooks/useNotifications'
import { notificationStore } from '../services/notificationStore.js'

export default function Layout() {
  const location = useLocation()
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const unsubscribe = notificationStore.subscribe(setNotifications)
    return () => { unsubscribe() }
  }, [])

  const isActive = (path: string) => location.pathname === path
  const unreadCount = notifications.filter(n => !n.data?.hasBeenRead).length

  return (
    <div className="min-h-screen">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-accent">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-gradient tracking-tight">AI热点雷达</h1>
              <div className="flex items-center space-x-1.5 ml-2 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-slow" />
                <span className="text-[10px] font-medium text-emerald-600">LIVE</span>
              </div>
            </div>

            {/* 导航链接 */}
            <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-0.5">
              <Link
                to="/"
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isActive('/')
                    ? 'bg-white text-slate-900 shadow-soft'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                热点
              </Link>
              <Link
                to="/keywords"
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isActive('/keywords')
                    ? 'bg-white text-slate-900 shadow-soft'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                关键词
              </Link>
              <Link
                to="/settings"
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isActive('/settings')
                    ? 'bg-white text-slate-900 shadow-soft'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                设置
              </Link>
            </div>

            {/* 右侧 */}
            <div className="flex items-center space-x-1">
              <NotificationCenter
                notifications={notifications}
                unreadCount={unreadCount}
                onRemove={(id) => notificationStore.remove(id)}
                onMarkAsRead={(id) => notificationStore.markAsRead(id)}
                onClear={() => notificationStore.clear()}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* 页脚 */}
      <footer className="border-t border-slate-200/60 mt-12">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center text-xs text-slate-400">
            <p>AI热点雷达 &copy; 2025 &mdash; 以最快速度发现 AI 领域的价值热点</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
