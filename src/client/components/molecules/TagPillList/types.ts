import type { TagColor } from '../../../types/tag'

export interface TagPillItem {
  tag: string
  color: TagColor
}

export interface TagPillListProps {
  tags: TagPillItem[]
  className?: string
}
