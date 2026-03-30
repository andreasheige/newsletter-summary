import { extractLinks, cleanEmailBody, stripEmojis } from './utils.js'
import type { RawLink } from './types.js'

export interface ContentSection {
  title: string
  body: string
  links: RawLink[]
}

export interface NewsletterContent {
  sections: ContentSection[]
  links: RawLink[]
}

/**
 * Extract structured content from a newsletter.
 * Splits HTML into sections by headings, extracts all links,
 * and returns a structured representation for display.
 */
export function extractNewsletterContent(plainText: string, html: string, sender?: string): NewsletterContent {
  if (!html && !plainText) {
    return { sections: [], links: [] }
  }

  // Clean plainText in case it contains MIME source
  const cleanPlain = cleanEmailBody(plainText)

  // Try TLDR-specific parser for TLDR senders or TLDR-shaped content
  const isTldr = sender?.toLowerCase().includes('tldr') || /TLDR/i.test(cleanPlain)
  if (isTldr) {
    const tldrResult = parseTldrContent(cleanPlain)
    if (tldrResult.sections.length > 0) {
      // Merge HTML links if available
      if (html) {
        const htmlLinks = extractLinks(html)
        const usedHtmlIndices = new Set<number>()

        // Try to match TLDR articles to actual URLs from HTML
        for (const link of tldrResult.links) {
          if (link.url) continue
          // Extract just the title (without "(X minute read)" suffix)
          const title = link.label.replace(/\s*\(\d+\s+minute\s+read\)\s*$/i, '').trim().toLowerCase()
          if (!title) continue

          // Try progressively looser matching
          let bestIdx = -1

          // 1) Exact title match
          bestIdx = htmlLinks.findIndex((hl, idx) =>
            !usedHtmlIndices.has(idx) && hl.label.toLowerCase().trim() === title
          )

          // 2) HTML label starts with title or vice versa (at least 15 chars)
          if (bestIdx === -1 && title.length >= 15) {
            bestIdx = htmlLinks.findIndex((hl, idx) => {
              if (usedHtmlIndices.has(idx)) return false
              const hlLower = hl.label.toLowerCase().trim()
              return hlLower.startsWith(title.slice(0, 30)) || title.startsWith(hlLower.slice(0, 30))
            })
          }

          // 3) Significant word overlap (for slightly different titles)
          if (bestIdx === -1) {
            const titleWords = title.split(/\s+/).filter(w => w.length > 3)
            if (titleWords.length >= 2) {
              let bestOverlap = 0
              htmlLinks.forEach((hl, idx) => {
                if (usedHtmlIndices.has(idx)) return
                const hlWords = hl.label.toLowerCase().split(/\s+/).filter(w => w.length > 3)
                const overlap = titleWords.filter(w => hlWords.includes(w)).length
                const ratio = overlap / Math.max(titleWords.length, 1)
                if (ratio > 0.5 && overlap > bestOverlap) {
                  bestOverlap = overlap
                  bestIdx = idx
                }
              })
            }
          }

          if (bestIdx !== -1) {
            link.url = htmlLinks[bestIdx].url
            usedHtmlIndices.add(bestIdx)
          }
        }

        // Also match section-level links
        for (const section of tldrResult.sections) {
          for (const link of section.links) {
            if (link.url) continue
            const matched = tldrResult.links.find(l => l.label === link.label && l.url)
            if (matched) link.url = matched.url
          }
        }

        // Remove links that still have no URL
        tldrResult.links = tldrResult.links.filter(l => l.url)
        for (const section of tldrResult.sections) {
          section.links = section.links.filter(l => l.url)
        }

        // Add any remaining HTML links not already matched
        const usedUrls = new Set(tldrResult.links.map(l => l.url))
        for (const hl of htmlLinks) {
          if (!usedUrls.has(hl.url)) {
            tldrResult.links.push(hl)
          }
        }
      } else {
        // No HTML — strip links with no URL
        tldrResult.links = tldrResult.links.filter(l => l.url)
        for (const section of tldrResult.sections) {
          section.links = section.links.filter(l => l.url)
        }
      }
      return tldrResult
    }
  }

  // Extract all links from HTML
  const allLinks = html ? extractLinks(html) : []

  // If no HTML, return cleaned plain text as a single section
  if (!html) {
    return {
      sections: [{ title: '', body: cleanPlain.trim(), links: [] }],
      links: allLinks,
    }
  }

  // Clean the HTML: remove style/script tags
  let cleaned = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')

  // Split by headings (h1, h2, h3)
  // We use a regex that captures the heading tag and its content
  const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi
  const headings: Array<{ title: string; index: number }> = []
  let match: RegExpExecArray | null

  while ((match = headingRegex.exec(cleaned)) !== null) {
    const rawTitle = match[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim()
    const title = stripEmojis(rawTitle)
    if (title) {
      headings.push({ title, index: match.index })
    }
  }

  // Build sections from heading positions
  const sections: ContentSection[] = []

  if (headings.length === 0) {
    // No headings — treat entire content as one section
    const body = stripHtmlToText(cleaned)
    const sectionLinks = findLinksInHtml(cleaned, allLinks)
    if (body.trim()) {
      sections.push({ title: '', body: body.trim(), links: sectionLinks })
    }
  } else {
    // Content before first heading (if any)
    if (headings[0].index > 0) {
      const preContent = cleaned.slice(0, headings[0].index)
      const body = stripHtmlToText(preContent)
      if (body.trim().length > 10) {
        sections.push({ title: '', body: body.trim(), links: findLinksInHtml(preContent, allLinks) })
      }
    }

    // Each heading starts a section, content goes until the next heading
    for (let i = 0; i < headings.length; i++) {
      const start = headings[i].index
      const end = i + 1 < headings.length ? headings[i + 1].index : cleaned.length
      const sectionHtml = cleaned.slice(start, end)

      // Remove the heading itself from the body
      const bodyHtml = sectionHtml.replace(/<h[1-3][^>]*>[\s\S]*?<\/h[1-3]>/i, '')
      const body = stripHtmlToText(bodyHtml)
      const sectionLinks = findLinksInHtml(sectionHtml, allLinks)

      sections.push({
        title: headings[i].title,
        body: body.trim(),
        links: sectionLinks,
      })
    }
  }

  // Filter out empty sections
  const nonEmpty = sections.filter(s => s.body.trim().length > 0 || s.links.length > 0)

  return {
    sections: nonEmpty.length > 0 ? nonEmpty : sections.length > 0 ? sections : [{ title: '', body: cleanPlain.trim() || '', links: [] }],
    links: allLinks,
  }
}

/** Known TLDR section names across all sub-newsletters */
const TLDR_SECTIONS = [
  // Main TLDR
  'Big Tech & Startups',
  'Science & Futuristic Technology',
  'Programming, Design & Data Science',
  'Programming,Design & Data Science',
  // TLDR AI
  'Headlines & Launches',
  'Deep Dives & Analysis',
  'Deep Dives',
  'Engineering & Research',
  'Research & Innovation',
  'Most Popular',
  // TLDR InfoSec
  'Attacks & Vulnerabilities',
  'Strategies & Tactics',
  // TLDR IT
  'News & Trends',
  'Analysis & Opinions',
  'Launches & Partnerships',
  // TLDR DevOps
  'Opinions & Tutorials',
  'Resources & Tools',
  // TLDR Dev
  'Articles & Tutorials',
  'Opinions & Advice',
  // TLDR Crypto
  'Markets & Business',
  'Innovation & Launches',
  'Guides & Tutorials',
  // Shared across many
  'Launches & Tools',
  'Miscellaneous',
  'Quick Links',
]

/**
 * Parse TLDR newsletter plain text into structured sections with articles.
 * Works on both multi-line text and single-line text (from MIME).
 * Returns empty if the text doesn't look like a TLDR newsletter.
 */
export function parseTldrContent(text: string): NewsletterContent {
  if (!text) return { sections: [], links: [] }

  // Check if this looks like a TLDR newsletter
  const hasTldrMarkers = /TLDR/i.test(text) && /\(\d+\s+minute\s+read\)/i.test(text)
  if (!hasTldrMarkers) return { sections: [], links: [] }

  // Build a regex that splits on TLDR section headers
  // This works whether text has newlines or not
  const sectionNamesEscaped = TLDR_SECTIONS.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const sectionSplitRegex = new RegExp(`(${sectionNamesEscaped})`, 'gi')

  // Strip header noise (before first section)
  let body = text
  const firstSectionMatch = body.match(sectionSplitRegex)
  if (firstSectionMatch) {
    const idx = body.indexOf(firstSectionMatch[0])
    if (idx > 0) body = body.slice(idx)
  }

  // Strip footer noise
  body = body.replace(/Love TLDR\?[\s\S]*$/i, '').trim()
  body = body.replace(/Share your referral[\s\S]*$/i, '').trim()

  // Split text into chunks by section headers
  const parts = body.split(sectionSplitRegex).filter(p => p.trim())

  const sections: ContentSection[] = []
  const allLinks: RawLink[] = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim()
    // Check if this part is a section header
    if (TLDR_SECTIONS.some(s => s.toLowerCase() === part.toLowerCase())) {
      const sectionTitle = stripEmojis(part)
      const sectionBody = (parts[i + 1] || '').trim()
      i++ // skip the body part

      const { links, body: formattedBody } = extractTldrArticles(sectionBody)
      for (const l of links) allLinks.push(l)

      sections.push({
        title: sectionTitle,
        body: formattedBody,
        links,
      })
    }
  }

  return { sections, links: allLinks }
}

/**
 * Extract articles from a TLDR section body text.
 * Splits on "(X minute read)" markers and extracts title + description pairs.
 * Strips sponsor blocks.
 */
function extractTldrArticles(text: string): { links: RawLink[]; body: string } {
  if (!text) return { links: [], body: '' }

  // Strip sponsor blocks
  let cleaned = text.replace(/[^.!?]*?\(Sponsor\)[\s\S]*?(?=.{10,120}?\(\d+\s+minute\s+read\)|$)/gi, ' ')
    .replace(/\s+/g, ' ').trim()

  const links: RawLink[] = []
  const bodyParts: string[] = []

  // Split by "(X minute read)" markers — each marker ends a title
  const markerRegex = /\((\d+\s+minute\s+read)\)/gi
  const markers: Array<{ readTime: string; start: number; end: number }> = []
  let match: RegExpExecArray | null
  while ((match = markerRegex.exec(cleaned)) !== null) {
    markers.push({ readTime: match[1], start: match.index, end: match.index + match[0].length })
  }

  if (markers.length === 0) return { links: [], body: cleaned }

  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i]
    // Title: text from end of previous marker (or start) to this marker
    const titleStart = i === 0 ? 0 : markers[i - 1].end
    let title = cleaned.slice(titleStart, marker.start).trim()

    // Description: text from end of this marker to start of next title
    const descEnd = i + 1 < markers.length ? markers[i + 1].start : cleaned.length
    let description = cleaned.slice(marker.end, descEnd).trim()

    // For i > 0, title may include previous description + actual title.
    // The title is typically the last sentence-like chunk (capitalized, no period ending).
    // Heuristic: take from last sentence boundary before the title
    if (i > 0) {
      // Find last sentence-ending punctuation followed by capital letter
      const sentenceEnd = title.match(/^([\s\S]*[.!?])\s+([A-Z][\s\S]*)$/)
      if (sentenceEnd) {
        title = sentenceEnd[2].trim()
      }
    }

    // Clean sponsor CTA bleed from title
    title = title.replace(/^.*?\b(?:today|now|here|free|try it|get started|sign up|learn more)\b\s*/i, '').trim()
    if (!title || title.length < 8) continue

    const label = `${title} (${marker.readTime})`
    links.push({ url: '', label })
    bodyParts.push(`${label}\n${description}`)
  }

  return { links, body: bodyParts.join('\n\n') }
}

function stripHtmlToText(html: string): string {
  return html
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

/**
 * Find which of the extracted links appear in a given HTML fragment.
 */
function findLinksInHtml(htmlFragment: string, allLinks: RawLink[]): RawLink[] {
  return allLinks.filter(link => htmlFragment.includes(link.url))
}
