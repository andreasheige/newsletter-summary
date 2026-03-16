export interface PaginationProps {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}
