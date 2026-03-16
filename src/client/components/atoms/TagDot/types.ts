import type { TagColor } from '../../../types/tag'

export type TagDotSize = 'xs' | 'sm'

export interface TagDotProps {
  tag: string
  color: TagColor
  size?: TagDotSize
  tooltipRight?: boolean
  onClick?: () => void
  className?: string
}
