import clsx from 'clsx'
import type { EmptyStateProps } from './types'

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div className={clsx('py-16 text-center', className)}>
      <h3 className="text-2xl font-medium tracking-tight mb-2 text-text-primary">{title}</h3>
      <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">{description}</p>
    </div>
  )
}
