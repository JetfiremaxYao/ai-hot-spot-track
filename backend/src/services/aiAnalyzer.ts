import axios from 'axios'
import { AnalysisResult } from '../types/index.js'

class AIAnalyzerService {
  private provider: 'openrouter' | 'fallback' = 'fallback'
  private openrouterApiKey: string = ''
  private model: string = 'deepseek/deepseek-v3.2'

  constructor() {
    this.openrouterApiKey = process.env.OPENROUTER_API_KEY || ''

    if (this.openrouterApiKey) {
      this.provider = 'openrouter'
      console.log(`✅ [AIAnalyzer] 使用 OpenRouter (${this.model}) 进行真伪识别和相关性分析`)
    } else {
      this.provider = 'fallback'
      console.log('⚠️ [AIAnalyzer] 使用本地降级分析 (未配置 OPENROUTER_API_KEY)')
    }
  }

  /**
   * 分析热点内容 — 真假识别 + 相关性分析
   */
  async analyzeHotspot(
    title: string,
    content: string,
    keywords: string[]
  ): Promise<AnalysisResult> {
    if (this.provider === 'openrouter') {
      return this.analyzeWithOpenRouter(title, content, keywords)
    } else {
      return this.fallbackAnalysis(title, content, keywords)
    }
  }

  /**
   * 使用 OpenRouter + DeepSeek V3.2 分析
   */
  private async analyzeWithOpenRouter(
    title: string,
    content: string,
    keywords: string[]
  ): Promise<AnalysisResult> {
    try {
      const keywordStr = keywords.join(', ')

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `你是一个热点信息分析专家，专注于真假识别和相关性分析。分析给定的内容，返回JSON格式的结果。

你需要评估以下内容与关键词 "${keywordStr}" 的相关性、热度和真实性。
重点任务：识别可能的虚假信息、标题党、AI生成的低质量内容。

请返回以下JSON格式（仅输出JSON，不要有额外的文本）：
{
  "relevanceScore": 0-10,
  "hotnessScore": 0-10,
  "credibilityScore": 0-10,
  "summary": "100-200字的摘要"
}`
            },
            {
              role: 'user',
              content: `标题: ${title}\n\n内容: ${content.substring(0, 1000)}`
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openrouterApiKey}`,
            'HTTP-Referer': 'https://ai-hot-spot.local',
            'X-Title': 'AI Hot Spot'
          },
          timeout: 15000
        }
      )

      const responseText = response.data?.choices?.[0]?.message?.content || ''
      
      // 解析JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.warn('⚠️ [OpenRouter] 无法解析响应')
        return this.fallbackAnalysis(title, content, keywords)
      }

      const parsed = JSON.parse(jsonMatch[0])

      return {
        relevanceScore: Math.min(10, Math.max(0, parsed.relevanceScore || 5)),
        hotnessScore: Math.min(10, Math.max(0, parsed.hotnessScore || 5)),
        credibilityScore: Math.min(10, Math.max(0, parsed.credibilityScore || 7)),
        summary: (parsed.summary || content.substring(0, 200)).substring(0, 500)
      }
    } catch (error: any) {
      console.error('❌ [OpenRouter] 分析错误:', error.message)
      return this.fallbackAnalysis(title, content, keywords)
    }
  }

  /**
   * 降级方案：不使用API时的本地分析
   */
  private fallbackAnalysis(
    title: string,
    content: string,
    keywords: string[]
  ): AnalysisResult {
    // 简单的关键词匹配
    let relevanceScore = 5
    keywords.forEach(kw => {
      const regex = new RegExp(kw, 'gi')
      const matches = (title + content).match(regex) || []
      if (matches.length > 0) {
        relevanceScore = Math.min(10, relevanceScore + matches.length)
      }
    })

    // 基于标题长度和内容估算热度
    let hotnessScore = 5
    if (title.length > 50) hotnessScore += 1
    if (content.length > 500) hotnessScore += 1
    if (content.includes('breaking') || content.includes('新')) hotnessScore += 2

    // 基于源估算真实性
    const credibilityScore = 7 // 默认中等可信度

    return {
      relevanceScore: Math.min(10, Math.max(0, relevanceScore)),
      hotnessScore: Math.min(10, Math.max(0, hotnessScore)),
      credibilityScore: credibilityScore,
      summary: content.substring(0, 200) || title
    }
  }
}

export default new AIAnalyzerService()
