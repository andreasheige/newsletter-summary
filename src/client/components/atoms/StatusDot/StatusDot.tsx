import clsx from 'clsx'
import type { StatusDotProps } from './types'

const statusStyles: Record<string, string> = {
  ok: 'bg-success',
  error: 'bg-error',
  busy: 'bg-success animate-dot-pulse',
  unknown: 'bg-text-secondary',
}

export function StatusDot({ status, title, className }: StatusDotProps) {
  return (
    <div
      className={clsx('w-2.5 h-2.5 rounded-full transition-colors', statusStyles[status], className)}
      title={title}
    />
  )
}
