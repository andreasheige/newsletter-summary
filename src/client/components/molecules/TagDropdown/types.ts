import type { TagColor } from '../../../types/tag'

export interface TagDropdownItem {
  tag: string
  color: TagColor
}

export interface TagDropdownProps {
  tags: TagDropdownItem[]
  activeTags: string[]
  onTagToggle: (tag: string) => void
  className?: string
}
