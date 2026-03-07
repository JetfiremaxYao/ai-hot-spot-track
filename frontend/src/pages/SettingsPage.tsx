import { useEffect, useMemo, useState } from 'react'
import { configService } from '../services/api.js'
import { SourcePolicy } from '../types/index.js'

function listToText(list: string[]): string {
  return list.join('\n')
}

function textToList(text: string): string[] {
  return text
    .split(/\n|,/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

export default function SettingsPage() {
  const [policy, setPolicy] = useState<SourcePolicy | null>(null)
  const [denylistText, setDenylistText] = useState('')
  const [preferlistText, setPreferlistText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadPolicy = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await configService.getSourcePolicy()
      setPolicy(data)
      setDenylistText(listToText(data.domainRules.denylist))
      setPreferlistText(listToText(data.domainRules.preferlist))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载配置失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPolicy()
  }, [])

  const canSave = useMemo(() => policy !== null && !saving, [policy, saving])

  const updatePolicy = <K extends keyof SourcePolicy>(key: K, value: SourcePolicy[K]) => {
    if (!policy) return
    setPolicy({ ...policy, [key]: value })
  }

  const handleSave = async () => {
    if (!policy) return

    try {
      setSaving(true)
      setMessage(null)
      setError(null)

      const nextPolicy: SourcePolicy = {
        ...policy,
        domainRules: {
          denylist: textToList(denylistText),
          preferlist: textToList(preferlistText)
        }
      }

      const saved = await configService.updateSourcePolicy(nextPolicy)
      setPolicy(saved)
      setDenylistText(listToText(saved.domainRules.denylist))
      setPreferlistText(listToText(saved.domainRules.preferlist))
      setMessage('已保存，全站立即生效（重启后仍保留）')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    try {
      setSaving(true)
      setMessage(null)
      setError(null)
      const reset = await configService.resetSourcePolicy()
      setPolicy(reset)
      setDenylistText(listToText(reset.domainRules.denylist))
      setPreferlistText(listToText(reset.domainRules.preferlist))
      setMessage('已恢复默认策略')
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft animate-pulse">
            <div className="h-5 w-48 rounded bg-slate-100"></div>
            <div className="mt-3 h-4 w-72 rounded bg-slate-100"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!policy) {
    return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-600">无法加载设置</div>
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">采集策略设置</h2>
        <p className="mt-1 text-sm text-slate-500">全站统一配置，默认可靠性优先。设置会持久化保存。</p>
      </div>

      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft space-y-4">
        <h3 className="text-base font-semibold text-slate-800">可靠性模式</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              className="accent-accent-500"
              checked={policy.reliabilityMode === 'strict'}
              onChange={() => updatePolicy('reliabilityMode', 'strict')}
            />
            严格（推荐）
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              className="accent-accent-500"
              checked={policy.reliabilityMode === 'balanced'}
              onChange={() => updatePolicy('reliabilityMode', 'balanced')}
            />
            平衡（覆盖更广）
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft space-y-4">
        <h3 className="text-base font-semibold text-slate-800">免费信息源开关</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { key: 'google', label: 'Google News' },
            { key: 'bing', label: 'Bing News' },
            { key: 'duckduckgo', label: 'DuckDuckGo' },
            { key: 'hackernews', label: 'Hacker News' },
            { key: 'twitter', label: 'Twitter/X（默认关闭）' }
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-700">{item.label}</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-accent-500"
                checked={policy.sources[item.key as keyof SourcePolicy['sources']]}
                onChange={(e) => updatePolicy('sources', {
                  ...policy.sources,
                  [item.key]: e.target.checked
                })}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft space-y-4">
        <h3 className="text-base font-semibold text-slate-800">Twitter/X 高门槛过滤</h3>
        <p className="text-sm text-slate-500">仅当开启 Twitter 且环境变量允许时生效。</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { key: 'minLikes', label: '最少点赞' },
            { key: 'minReposts', label: '最少转发' },
            { key: 'minReplies', label: '最少回复' },
            { key: 'minFollowers', label: '作者最少粉丝' }
          ].map((item) => (
            <label key={item.key} className="text-sm text-slate-600">
              <span className="mb-1 block">{item.label}</span>
              <input
                type="number"
                min={0}
                value={policy.twitterThresholds[item.key as keyof SourcePolicy['twitterThresholds']] as number}
                onChange={(e) => updatePolicy('twitterThresholds', {
                  ...policy.twitterThresholds,
                  [item.key]: Number(e.target.value) || 0
                })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:outline-none"
              />
            </label>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            允许抓取回复推文
            <input
              type="checkbox"
              className="h-4 w-4 accent-accent-500"
              checked={policy.twitterThresholds.allowReplies}
              onChange={(e) => updatePolicy('twitterThresholds', {
                ...policy.twitterThresholds,
                allowReplies: e.target.checked
              })}
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            允许抓取引用推文
            <input
              type="checkbox"
              className="h-4 w-4 accent-accent-500"
              checked={policy.twitterThresholds.allowQuotes}
              onChange={(e) => updatePolicy('twitterThresholds', {
                ...policy.twitterThresholds,
                allowQuotes: e.target.checked
              })}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft space-y-4">
        <h3 className="text-base font-semibold text-slate-800">域名规则（每行或逗号分隔）</h3>
        <div className="grid gap-3 lg:grid-cols-2">
          <label className="text-sm text-slate-600">
            <span className="mb-1 block">拒绝名单（命中即丢弃）</span>
            <textarea
              value={denylistText}
              onChange={(e) => setDenylistText(e.target.value)}
              className="h-36 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:outline-none"
            />
          </label>
          <label className="text-sm text-slate-600">
            <span className="mb-1 block">优先名单（排序提升）</span>
            <textarea
              value={preferlistText}
              onChange={(e) => setPreferlistText(e.target.value)}
              className="h-36 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:outline-none"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft space-y-4">
        <h3 className="text-base font-semibold text-slate-800">可选付费接口（默认关闭）</h3>
        <p className="text-sm text-slate-500">这里只保留开关。未配置对应 API Key 时不会生效。</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            SerpAPI
            <input
              type="checkbox"
              className="h-4 w-4 accent-accent-500"
              checked={policy.paidProviders.serpApi}
              onChange={(e) => updatePolicy('paidProviders', {
                ...policy.paidProviders,
                serpApi: e.target.checked
              })}
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Brave Search API
            <input
              type="checkbox"
              className="h-4 w-4 accent-accent-500"
              checked={policy.paidProviders.braveSearch}
              onChange={(e) => updatePolicy('paidProviders', {
                ...policy.paidProviders,
                braveSearch: e.target.checked
              })}
            />
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="rounded-lg bg-gradient-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存全站配置'}
        </button>
        <button
          onClick={handleReset}
          disabled={saving}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          恢复默认配置
        </button>
      </div>
    </div>
  )
}
