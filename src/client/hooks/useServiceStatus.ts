import { useState, useEffect, useCallback } from 'react'
import { fetchServiceStatus } from '../api'
import type { ServiceStatusResponse } from '../../shared/types'

export function useServiceStatus() {
  const [data, setData] = useState<ServiceStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchServiceStatus()
      setData(result)
    } catch (err) {
      console.error('Failed to load service status', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [load])

  return { data, loading }
}
