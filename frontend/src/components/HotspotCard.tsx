import { motion } from 'framer-motion'

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
    if (score >= 8) return 'text-emerald-600'
    if (score >= 6) return 'text-accent-600'
    if (score >= 4) return 'text-amber-600'
    return 'text-orange-600'
  }

  const scoreBg = (score: number) => {
    if (score >= 8) return 'bg-emerald-50'
    if (score >= 6) return 'bg-accent-50'
    if (score >= 4) return 'bg-amber-50'
    return 'bg-orange-50'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleCardClick}
      className={`
        group relative rounded-xl border transition-all duration-300 cursor-pointer bg-white
        ${
          hotspot.isRead
            ? 'border-slate-200 hover:border-slate-300 hover:shadow-card'
            : 'border-accent-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5'
        }
      `}
    >
      {/* 未读左侧高亮条 */}
      {!hotspot.isRead && (
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-accent" />
      )}

      <div className="p-5 pl-6">
        {/* 标题行 */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-[15px] font-semibold text-slate-800 group-hover:text-accent-600 transition-colors leading-snug">
            {hotspot.title}
          </h3>
          {!hotspot.isRead && (
            <span className="flex-shrink-0 mt-1 px-1.5 py-0.5 text-[10px] font-bold text-accent-600 bg-accent-50 rounded">
              NEW
            </span>
          )}
        </div>

        {/* 摘要 */}
        <p className="mt-2 line-clamp-2 text-sm text-slate-500 leading-relaxed">{hotspot.summary}</p>

        {/* 标签 */}
        {hotspot.keywords?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {hotspot.keywords.map((kw: any) => (
              <span
                key={kw.id}
                className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200/60"
              >
                #{kw.name}
              </span>
            ))}
          </div>
        )}

        {/* 评分条 */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          {[
            { label: '关联', value: hotspot.relevanceScore },
            { label: '热度', value: hotspot.hotnessScore },
            { label: '可信', value: hotspot.credibilityScore },
          ].map(({ label, value }) => (
            <div key={label} className={`flex items-center space-x-1 px-2 py-1 rounded-md ${scoreBg(value)}`}>
              <span className="text-slate-500">{label}</span>
              <span className={`font-bold tabular-nums ${scoreColor(value)}`}>
                {value.toFixed(1)}
              </span>
            </div>
          ))}
        </div>

        {/* 底部：来源 + 操作 */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-2.5 text-xs text-slate-400">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/60 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
              {hotspot.source}
            </span>
            <span>{new Date(hotspot.publishedAt).toLocaleDateString('zh-CN')}</span>
          </div>

          {/* 交互按钮 */}
          <div className="flex items-center space-x-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onLike?.(hotspot.id, !hotspot.liked)
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                hotspot.liked
                  ? 'text-rose-500 bg-rose-50'
                  : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
              }`}
              title={hotspot.liked ? '已点赞' : '点赞'}
            >
              <svg className={`w-4 h-4 ${hotspot.liked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSave?.(hotspot.id, !hotspot.isSaved)
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                hotspot.isSaved
                  ? 'text-accent-600 bg-accent-50'
                  : 'text-slate-400 hover:text-accent-600 hover:bg-accent-50'
              }`}
              title={hotspot.isSaved ? '已保存' : '保存'}
            >
              <svg className={`w-4 h-4 ${hotspot.isSaved ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 19V5z" />
              </svg>
            </button>
            <a
              href={hotspot.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-accent-600 hover:bg-accent-50 transition-colors opacity-0 group-hover:opacity-100"
              title="打开源链接"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
