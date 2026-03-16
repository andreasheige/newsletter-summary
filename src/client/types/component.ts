import type { ReactNode } from 'react'

export interface BaseComponentProps {
  className?: string
  children?: ReactNode
}

export type StatusVariant = 'success' | 'error' | 'warning' | 'info'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export type ButtonSize = 'sm' | 'md' | 'lg'

export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left'

export type TagDotSize = 'sm' | 'md' | 'lg'
