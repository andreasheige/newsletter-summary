import clsx from 'clsx'
import { TagPill } from '../../atoms/TagPill'
import type { TagPillListProps } from './types'

export function TagPillList({ tags, className }: TagPillListProps) {
  if (tags.length === 0) return null
  return (
    <div className={clsx('flex gap-2 flex-wrap', className)}>
      {tags.map((t) => (
        <TagPill key={t.tag} tag={t.tag} color={t.color} active />
      ))}
    </div>
  )
}
