import { useState, useEffect, useMemo } from 'react'
import { useHotspots } from '../hooks/useHotspots.js'
import { hotspotService, searchService } from '../services/api.js'
import { socketService } from '../services/socket.js'
import { notificationStore } from '../services/notificationStore.js'
import HotspotCard from '../components/HotspotCard.jsx'
import { TextGenerateEffect } from '../components/ui/text-generate-effect'
import { MovingBorderButton } from '../components/ui/moving-border'

export default function HotspotsPage() {
  const [sortBy, setSortBy] = useState('hotness')
  const [filterKeyword, setFilterKeyword] = useState('')
  const [onlySaved, setOnlySaved] = useState(false)
  const [filterSource, setFilterSource] = useState('all')
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState<'db' | 'live'>('db')
  const [searchResults, setSearchResults] = useState<any[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const filter = useMemo(() => ({
    keyword: filterKeyword || undefined,
    isSaved: onlySaved || undefined,
    source: filterSource === 'all' ? undefined : filterSource,
    isRead: readFilter === 'all' ? undefined : readFilter === 'read',
    sortBy
  }), [filterKeyword, onlySaved, filterSource, readFilter, sortBy])

  const { hotspots, total, loading, error, currentPage, totalPages, nextPage, prevPage, refetch } = useHotspots(filter)

  // WebSocket 订阅
  useEffect(() => {
    socketService.connect()

    // 监听新热点事件
    const handleNewHotspots = (data: any) => {
      console.log('[WebSocket] 新热点:', data)
      notificationStore.notifyNewHotspots(data.count, data.hotspots)
      refetch()
    }

    // 兼容旧事件
    const handleLegacyHotspot = (hotspot: any) => {
      console.log('[WebSocket] 新热点(旧):', hotspot)
      notificationStore.notifySystem('发现新热点', { hotspot })
      refetch()
    }

    socketService.on('hotspot:new', handleNewHotspots)
    socketService.onNewHotspot(handleLegacyHotspot)

    const handleRefreshDone = (data: any) => {
      notificationStore.notifySuccess(data?.message || '刷新完成')
      refetch()
    }

    socketService.on('refresh:done', handleRefreshDone)

    return () => {
      socketService.off('hotspot:new', handleNewHotspots)
      socketService.offNewHotspot(handleLegacyHotspot)
      socketService.off('refresh:done', handleRefreshDone)
    }
  }, [])

  // 手动刷新所有热点
  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true)
      notificationStore.notifySystem('正在刷新热点，请稍候...')
      await hotspotService.refreshAll()
      notificationStore.notifySystem('刷新任务已启动，稍后会自动通知结果')
    } catch (error) {
      notificationStore.notifyError('更新失败，请检查网络连接')
      console.error('刷新失败:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // 全网搜索
  const handleSearch = async () => {
    const q = searchQuery.trim()
    if (!q) return
    try {
      setIsSearching(true)
      const result = await searchService.search(q, searchMode)
      setSearchResults(result.results || [])
      notificationStore.notifySuccess(`搜索完成，共 ${result.results?.length || 0} 条结果`)
    } catch (error) {
      notificationStore.notifyError('搜索失败，请稍后重试')
    } finally {
      setIsSearching(false)
    }
  }

  const handleClearSearch = () => {
    setSearchResults(null)
    setSearchQuery('')
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await hotspotService.markAsRead(id)
    } catch (err) {
      console.error('标记失败:', err)
    }
  }

  const handleToggleSave = async (id: number, isSaved: boolean) => {
    try {
      await hotspotService.toggleSave(id, isSaved)
    } catch (err) {
      console.error('保存失败:', err)
    }
  }

  const handleToggleLike = async (id: number, like: boolean) => {
    try {
      await hotspotService.toggleLike(id, like)
    } catch (err) {
      console.error('操作失败:', err)
    }
  }

  return (
    <div className="space-y-5">
      {/* 页面标题和操作栏 */}
      <div className="flex items-start justify-between">
        <div>
          <TextGenerateEffect
            words="AI 热点雷达"
            className="text-2xl md:text-3xl font-bold text-gradient"
            duration={0.4}
          />
          <p className="mt-1 text-sm text-slate-500">以最快速度发现 AI 领域的价值热点</p>
        </div>
        <MovingBorderButton
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          borderRadius="0.75rem"
          className="px-5 py-2.5 font-medium text-sm text-slate-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          containerClassName="h-auto"
          duration={3000}
        >
          <div className="flex items-center gap-2">
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? '更新中...' : '更新热点'}
          </div>
        </MovingBorderButton>
      </div>

      {/* 搜索栏 */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center shadow-soft">
        <div className="flex flex-1 items-center space-x-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="全网搜索关键词..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:outline-none transition-all"
          />
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={searchMode}
            onChange={(e) => setSearchMode(e.target.value as 'db' | 'live')}
            className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent-400 focus:outline-none transition-all"
          >
            <option value="db">本地搜索</option>
            <option value="live">全网搜索</option>
          </select>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-gradient-accent text-white hover:opacity-90 disabled:opacity-50"
          >
            {isSearching ? '搜索中...' : '搜索'}
          </button>
          {searchResults && (
            <button
              onClick={handleClearSearch}
              className="px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* 过滤和排序栏 */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center shadow-soft">
        <div className="flex flex-1 items-center space-x-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <input
            type="text"
            placeholder="按关键词过滤..."
            value={filterKeyword}
            onChange={(e) => setFilterKeyword(e.target.value)}
            className="flex-1 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:outline-none transition-all"
          />
        </div>
        <div className="flex items-center space-x-2 flex-wrap">
          <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent-400 focus:outline-none">
            <option value="all">全部来源</option>
            <option value="bing">Bing</option>
            <option value="google">Google</option>
            <option value="hackernews">HackerNews</option>
            <option value="duckduckgo">DuckDuckGo</option>
            <option value="twitter">Twitter/X</option>
          </select>
          <select value={readFilter} onChange={(e) => setReadFilter(e.target.value as 'all' | 'read' | 'unread')} className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent-400 focus:outline-none">
            <option value="all">全部状态</option>
            <option value="unread">未读</option>
            <option value="read">已读</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent-400 focus:outline-none">
            <option value="hotness">热度排序</option>
            <option value="relevance">关联度排序</option>
            <option value="credibility">可信度排序</option>
            <option value="time">时间排序</option>
          </select>
          <button
            onClick={() => setOnlySaved(!onlySaved)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              onlySaved
                ? 'bg-accent-50 text-accent-600 border border-accent-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent'
            }`}
          >
            已保存
          </button>
        </div>
      </div>

      {/* 摘要统计 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">总热点</p>
          <p className="mt-1 text-2xl font-bold text-slate-800 tabular-nums">{total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">当前页</p>
          <p className="mt-1 text-2xl font-bold text-slate-800 tabular-nums">{currentPage}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">未读</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 tabular-nums">{hotspots.filter(h => !h.isRead).length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">已保存</p>
          <p className="mt-1 text-2xl font-bold text-accent-600 tabular-nums">{hotspots.filter(h => h.isSaved).length}</p>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-600">
          <p className="text-sm">加载失败: {error}</p>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse">
              <div className="h-5 bg-slate-100 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-slate-100 rounded w-full mb-2"></div>
              <div className="h-4 bg-slate-100 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      )}

      {/* 热点列表 */}
      {!loading && (searchResults ? searchResults.length > 0 : hotspots.length > 0) && (
        <div className="grid gap-3">
          {(searchResults || hotspots).map((hotspot) => (
            <HotspotCard
              key={hotspot.id}
              hotspot={hotspot}
              onRead={searchResults ? undefined : handleMarkAsRead}
              onSave={searchResults ? undefined : handleToggleSave}
              onLike={searchResults ? undefined : handleToggleLike}
            />
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!loading && (searchResults ? searchResults.length === 0 : hotspots.length === 0) && (
        <div className="rounded-xl border border-slate-200 bg-white p-16 text-center shadow-soft">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-slate-700">暂无热点</h3>
          <p className="mt-1 text-sm text-slate-400">请添加关键词或稍后再试</p>
        </div>
      )}

      {/* 分页 */}
      {!loading && !searchResults && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-soft">
          <div className="text-sm text-slate-500">
            第 <span className="font-semibold text-slate-800">{currentPage}</span> / <span className="font-semibold text-slate-800">{totalPages}</span> 页
          </div>
          <div className="flex space-x-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              上一页
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
