import { useState } from 'react'

interface AIProviderConfig {
  provider: 'google' | 'openrouter' | 'auto'
  googleApiKey?: string
  openrouterApiKey?: string
}

export default function AIProviderSettings() {
  const [config, setConfig] = useState<AIProviderConfig>({
    provider: 'auto',
    googleApiKey: localStorage.getItem('google_ai_key') || '',
    openrouterApiKey: localStorage.getItem('openrouter_key') || ''
  })
  const [showMore, setShowMore] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // 保存到本地存储
    if (config.googleApiKey) {
      localStorage.setItem('google_ai_key', config.googleApiKey)
    }
    if (config.openrouterApiKey) {
      localStorage.setItem('openrouter_key', config.openrouterApiKey)
    }

    // 保存到后端
    fetch('/api/config/ai-provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    }).catch(err => console.error('保存配置失败:', err))

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">AI 分析引擎配置</h3>
          <p className="text-sm text-slate-500 mt-0.5">选择用于热点分析的 AI 服务</p>
        </div>
        <button
          onClick={() => setShowMore(!showMore)}
          className="text-sm text-accent-600 hover:text-accent-700 font-medium"
        >
          {showMore ? '收起' : '展开'}
        </button>
      </div>

      {showMore && (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">AI 提供商</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="radio" name="provider" value="auto" checked={config.provider === 'auto'} onChange={() => setConfig({ ...config, provider: 'auto' })} className="accent-accent-500" />
                <span className="text-sm text-slate-700">自动 (优先 Google AI，次选 OpenRouter)</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="radio" name="provider" value="google" checked={config.provider === 'google'} onChange={() => setConfig({ ...config, provider: 'google' })} className="accent-accent-500" />
                <span className="text-sm text-slate-700">Google AI (Gemini 2.0 Flash) — 推荐</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="radio" name="provider" value="openrouter" checked={config.provider === 'openrouter'} onChange={() => setConfig({ ...config, provider: 'openrouter' })} className="accent-accent-500" />
                <span className="text-sm text-slate-700">OpenRouter (Mistral 7B)</span>
              </label>
            </div>
          </div>

          {(config.provider === 'auto' || config.provider === 'google') && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Google AI API Key</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={config.googleApiKey || ''}
                onChange={(e) => setConfig({ ...config, googleApiKey: e.target.value })}
                className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:outline-none transition-all"
              />
              <p className="text-xs text-slate-400 mt-1">获取: https://makersuite.google.com → API Keys</p>
            </div>
          )}

          {(config.provider === 'auto' || config.provider === 'openrouter') && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">OpenRouter API Key</label>
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={config.openrouterApiKey || ''}
                onChange={(e) => setConfig({ ...config, openrouterApiKey: e.target.value })}
                className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:outline-none transition-all"
              />
              <p className="text-xs text-slate-400 mt-1">获取: https://openrouter.ai → API Keys</p>
            </div>
          )}

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-600">说明:</span><br />
              · Google AI (Gemini 2.0): 速度快、免费额度大、推荐使用<br />
              · OpenRouter: 支持多个模型、成本低<br />
              · 两个都配置时，自动优先使用 Google AI<br />
              · 都不配置时，使用本地降级分析
            </p>
          </div>

          <button
            onClick={handleSave}
            className="w-full rounded-lg bg-gradient-accent hover:opacity-90 px-4 py-2 text-sm font-medium text-white transition-all"
          >
            {saved ? '✅ 保存成功' : '保存配置'}
          </button>
        </div>
      )}

      {!showMore && (
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-slow"></div>
          <span className="text-slate-500">
            当前使用: {config.provider === 'google' ? 'Google AI' : config.provider === 'openrouter' ? 'OpenRouter' : '自动'}
          </span>
        </div>
      )}
    </div>
  )
}
