export interface Link {
  url: string;
  title: string;
  description: string;
}

export interface ContentSection {
  title: string;
  body: string;
  links: Array<{ url: string; label: string }>;
}

export interface NewsletterContent {
  sections: ContentSection[];
  links: Array<{ url: string; label: string }>;
}

export interface Newsletter {
  id: number;
  subject: string;
  sender: string;
  received_at: string;
  summary: string;
  tags: string[];
  links: Link[];
  content: NewsletterContent;
  created_at: string;
}

export interface PaginatedResponse {
  items: Newsletter[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StatusResponse {
  status: string;
  newsletters: number;
  source: string;
  llmProvider: string;
  llmModel: string;
  ollamaUrl?: string;
  cronSchedule: string;
  lastCheckAt: string | null;
  lastCheckResult: string | null;
}

export interface ActionResponse {
  success: boolean;
  processed?: number;
  skipped?: number;
  retried?: number;
  updated?: number;
  deleted?: number;
  total?: number;
  error?: string;
}

// --- Tab navigation ---
export type TabId = "newsletters" | "trending" | "status";

// --- Trending Tab ---
export interface TrendingItem {
  id: string;
  title: string;
  url: string;
  source: "hackernews" | "reddit" | "lobsters";
  subreddit?: string;
  score: number;
  commentCount: number;
  commentUrl: string;
  author: string;
  createdAt: string;
}

export interface TrendingResponse {
  items: TrendingItem[];
  fetchedAt: string;
}

// --- Status Tab ---
export type ServiceHealth =
  | "operational"
  | "degraded"
  | "major"
  | "unknown"
  | "no-feed";

export interface StatusIncident {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  service: string;
}

export interface ServiceStatus {
  name: string;
  slug: string;
  health: ServiceHealth;
  incidents: StatusIncident[];
  statusUrl?: string;
  feedUrl?: string;
  fetchedAt: string;
}

export interface ServiceStatusResponse {
  services: ServiceStatus[];
}
