import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { triggerCheckNow, triggerRefetch, triggerResummarize, fetchJobStatus } from '../api'
import type { StatusResponse } from '../../shared/types'

const btn = 'font-sans text-sm font-normal px-5 py-2 border rounded-full cursor-pointer transition-all tracking-tight disabled:opacity-30 disabled:cursor-not-allowed'

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

  const getBtnState = (type: string) => {
    if (jobRunning && jobType === type) return 'loading'
    if (!jobRunning && doneType && jobType === type) return doneType
    return 'idle'
  }

  const btnLabel = (type: string, defaultLabel: string) => {
    if (!jobRunning && doneLabel && jobType === type) return doneLabel
    return defaultLabel
  }

  const anyBusy = jobRunning

  const actionBtn = (state: string) => clsx(btn,
    state === 'loading' && 'pointer-events-none text-text-secondary border-text-secondary',
    state === 'done' && 'border-success text-success pointer-events-none',
    state === 'error' && 'border-error text-error pointer-events-none',
    state === 'idle' && 'border-text-primary text-text-primary hover:bg-text-primary hover:text-bg',
  )

  const statusTitle = anyBusy
    ? `Running: ${jobType}...`
    : statusError
      ? 'Cannot reach server'
      : status
        ? `${status.newsletters} newsletters | Model: ${status.ollamaModel}`
        : 'Checking status...'

  return (
    <header className={clsx(
      'sticky top-0 z-100 bg-bg border-b border-border transition-colors',
      anyBusy && 'header-working'
    )}>
      <div className="max-w-[1200px] mx-auto px-4 py-4 sm:px-8 sm:py-5 flex justify-between items-center">
        <h1 className="text-xl font-medium tracking-tight text-text-primary">
          Newsletter<span className="font-light text-text-secondary">Summary</span>
        </h1>
        <div className="flex items-center gap-3">
          <button
            className={clsx(btn, 'text-lg px-3 py-1.5 leading-none border-text-primary text-text-primary hover:bg-text-primary hover:text-bg')}
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <span className="relative inline-block" data-tooltip={anyBusy && jobType !== 'resummarize' ? 'Please wait — another action is in progress' : undefined}>
            <button
              className={actionBtn(getBtnState('resummarize'))}
              onClick={() => startJob('resummarize', triggerResummarize)}
              disabled={anyBusy}
            >
              {btnLabel('resummarize', 'Resummarize')}
            </button>
          </span>
          <span className="relative inline-block" data-tooltip={anyBusy && jobType !== 'refetch' ? 'Please wait — another action is in progress' : undefined}>
            <button
              className={actionBtn(getBtnState('refetch'))}
              onClick={() => startJob('refetch', triggerRefetch)}
              disabled={anyBusy}
            >
              {btnLabel('refetch', 'Refetch')}
            </button>
          </span>
          <span className="relative inline-block" data-tooltip={anyBusy && jobType !== 'check' ? 'Please wait — another action is in progress' : undefined}>
            <button
              className={actionBtn(getBtnState('check'))}
              onClick={() => startJob('check', triggerCheckNow)}
              disabled={anyBusy}
            >
              {btnLabel('check', 'Check Now')}
            </button>
          </span>
          <div
            className={clsx(
              'w-2.5 h-2.5 rounded-full transition-colors',
              anyBusy ? 'bg-success animate-dot-pulse' :
              statusError ? 'bg-error' :
              status ? 'bg-success' : 'bg-text-secondary'
            )}
            title={statusTitle}
          />
        </div>
      </div>
    </header>
  )
}
