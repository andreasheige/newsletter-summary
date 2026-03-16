import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchJobStatus } from '../api.js'
import type { JobType, ButtonState } from '../types/job.js'

interface UseJobPollerOptions {
  /** Called when a running job finishes (success or error). */
  onComplete?: () => void
  /** Polling interval in ms. Default 2000. */
  interval?: number
}

interface UseJobPollerReturn {
  jobType: JobType | ''
  jobRunning: boolean
  doneLabel: string
  doneType: 'done' | 'error' | ''
  startJob: (type: JobType, fn: () => Promise<unknown>) => void
  getBtnState: (type: JobType) => ButtonState
  btnLabel: (type: JobType, defaultLabel: string) => string
  anyBusy: boolean
}

export function useJobPoller(options: UseJobPollerOptions = {}): UseJobPollerReturn {
  const { onComplete, interval = 2000 } = options

  const [jobType, setJobType] = useState<JobType | ''>('')
  const [jobRunning, setJobRunning] = useState(false)
  const [doneLabel, setDoneLabel] = useState('')
  const [doneType, setDoneType] = useState<'done' | 'error' | ''>('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const poll = async () => {
      try {
        const job = await fetchJobStatus()
        if (job.running) {
          setJobRunning(true)
          setJobType(job.type as JobType)
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
          onCompleteRef.current?.()
          setTimeout(() => {
            setDoneLabel('')
            setDoneType('')
            setJobType('')
          }, 2500)
        }
      } catch {
        /* server unreachable */
      }
    }

    poll()
    pollRef.current = setInterval(poll, interval)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [jobRunning, interval])

  const startJob = useCallback(async (type: JobType, fn: () => Promise<unknown>) => {
    setJobType(type)
    setJobRunning(true)
    setDoneLabel('')
    setDoneType('')
    try {
      await fn()
    } catch {
      /* polling handles result */
    }
  }, [])

  const getBtnState = useCallback(
    (type: JobType): ButtonState => {
      if (jobRunning && jobType === type) return 'loading'
      if (!jobRunning && doneType && jobType === type) {
        return doneType === 'error' ? 'error' : 'done'
      }
      return 'idle'
    },
    [jobRunning, jobType, doneType],
  )

  const btnLabel = useCallback(
    (type: JobType, defaultLabel: string): string => {
      if (!jobRunning && doneLabel && jobType === type) return doneLabel
      return defaultLabel
    },
    [jobRunning, doneLabel, jobType],
  )

  return {
    jobType,
    jobRunning,
    doneLabel,
    doneType,
    startJob,
    getBtnState,
    btnLabel,
    anyBusy: jobRunning,
  }
}
