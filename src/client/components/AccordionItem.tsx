import { useState } from 'react'
import clsx from 'clsx'
import type { Newsletter, ContentSection } from '../../shared/types'
import { TAG_COLORS, tagColorIndex, getTagColor } from '../tagColors'

function stripEmojis(text: string): string {
  if (!text) return ''
  return text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{1F3FB}-\u{1F3FF}\u{2B50}\u{2B55}\u{2934}\u{2935}\u{25AA}-\u{25FE}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{3030}\u{303D}\u{3297}\u{3299}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{200B}\u{200C}\u{200D}\u{FEFF}]+/gu, '')
    .replace(/\s+([,.:;!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function isRealContent(body: string): boolean {
  if (!body || body.length < 20) return false
  if (/^(Delivered-To:|Received:|From:|DKIM|ARC-|Sign Up \|)/i.test(body)) return false
  if (/Content-Type:|boundary=/i.test(body.slice(0, 200))) return false
  return true
}

function cleanSummary(text: string): string {
  if (!text) return ''
  return text
    .replace(/^Here(?:'s| is) (?:a |the )?summary[^:]*:\s*/i, '')
    .replace(/^Summary:\s*/i, '')
    .replace(/\s*(?:Here are \d+ topic )?[Tt]ags:?\s*[\s\S]*$/i, '')
    .trim()
}

interface AccordionItemProps {
  item: Newsletter
}

function SectionBlock({ section }: { section: ContentSection }) {
  return (
    <div className="pb-3 border-b border-border last:border-b-0">
      {section.title && (
        <h4 className="text-[0.95rem] font-semibold tracking-tight mb-1.5 text-text-primary">{stripEmojis(section.title)}</h4>
      )}
      {section.links.length > 0 && (
        <ul className="list-none mt-5 p-0 flex flex-col gap-2.5">
          {section.links.map((link, i) => (
            <li key={i} className="text-sm leading-relaxed">
              <a
                href={link.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-primary no-underline font-medium border-b border-border hover:border-text-primary transition-colors"
              >
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

  const contentSections = item.content?.sections?.filter(
    s => s.links.length > 0 || (s.title && isRealContent(s.body))
  ) ?? []
  const hasContent = contentSections.length > 0
  const flatLinks = item.links ?? []

  return (
    <div className={clsx(
      '-mx-6 px-6 border-b border-border transition-colors',
      open && 'bg-bg-secondary'
    )}>
      <button
        className="w-full bg-transparent border-none py-6 cursor-pointer text-left grid grid-cols-[1fr_auto] gap-6 items-start font-sans text-text-primary transition-opacity hover:opacity-60"
        onClick={() => setOpen(!open)}
      >
        <div className="flex flex-col gap-1.5">
          <div className="text-xl font-medium tracking-tight leading-snug sm:text-[1.25rem]">
            {stripEmojis(item.subject)}
          </div>
          <div className="text-[0.8rem] text-text-secondary flex gap-4 flex-wrap">
            <span>{item.sender}</span>
            <span>{date}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 mt-1">
          {item.tags.length > 0 && (
            <div className="flex gap-[5px] items-center">
              {item.tags.map((tag, i) => {
                const color = TAG_COLORS[tagColorIndex(tag)]
                return (
                  <span
                    key={i}
                    className="tooltip-right relative w-[7px] h-[7px] rounded-full shrink-0"
                    style={{ background: color.dot }}
                    data-tooltip={tag}
                  />
                )
              })}
            </div>
          )}
          <span className={clsx(
            'text-2xl font-light leading-none transition-transform shrink-0',
            open && 'rotate-45'
          )}>+</span>
        </div>
      </button>
      <div className={clsx(
        'max-h-0 overflow-hidden transition-[max-height] duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]',
        open && 'max-h-[2000px]'
      )}>
        <div className="pb-6">
          {item.tags.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {item.tags.map((tag, i) => {
                const color = getTagColor(tag)
                return (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 border rounded-full tracking-wide lowercase"
                    style={{ background: color.bg, borderColor: color.border, color: color.dot }}
                  >
                    {tag}
                  </span>
                )
              })}
            </div>
          )}

          <p className="text-base leading-relaxed text-text-primary max-w-[720px]">
            {cleanSummary(item.summary)}
          </p>

          {hasContent ? (
            <div className="mt-5 flex flex-col gap-5">
              {contentSections.map((section, i) => (
                <SectionBlock key={i} section={section} />
              ))}
            </div>
          ) : flatLinks.length > 0 ? (
            <ul className="list-none mt-5 p-0 flex flex-col gap-2.5">
              {flatLinks.map((link, i) => (
                <li key={i} className="text-sm leading-relaxed">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-primary no-underline font-medium border-b border-border hover:border-text-primary transition-colors"
                  >
                    {link.title || link.url}
                  </a>
                  {link.description && (
                    <span className="text-text-secondary font-normal"> — {link.description}</span>
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
