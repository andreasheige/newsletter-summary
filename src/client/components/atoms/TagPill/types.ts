import type { TagColor } from '../../../types/tag'

export interface TagPillProps {
  tag: string
  color: TagColor
  active?: boolean
  onClick?: () => void
  className?: string
}
