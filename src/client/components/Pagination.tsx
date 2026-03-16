import clsx from 'clsx'

const btnClass = 'font-sans text-sm font-normal px-5 py-2 border border-text-primary bg-transparent text-text-primary rounded-full cursor-pointer transition-all tracking-tight hover:bg-text-primary hover:text-bg disabled:opacity-30 disabled:cursor-not-allowed'

interface PaginationProps {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}

export function Pagination({ page, totalPages, onPrev, onNext }: PaginationProps) {
  return (
    <section className="max-w-[1200px] mx-auto px-4 pt-8 pb-12 sm:px-8 sm:pt-10 sm:pb-16 flex justify-center items-center gap-6">
      <button className={btnClass} onClick={onPrev} disabled={page <= 1}>Previous</button>
      <span className="text-[0.85rem] text-text-secondary">Page {page} of {totalPages}</span>
      <button className={btnClass} onClick={onNext} disabled={page >= totalPages}>Next</button>
    </section>
  )
}
