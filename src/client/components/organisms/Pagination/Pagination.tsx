import { Button } from '../../atoms/Button'
import { PageContainer } from '../../atoms/PageContainer'
import type { PaginationProps } from './types'

export function Pagination({ page, totalPages, onPrev, onNext }: PaginationProps) {
  return (
    <PageContainer className="pt-8 pb-12 sm:pt-10 sm:pb-16 flex justify-center items-center gap-6">
      <Button onClick={onPrev} disabled={page <= 1}>Previous</Button>
      <span className="text-[0.85rem] text-text-secondary">Page {page} of {totalPages}</span>
      <Button onClick={onNext} disabled={page >= totalPages}>Next</Button>
    </PageContainer>
  )
}
