interface PaginationProps {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}

export function Pagination({ page, totalPages, onPrev, onNext }: PaginationProps) {
  return (
    <section className="pagination">
      <button className="btn" onClick={onPrev} disabled={page <= 1}>Previous</button>
      <span className="page-info">Page {page} of {totalPages}</span>
      <button className="btn" onClick={onNext} disabled={page >= totalPages}>Next</button>
    </section>
  )
}
