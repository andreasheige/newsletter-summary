import type {
  ServiceStatus,
  ServiceStatusResponse,
  ServiceHealth,
  StatusIncident,
} from "../shared/types.js";

const SERVICES = [
  // Dev platforms
  {
    name: "GitHub",
    slug: "github",
    statusUrl: "https://www.githubstatus.com",
    feedUrl: "https://www.githubstatus.com/history.rss",
  },
  {
    name: "Cloudflare",
    slug: "cloudflare",
    statusUrl: "https://www.cloudflarestatus.com",
    feedUrl: "https://www.cloudflarestatus.com/history.rss",
  },
  {
    name: "Slack",
    slug: "slack",
    statusUrl: "https://status.slack.com",
    feedUrl: "https://status.slack.com/feed/rss",
  },
  {
    name: "Vercel",
    slug: "vercel",
    statusUrl: "https://www.vercel-status.com",
    feedUrl: "https://www.vercel-status.com/history.rss",
  },
  {
    name: "Atlassian",
    slug: "atlassian",
    statusUrl: "https://status.atlassian.com",
    feedUrl: "https://status.atlassian.com/history.rss",
  },
  {
    name: "npm",
    slug: "npm",
    statusUrl: "https://status.npmjs.org",
    feedUrl: "https://status.npmjs.org/history.rss",
  },
  {
    name: "Docker Hub",
    slug: "dockerhub",
    statusUrl: "https://www.dockerstatus.com",
    feedUrl: "https://www.dockerstatus.com/pages/533c6539221ae15e3f000031/rss",
  },
  // AI providers
  {
    name: "OpenAI",
    slug: "openai",
    statusUrl: "https://status.openai.com",
    feedUrl: "https://status.openai.com/history.rss",
  },
  {
    name: "Anthropic",
    slug: "anthropic",
    statusUrl: "https://status.anthropic.com",
    feedUrl: "https://status.anthropic.com/history.rss",
  },
  // Observability
  {
    name: "Splunk",
    slug: "splunk",
    statusUrl: "https://status.splunkcloud.com",
    feedUrl: "https://status.splunkcloud.com/history.rss",
  },
  {
    name: "Grafana",
    slug: "grafana",
    statusUrl: "https://status.grafana.com",
    feedUrl: "https://status.grafana.com/history.rss",
  },
  // E-commerce & business services
  {
    name: "Storyblok",
    slug: "storyblok",
    statusUrl: "https://uptime.storyblok.com",
    feedUrl: null,
  },
  {
    name: "Centra",
    slug: "centra",
    statusUrl: "https://status.centra.com",
    feedUrl: "https://status.centra.com/history.rss",
  },
  {
    name: "Adyen",
    slug: "adyen",
    statusUrl: "https://status.adyen.com",
    feedUrl: "https://status.adyen.com/history.rss",
  },
  {
    name: "Azure",
    slug: "azure",
    statusUrl: "https://status.azure.com",
    feedUrl: "https://status.azure.com/en-us/status/feed/",
  },
  {
    name: "Google Maps",
    slug: "google-maps",
    statusUrl: "https://status.cloud.google.com",
    feedUrl: "https://status.cloud.google.com/en/feed.atom",
  },
  {
    name: "Emarsys",
    slug: "emarsys",
    statusUrl: "https://status.emarsys.com",
    feedUrl: "https://status.emarsys.com/history.rss",
  },
  {
    name: "Tealium",
    slug: "tealium",
    statusUrl: "https://status.tealium.com",
    feedUrl: "https://status.tealium.com/pages/56216ec56de34e1e5900016f/rss",
  },
  {
    name: "Ingrid",
    slug: "ingrid",
    statusUrl: "https://status.ingrid.com",
    feedUrl: "https://www.ingridstatus.com/history.rss",
  },
  {
    name: "ParcelLab",
    slug: "parcellab",
    statusUrl: "https://status.parcellab.com",
    feedUrl: "https://status.parcellab.com/history.rss",
  },
  {
    name: "Fredhopper",
    slug: "fredhopper",
    statusUrl: "https://fredhopperstatus.crownpeak.com",
    feedUrl: null,
  },
  {
    name: "TurnTo / Emplifi",
    slug: "turnto",
    statusUrl: "https://status.emplifi.io",
    feedUrl: "https://status.emplifi.io/history.rss",
  },
];

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  status: ServiceStatus;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function stripCdata(str: string): string {
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? stripCdata(match[1]).trim() : "";
}

function parseRssItems(
  xml: string,
): Array<{
  title: string;
  description: string;
  link: string;
  pubDate: string;
}> {
  const items: Array<{
    title: string;
    description: string;
    link: string;
    pubDate: string;
  }> = [];

  // Try RSS <item> format first
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    items.push({
      title: extractTag(block, "title"),
      description: extractTag(block, "description"),
      link: extractTag(block, "link"),
      pubDate: extractTag(block, "pubDate"),
    });
  }

  // Fall back to Atom <entry> format
  if (items.length === 0) {
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null) {
      const block = match[1];
      // Atom uses <link href="..."/> (self-closing) and <updated> or <published>
      const linkMatch = /<link[^>]*href=["']([^"']+)["'][^>]*\/?>/.exec(block);
      const link = linkMatch ? linkMatch[1] : extractTag(block, "link");
      const pubDate =
        extractTag(block, "updated") || extractTag(block, "published");
      items.push({
        title: extractTag(block, "title"),
        description:
          extractTag(block, "content") || extractTag(block, "summary"),
        link,
        pubDate,
      });
    }
  }

  return items;
}

function detectHealth(
  incidents: Array<{ title: string; pubDate: string }>,
): ServiceHealth {
  if (incidents.length === 0) return "operational";

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  // Statuspage RSS items have titles like "Resolved - Issue name" or "Investigating - Issue name"
  const recentIncidents = incidents.filter((inc) => {
    const pubTime = new Date(inc.pubDate).getTime();
    return !isNaN(pubTime) && pubTime > oneDayAgo;
  });

  if (recentIncidents.length === 0) return "operational";

  // Check the most recent update — Statuspage prefixes with status
  const latestTitle = recentIncidents[0].title.toLowerCase();

  if (/^(major|critical)/.test(latestTitle)) return "major";
  if (/^(investigating|identified|monitoring|update)/.test(latestTitle))
    return "degraded";
  // "Resolved - ..." means the incident is over
  if (/^resolved/.test(latestTitle)) return "operational";

  // No recognized prefix — check description-style titles
  if (/\b(outage|down|major)\b/.test(latestTitle)) return "major";
  if (/\b(degraded|issue|incident|disruption)\b/.test(latestTitle))
    return "degraded";

  return "operational";
}

async function fetchServiceStatus(
  service: (typeof SERVICES)[number],
): Promise<ServiceStatus> {
  const cached = cache.get(service.slug);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.status;
  }

  // Services without a feed URL — return a "no feed" status with link to status page
  if (!service.feedUrl) {
    const status: ServiceStatus = {
      name: service.name,
      slug: service.slug,
      health: "no-feed",
      incidents: [],
      statusUrl: service.statusUrl ?? undefined,
      feedUrl: undefined,
      fetchedAt: new Date().toISOString(),
    };
    cache.set(service.slug, { status, expiresAt: Date.now() + CACHE_TTL });
    return status;
  }

  try {
    const res = await fetch(service.feedUrl, {
      headers: { "User-Agent": "newsletter-summary/1.0" },
    });
    if (!res.ok) throw new Error(`RSS feed returned ${res.status}`);
    const xml = await res.text();

    const rawItems = parseRssItems(xml);

    const incidents: StatusIncident[] = rawItems
      .slice(0, 10)
      .map((item, i) => ({
        id: `${service.slug}-${i}`,
        title: item.title,
        description: item.description,
        url: item.link,
        publishedAt: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString(),
        service: service.name,
      }));

    const health = detectHealth(rawItems);
    const fetchedAt = new Date().toISOString();

    const status: ServiceStatus = {
      name: service.name,
      slug: service.slug,
      health,
      incidents,
      statusUrl: service.statusUrl ?? undefined,
      feedUrl: service.feedUrl ?? undefined,
      fetchedAt,
    };

    cache.set(service.slug, { status, expiresAt: Date.now() + CACHE_TTL });

    return status;
  } catch (err) {
    console.error(
      `[ServiceStatus] Failed to fetch ${service.name}:`,
      (err as Error).message,
    );

    // Return cached data if available (even if expired), otherwise a fallback
    const stale = cache.get(service.slug);
    if (stale) return stale.status;

    return {
      name: service.name,
      slug: service.slug,
      health: "unknown",
      incidents: [],
      statusUrl: service.statusUrl ?? undefined,
      feedUrl: service.feedUrl ?? undefined,
      fetchedAt: new Date().toISOString(),
    };
  }
}

export async function getAllServiceStatuses(): Promise<ServiceStatusResponse> {
  const services = await Promise.all(SERVICES.map(fetchServiceStatus));
  return { services };
}
