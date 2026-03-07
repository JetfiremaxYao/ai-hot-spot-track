import { useKeywords } from '../hooks/useKeywords.js'
import KeywordList from '../components/KeywordList.jsx'
import AIProviderSettings from '../components/AIProviderSettings.jsx'

export default function KeywordsPage() {
  const { keywords, loading, error, addKeyword, updateKeywordStatus, deleteKeyword } = useKeywords()

  const activeCount = keywords.filter(kw => kw.status === 'active').length
  const pausedCount = keywords.filter(kw => kw.status === 'paused').length

  return (
    <div className="space-y-5">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">关键词管理</h2>
        <p className="mt-1 text-sm text-slate-500">管理您想要监控的关键词</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">总数</p>
          <p className="mt-1 text-2xl font-bold text-slate-800 tabular-nums">{keywords.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">监控中</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 tabular-nums">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">已暂停</p>
          <p className="mt-1 text-2xl font-bold text-slate-400 tabular-nums">{pausedCount}</p>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-600">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 animate-pulse">
              <div className="h-5 bg-slate-100 rounded w-40 mb-2"></div>
              <div className="h-4 bg-slate-100 rounded w-64"></div>
            </div>
          ))}
        </div>
      )}

      {/* 关键词列表 */}
      {!loading && (
        <KeywordList
          keywords={keywords}
          onStatusChange={updateKeywordStatus}
          onDelete={deleteKeyword}
          onAddWord={addKeyword}
          loading={loading}
        />
      )}

      {/* 提示信息 */}
      <div className="rounded-xl border border-accent-200 bg-accent-50/50 p-4">
        <div className="flex space-x-3">
          <svg className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-accent-700">
            <p className="font-medium">提示</p>
            <p className="mt-0.5 text-accent-600/80">系统每 30 分钟自动检查一次关键词的热点。只有「监控中」状态的关键词才会被扫描。</p>
          </div>
        </div>
      </div>
    </div>
  )
}
