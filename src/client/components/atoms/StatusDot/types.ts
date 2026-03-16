export type StatusDotVariant = 'ok' | 'error' | 'busy' | 'unknown'

export interface StatusDotProps {
  status: StatusDotVariant
  title?: string
  className?: string
}
