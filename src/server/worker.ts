import { fetchNewEmails, markAsRead } from './email.js'
import { summarize } from './summarizer.js'
import { extractNewsletterContent } from './content.js'
import { cleanEmailBody } from './utils.js'
import { insert, exists, getFailed, getAll, updateSummary, updateHtml, getByMessageId } from './db.js'

let isRunning = false

export async function processNewEmails(): Promise<{ processed: number; skipped: number }> {
  if (isRunning) {
    console.log('[Worker] Already running, skipping...')
    return { processed: 0, skipped: 0 }
  }

  isRunning = true
  let processed = 0
  let skipped = 0
  const processedIds: string[] = []

  try {
    const lookbackDays = parseInt(process.env.LOOKBACK_DAYS || '') || 90
    const since = new Date()
    since.setDate(since.getDate() - lookbackDays)

    console.log(`[Worker] Checking for new emails since ${since.toISOString()}...`)
    const emails = await fetchNewEmails(since)
    console.log(`[Worker] Found ${emails.length} emails`)

    const senderFilter = process.env.NEWSLETTER_SENDERS
      ? process.env.NEWSLETTER_SENDERS.split(',').map(s => s.trim().toLowerCase())
      : null

    for (const email of emails) {
      if (senderFilter && !senderFilter.some(s => email.sender.toLowerCase().includes(s))) {
        continue
      }

      if (exists(email.messageId)) {
        skipped++
        continue
      }

      console.log(`[Worker] Summarizing: "${email.subject}" (${email.links.length} links found)`)
      const cleanText = cleanEmailBody(email.text)
      const { summary, tags, links } = await summarize(email.subject, cleanText, email.links)
      const content = extractNewsletterContent(cleanText, email.html, email.sender)

      insert({
        message_id: email.messageId,
        subject: email.subject,
        sender: email.sender,
        received_at: email.date.toISOString(),
        original_text: email.text,
        original_html: email.html,
        summary,
        tags: JSON.stringify(tags),
        links: JSON.stringify(links),
        content: JSON.stringify(content),
      })

      processed++
      processedIds.push(email.messageId)
      console.log(`[Worker] Saved: "${email.subject}"`)
    }

    if (process.env.MARK_AS_READ === 'true' && processedIds.length > 0) {
      await markAsRead(processedIds)
    }
  } catch (err) {
    console.error('[Worker] Error:', (err as Error).message)
  } finally {
    isRunning = false
  }

  console.log(`[Worker] Done. Processed: ${processed}, Skipped: ${skipped}`)
  return { processed, skipped }
}

export async function retryFailed(): Promise<{ retried: number }> {
  const failed = getFailed()
  if (!failed.length) {
    console.log('[Worker] No failed summaries to retry')
    return { retried: 0 }
  }

  console.log(`[Worker] Retrying ${failed.length} failed summaries...`)
  let retried = 0

  for (const row of failed) {
    console.log(`[Worker] Retrying: "${row.subject}"`)
    const htmlContent = row.original_html || ''
    const { extractLinks } = await import('./utils.js')
    const rawLinks = htmlContent ? extractLinks(htmlContent) : []
    const cleanText = cleanEmailBody(row.original_text)
    const { summary, tags, links } = await summarize(row.subject, cleanText, rawLinks)

    if (summary.startsWith('Could not summarize:') || summary.startsWith('{')) {
      console.log(`[Worker] Still failing: "${row.subject}"`)
      continue
    }

    const content = extractNewsletterContent(cleanText, htmlContent, row.sender)
    updateSummary({ id: row.id, summary, tags: JSON.stringify(tags), links: JSON.stringify(links), content: JSON.stringify(content) })
    retried++
    console.log(`[Worker] Fixed: "${row.subject}"`)
  }

  console.log(`[Worker] Retry done. Fixed: ${retried}/${failed.length}`)
  return { retried }
}

/**
 * Re-fetch emails from Mail.app to get HTML content, then re-process.
 * Updates existing DB entries with HTML and regenerates content/links.
 */
export async function refetchAll(): Promise<{ updated: number; total: number }> {
  const lookbackDays = parseInt(process.env.LOOKBACK_DAYS || '') || 90
  const since = new Date()
  since.setDate(since.getDate() - lookbackDays)

  console.log('[Worker] Refetching emails from Mail.app to get HTML...')
  const emails = await fetchNewEmails(since)
  console.log(`[Worker] Got ${emails.length} emails from Mail.app`)

  let updated = 0
  const total = emails.length

  for (const email of emails) {
    if (!email.html) continue

    const existing = getByMessageId(email.messageId)
    if (!existing) continue

    // Update HTML in DB
    updateHtml({ message_id: email.messageId, original_html: email.html })

    // Re-extract content with HTML links
    const cleanText = cleanEmailBody(existing.original_text)
    const { extractLinks } = await import('./utils.js')
    const rawLinks = extractLinks(email.html)
    const { summary, tags, links } = await summarize(existing.subject, cleanText, rawLinks)

    if (summary.startsWith('Could not summarize:') || summary.startsWith('{')) {
      console.log(`[Worker] Summarize failed: "${existing.subject}"`)
      // Still update content with HTML links even if summary fails
      const content = extractNewsletterContent(cleanText, email.html, existing.sender)
      updateSummary({ id: existing.id, summary: existing.summary || summary, tags: JSON.stringify(tags), links: JSON.stringify(links), content: JSON.stringify(content) })
      updated++
      continue
    }

    const content = extractNewsletterContent(cleanText, email.html, existing.sender)
    updateSummary({ id: existing.id, summary, tags: JSON.stringify(tags), links: JSON.stringify(links), content: JSON.stringify(content) })
    updated++
    console.log(`[Worker] Refetched: "${existing.subject}" (${rawLinks.length} links)`)
  }

  console.log(`[Worker] Refetch done. Updated: ${updated}/${total}`)
  return { updated, total }
}

export async function resummarizeAll(): Promise<{ updated: number; total: number }> {
  const all = getAll()
  if (!all.length) {
    console.log('[Worker] No newsletters to resummarize')
    return { updated: 0, total: 0 }
  }

  console.log(`[Worker] Resummarizing all ${all.length} newsletters...`)
  let updated = 0

  for (const row of all) {
    console.log(`[Worker] Resummarizing: "${row.subject}"`)
    const htmlContent = row.original_html || ''
    const { extractLinks } = await import('./utils.js')
    const rawLinks = htmlContent ? extractLinks(htmlContent) : []
    const cleanText = cleanEmailBody(row.original_text)
    const { summary, tags, links } = await summarize(row.subject, cleanText, rawLinks)

    if (summary.startsWith('Could not summarize:') || summary.startsWith('{')) {
      console.log(`[Worker] Failed: "${row.subject}"`)
      continue
    }

    const content = extractNewsletterContent(cleanText, htmlContent, row.sender)
    updateSummary({ id: row.id, summary, tags: JSON.stringify(tags), links: JSON.stringify(links), content: JSON.stringify(content) })
    updated++
  }

  console.log(`[Worker] Resummarize done. Updated: ${updated}/${all.length}`)
  return { updated, total: all.length }
}
