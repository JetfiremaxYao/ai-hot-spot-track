import { Router, Request, Response } from 'express'
import { prisma } from '../index.js'
import { ApiResponse } from '../types/index.js'

const router = Router()

// GET /api/keywords - 获取所有关键词
router.get('/', async (req: Request, res: Response) => {
  try {
    const keywords = await prisma.keyword.findMany({
      include: {
        _count: {
          select: { hotspots: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const response: ApiResponse<any> = {
      success: true,
      data: keywords.map(kw => ({
        id: kw.id,
        name: kw.name,
        description: kw.description,
        status: kw.status,
        hotspotCount: kw._count.hotspots,
        createdAt: kw.createdAt,
        updatedAt: kw.updatedAt,
        lastCheckedAt: kw.lastCheckedAt
      }))
    }

    res.json(response)
  } catch (error: any) {
    console.error('获取关键词失败:', error)
    res.status(500).json({
      success: false,
      error: '获取关键词失败'
    })
  }
})

// POST /api/keywords - 添加关键词
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '关键词名称不能为空'
      })
    }

    const keyword = await prisma.keyword.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status: 'active'
      }
    })

    res.status(201).json({
      success: true,
      data: keyword,
      message: '关键词添加成功'
    })
  } catch (error: any) {
    console.error('添加关键词失败:', error)

    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: '关键词已存在'
      })
    }

    res.status(500).json({
      success: false,
      error: '添加失败'
    })
  }
})

// PATCH /api/keywords/:id/status - 更新关键词状态
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['active', 'paused'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: '无效的状态值'
      })
    }

    const keyword = await prisma.keyword.update({
      where: { id: parseInt(id) },
      data: { status }
    })

    res.json({
      success: true,
      data: keyword,
      message: `关键词已${status === 'active' ? '激活' : '暂停'}`
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: '关键词不存在'
      })
    }

    res.status(500).json({
      success: false,
      error: '更新失败'
    })
  }
})

// DELETE /api/keywords/:id - 删除关键词
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await prisma.keyword.delete({
      where: { id: parseInt(id) }
    })

    res.json({
      success: true,
      message: '关键词已删除'
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: '关键词不存在'
      })
    }

    res.status(500).json({
      success: false,
      error: '删除失败'
    })
  }
})

export default router
