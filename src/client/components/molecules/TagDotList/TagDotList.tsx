import clsx from 'clsx'
import { TagDot } from '../../atoms/TagDot'
import type { TagDotListProps } from './types'

export function TagDotList({ tags, size = 'xs', tooltipRight, onClick, className }: TagDotListProps) {
  if (tags.length === 0) return null
  return (
    <div className={clsx('flex gap-[5px] items-center', className)}>
      {tags.map((t) => (
        <TagDot
          key={t.tag}
          tag={t.tag}
          color={t.color}
          size={size}
          tooltipRight={tooltipRight}
          onClick={onClick ? () => onClick(t.tag) : undefined}
        />
      ))}
    </div>
  )
}
