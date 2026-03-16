import clsx from 'clsx'
import type { ExternalLinkProps } from './types'

export function ExternalLink({ href, children, className }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        'text-text-primary no-underline font-medium border-b border-border hover:border-text-primary transition-colors',
        className,
      )}
    >
      {children}
    </a>
  )
}
