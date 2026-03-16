import { Button } from '../../atoms/Button'
import type { ActionButtonProps } from './types'

export function ActionButton({ label, state, disabled, tooltip, onClick, className }: ActionButtonProps) {
  return (
    <span className="relative inline-block" data-tooltip={tooltip}>
      <Button
        state={state}
        onClick={onClick}
        disabled={disabled}
        className={className}
      >
        {label}
      </Button>
    </span>
  )
}
