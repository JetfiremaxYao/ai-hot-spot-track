import { useState, useEffect, useRef } from 'react'
import { hotspotService } from '../services/api.js'
import { Hotspot } from '../types/index.js'

interface HotspotsFilter {
  keyword?: string
  source?: string
  sortBy?: string
  isRead?: boolean
  isSaved?: boolean
}

export function useHotspots(filter: HotspotsFilter = {}) {
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)

  const pageSize = 20
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const prevFilterRef = useRef<string>('')

  const fetchHotspots = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await hotspotService.getList({
        ...filter,
        offset,
        limit: pageSize
      })
      setHotspots(result.hotspots)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取热点失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 防抖处理，避免频繁触发
    const filterStr = JSON.stringify({ ...filter, offset })
    
    if (filterStr === prevFilterRef.current) {
      return
    }
    
    prevFilterRef.current = filterStr

    // 清除之前的定时器
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // 如果只改变了 keyword 或 sortBy，重置到第1页
    if (offset > 0 && (filter.keyword !== undefined || filter.sortBy !== undefined)) {
      setOffset(0)
      return
    }

    // 延迟 300ms 后执行，避免用户快速输入时频繁请求
    debounceTimer.current = setTimeout(() => {
      fetchHotspots()
    }, 300)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [filter, offset])

  const nextPage = () => {
    if (offset + pageSize < total) {
      setOffset(offset + pageSize)
    }
  }

  const prevPage = () => {
    if (offset > 0) {
      setOffset(offset - pageSize)
    }
  }

  const resetPage = () => {
    setOffset(0)
  }

  return {
    hotspots,
    total,
    loading,
    error,
    offset,
    pageSize,
    currentPage: Math.floor(offset / pageSize) + 1,
    totalPages: Math.ceil(total / pageSize),
    nextPage,
    prevPage,
    resetPage,
    refetch: fetchHotspots
  }
}
