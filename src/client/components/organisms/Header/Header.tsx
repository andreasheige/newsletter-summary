import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { Button } from '../../atoms/Button'
import { StatusDot } from '../../atoms/StatusDot'
import { ActionButton } from '../../molecules/ActionButton'
import { triggerCheckNow, triggerRefetch, triggerResummarize, fetchJobStatus } from '../../../api'
import type { HeaderProps } from './types'

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

  const getBtnState = (type: string): 'idle' | 'loading' | 'done' | 'error' => {
    if (jobRunning && jobType === type) return 'loading'
    if (!jobRunning && doneType && jobType === type) return doneType
    return 'idle'
  }

  const btnLabel = (type: string, defaultLabel: string) => {
    if (!jobRunning && doneLabel && jobType === type) return doneLabel
    return defaultLabel
  }

  const anyBusy = jobRunning
  const busyTooltip = 'Please wait — another action is in progress'

  const statusVariant = anyBusy ? 'busy' as const
    : statusError ? 'error' as const
    : status ? 'ok' as const
    : 'unknown' as const

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
          <Button
            variant="primary"
            size="sm"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="text-lg"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </Button>
          <ActionButton
            label={btnLabel('resummarize', 'Resummarize')}
            state={getBtnState('resummarize')}
            onClick={() => startJob('resummarize', triggerResummarize)}
            disabled={anyBusy}
            tooltip={anyBusy && jobType !== 'resummarize' ? busyTooltip : undefined}
          />
          <ActionButton
            label={btnLabel('refetch', 'Refetch')}
            state={getBtnState('refetch')}
            onClick={() => startJob('refetch', triggerRefetch)}
            disabled={anyBusy}
            tooltip={anyBusy && jobType !== 'refetch' ? busyTooltip : undefined}
          />
          <ActionButton
            label={btnLabel('check', 'Check Now')}
            state={getBtnState('check')}
            onClick={() => startJob('check', triggerCheckNow)}
            disabled={anyBusy}
            tooltip={anyBusy && jobType !== 'check' ? busyTooltip : undefined}
          />
          <StatusDot status={statusVariant} title={statusTitle} />
        </div>
      </div>
    </header>
  )
}
