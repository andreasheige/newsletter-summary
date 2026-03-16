import type { StatusResponse } from '../../../../shared/types'

export interface HeaderProps {
  status: StatusResponse | null
  statusError: boolean
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onReload: () => void
}
