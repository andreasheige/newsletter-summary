import clsx from 'clsx'
import type { AccordionToggleProps } from './types'

export function AccordionToggle({ open, className }: AccordionToggleProps) {
  return (
    <span className={clsx(
      'text-2xl font-light leading-none transition-transform shrink-0',
      open && 'rotate-45',
      className,
    )}>
      +
    </span>
  )
}
