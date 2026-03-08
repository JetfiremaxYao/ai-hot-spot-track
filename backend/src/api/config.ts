import { Router, Request, Response } from 'express'
import sourcePolicyService from '../services/sourcePolicy.js'
import emailNotifier from '../services/emailNotifier.js'

const router = Router()

router.get('/source-policy', async (_req: Request, res: Response) => {
  try {
    const policy = await sourcePolicyService.getPolicy(true)
    res.json({
      success: true,
      data: policy
    })
  } catch (error) {
    console.error('获取采集策略失败:', error)
    res.status(500).json({
      success: false,
      error: '获取采集策略失败'
    })
  }
})

router.put('/source-policy', async (req: Request, res: Response) => {
  try {
    const policy = await sourcePolicyService.updatePolicy(req.body || {})
    res.json({
      success: true,
      data: policy,
      message: '采集策略已更新'
    })
  } catch (error) {
    console.error('更新采集策略失败:', error)
    res.status(500).json({
      success: false,
      error: '更新采集策略失败'
    })
  }
})

router.post('/source-policy/reset', async (_req: Request, res: Response) => {
  try {
    const policy = await sourcePolicyService.updatePolicy(sourcePolicyService.getDefaultPolicy())
    res.json({
      success: true,
      data: policy,
      message: '采集策略已重置为默认值'
    })
  } catch (error) {
    console.error('重置采集策略失败:', error)
    res.status(500).json({
      success: false,
      error: '重置采集策略失败'
    })
  }
})

router.post('/email/test', async (req: Request, res: Response) => {
  try {
    const policy = await sourcePolicyService.getPolicy()
    const rawProfiles = Array.isArray(req.body?.smtpProfiles)
      ? req.body.smtpProfiles
      : policy.notification.smtpProfiles

    const smtpProfiles = rawProfiles
      .map((item: any) => ({
        recipientEmail: typeof item?.recipientEmail === 'string' ? item.recipientEmail.trim().toLowerCase() : '',
        smtpHost: typeof item?.smtpHost === 'string' ? item.smtpHost.trim() : '',
        smtpPort: Number(item?.smtpPort || 587),
        smtpUser: typeof item?.smtpUser === 'string' ? item.smtpUser.trim() : '',
        smtpPass: typeof item?.smtpPass === 'string' ? item.smtpPass.trim() : '',
        smtpFrom: typeof item?.smtpFrom === 'string' ? item.smtpFrom.trim() : '',
        enabled: item?.enabled !== false
      }))
      .filter((item: any) => item.recipientEmail && item.smtpHost && item.smtpUser && item.smtpPass)

    if (smtpProfiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请先填写至少一组有效的 邮箱+SMTP 配置'
      })
    }

    const successCount = await emailNotifier.sendTestEmail(smtpProfiles)

    res.json({
      success: true,
      message: `测试邮件发送成功 ${successCount}/${smtpProfiles.length}`
    })
  } catch (error: any) {
    console.error('发送测试邮件失败:', error)
    res.status(500).json({
      success: false,
      error: error?.message || '发送测试邮件失败'
    })
  }
})

export default router
