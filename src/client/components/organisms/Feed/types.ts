import type { Newsletter } from '../../../../shared/types'

export interface FeedProps {
  items: Newsletter[]
  loading: boolean
}
