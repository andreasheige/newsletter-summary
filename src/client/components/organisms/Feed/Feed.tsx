import { AccordionItem } from '../AccordionItem'
import { EmptyState } from '../../atoms/EmptyState'
import { PageContainer } from '../../atoms/PageContainer'
import type { FeedProps } from './types'

export function Feed({ items, loading }: FeedProps) {
  return (
    <PageContainer className="min-h-[60vh]">
      {loading && <div className="py-16 text-center text-text-secondary text-sm">Loading...</div>}
      {!loading && items.length === 0 && (
        <EmptyState
          title="No newsletters yet"
          description={'Click "Check Now" to fetch newsletters from Mail.app.\nThey\'ll be summarized automatically with Ollama.'}
        />
      )}
      {items.map(item => (
        <AccordionItem key={item.id} item={item} />
      ))}
    </PageContainer>
  )
}
