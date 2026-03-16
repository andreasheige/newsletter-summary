import type { ReactNode } from 'react'

export interface PageContainerProps {
  as?: 'section' | 'footer' | 'div' | 'header'
  children: ReactNode
  className?: string
}
