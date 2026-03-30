import type { ServiceStatus, ServiceStatusResponse, ServiceHealth, StatusIncident } from '../shared/types.js'

const SERVICES = [
  // Dev platforms
  { name: 'GitHub', slug: 'github', feedUrl: 'https://www.githubstatus.com/history.rss' },
  { name: 'Cloudflare', slug: 'cloudflare', feedUrl: 'https://www.cloudflarestatus.com/history.rss' },
  { name: 'Slack', slug: 'slack', feedUrl: 'https://status.slack.com/feed/rss' },
  { name: 'Vercel', slug: 'vercel', feedUrl: 'https://www.vercel-status.com/history.rss' },
  { name: 'Atlassian', slug: 'atlassian', feedUrl: 'https://status.atlassian.com/history.rss' },
  { name: 'npm', slug: 'npm', feedUrl: 'https://status.npmjs.org/history.rss' },
  { name: 'Docker Hub', slug: 'dockerhub', feedUrl: 'https://www.dockerstatus.com/pages/533c6539221ae15e3f000031/rss' },
  // AI providers
  { name: 'OpenAI', slug: 'openai', feedUrl: 'https://status.openai.com/history.rss' },
  { name: 'Anthropic', slug: 'anthropic', feedUrl: 'https://status.anthropic.com/history.rss' },
  // Observability
  { name: 'Splunk', slug: 'splunk', feedUrl: 'https://status.splunkcloud.com/history.rss' },
  { name: 'Grafana', slug: 'grafana', feedUrl: 'https://status.grafana.com/history.rss' },
  // Delivery
  { name: 'Ingrid', slug: 'ingrid', feedUrl: 'https://www.ingridstatus.com/history.rss' },
]

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CacheEntry {
  status: ServiceStatus
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()

function stripCdata(str: string): string {
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')
  const match = xml.match(regex)
  return match ? stripCdata(match[1]).trim() : ''
}

function parseRssItems(xml: string): Array<{ title: string; description: string; link: string; pubDate: string }> {
  const items: Array<{ title: string; description: string; link: string; pubDate: string }> = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match: RegExpExecArray | null

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    items.push({
      title: extractTag(block, 'title'),
      description: extractTag(block, 'description'),
      link: extractTag(block, 'link'),
      pubDate: extractTag(block, 'pubDate'),
    })
  }

  return items
}

function detectHealth(incidents: Array<{ title: string; pubDate: string }>): ServiceHealth {
  if (incidents.length === 0) return 'operational'

  const now = Date.now()
  const oneDayAgo = now - 24 * 60 * 60 * 1000

  // Statuspage RSS items have titles like "Resolved - Issue name" or "Investigating - Issue name"
  const recentIncidents = incidents.filter((inc) => {
    const pubTime = new Date(inc.pubDate).getTime()
    return !isNaN(pubTime) && pubTime > oneDayAgo
  })

  if (recentIncidents.length === 0) return 'operational'

  // Check the most recent update — Statuspage prefixes with status
  const latestTitle = recentIncidents[0].title.toLowerCase()

  if (/^(major|critical)/.test(latestTitle)) return 'major'
  if (/^(investigating|identified|monitoring|update)/.test(latestTitle)) return 'degraded'
  // "Resolved - ..." means the incident is over
  if (/^resolved/.test(latestTitle)) return 'operational'

  // No recognized prefix — check description-style titles
  if (/\b(outage|down|major)\b/.test(latestTitle)) return 'major'
  if (/\b(degraded|issue|incident|disruption)\b/.test(latestTitle)) return 'degraded'

  return 'operational'
}

async function fetchServiceStatus(service: typeof SERVICES[number]): Promise<ServiceStatus> {
  const cached = cache.get(service.slug)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.status
  }

  try {
    const res = await fetch(service.feedUrl, {
      headers: { 'User-Agent': 'newsletter-summary/1.0' },
    })
    if (!res.ok) throw new Error(`RSS feed returned ${res.status}`)
    const xml = await res.text()

    const rawItems = parseRssItems(xml)

    const incidents: StatusIncident[] = rawItems.slice(0, 10).map((item, i) => ({
      id: `${service.slug}-${i}`,
      title: item.title,
      description: item.description,
      url: item.link,
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      service: service.name,
    }))

    const health = detectHealth(rawItems)
    const fetchedAt = new Date().toISOString()

    const status: ServiceStatus = {
      name: service.name,
      slug: service.slug,
      health,
      incidents,
      feedUrl: service.feedUrl,
      fetchedAt,
    }

    cache.set(service.slug, { status, expiresAt: Date.now() + CACHE_TTL })

    return status
  } catch (err) {
    console.error(`[ServiceStatus] Failed to fetch ${service.name}:`, (err as Error).message)

    // Return cached data if available (even if expired), otherwise a fallback
    const stale = cache.get(service.slug)
    if (stale) return stale.status

    return {
      name: service.name,
      slug: service.slug,
      health: 'unknown',
      incidents: [],
      feedUrl: service.feedUrl,
      fetchedAt: new Date().toISOString(),
    }
  }
}

export async function getAllServiceStatuses(): Promise<ServiceStatusResponse> {
  const services = await Promise.all(SERVICES.map(fetchServiceStatus))
  return { services }
}
