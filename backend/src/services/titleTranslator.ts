import axios from 'axios'

class TitleTranslatorService {
  private openrouterApiKey: string
  private model: string
  private cache: Map<string, string>

  constructor() {
    this.openrouterApiKey = process.env.OPENROUTER_API_KEY || ''
    this.model = process.env.TITLE_TRANSLATE_MODEL || 'deepseek/deepseek-v3.2'
    this.cache = new Map<string, string>()
  }

  private isLikelyChinese(text: string): boolean {
    return isLikelyChineseText(text)
  }

  private normalizeModelOutput(text: string): string {
    return text
      .replace(/^"|"$/g, '')
      .replace(/^“|”$/g, '')
      .replace(/^'|'$/g, '')
      .trim()
  }

  private formatTitle(originalTitle: string, translatedTitle: string): string {
    return formatTitleWithTranslation(originalTitle, translatedTitle)
  }

  private async translateWithOpenRouter(title: string): Promise<string> {
    if (!this.openrouterApiKey) {
      throw new Error('OpenRouter key is missing')
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: this.model,
        temperature: 0,
        max_tokens: 120,
        messages: [
          {
            role: 'system',
            content: 'Translate the title into concise Simplified Chinese. Return only the translated title text without explanation. If the input is already Chinese, return it unchanged.'
          },
          {
            role: 'user',
            content: title
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${this.openrouterApiKey}`,
          'HTTP-Referer': 'https://ai-hot-spot.local',
          'X-Title': 'AI Hot Spot Title Translator'
        },
        timeout: 10000
      }
    )

    const raw = response.data?.choices?.[0]?.message?.content || ''
    const normalized = this.normalizeModelOutput(raw)

    if (!normalized) {
      throw new Error('Empty translation from OpenRouter')
    }

    return normalized
  }

  private async translateWithGoogleFreeApi(title: string): Promise<string> {
    const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
      params: {
        client: 'gtx',
        sl: 'auto',
        tl: 'zh-CN',
        dt: 't',
        q: title
      },
      timeout: 8000
    })

    const segments = Array.isArray(response.data?.[0]) ? response.data[0] : []
    const translated = segments
      .map((segment: any) => (Array.isArray(segment) ? segment[0] : ''))
      .filter(Boolean)
      .join('')
      .trim()

    if (!translated) {
      throw new Error('Empty translation from Google API')
    }

    return translated
  }

  async translateTitle(title: string): Promise<string> {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return title

    const cached = this.cache.get(trimmedTitle)
    if (cached) return cached

    if (this.isLikelyChinese(trimmedTitle)) {
      this.cache.set(trimmedTitle, trimmedTitle)
      return trimmedTitle
    }

    try {
      const aiTranslated = await this.translateWithOpenRouter(trimmedTitle)
      const formatted = this.formatTitle(trimmedTitle, aiTranslated)
      this.cache.set(trimmedTitle, formatted)
      return formatted
    } catch {
      try {
        const freeApiTranslated = await this.translateWithGoogleFreeApi(trimmedTitle)
        const formatted = this.formatTitle(trimmedTitle, freeApiTranslated)
        this.cache.set(trimmedTitle, formatted)
        return formatted
      } catch {
        this.cache.set(trimmedTitle, trimmedTitle)
        return trimmedTitle
      }
    }
  }
}

export default new TitleTranslatorService()

export function isLikelyChineseText(text: string): boolean {
  if (!text) return false
  const cjkMatches = text.match(/[\u3400-\u9FFF\uF900-\uFAFF]/g) || []
  return cjkMatches.length >= Math.max(2, Math.floor(text.length * 0.2))
}

export function formatTitleWithTranslation(originalTitle: string, translatedTitle: string): string {
  const origin = originalTitle.trim()
  const translated = translatedTitle.trim()

  if (!translated) return origin
  if (translated === origin) return origin

  // 用户要求的展示形态：原标题（翻译标题）
  return `${origin}（${translated}）`
}
