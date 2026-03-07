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
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  // 当 filter 变化时重置分页到第 1 页
  useEffect(() => {
    const filterStr = JSON.stringify(filter)
    if (prevFilterRef.current && filterStr !== prevFilterRef.current) {
      setOffset(0)
    }
    prevFilterRef.current = filterStr
  }, [filter])

  // 防抖获取数据
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

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
