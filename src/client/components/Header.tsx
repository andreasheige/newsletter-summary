import { useState, useEffect, useRef } from 'react'
import { triggerCheckNow, triggerRefetch, triggerResummarize, fetchJobStatus } from '../api'
import type { StatusResponse } from '../../shared/types'

interface HeaderProps {
  status: StatusResponse | null
  statusError: boolean
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onReload: () => void
}

export function Header({ status, statusError, theme, onToggleTheme, onReload }: HeaderProps) {
  const [jobType, setJobType] = useState('')
  const [jobRunning, setJobRunning] = useState(false)
  const [doneLabel, setDoneLabel] = useState('')
  const [doneType, setDoneType] = useState<'done' | 'error' | ''>('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Poll job status — picks up running jobs even after page refresh
  useEffect(() => {
    const poll = async () => {
      try {
        const job = await fetchJobStatus()
        if (job.running) {
          setJobRunning(true)
          setJobType(job.type)
          setDoneLabel('')
          setDoneType('')
        } else if (jobRunning) {
          // Job just finished
          setJobRunning(false)
          if (job.error) {
            setDoneType('error')
            setDoneLabel('Error')
          } else {
            setDoneType('done')
            setDoneLabel(job.total ? `${job.progress}/${job.total}` : `+${job.progress}`)
          }
          onReload()
          setTimeout(() => { setDoneLabel(''); setDoneType(''); setJobType('') }, 2500)
        }
      } catch { /* server unreachable */ }
    }

    poll()
    pollRef.current = setInterval(poll, 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [jobRunning]) // eslint-disable-line react-hooks/exhaustive-deps

  const startJob = async (type: string, fn: () => Promise<unknown>) => {
    setJobType(type)
    setJobRunning(true)
    setDoneLabel('')
    setDoneType('')
    try { await fn() } catch { /* polling handles result */ }
  }

  const btnState = (type: string) => {
    if (jobRunning && jobType === type) return 'loading'
    if (!jobRunning && doneType && jobType === type) return doneType
    return 'idle'
  }

  const btnLabel = (type: string, defaultLabel: string) => {
    if (!jobRunning && doneLabel && jobType === type) return doneLabel
    return defaultLabel
  }

  const anyBusy = jobRunning

  const btnClass = (state: string) =>
    `btn ${state === 'loading' ? 'loading-btn' : state === 'done' ? 'btn-done' : state === 'error' ? 'btn-error' : ''}`

  const statusClass = anyBusy
    ? 'working'
    : statusError ? 'error' : status ? 'ok' : ''

  const statusTitle = anyBusy
    ? `Running: ${jobType}...`
    : statusError
      ? 'Cannot reach server'
      : status
        ? `${status.newsletters} newsletters | Model: ${status.ollamaModel}`
        : 'Checking status...'

  return (
    <header className={anyBusy ? 'header-working' : ''}>
      <div className="header-inner">
        <h1 className="logo">Newsletter<span>Summary</span></h1>
        <div className="header-actions">
          <button
            className="btn theme-toggle"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <span className="btn-wrap" data-tooltip={anyBusy && jobType !== 'resummarize' ? 'Please wait — another action is in progress' : undefined}>
            <button
              className={btnClass(btnState('resummarize'))}
              onClick={() => startJob('resummarize', triggerResummarize)}
              disabled={anyBusy}
            >
              {btnLabel('resummarize', 'Resummarize')}
            </button>
          </span>
          <span className="btn-wrap" data-tooltip={anyBusy && jobType !== 'refetch' ? 'Please wait — another action is in progress' : undefined}>
            <button
              className={btnClass(btnState('refetch'))}
              onClick={() => startJob('refetch', triggerRefetch)}
              disabled={anyBusy}
            >
              {btnLabel('refetch', 'Refetch')}
            </button>
          </span>
          <span className="btn-wrap" data-tooltip={anyBusy && jobType !== 'check' ? 'Please wait — another action is in progress' : undefined}>
            <button
              className={btnClass(btnState('check'))}
              onClick={() => startJob('check', triggerCheckNow)}
              disabled={anyBusy}
            >
              {btnLabel('check', 'Check Now')}
            </button>
          </span>
          <div className={`status-dot ${statusClass}`} title={statusTitle} />
        </div>
      </div>
    </header>
  )
}
