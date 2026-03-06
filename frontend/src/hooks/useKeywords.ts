import { useState, useEffect } from 'react'
import { keywordService } from '../services/api.js'
import { Keyword } from '../types/index.js'

export function useKeywords() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchKeywords = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await keywordService.getAll()
      setKeywords(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取关键词失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeywords()
  }, [])

  const addKeyword = async (name: string, description?: string) => {
    try {
      const newKeyword = await keywordService.create(name, description)
      if (newKeyword) {
        setKeywords([newKeyword, ...keywords])
      }
      return newKeyword
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加关键词失败')
      throw err
    }
  }

  const updateKeywordStatus = async (id: number, status: 'active' | 'paused') => {
    try {
      const updated = await keywordService.updateStatus(id, status)
      if (updated) {
        setKeywords(keywords.map(kw => (kw.id === id ? updated : kw)))
      }
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新状态失败')
      throw err
    }
  }

  const deleteKeyword = async (id: number) => {
    try {
      await keywordService.delete(id)
      setKeywords(keywords.filter((kw): kw is Keyword => kw.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
      throw err
    }
  }

  return {
    keywords,
    loading,
    error,
    addKeyword,
    updateKeywordStatus,
    deleteKeyword,
    refetch: fetchKeywords
  }
}
