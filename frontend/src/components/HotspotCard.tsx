interface HotspotCardProps {
  hotspot: any
  onRead?: (id: number) => void
  onSave?: (id: number, isSaved: boolean) => void
  onLike?: (id: number, like: boolean) => void
}

export default function HotspotCard({ hotspot, onRead, onSave, onLike }: HotspotCardProps) {
  const handleCardClick = () => {
    if (!hotspot.isRead) {
      onRead?.(hotspot.id)
    }
  }

  const scoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-400'
    if (score >= 6) return 'text-brand-400'
    if (score >= 4) return 'text-yellow-400'
    return 'text-orange-400'
  }

  const scoreSize = (score: number) => {
    if (score >= 8) return 'scale-110'
    return 'scale-100'
  }

  return (
    <div
      onClick={handleCardClick}
      className={`
        group relative rounded-xl border transition-all duration-300 cursor-pointer
        ${
          hotspot.isRead
            ? 'border-dark-700 bg-dark-700/30 hover:border-dark-600 hover:bg-dark-700/50'
            : 'border-brand-500/30 bg-dark-700 hover:border-brand-400/50 hover:bg-dark-600'
        }
      `}
    >
      {/* 新消息指示器 */}
      {!hotspot.isRead && (
        <div className="absolute left-4 top-4 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
      )}

      <div className="p-5">
        {/* 标题 */}
        <h3 className="line-clamp-2 text-lg font-semibold text-white group-hover:text-brand-400 transition-colors">
          {hotspot.title}
        </h3>

        {/* 摘要 */}
        <p className="mt-2 line-clamp-2 text-sm text-gray-400">{hotspot.summary}</p>

        {/* 标签 */}
        <div className="mt-3 flex flex-wrap gap-2">
          {hotspot.keywords?.map((kw: any) => (
            <span
              key={kw.id}
              className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-dark-600 text-gray-300"
            >
              #{kw.name}
            </span>
          ))}
        </div>

        {/* 评分 */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-1">
            <span className="text-gray-500">关联度:</span>
            <span className={`font-bold ${scoreColor(hotspot.relevanceScore)} ${scoreSize(hotspot.relevanceScore)}`}>
              {hotspot.relevanceScore.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-500">热度:</span>
            <span className={`font-bold ${scoreColor(hotspot.hotnessScore)} ${scoreSize(hotspot.hotnessScore)}`}>
              {hotspot.hotnessScore.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-500">可信度:</span>
            <span className={`font-bold ${scoreColor(hotspot.credibilityScore)} ${scoreSize(hotspot.credibilityScore)}`}>
              {hotspot.credibilityScore.toFixed(1)}
            </span>
          </div>
        </div>

        {/* 元数据 */}
        <div className="mt-4 flex items-center justify-between border-t border-dark-600 pt-4">
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <span className="inline-block px-2 py-1 rounded bg-dark-600 font-medium text-gray-400">
              {hotspot.source}
            </span>
            <span>{new Date(hotspot.publishedAt).toLocaleDateString('zh-CN')}</span>
          </div>

          {/* 交互按钮 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onLike?.(hotspot.id, !hotspot.liked)
              }}
              className="p-2 rounded-lg hover:bg-dark-600 text-gray-400 hover:text-red-400 transition-colors"
              title={hotspot.liked ? '已点赞' : '点赞'}
            >
              <svg className={`w-4 h-4 ${hotspot.liked ? 'fill-red-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSave?.(hotspot.id, !hotspot.isSaved)
              }}
              className="p-2 rounded-lg hover:bg-dark-600 text-gray-400 hover:text-brand-400 transition-colors"
              title={hotspot.isSaved ? '已保存' : '保存'}
            >
              <svg className={`w-4 h-4 ${hotspot.isSaved ? 'fill-brand-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 19V5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 外链箭头 */}
      <a
        href={hotspot.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute right-4 bottom-4 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-dark-600 text-gray-400 hover:text-brand-400 transition-all"
        title="打开源链接"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  )
}
