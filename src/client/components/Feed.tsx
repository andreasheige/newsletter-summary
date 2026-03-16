import { AccordionItem } from './AccordionItem'
import type { Newsletter } from '../../shared/types'

interface FeedProps {
  items: Newsletter[]
  loading: boolean
}

export function Feed({ items, loading }: FeedProps) {
  return (
    <section className="feed">
      {loading && <div className="loading">Loading...</div>}
      {!loading && items.length === 0 && (
        <div className="empty-state">
          <h3>No newsletters yet</h3>
          <p>Click "Check Now" to fetch newsletters from Mail.app.<br />
          They'll be summarized automatically with Ollama.</p>
        </div>
      )}
      {items.map(item => (
        <AccordionItem key={item.id} item={item} />
      ))}
    </section>
  )
}
