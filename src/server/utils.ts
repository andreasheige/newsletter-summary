import type { RawLink } from './types.js'

/**
 * Strip emoji characters from text, collapsing leftover whitespace.
 */
export function stripEmojis(text: string): string {
  if (!text) return ''
  return text
    // Remove emoji characters: emoticons, symbols, dingbats, skin tone modifiers, ZWJ sequences
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{1F3FB}-\u{1F3FF}\u{2B50}\u{2B55}\u{2934}\u{2935}\u{25AA}-\u{25FE}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{3030}\u{303D}\u{3297}\u{3299}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{200B}\u{200C}\u{200D}\u{FEFF}]+/gu, '')
    // Clean up space before punctuation left by emoji removal
    .replace(/\s+([,.:;!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Clean raw email body text. Handles:
 * - MIME headers (Delivered-To, Received, DKIM-Signature, etc.)
 * - Multipart boundaries
 * - Quoted-printable decoding
 * - Zero-width/invisible characters
 */
export function cleanEmailBody(text: string): string {
  if (!text) return ''

  let body = text

  // Detect MIME: check if it starts with common email headers
  const looksLikeMime = /^(Delivered-To:|Received:|From:|Return-Path:|DKIM-Signature:|ARC-|X-Received:|Content-Type:)/m.test(body.slice(0, 500))

  if (looksLikeMime) {
    // Check for multipart boundary
    const boundaryMatch = body.match(/boundary=([^\s;]+)/i)

    if (boundaryMatch) {
      const boundary = boundaryMatch[1].replace(/^["']|["']$/g, '')
      const escapedBoundary = boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Extract text/plain part from multipart
      const parts = body.split(new RegExp(`--${escapedBoundary}`, 'g'))

      let plainPart = ''
      for (const part of parts) {
        if (/Content-Type:\s*text\/plain/i.test(part)) {
          // Try double newline first (proper MIME)
          const headerEnd = part.indexOf('\n\n')
          if (headerEnd !== -1) {
            plainPart = part.slice(headerEnd + 2)
          } else {
            // Single-line MIME: strip Content-Type/Transfer-Encoding headers
            plainPart = part
              .replace(/Content-Type:[^;]*;?\s*charset=[^\s]*/i, '')
              .replace(/Content-Transfer-Encoding:\s*\S+/i, '')
              .trim()
          }
          break
        }
      }

      if (plainPart) {
        body = plainPart
      } else {
        // No text/plain part found — try to get body after main headers
        const headerEnd = body.indexOf('\n\n')
        if (headerEnd !== -1) {
          body = body.slice(headerEnd + 2)
        }
      }
    } else {
      // Not multipart — strip headers (everything before first blank line)
      const headerEnd = body.indexOf('\n\n')
      if (headerEnd !== -1) {
        body = body.slice(headerEnd + 2)
      } else {
        // Single-line: try to find content after Content-Transfer-Encoding
        const cteMatch = body.match(/Content-Transfer-Encoding:\s*\S+\s*/i)
        if (cteMatch) {
          body = body.slice(cteMatch.index! + cteMatch[0].length)
        }
      }
    }
  }

  // Strip any remaining Content-Type / Content-Transfer-Encoding lines
  body = body.replace(/^Content-Type:.*\n?/gim, '')
  body = body.replace(/^Content-Transfer-Encoding:.*\n?/gim, '')

  // Strip multipart boundary markers that might remain
  body = body.replace(/^--[A-Za-z0-9+/=_-]+--?\s*$/gm, '')

  // Decode quoted-printable if present
  const hasQP = /=[0-9A-Fa-f]{2}/.test(body)
  if (hasQP) {
    // Soft line breaks (=\n)
    body = body.replace(/=\r?\n/g, '')
    // Encoded bytes (=XX)
    body = body.replace(/=([0-9A-Fa-f]{2})/g, (_match, hex) => {
      return String.fromCharCode(parseInt(hex, 16))
    })
    // Re-decode multi-byte UTF-8 that was decoded byte-by-byte
    try {
      const bytes = new Uint8Array([...body].map(c => c.charCodeAt(0)))
      body = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
    } catch {
      // keep as-is
    }
  }

  // Strip zero-width characters and invisible Unicode
  body = body.replace(/[\u200B\u200C\u200D\uFEFF\u00A0]/g, ' ')
  // Strip combining grapheme joiner (U+034F) — used as padding in emails
  body = body.replace(/\u034F/g, '')
  // Strip object replacement character (U+FFFC) — used for embedded images
  body = body.replace(/\uFFFC/g, '')

  // Strip common email boilerplate/footers
  // LinkedIn
  body = body.replace(/Läs den här artikeln på LinkedIn[\s\S]*/i, '')
  body = body.replace(/Detta e-postmeddelande var avsett för[\s\S]*/i, '')
  body = body.replace(/Du tar emot e-postaviseringar[\s\S]*/i, '')
  // Generic unsubscribe/footer patterns
  body = body.replace(/©\s*\d{4}\s+LinkedIn[\s\S]*/i, '')

  // Collapse excessive newlines (max 2)
  body = body.replace(/\n{3,}/g, '\n\n')

  // Collapse multiple spaces on a single line
  body = body.replace(/[ \t]+/g, ' ')

  // Trim each line
  body = body.split('\n').map(l => l.trim()).join('\n')

  // Final collapse of excessive newlines after trimming
  body = body.replace(/\n{3,}/g, '\n\n')

  return body.trim()
}

/**
 * Extract HTML part from raw MIME email source.
 * Finds the text/html boundary part and decodes it.
 */
export function extractHtmlFromMime(mimeSource: string): string {
  if (!mimeSource) return ''

  const boundaryMatch = mimeSource.match(/boundary="?([^\s";]+)"?/i)
  if (!boundaryMatch) return ''

  const boundary = boundaryMatch[1]
  const escapedBoundary = boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = mimeSource.split(new RegExp(`--${escapedBoundary}`, 'g'))

  for (const part of parts) {
    if (!/Content-Type:\s*text\/html/i.test(part)) continue

    // Find the body after headers (double newline)
    const headerEnd = part.indexOf('\n\n')
    let htmlBody = headerEnd !== -1 ? part.slice(headerEnd + 2) : part

    // Strip trailing boundary marker
    htmlBody = htmlBody.replace(/--$/, '').trim()

    // Check for nested multipart (some emails have multipart/alternative inside multipart/mixed)
    const nestedBoundary = part.match(/boundary="?([^\s";]+)"?/i)
    if (nestedBoundary) {
      const nested = extractHtmlFromMime(part)
      if (nested) return nested
    }

    // Decode quoted-printable if needed
    const isQP = /Content-Transfer-Encoding:\s*quoted-printable/i.test(part)
    if (isQP) {
      htmlBody = htmlBody.replace(/=\r?\n/g, '')
      htmlBody = htmlBody.replace(/=([0-9A-Fa-f]{2})/g, (_m, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      )
      try {
        const bytes = new Uint8Array([...htmlBody].map(c => c.charCodeAt(0)))
        htmlBody = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
      } catch { /* keep as-is */ }
    }

    // Decode base64 if needed
    const isB64 = /Content-Transfer-Encoding:\s*base64/i.test(part)
    if (isB64) {
      try {
        htmlBody = Buffer.from(htmlBody.replace(/\s/g, ''), 'base64').toString('utf-8')
      } catch { /* keep as-is */ }
    }

    if (htmlBody.includes('<') && htmlBody.length > 100) return htmlBody
  }

  // Try nested multipart/alternative
  for (const part of parts) {
    if (/Content-Type:\s*multipart\/alternative/i.test(part)) {
      const nested = extractHtmlFromMime(part)
      if (nested) return nested
    }
  }

  return ''
}

export function htmlToText(html: string): string {
  if (!html) return ''
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractLinks(html: string): RawLink[] {
  if (!html) return []
  const seen = new Set<string>()
  const seenLabels = new Set<string>()
  const links: RawLink[] = []
  const regex = /<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    const url = match[1].trim()
    const label = match[2]
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim()

    if (!url || url.startsWith('#') || url.startsWith('mailto:')) continue
    if (!label || label.length < 5) continue

    // Skip obvious non-content URLs
    if (/unsubscribe|manage.preferences|email.preferences|list-manage\.com|beacon\.|pixel\.|open\.substack\.com\/(pub|img)|\/click(\?|$)|\/track(\?|\/|$)/i.test(url)) continue
    // Skip labels that are just actions, not content
    if (/^(unsubscribe|view.*browser|update.*preferences|click here|read more|learn more|download|share|tweet|forward|logo|header|footer|©)$/i.test(label)) continue
    // Skip bare social media profile pages (but keep links to specific posts/pages)
    if (/^https?:\/\/(www\.)?(twitter|x|facebook|linkedin|instagram|youtube)\.com\/?$/i.test(url)) continue

    if (seen.has(url)) continue
    const labelLower = label.toLowerCase()
    if (seenLabels.has(labelLower)) continue
    seen.add(url)
    seenLabels.add(labelLower)

    links.push({ url, label })
  }

  return links
}
