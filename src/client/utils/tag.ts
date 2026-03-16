import type { TagColor } from '../types/tag.js'
import { TAG_COLORS, TAG_COLORS_DARK } from '../constants/tagColors.js'

/**
 * Deterministic hash-based index into the tag color palette.
 */
export function tagColorIndex(tag: string): number {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = ((hash << 5) - hash + tag.charCodeAt(i)) | 0
  return Math.abs(hash) % TAG_COLORS.length
}

/**
 * Pure function that returns a TagColor for the given tag and theme.
 * Unlike the original getTagColor, this does not read from the DOM.
 */
export function getTagColor(tag: string, theme: 'light' | 'dark'): TagColor {
  const palette = theme === 'dark' ? TAG_COLORS_DARK : TAG_COLORS
  return palette[tagColorIndex(tag)]
}
