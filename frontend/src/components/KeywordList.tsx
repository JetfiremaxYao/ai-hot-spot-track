import { useState } from 'react'

interface KeywordListProps {
  keywords: any[]
  onStatusChange?: (id: number, status: 'active' | 'paused') => void
  onDelete?: (id: number) => void
  onAddWord?: (name: string, description?: string) => void
  loading?: boolean
}

export default function KeywordList({
  keywords,
  onStatusChange,
  onDelete,
  onAddWord,
  loading = false
}: KeywordListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null)

  const handleAdd = async () => {
    if (!newName.trim()) return
    try {
      await onAddWord?.(newName, newDesc)
      setNewName('')
      setNewDesc('')
      setIsAdding(false)
    } catch (err) {
      console.error('添加失败:', err)
    }
  }

  const handleToggleStatus = async (kw: any) => {
    if (pendingStatusId === kw.id) return

    const newStatus: 'active' | 'paused' = kw.status === 'active' ? 'paused' : 'active'

    try {
      setPendingStatusId(kw.id)
      await onStatusChange?.(kw.id, newStatus)
    } catch (err) {
      console.error('切换关键词状态失败:', err)
    } finally {
      setPendingStatusId(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* 添加按钮 */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-accent-400 bg-white hover:bg-accent-50/30 p-4 text-center flex items-center justify-center space-x-2 text-slate-400 hover:text-accent-600 transition-all cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-medium">添加关键词</span>
        </button>
      )}

      {/* 添加表单 */}
      {isAdding && (
        <div className="rounded-xl border border-accent-200 bg-white p-4 space-y-3 shadow-card">
          <input
            type="text"
            placeholder="关键词名称"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:outline-none transition-all"
          />
          <input
            type="text"
            placeholder="描述（可选）"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:outline-none transition-all"
          />
          <div className="flex space-x-2 justify-end">
            <button
              onClick={() => { setIsAdding(false); setNewName(''); setNewDesc('') }}
              className="px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              disabled={loading || !newName.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-accent text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              添加
            </button>
          </div>
        </div>
      )}

      {/* 关键词列表 */}
      <div className="space-y-2">
        {keywords.map((kw) => (
          <div
            key={kw.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:shadow-card hover:border-slate-300 transition-all"
          >
            <div className="flex-1">
              <h4 className="font-semibold text-slate-800">{kw.name}</h4>
              {kw.description && <p className="text-sm text-slate-500 mt-0.5">{kw.description}</p>}
              <div className="flex items-center space-x-3 mt-2 text-xs text-slate-400">
                <span className="font-medium">{kw.hotspotCount || 0} 个热点</span>
                <span className="text-slate-300">·</span>
                <span>{new Date(kw.updatedAt).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${kw.status === 'active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {kw.status === 'active' ? '监控中' : '已暂停'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={kw.status === 'active'}
                  aria-label={`${kw.name} 抓取开关`}
                  onClick={() => handleToggleStatus(kw)}
                  disabled={loading || pendingStatusId === kw.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-accent-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    kw.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                  title={kw.status === 'active' ? '点击暂停抓取' : '点击开启抓取'}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      kw.status === 'active' ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={() => {
                  if (confirm(`确定删除关键词"${kw.name}"吗？`)) {
                    onDelete?.(kw.id)
                  }
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                title="删除"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {keywords.length === 0 && !isAdding && (
          <div className="text-center py-10 text-slate-400">
            <p className="text-sm">还没有关键词，添加一个开始监控吧</p>
          </div>
        )}
      </div>
    </div>
  )
}
