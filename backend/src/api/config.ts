import { Router, Request, Response } from 'express'
import sourcePolicyService from '../services/sourcePolicy.js'

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

export default router
