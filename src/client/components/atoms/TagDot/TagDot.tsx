import clsx from 'clsx'
import type { TagDotProps } from './types'

const sizes: Record<string, string> = {
  xs: 'w-[7px] h-[7px]',
  sm: 'w-[9px] h-[9px]',
}

export function TagDot({ tag, color, size = 'xs', tooltipRight, onClick, className }: TagDotProps) {
  return (
    <span
      className={clsx(
        'relative rounded-full shrink-0',
        sizes[size],
        onClick && 'cursor-pointer transition-transform hover:scale-[1.4] hover:opacity-70',
        tooltipRight && 'tooltip-right',
        className,
      )}
      style={{ background: color.dot }}
      data-tooltip={tag}
      onClick={onClick}
    />
  )
}
