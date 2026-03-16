import clsx from 'clsx'
import type { TagPillProps } from './types'

export function TagPill({ tag, color, active, onClick, className }: TagPillProps) {
  return (
    <span
      className={clsx(
        'text-xs px-2.5 py-1 border rounded-full tracking-wide lowercase',
        onClick && 'cursor-pointer',
        className,
      )}
      style={active !== false
        ? { background: color.bg, borderColor: color.border, color: color.dot }
        : undefined
      }
      onClick={onClick}
    >
      {tag}
    </span>
  )
}
