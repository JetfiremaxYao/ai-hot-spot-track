import nodemailer from 'nodemailer'
import sourcePolicyService from './sourcePolicy.js'
import { SourcePolicy } from '../types/index.js'

interface EmailHotspotPayload {
  title: string
  summary: string
  source: string
  sourceUrl: string
  hotnessScore: number
  relevanceScore: number
  credibilityScore: number
  publishedAt: Date | string
}

class EmailNotifierService {
  private createTransporter(profile: SourcePolicy['notification']['smtpProfiles'][number]): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: profile.smtpHost,
      port: profile.smtpPort,
      secure: profile.smtpPort === 465,
      auth: {
        user: profile.smtpUser,
        pass: profile.smtpPass
      }
    })
  }

  private buildHtml(payload: EmailHotspotPayload): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.55; color: #1f2937;">
        <h2 style="margin: 0 0 12px;">超高热点提醒</h2>
        <p style="margin: 0 0 10px;"><strong>标题：</strong>${payload.title}</p>
        <p style="margin: 0 0 10px;"><strong>摘要：</strong>${payload.summary || '（无）'}</p>
        <p style="margin: 0 0 8px;"><strong>来源：</strong>${payload.source}</p>
        <p style="margin: 0 0 8px;"><strong>热度：</strong>${payload.hotnessScore.toFixed(1)} / 10</p>
        <p style="margin: 0 0 8px;"><strong>相关性：</strong>${payload.relevanceScore.toFixed(1)} / 10</p>
        <p style="margin: 0 0 8px;"><strong>可信度：</strong>${payload.credibilityScore.toFixed(1)} / 10</p>
        <p style="margin: 0 0 8px;"><strong>发布时间：</strong>${new Date(payload.publishedAt).toLocaleString('zh-CN')}</p>
        <p style="margin: 12px 0 0;"><a href="${payload.sourceUrl}" target="_blank" rel="noopener noreferrer">查看原文</a></p>
      </div>
    `
  }

  async notifyUltraHotspot(payload: EmailHotspotPayload): Promise<void> {
    const policy = await sourcePolicyService.getPolicy()
    const { enableEmailPush, ultraHotThreshold, smtpProfiles } = policy.notification

    if (!enableEmailPush || smtpProfiles.length === 0) {
      return
    }

    if (payload.hotnessScore < ultraHotThreshold) {
      return
    }

    const activeProfiles = smtpProfiles.filter((profile) => profile.enabled)
    if (activeProfiles.length === 0) {
      return
    }

    const subject = `【AI 热点】超高热点提醒 (热度 ${payload.hotnessScore.toFixed(1)})`

    for (const profile of activeProfiles) {
      try {
        const transporter = this.createTransporter(profile)
        const from = profile.smtpFrom || profile.smtpUser

        await transporter.sendMail({
          from,
          to: profile.recipientEmail,
          subject,
          text: `${payload.title}\n\n热度: ${payload.hotnessScore.toFixed(1)}\n来源: ${payload.source}\n链接: ${payload.sourceUrl}\n\n摘要:\n${payload.summary || '（无）'}`,
          html: this.buildHtml(payload)
        })
      } catch (error: any) {
        console.error(`[EmailNotifier] 发送超高热点邮件失败: ${profile.recipientEmail}`, error?.message || error)
      }
    }

    console.log(`[EmailNotifier] 已尝试发送超高热点邮件，目标邮箱数量: ${activeProfiles.length}`)
  }

  async sendTestEmail(profiles: SourcePolicy['notification']['smtpProfiles']): Promise<number> {
    const activeProfiles = profiles.filter((profile) => profile.enabled)
    if (activeProfiles.length === 0) {
      throw new Error('请先添加至少一组启用状态的 邮箱+SMTP 配置')
    }

    let successCount = 0

    for (const profile of activeProfiles) {
      try {
        const transporter = this.createTransporter(profile)
        const from = profile.smtpFrom || profile.smtpUser

        await transporter.sendMail({
          from,
          to: profile.recipientEmail,
          subject: '【AI 热点】测试邮件',
          text: '这是一封测试邮件。若你收到此邮件，说明该邮箱对应的 SMTP 配置可用。',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #1f2937;">
              <h3 style="margin: 0 0 10px;">测试邮件发送成功</h3>
              <p style="margin: 0;">这是一封测试邮件。若你收到此邮件，说明该邮箱对应的 SMTP 配置可用。</p>
            </div>
          `
        })

        successCount += 1
      } catch (error: any) {
        console.error(`[EmailNotifier] 测试邮件发送失败: ${profile.recipientEmail}`, error?.message || error)
      }
    }

    if (successCount === 0) {
      throw new Error('所有测试邮件均发送失败，请检查 SMTP 参数或授权码')
    }

    return successCount
  }
}

export default new EmailNotifierService()
