import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import type { NewsletterRow } from './types.js'

const dataDir = path.join(import.meta.dirname, '..', '..', 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const db = new Database(path.join(dataDir, 'newsletters.db'))

db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS newsletters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT UNIQUE,
    subject TEXT,
    sender TEXT,
    received_at TEXT,
    original_text TEXT,
    summary TEXT,
    tags TEXT DEFAULT '[]',
    links TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now'))
  )
`)

// Migrations for existing DBs
for (const col of [
  { name: 'links', def: "TEXT DEFAULT '[]'" },
  { name: 'original_html', def: "TEXT DEFAULT ''" },
  { name: 'content', def: "TEXT DEFAULT '[]'" },
]) {
  try { db.exec(`ALTER TABLE newsletters ADD COLUMN ${col.name} ${col.def}`) } catch { /* exists */ }
}

interface InsertParams {
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
}

interface PaginationParams {
  limit: number
  offset: number
}

interface SenderPaginationParams extends PaginationParams {
  sender: string
}

interface UpdateParams {
  id: number
  summary: string
  tags: string
  links: string
  content: string
}

const insertStmt = db.prepare<InsertParams>(`
  INSERT OR IGNORE INTO newsletters (message_id, subject, sender, received_at, original_text, original_html, summary, tags, links, content)
  VALUES (@message_id, @subject, @sender, @received_at, @original_text, @original_html, @summary, @tags, @links, @content)
`)

const getPageStmt = db.prepare<PaginationParams>(`
  SELECT id, subject, sender, received_at, summary, tags, links, content, created_at
  FROM newsletters
  ORDER BY received_at DESC
  LIMIT @limit OFFSET @offset
`)

const getPageBySenderStmt = db.prepare<SenderPaginationParams>(`
  SELECT id, subject, sender, received_at, summary, tags, links, content, created_at
  FROM newsletters
  WHERE sender LIKE @sender
  ORDER BY received_at DESC
  LIMIT @limit OFFSET @offset
`)

const getCountStmt = db.prepare(`SELECT COUNT(*) as count FROM newsletters`)

const getCountBySenderStmt = db.prepare<{ sender: string }>(`SELECT COUNT(*) as count FROM newsletters WHERE sender LIKE @sender`)

const getSendersStmt = db.prepare(`SELECT DISTINCT sender FROM newsletters ORDER BY sender`)

const existsStmt = db.prepare<[string]>(`SELECT 1 FROM newsletters WHERE message_id = ?`)

const getFailedStmt = db.prepare(`
  SELECT id, subject, sender, original_text, original_html FROM newsletters
  WHERE summary LIKE 'Could not summarize:%'
     OR summary LIKE '{%'
     OR summary LIKE '<%'
     OR summary LIKE '%</%>%'
     OR length(summary) < 10
     OR content = '[]'
     OR content = ''
     OR content IS NULL
`)

const getAllStmt = db.prepare(`SELECT id, subject, sender, original_text, original_html FROM newsletters ORDER BY received_at DESC`)

const updateSummaryStmt = db.prepare<UpdateParams>(`UPDATE newsletters SET summary = @summary, tags = @tags, links = @links, content = @content WHERE id = @id`)

const getAllTagsStmt = db.prepare(`SELECT tags FROM newsletters WHERE tags != '[]' AND tags IS NOT NULL`)

const updateHtmlStmt = db.prepare<{ message_id: string; original_html: string }>(`UPDATE newsletters SET original_html = @original_html WHERE message_id = @message_id`)

const getByMessageIdStmt = db.prepare<[string]>(`SELECT id, message_id, subject, sender, original_text, original_html FROM newsletters WHERE message_id = ?`)

const getMissingHtmlStmt = db.prepare(`SELECT id, message_id, subject, sender FROM newsletters WHERE original_html = '' OR original_html IS NULL`)

const deleteMissingLinksStmt = db.prepare(`DELETE FROM newsletters WHERE links = '[]' OR links IS NULL`)

// Exported functions wrapping prepared statements
export function insert(params: InsertParams) {
  return insertStmt.run(params)
}

export function getPage(params: PaginationParams): NewsletterRow[] {
  return getPageStmt.all(params) as NewsletterRow[]
}

export function getPageBySender(params: SenderPaginationParams): NewsletterRow[] {
  return getPageBySenderStmt.all(params) as NewsletterRow[]
}

export function getCount(): number {
  return (getCountStmt.get() as { count: number }).count
}

export function getCountBySender(sender: string): number {
  return (getCountBySenderStmt.get({ sender }) as { count: number }).count
}

export function getSenders(): string[] {
  return (getSendersStmt.all() as { sender: string }[]).map(r => r.sender)
}

export function exists(messageId: string): boolean {
  return !!existsStmt.get(messageId)
}

export function getFailed(): Pick<NewsletterRow, 'id' | 'subject' | 'sender' | 'original_text' | 'original_html'>[] {
  return getFailedStmt.all() as Pick<NewsletterRow, 'id' | 'subject' | 'sender' | 'original_text' | 'original_html'>[]
}

export function getAll(): Pick<NewsletterRow, 'id' | 'subject' | 'sender' | 'original_text' | 'original_html'>[] {
  return getAllStmt.all() as Pick<NewsletterRow, 'id' | 'subject' | 'sender' | 'original_text' | 'original_html'>[]
}

export function updateSummary(params: UpdateParams) {
  return updateSummaryStmt.run(params)
}

export function getAllTags(): string[] {
  const rows = getAllTagsStmt.all() as { tags: string }[]
  const tagSet = new Set<string>()
  for (const row of rows) {
    try {
      const tags = JSON.parse(row.tags)
      if (Array.isArray(tags)) tags.forEach((t: string) => tagSet.add(t))
    } catch { /* ignore */ }
  }
  return [...tagSet].sort()
}

export function updateHtml(params: { message_id: string; original_html: string }) {
  return updateHtmlStmt.run(params)
}

export function getByMessageId(messageId: string): NewsletterRow | undefined {
  return getByMessageIdStmt.get(messageId) as NewsletterRow | undefined
}

export function getMissingHtml(): Pick<NewsletterRow, 'id' | 'message_id' | 'subject' | 'sender'>[] {
  return getMissingHtmlStmt.all() as Pick<NewsletterRow, 'id' | 'message_id' | 'subject' | 'sender'>[]
}

export function deleteMissingLinks() {
  return deleteMissingLinksStmt.run()
}

export { db }
