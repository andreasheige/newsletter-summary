import clsx from 'clsx'
import type { ButtonProps } from './types'

const base = 'font-sans font-normal border rounded-full cursor-pointer transition-all tracking-tight disabled:opacity-30 disabled:cursor-not-allowed'

const sizes: Record<string, string> = {
  sm: 'text-sm px-3 py-1.5 leading-none',
  md: 'text-sm px-5 py-2',
}

const variants: Record<string, string> = {
  primary: 'border-text-primary text-text-primary hover:bg-text-primary hover:text-bg',
  outline: 'border-text-primary text-text-primary hover:bg-text-primary hover:text-bg',
  ghost: 'border-transparent bg-transparent text-text-primary hover:bg-bg-secondary',
}

const states: Record<string, string> = {
  idle: '',
  loading: 'pointer-events-none text-text-secondary border-text-secondary',
  done: 'border-success text-success pointer-events-none',
  error: 'border-error text-error pointer-events-none',
}

export function Button({
  variant = 'primary',
  size = 'md',
  state = 'idle',
  disabled,
  className,
  onClick,
  children,
  title,
}: ButtonProps) {
  return (
    <button
      className={clsx(base, sizes[size], variants[variant], states[state], className)}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  )
}
