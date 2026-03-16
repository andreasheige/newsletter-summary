export interface Link {
  url: string
  title: string
  description: string
}

export interface ContentSection {
  title: string
  body: string
  links: Array<{ url: string; label: string }>
}

export interface NewsletterContent {
  sections: ContentSection[]
  links: Array<{ url: string; label: string }>
}

export interface Newsletter {
  id: number
  subject: string
  sender: string
  received_at: string
  summary: string
  tags: string[]
  links: Link[]
  content: NewsletterContent
  created_at: string
}

export interface PaginatedResponse {
  items: Newsletter[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface StatusResponse {
  status: string
  newsletters: number
  source: string
  ollamaUrl: string
  ollamaModel: string
  cronSchedule: string
}

export interface ActionResponse {
  success: boolean
  processed?: number
  skipped?: number
  retried?: number
  updated?: number
  deleted?: number
  total?: number
  error?: string
}
