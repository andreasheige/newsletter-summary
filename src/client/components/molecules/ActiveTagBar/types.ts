import type { TagColor } from '../../../types/tag'

export interface ActiveTag {
  tag: string
  color: TagColor
}

export interface ActiveTagBarProps {
  tags: ActiveTag[]
  onTagToggle: (tag: string) => void
  onClearTags: () => void
  className?: string
}
