import type { ReactNode, MouseEventHandler } from 'react'

export type ButtonVariant = 'primary' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md'
export type ButtonState = 'idle' | 'loading' | 'done' | 'error'

export interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  state?: ButtonState
  disabled?: boolean
  className?: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  children: ReactNode
  title?: string
}
