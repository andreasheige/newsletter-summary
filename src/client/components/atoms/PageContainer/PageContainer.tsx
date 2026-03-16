import clsx from 'clsx'
import type { PageContainerProps } from './types'

export function PageContainer({ as: Tag = 'section', children, className }: PageContainerProps) {
  return (
    <Tag className={clsx('max-w-[1200px] mx-auto px-4 sm:px-8', className)}>
      {children}
    </Tag>
  )
}
