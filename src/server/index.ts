import 'dotenv/config'
import express from 'express'
import cron from 'node-cron'
import path from 'path'
import { getPage, getPageBySender, getCount, getCountBySender, getSenders, getAllTags } from './db.js'
import { processNewEmails, retryFailed, resummarizeAll, refetchAll } from './worker.js'
import { ensureOllamaRunning, getProviderInfo } from './summarizer.js'
import { getTrending } from './trending.js'
import { getAllServiceStatuses } from './serviceStatus.js'
import type { Newsletter } from '../shared/types.js'

const app = express()
const PORT = process.env.PORT || 3000

// Background job tracker — survives client refresh
interface JobState {
  running: boolean
  type: string
  progress: number
  total: number
  error: string
  startedAt: number
}
const job: JobState = { running: false, type: '', progress: 0, total: 0, error: '', startedAt: 0 }

// In production, serve Vite build output
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(import.meta.dirname, '..', '..', 'dist', 'client')))
}

// API: Get paginated newsletters
app.get('/api/newsletters', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const rawLimit = parseInt(req.query.limit as string)
  const showAll = rawLimit === 0
  const limit = showAll ? 10000 : ([25, 50, 75, 100].includes(rawLimit) ? rawLimit : 25)
  const offset = showAll ? 0 : (page - 1) * limit
  const senderFilter = (req.query.sender as string) || ''

  let items, total: number
  if (senderFilter) {
    items = getPageBySender({ limit, offset, sender: `%${senderFilter}%` })
    total = getCountBySender(`%${senderFilter}%`)
  } else {
    items = getPage({ limit, offset })
    total = getCount()
  }

  const newsletters: Newsletter[] = items.map(item => ({
    id: item.id,
    subject: item.subject,
    sender: item.sender,
    received_at: item.received_at,
    summary: item.summary,
    tags: JSON.parse(item.tags || '[]'),
    links: JSON.parse(item.links || '[]'),
    content: JSON.parse(item.content || '{"sections":[],"links":[]}'),
    created_at: item.created_at,
  }))

  res.json({
    items: newsletters,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  })
})

// API: Get distinct senders
app.get('/api/senders', (_req, res) => {
  res.json({ senders: getSenders() })
})

// API: Get all unique tags
app.get('/api/tags', (_req, res) => {
  res.json({ tags: getAllTags() })
})

// Helper: start a background job (returns immediately, runs in background)
function startJob(type: string, fn: () => Promise<unknown>) {
  if (job.running) return false
  job.running = true
  job.type = type
  job.progress = 0
  job.total = 0
  job.error = ''
  job.startedAt = Date.now()
  fn()
    .catch(err => { job.error = (err as Error).message })
    .finally(() => { job.running = false })
  return true
}

// API: Manually trigger email check
app.post('/api/check-now', (_req, res) => {
  const started = startJob('check', async () => {
    const result = await processNewEmails()
    job.progress = result.processed
  })
  if (started) res.json({ success: true })
  else res.status(409).json({ success: false, error: 'A job is already running' })
})

// API: Retry failed summaries
app.post('/api/retry-failed', (_req, res) => {
  const started = startJob('retry', async () => {
    const result = await retryFailed()
    job.progress = result.retried
  })
  if (started) res.json({ success: true })
  else res.status(409).json({ success: false, error: 'A job is already running' })
})

// API: Refetch — re-process entries missing content/links
app.post('/api/refetch', (_req, res) => {
  const started = startJob('refetch', async () => {
    const result = await refetchAll()
    job.progress = result.updated
    job.total = result.total
  })
  if (started) res.json({ success: true })
  else res.status(409).json({ success: false, error: 'A job is already running' })
})

// API: Resummarize all newsletters
app.post('/api/resummarize', (_req, res) => {
  const started = startJob('resummarize', async () => {
    const result = await resummarizeAll()
    job.progress = result.updated
    job.total = result.total
  })
  if (started) res.json({ success: true })
  else res.status(409).json({ success: false, error: 'A job is already running' })
})

// API: Job status (poll this to track background work)
app.get('/api/job', (_req, res) => {
  res.json(job)
})

// API: Health check
app.get('/api/status', (_req, res) => {
  const count = getCount()
  const { provider, model } = getProviderInfo()
  res.json({
    status: 'running',
    newsletters: count,
    source: 'macOS Mail.app',
    llmProvider: provider,
    llmModel: model,
    ollamaUrl: provider === 'ollama' ? (process.env.OLLAMA_URL || 'http://localhost:11434') : undefined,
    cronSchedule: process.env.CRON_SCHEDULE || '0 */6 * * *',
  })
})

// API: Get trending tech items
app.get('/api/trending', async (_req, res) => {
  try {
    const data = await getTrending()
    res.json(data)
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch trending data' })
  }
})

// API: Get service statuses
app.get('/api/service-status', async (_req, res) => {
  try {
    const data = await getAllServiceStatuses()
    res.json(data)
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch service statuses' })
  }
})

// SPA fallback for production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(import.meta.dirname, '..', '..', 'dist', 'client', 'index.html'))
    }
  })
}

// Schedule background email checks
const schedule = process.env.CRON_SCHEDULE || '0 */6 * * *'
if (cron.validate(schedule)) {
  cron.schedule(schedule, () => {
    console.log(`[Cron] Running scheduled email check...`)
    processNewEmails()
  })
  console.log(`[Cron] Scheduled email checks: ${schedule}`)
} else {
  console.error(`[Cron] Invalid schedule: ${schedule}`)
}

app.listen(PORT, async () => {
  console.log(`Newsletter Summary running at http://localhost:${PORT}`)
  try {
    await ensureOllamaRunning()
    await retryFailed()
  } catch (err) {
    console.error('[Startup] Could not start Ollama:', (err as Error).message)
  }
})
