import { useState, useEffect } from 'react'
import { fetchSenders } from '../api'

export function useSenders() {
  const [senders, setSenders] = useState<string[]>([])

  useEffect(() => {
    fetchSenders().then(setSenders).catch(() => {})
  }, [])

  return senders
}
