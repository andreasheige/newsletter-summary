import type { TrendingItem, TrendingResponse } from '../shared/types.js'

// In-memory cache with 10-minute TTL
let cache: { items: TrendingItem[]; fetchedAt: string; expiresAt: number } | null = null
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

const AI_TECH_KEYWORDS = /\b(ai|llm|gpt|openai|anthropic|claude|gemini|machine\s?learning|deep\s?learning|neural|transformer|diffusion|copilot|chatbot|langchain|rag|fine.?tun|embedding|vector|token|prompt|agent|autonom|rust|go|python|javascript|typescript|programming|software|engineer|developer|devops|kubernetes|docker|linux|api|open.?source|compiler|database|sql|web|frontend|backend|framework|library|git|cloud|deploy|server|security|crypto|blockchain|chip|gpu|cuda|model|train|dataset|benchmark|reasoning|multimodal|vision|speech|nlp|code|coding|hack|startup|tech)\b/i

async function fetchHackerNews(): Promise<TrendingItem[]> {
  try {
    const res = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30')
    if (!res.ok) throw new Error(`HN API returned ${res.status}`)
    const data = await res.json()

    return (data.hits || [])
      .filter((hit: any) => AI_TECH_KEYWORDS.test(hit.title || ''))
      .map((hit: any) => ({
        id: `hn-${hit.objectID}`,
        title: hit.title || '',
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        source: 'hackernews' as const,
        score: hit.points || 0,
        commentCount: hit.num_comments || 0,
        commentUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
        author: hit.author || '',
        createdAt: hit.created_at || new Date().toISOString(),
      }))
  } catch (err) {
    console.error('[Trending] HackerNews fetch failed:', (err as Error).message)
    return []
  }
}

async function fetchReddit(): Promise<TrendingItem[]> {
  try {
    const res = await fetch(
      'https://www.reddit.com/r/artificial+MachineLearning+programming/hot.json?limit=25',
      { headers: { 'User-Agent': 'newsletter-summary/1.0' } }
    )
    if (!res.ok) throw new Error(`Reddit API returned ${res.status}`)
    const data = await res.json()

    return (data.data?.children || [])
      .filter((child: any) => child.kind === 't3' && !child.data.stickied)
      .map((child: any) => {
        const d = child.data
        return {
          id: `reddit-${d.id}`,
          title: d.title || '',
          url: d.url || '',
          source: 'reddit' as const,
          subreddit: d.subreddit || '',
          score: d.score || 0,
          commentCount: d.num_comments || 0,
          commentUrl: `https://www.reddit.com${d.permalink}`,
          author: d.author || '',
          createdAt: new Date((d.created_utc || 0) * 1000).toISOString(),
        }
      })
  } catch (err) {
    console.error('[Trending] Reddit fetch failed:', (err as Error).message)
    return []
  }
}

async function fetchLobsters(): Promise<TrendingItem[]> {
  try {
    const res = await fetch('https://lobste.rs/hottest.json')
    if (!res.ok) throw new Error(`Lobsters API returned ${res.status}`)
    const data = await res.json()

    return (data as any[]).slice(0, 20).map((item) => ({
      id: `lobsters-${item.short_id}`,
      title: item.title || '',
      url: item.url || item.comments_url || '',
      source: 'lobsters' as const,
      score: item.score || 0,
      commentCount: item.comment_count || 0,
      commentUrl: item.comments_url || '',
      author: item.submitter_user?.username || '',
      createdAt: item.created_at || new Date().toISOString(),
    }))
  } catch (err) {
    console.error('[Trending] Lobsters fetch failed:', (err as Error).message)
    return []
  }
}

export async function getTrending(): Promise<TrendingResponse> {
  if (cache && Date.now() < cache.expiresAt) {
    return { items: cache.items, fetchedAt: cache.fetchedAt }
  }

  const [hn, reddit, lobsters] = await Promise.all([
    fetchHackerNews(),
    fetchReddit(),
    fetchLobsters(),
  ])

  const items = [...hn, ...reddit, ...lobsters].sort((a, b) => b.score - a.score)
  const fetchedAt = new Date().toISOString()

  cache = { items, fetchedAt, expiresAt: Date.now() + CACHE_TTL }

  return { items, fetchedAt }
}
