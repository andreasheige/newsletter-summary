import { useState, useEffect } from 'react'
import { fetchTags } from '../api'

export function useTags() {
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    fetchTags().then(setTags).catch(() => {})
  }, [])

  return tags
}
