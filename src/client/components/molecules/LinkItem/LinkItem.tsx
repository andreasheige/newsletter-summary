import clsx from 'clsx'
import { ExternalLink } from '../../atoms/ExternalLink'
import type { LinkItemProps } from './types'

export function LinkItem({ url, label, description, className }: LinkItemProps) {
  return (
    <li className={clsx('text-sm leading-relaxed', className)}>
      <ExternalLink href={url || '#'}>
        {label || url}
      </ExternalLink>
      {description && (
        <span className="text-text-secondary font-normal"> — {description}</span>
      )}
    </li>
  )
}
