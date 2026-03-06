import { useState, useEffect } from 'react'
import { useHotspots } from '../hooks/useHotspots.js'
import { hotspotService, searchService } from '../services/api.js'
import { socketService } from '../services/socket.js'
import { notificationStore } from '../services/notificationStore.js'
import HotspotCard from '../components/HotspotCard.jsx'

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

  const { hotspots, total, loading, error, currentPage, totalPages, nextPage, prevPage, refetch } = useHotspots({
    keyword: filterKeyword || undefined,
    isSaved: onlySaved || undefined,
    source: filterSource === 'all' ? undefined : filterSource,
    isRead: readFilter === 'all' ? undefined : readFilter === 'read',
    sortBy
  })

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
    <div className="space-y-6">
      {/* 页面标题和操作栏 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">AI 热点</h2>
          <p className="mt-2 text-gray-400">发现和分析 AI/ML 领域的最新热点话题</p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="mt-1 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium transition-all flex items-center gap-2"
          title="手动刷新所有热点"
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isRefreshing ? '更新中...' : '🔄 更新热点'}
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="flex flex-col gap-4 rounded-lg border border-dark-700 bg-dark-800 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="全网搜索关键词..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
            }}
            className="flex-1 rounded-lg bg-dark-700 border border-dark-600 px-3 py-2 text-white placeholder-gray-500 focus:border-brand-400 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={searchMode}
            onChange={(e) => setSearchMode(e.target.value as 'db' | 'live')}
            className="rounded-lg bg-dark-700 border border-dark-600 px-3 py-2 text-white focus:border-brand-400 focus:outline-none transition-colors"
          >
            <option value="db">本地搜索</option>
            <option value="live">全网搜索</option>
          </select>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 disabled:opacity-50"
          >
            {isSearching ? '搜索中...' : '搜索'}
          </button>
          {searchResults && (
            <button
              onClick={handleClearSearch}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-dark-700 text-gray-400 hover:text-white"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* 过滤和排序栏 */}
      <div className="flex flex-col gap-4 rounded-lg border border-dark-700 bg-dark-800 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="按关键词过滤..."
            value={filterKeyword}
            onChange={(e) => {
              setFilterKeyword(e.target.value)
            }}
            className="flex-1 rounded-lg bg-dark-700 border border-dark-600 px-3 py-2 text-white placeholder-gray-500 focus:border-brand-400 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="rounded-lg bg-dark-700 border border-dark-600 px-3 py-2 text-white focus:border-brand-400 focus:outline-none transition-colors"
          >
            <option value="all">全部来源</option>
            <option value="bing">Bing</option>
            <option value="google">Google</option>
            <option value="hackernews">HackerNews</option>
            <option value="duckduckgo">DuckDuckGo</option>
            <option value="twitter">Twitter/X</option>
          </select>
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value as 'all' | 'read' | 'unread')}
            className="rounded-lg bg-dark-700 border border-dark-600 px-3 py-2 text-white focus:border-brand-400 focus:outline-none transition-colors"
          >
            <option value="all">全部状态</option>
            <option value="unread">未读</option>
            <option value="read">已读</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg bg-dark-700 border border-dark-600 px-3 py-2 text-white focus:border-brand-400 focus:outline-none transition-colors"
          >
            <option value="hotness">热度排序</option>
            <option value="relevance">关联度排序</option>
            <option value="credibility">可信度排序</option>
            <option value="time">时间排序</option>
          </select>

          <button
            onClick={() => setOnlySaved(!onlySaved)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              onlySaved
                ? 'bg-brand-500/20 text-brand-400'
                : 'bg-dark-700 text-gray-400 hover:text-white'
            }`}
          >
            已保存
          </button>
        </div>
      </div>

      {/* 摘要统计 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-dark-700 bg-dark-800/50 p-4">
          <p className="text-sm text-gray-500">总热点数</p>
          <p className="mt-1 text-2xl font-bold text-white">{total}</p>
        </div>
        <div className="rounded-lg border border-dark-700 bg-dark-800/50 p-4">
          <p className="text-sm text-gray-500">当前页</p>
          <p className="mt-1 text-2xl font-bold text-white">{currentPage}</p>
        </div>
        <div className="rounded-lg border border-dark-700 bg-dark-800/50 p-4">
          <p className="text-sm text-gray-500">未读数</p>
          <p className="mt-1 text-2xl font-bold text-green-400">{hotspots.filter(h => !h.isRead).length}</p>
        </div>
        <div className="rounded-lg border border-dark-700 bg-dark-800/50 p-4">
          <p className="text-sm text-gray-500">已保存</p>
          <p className="mt-1 text-2xl font-bold text-brand-400">{hotspots.filter(h => h.isSaved).length}</p>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          <p className="text-sm">加载失败: {error}</p>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-dark-700 bg-dark-700 p-5 animate-pulse">
              <div className="h-6 bg-dark-600 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-dark-600 rounded w-full mb-2"></div>
              <div className="h-4 bg-dark-600 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      )}

      {/* 热点列表 */}
      {!loading && (searchResults ? searchResults.length > 0 : hotspots.length > 0) && (
        <div className="grid gap-4">
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
        <div className="rounded-lg border border-dark-700 bg-dark-800/30 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-white">暂无热点</h3>
          <p className="mt-1 text-gray-400">请添加关键词或稍后再试</p>
        </div>
      )}

      {/* 分页 */}
      {!loading && !searchResults && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-dark-700 bg-dark-800 p-4">
          <div className="text-sm text-gray-400">
            第 <span className="font-semibold text-white">{currentPage}</span> / <span className="font-semibold text-white">{totalPages}</span> 页
          </div>
          <div className="flex space-x-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg bg-dark-700 text-gray-400 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              上一页
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg bg-dark-700 text-gray-400 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
