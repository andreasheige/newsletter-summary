import { useState } from 'react'
import type { Newsletter, ContentSection } from '../../shared/types'
import { TAG_COLORS, TAG_COLORS_DARK, tagColorIndex, getTagColor } from '../tagColors'

function stripEmojis(text: string): string {
  if (!text) return ''
  return text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{1F3FB}-\u{1F3FF}\u{2B50}\u{2B55}\u{2934}\u{2935}\u{25AA}-\u{25FE}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{3030}\u{303D}\u{3297}\u{3299}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{200B}\u{200C}\u{200D}\u{FEFF}]+/gu, '')
    .replace(/\s+([,.:;!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Check if a section body is real content vs junk (MIME, raw headers, etc.) */
function isRealContent(body: string): boolean {
  if (!body || body.length < 20) return false
  // Junk indicators: MIME headers, raw email source, "Sign Up" TLDR header noise
  if (/^(Delivered-To:|Received:|From:|DKIM|ARC-|Sign Up \|)/i.test(body)) return false
  if (/Content-Type:|boundary=/i.test(body.slice(0, 200))) return false
  return true
}

/** Clean summary text: strip LLM preamble, trailing tags text */
function cleanSummary(text: string): string {
  if (!text) return ''
  return text
    .replace(/^Here(?:'s| is) (?:a |the )?summary[^:]*:\s*/i, '')
    .replace(/^Summary:\s*/i, '')
    // Strip trailing tags in all LLM formats: JSON array, bullets, numbered list
    .replace(/\s*(?:Here are \d+ topic )?[Tt]ags:?\s*[\s\S]*$/i, '')
    .trim()
}

interface AccordionItemProps {
  item: Newsletter
}

function SectionBlock({ section }: { section: ContentSection }) {
  return (
    <div className="content-section">
      {section.title && <h4 className="section-title">{stripEmojis(section.title)}</h4>}
      {section.links.length > 0 && (
        <ul className="link-list">
          {section.links.map((link, i) => (
            <li key={i} className="link-item">
              <a href={link.url || '#'} target="_blank" rel="noopener noreferrer">
                {link.label || link.url}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function AccordionItem({ item }: AccordionItemProps) {
  const [open, setOpen] = useState(false)

  const date = new Date(item.received_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  // Content sections: only show if they have real content (not junk MIME)
  const contentSections = item.content?.sections?.filter(
    s => s.links.length > 0 || (s.title && isRealContent(s.body))
  ) ?? []
  const hasContent = contentSections.length > 0

  // Flat links from old format (title + description)
  const flatLinks = item.links ?? []

  return (
    <div className={`accordion ${open ? 'open' : ''}`}>
      <button className="accordion-header" onClick={() => setOpen(!open)}>
        <div className="accordion-meta">
          <div className="accordion-subject">{stripEmojis(item.subject)}</div>
          <div className="accordion-info">
            <span>{item.sender}</span>
            <span>{date}</span>
          </div>
        </div>
        <div className="accordion-right">
          {item.tags.length > 0 && (
            <div className="tag-dots">
              {item.tags.map((tag, i) => {
                const color = TAG_COLORS[tagColorIndex(tag)]
                return (
                  <span
                    key={i}
                    className="tag-dot"
                    style={{ background: color.dot }}
                    data-tooltip={tag}
                  />
                )
              })}
            </div>
          )}
          <span className="accordion-toggle">+</span>
        </div>
      </button>
      <div className="accordion-body">
        <div className="accordion-content">
          {item.tags.length > 0 && (
            <div className="tags">
              {item.tags.map((tag, i) => {
                const color = getTagColor(tag)
                return (
                  <span
                    key={i}
                    className="tag"
                    style={{ background: color.bg, borderColor: color.border, color: color.dot }}
                  >
                    {tag}
                  </span>
                )
              })}
            </div>
          )}

          <p className="summary-text">{cleanSummary(item.summary)}</p>

          {hasContent ? (
            <div className="content-sections">
              {contentSections.map((section, i) => (
                <SectionBlock key={i} section={section} />
              ))}
            </div>
          ) : flatLinks.length > 0 ? (
            <ul className="link-list">
              {flatLinks.map((link, i) => (
                <li key={i} className="link-item">
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.title || link.url}
                  </a>
                  {link.description && (
                    <span className="link-desc"> — {link.description}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  )
}
