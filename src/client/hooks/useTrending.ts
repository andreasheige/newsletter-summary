import { useState, useEffect, useCallback } from 'react'
import { fetchTrending } from '../api'
import type { TrendingResponse } from '../../shared/types'

export function useTrending() {
  const [data, setData] = useState<TrendingResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchTrending()
      setData(result)
    } catch (err) {
      console.error('Failed to load trending', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { data, loading, reload: load }
}
