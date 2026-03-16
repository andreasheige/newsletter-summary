import { AccordionItem } from './AccordionItem'
import type { Newsletter } from '../../shared/types'

interface FeedProps {
  items: Newsletter[]
  loading: boolean
}

export function Feed({ items, loading }: FeedProps) {
  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-8 min-h-[60vh]">
      {loading && <div className="py-16 text-center text-text-secondary text-sm">Loading...</div>}
      {!loading && items.length === 0 && (
        <div className="py-16 text-center">
          <h3 className="text-2xl font-medium tracking-tight mb-2 text-text-primary">No newsletters yet</h3>
          <p className="text-text-secondary text-sm leading-relaxed">
            Click "Check Now" to fetch newsletters from Mail.app.<br />
            They'll be summarized automatically with Ollama.
          </p>
        </div>
      )}
      {items.map(item => (
        <AccordionItem key={item.id} item={item} />
      ))}
    </section>
  )
}
