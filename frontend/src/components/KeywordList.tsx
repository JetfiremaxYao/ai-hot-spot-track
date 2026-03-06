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

  return (
    <div className="space-y-4">
      {/* 添加按钮 */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full rounded-lg border-2 border-dashed border-dark-600 hover:border-brand-400 bg-dark-700/30 hover:bg-dark-700 p-4 text-center flex items-center justify-center space-x-2 text-gray-400 hover:text-brand-400 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>添加关键词</span>
        </button>
      )}

      {/* 添加表单 */}
      {isAdding && (
        <div className="rounded-lg border border-brand-500/30 bg-dark-700 p-4 space-y-3">
          <input
            type="text"
            placeholder="关键词名称"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full rounded-lg bg-dark-600 border border-dark-500 px-3 py-2 text-white placeholder-gray-500 focus:border-brand-400 focus:outline-none transition-colors"
          />
          <input
            type="text"
            placeholder="描述（可选）"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full rounded-lg bg-dark-600 border border-dark-500 px-3 py-2 text-white placeholder-gray-500 focus:border-brand-400 focus:outline-none transition-colors"
          />
          <div className="flex space-x-2 justify-end">
            <button
              onClick={() => {
                setIsAdding(false)
                setNewName('')
                setNewDesc('')
              }}
              className="px-3 py-2 rounded-lg bg-dark-600 text-gray-400 hover:bg-dark-500 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              disabled={loading || !newName.trim()}
              className="px-3 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            className="flex items-center justify-between rounded-lg border border-dark-600 bg-dark-700 p-4 hover:border-dark-500 transition-colors"
          >
            <div className="flex-1">
              <h4 className="font-semibold text-white">{kw.name}</h4>
              {kw.description && <p className="text-sm text-gray-400 mt-1">{kw.description}</p>}
              <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                <span>{kw.hotspotCount || 0} 个热点</span>
                <span>•</span>
                <span>{new Date(kw.updatedAt).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* 状态切换 */}
              <button
                onClick={() => {
                  const newStatus = kw.status === 'active' ? 'paused' : 'active'
                  onStatusChange?.(kw.id, newStatus)
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  kw.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                    : 'bg-gray-700/20 text-gray-400 hover:bg-gray-700/30'
                }`}
              >
                {kw.status === 'active' ? '监控中' : '已暂停'}
              </button>

              {/* 删除按钮 */}
              <button
                onClick={() => {
                  if (confirm(`确定删除关键词"${kw.name}"吗？`)) {
                    onDelete?.(kw.id)
                  }
                }}
                className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
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
          <div className="text-center py-8 text-gray-500">
            <p>还没有关键词，添加一个开始监控吧</p>
          </div>
        )}
      </div>
    </div>
  )
}
