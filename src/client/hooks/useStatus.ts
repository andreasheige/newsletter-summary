import { useState, useEffect } from 'react'
import { fetchStatus } from '../api'
import type { StatusResponse } from '../../shared/types'

export function useStatus() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchStatus()
      .then(setStatus)
      .catch(() => setError(true))
  }, [])

  return { status, error }
}
