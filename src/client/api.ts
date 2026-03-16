import type { PaginatedResponse, StatusResponse, ActionResponse } from '../shared/types'

export async function fetchNewsletters(page: number, limit: number, sender?: string): Promise<PaginatedResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (sender) params.set('sender', sender)
  const res = await fetch(`/api/newsletters?${params}`)
  return res.json()
}

export async function fetchSenders(): Promise<string[]> {
  const res = await fetch('/api/senders')
  const data = await res.json()
  return data.senders
}

export async function fetchTags(): Promise<string[]> {
  const res = await fetch('/api/tags')
  const data = await res.json()
  return data.tags
}

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch('/api/status')
  return res.json()
}

export async function triggerCheckNow(): Promise<ActionResponse> {
  const res = await fetch('/api/check-now', { method: 'POST' })
  return res.json()
}

export async function triggerRefetch(): Promise<ActionResponse> {
  const res = await fetch('/api/refetch', { method: 'POST' })
  return res.json()
}

export async function triggerRetryFailed(): Promise<ActionResponse> {
  const res = await fetch('/api/retry-failed', { method: 'POST' })
  return res.json()
}

export async function triggerResummarize(): Promise<ActionResponse> {
  const res = await fetch('/api/resummarize', { method: 'POST' })
  return res.json()
}

export interface JobStatus {
  running: boolean
  type: string
  progress: number
  total: number
  error: string
  startedAt: number
}

export async function fetchJobStatus(): Promise<JobStatus> {
  const res = await fetch('/api/job')
  return res.json()
}
