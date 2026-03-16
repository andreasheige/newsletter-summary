import type { ButtonState } from '../atoms/Button'

export interface ActionButtonProps {
  label: string
  state: ButtonState
  disabled?: boolean
  tooltip?: string
  onClick: () => void
  className?: string
}
