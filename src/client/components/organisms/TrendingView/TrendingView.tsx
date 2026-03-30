import { useTrending } from '../../../hooks/useTrending'
import type { TrendingItem } from '../../../../shared/types'

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.max(0, now - then)
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const sourceBadge: Record<TrendingItem['source'], { label: string; className: string }> = {
  hackernews: { label: 'HN', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  reddit: { label: 'Reddit', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  lobsters: { label: 'Lobsters', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

export function TrendingView() {
  const { data, loading, reload } = useTrending()

  if (loading && !data) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-12 text-center text-text-secondary">
        Loading trending items...
      </div>
    )
  }

  const items = data ? [...data.items].sort((a, b) => b.score - a.score) : []

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-text-primary">Trending</h2>
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          {data?.fetchedAt && (
            <span>Fetched {relativeTime(data.fetchedAt)}</span>
          )}
          <button
            onClick={reload}
            className="text-text-link hover:underline"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {items.map(item => {
          const badge = sourceBadge[item.source]
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-bg-secondary border border-border"
            >
              <div className="flex flex-col items-center min-w-[3rem] pt-0.5">
                <span className="text-sm font-semibold text-text-primary">{item.score}</span>
                <span className="text-xs text-text-secondary">pts</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded border ${badge.className}`}>
                    {badge.label}
                    {item.source === 'reddit' && item.subreddit && (
                      <span className="ml-1 opacity-75">r/{item.subreddit}</span>
                    )}
                  </span>
                  <span className="text-xs text-text-secondary">{relativeTime(item.createdAt)}</span>
                  <span className="text-xs text-text-secondary">by {item.author}</span>
                </div>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-link hover:underline font-medium text-sm leading-snug"
                >
                  {item.title}
                </a>

                <div className="mt-1">
                  <a
                    href={item.commentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-text-secondary hover:text-text-link"
                  >
                    {item.commentCount} comments
                  </a>
                </div>
              </div>
            </div>
          )
        })}

        {items.length === 0 && !loading && (
          <p className="text-center text-text-secondary py-8">No trending items available.</p>
        )}
      </div>
    </div>
  )
}
