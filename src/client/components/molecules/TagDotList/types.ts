import type { TagColor } from '../../../types/tag'

export interface TagDotItem {
  tag: string
  color: TagColor
}

export interface TagDotListProps {
  tags: TagDotItem[]
  size?: 'xs' | 'sm'
  tooltipRight?: boolean
  onClick?: (tag: string) => void
  className?: string
}
