import { useState, useEffect, useCallback } from 'react'
import { fetchNewsletters } from '../api'
import type { PaginatedResponse } from '../../shared/types'

export function useNewsletters(page: number, limit: number, sender: string) {
  const [data, setData] = useState<PaginatedResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchNewsletters(page, limit, sender || undefined)
      setData(result)
    } catch (err) {
      console.error('Failed to load newsletters', err)
    } finally {
      setLoading(false)
    }
  }, [page, limit, sender])

  useEffect(() => { load() }, [load])

  return { data, loading, reload: load }
}
