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

function createEmptySmtpProfile(): SourcePolicy['notification']['smtpProfiles'][number] {
  return {
    recipientEmail: '',
    smtpHost: 'smtp.qq.com',
    smtpPort: 465,
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
    enabled: true
  }
}

export default function SettingsPage() {
  const [policy, setPolicy] = useState<SourcePolicy | null>(null)
  const [denylistText, setDenylistText] = useState('')
  const [preferlistText, setPreferlistText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadPolicy = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await configService.getSourcePolicy()
      const smtpProfiles = data.notification.smtpProfiles.length > 0
        ? data.notification.smtpProfiles
        : [createEmptySmtpProfile()]

      setDenylistText(listToText(data.domainRules.denylist))
      setPreferlistText(listToText(data.domainRules.preferlist))
      setPolicy({
        ...data,
        notification: {
          ...data.notification,
          smtpProfiles
        }
      })
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
        },
        notification: {
          ...policy.notification,
          smtpProfiles: policy.notification.smtpProfiles.map((profile) => ({
            ...profile,
            recipientEmail: profile.recipientEmail.trim().toLowerCase(),
            smtpHost: profile.smtpHost.trim(),
            smtpUser: profile.smtpUser.trim(),
            smtpPass: profile.smtpPass.trim(),
            smtpFrom: (profile.smtpFrom || '').trim()
          }))
        }
      }

      const saved = await configService.updateSourcePolicy(nextPolicy)
      setDenylistText(listToText(saved.domainRules.denylist))
      setPreferlistText(listToText(saved.domainRules.preferlist))
      setPolicy({
        ...saved,
        notification: {
          ...saved.notification,
          smtpProfiles: saved.notification.smtpProfiles.length > 0
            ? saved.notification.smtpProfiles
            : [createEmptySmtpProfile()]
        }
      })
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
      setDenylistText(listToText(reset.domainRules.denylist))
      setPreferlistText(listToText(reset.domainRules.preferlist))
      setPolicy({
        ...reset,
        notification: {
          ...reset.notification,
          smtpProfiles: reset.notification.smtpProfiles.length > 0
            ? reset.notification.smtpProfiles
            : [createEmptySmtpProfile()]
        }
      })
      setMessage('已恢复默认策略')
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置失败')
    } finally {
      setSaving(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!policy) return

    try {
      setTestingEmail(true)
      setMessage(null)
      setError(null)

      await configService.sendTestEmail(policy.notification.smtpProfiles)
      setMessage('测试邮件发送成功，请检查收件箱')
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送测试邮件失败')
    } finally {
      setTestingEmail(false)
    }
  }

  const addSmtpProfile = () => {
    if (!policy) return
    updatePolicy('notification', {
      ...policy.notification,
      smtpProfiles: [...policy.notification.smtpProfiles, createEmptySmtpProfile()]
    })
  }

  const removeSmtpProfile = (index: number) => {
    if (!policy) return
    const next = policy.notification.smtpProfiles.filter((_, idx) => idx !== index)
    updatePolicy('notification', {
      ...policy.notification,
      smtpProfiles: next.length > 0 ? next : [createEmptySmtpProfile()]
    })
  }

  const updateSmtpProfile = <K extends keyof SourcePolicy['notification']['smtpProfiles'][number]>(
    index: number,
    key: K,
    value: SourcePolicy['notification']['smtpProfiles'][number][K]
  ) => {
    if (!policy) return

    const nextProfiles = policy.notification.smtpProfiles.map((profile, idx) =>
      idx === index ? { ...profile, [key]: value } : profile
    )

    updatePolicy('notification', {
      ...policy.notification,
      smtpProfiles: nextProfiles
    })
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

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
          <label className="text-sm text-slate-700">
            <span className="mb-1 block font-medium">内容时效窗口</span>
            <span className="mb-2 block text-xs text-slate-500">仅采集窗口内的内容，默认 24 小时</span>
            <select
              value={policy.qualityFilters.recencyHours}
              onChange={(e) => updatePolicy('qualityFilters', {
                ...policy.qualityFilters,
                recencyHours: Number(e.target.value)
              })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:outline-none"
            >
              <option value={6}>最近 6 小时</option>
              <option value={12}>最近 12 小时</option>
              <option value={24}>最近 24 小时（默认）</option>
              <option value={48}>最近 48 小时</option>
              <option value={72}>最近 72 小时</option>
              <option value={168}>最近 7 天</option>
            </select>
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
        <h3 className="text-base font-semibold text-slate-800">超高热点邮件推送</h3>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          邮件推送需要两个条件同时满足：
          1) 至少添加一组启用状态的 邮箱 + SMTP；
          2) 该邮箱服务方允许 SMTP 并使用正确授权码。
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          QQ 邮箱对齐说明：
          发送邮件服务器 `smtp.qq.com`，SSL 端口 `465`（或 `587`）；
          用户名/帐户为完整 QQ 邮箱地址；密码为 SMTP 授权码（非登录密码）。
          接收邮件服务器 `pop.qq.com:995` 仅用于收信，不影响本系统发信。
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            开启邮件推送
            <input
              type="checkbox"
              className="h-4 w-4 accent-accent-500"
              checked={policy.notification.enableEmailPush}
              onChange={(e) => updatePolicy('notification', {
                ...policy.notification,
                enableEmailPush: e.target.checked
              })}
            />
          </label>

          <label className="text-sm text-slate-600">
            <span className="mb-1 block">超高热点阈值（6-10）</span>
            <input
              type="number"
              min={6}
              max={10}
              step={0.1}
              value={policy.notification.ultraHotThreshold}
              onChange={(e) => updatePolicy('notification', {
                ...policy.notification,
                ultraHotThreshold: Number(e.target.value) || 8
              })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:outline-none"
            />
          </label>
        </div>

        <div className="space-y-3">
          {policy.notification.smtpProfiles.map((profile, index) => (
            <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">邮箱服务器配置 #{index + 1}</p>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs text-slate-600">
                    启用
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-accent-500"
                      checked={profile.enabled}
                      onChange={(e) => updateSmtpProfile(index, 'enabled', e.target.checked)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeSmtpProfile(index)}
                    className="rounded border border-rose-200 bg-white px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    删除
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-xs text-slate-600">
                  电子邮件地址（接收提醒）
                  <input
                    type="email"
                    value={profile.recipientEmail}
                    onChange={(e) => updateSmtpProfile(index, 'recipientEmail', e.target.value)}
                    placeholder="your_mail@qq.com"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:outline-none"
                  />
                </label>

                <label className="text-xs text-slate-600">
                  发送邮件服务器（SMTP Host）
                  <input
                    type="text"
                    value={profile.smtpHost}
                    onChange={(e) => updateSmtpProfile(index, 'smtpHost', e.target.value)}
                    placeholder="smtp.qq.com"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:outline-none"
                  />
                </label>

                <label className="text-xs text-slate-600">
                  发送服务器端口（SMTP Port）
                  <input
                    type="number"
                    min={1}
                    max={65535}
                    value={profile.smtpPort}
                    onChange={(e) => updateSmtpProfile(index, 'smtpPort', Number(e.target.value) || 587)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:outline-none"
                  />
                </label>

                <label className="text-xs text-slate-600">
                  用户名/帐户（SMTP User）
                  <input
                    type="text"
                    value={profile.smtpUser}
                    onChange={(e) => updateSmtpProfile(index, 'smtpUser', e.target.value)}
                    placeholder="sender@qq.com"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:outline-none"
                  />
                </label>

                <label className="text-xs text-slate-600">
                  密码（SMTP 授权码）
                  <input
                    type="password"
                    value={profile.smtpPass}
                    onChange={(e) => updateSmtpProfile(index, 'smtpPass', e.target.value)}
                    placeholder="授权码"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:outline-none"
                  />
                </label>

                <label className="text-xs text-slate-600">
                  发件人地址（SMTP From，可选）
                  <input
                    type="text"
                    value={profile.smtpFrom || ''}
                    onChange={(e) => updateSmtpProfile(index, 'smtpFrom', e.target.value)}
                    placeholder="sender@qq.com"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 focus:outline-none"
                  />
                </label>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addSmtpProfile}
            className="rounded-lg border border-accent-200 bg-accent-50 px-3 py-2 text-sm font-medium text-accent-700 hover:bg-accent-100"
          >
            + 添加邮箱 SMTP
          </button>

          <span className="block text-xs text-slate-500">
            建议添加后先点击“发送测试邮件”逐条验证配置。
          </span>
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
          onClick={handleSendTestEmail}
          disabled={saving || testingEmail}
          className="rounded-lg border border-accent-200 bg-accent-50 px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-100 disabled:opacity-50"
        >
          {testingEmail ? '发送中...' : '发送测试邮件'}
        </button>
        <button
          onClick={handleReset}
          disabled={saving || testingEmail}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          恢复默认配置
        </button>
      </div>
    </div>
  )
}
