export interface RawLink {
  url: string
  label: string
}

export interface Email {
  messageId: string
  subject: string
  sender: string
  date: Date
  text: string
  html: string
  links: RawLink[]
}

export interface SummarizeResult {
  summary: string
  tags: string[]
  links: Array<{ url: string; title: string; description: string }>
}

export interface NewsletterRow {
  id: number
  message_id: string
  subject: string
  sender: string
  received_at: string
  original_text: string
  original_html: string
  summary: string
  tags: string
  links: string
  content: string
  created_at: string
}
