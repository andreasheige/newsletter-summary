import clsx from 'clsx'
import { TagDot } from '../../atoms/TagDot'
import type { ActiveTagBarProps } from './types'

export function ActiveTagBar({ tags, onTagToggle, onClearTags, className }: ActiveTagBarProps) {
  if (tags.length === 0) return null
  return (
    <div className={clsx('flex items-center gap-2.5 pt-3', className)}>
      <div className="flex gap-1.5 items-center flex-wrap">
        {tags.map((t) => (
          <TagDot
            key={t.tag}
            tag={t.tag}
            color={t.color}
            size="sm"
            onClick={() => onTagToggle(t.tag)}
          />
        ))}
      </div>
      <button
        className="font-sans text-lg leading-none text-text-secondary bg-transparent border-none cursor-pointer px-0.5 transition-colors hover:text-text-primary"
        onClick={onClearTags}
        title="Clear tag filters"
      >
        &times;
      </button>
    </div>
  )
}
