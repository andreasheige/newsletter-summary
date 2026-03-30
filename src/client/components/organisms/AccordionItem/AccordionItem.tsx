import { useState } from 'react'
import clsx from 'clsx'
import { AccordionToggle } from '../../atoms/AccordionToggle'
import { TagDotList } from '../../molecules/TagDotList'
import { TagPillList } from '../../molecules/TagPillList'
import { SectionBlock } from '../../molecules/SectionBlock'
import { LinkItem } from '../../molecules/LinkItem'
import { stripEmojis, cleanSummary, isRealContent } from '../../../utils/text'
import { TAG_COLORS, tagColorIndex, getTagColor } from '../../../tagColors'
import type { AccordionItemProps } from './types'

export function AccordionItem({ item }: AccordionItemProps) {
  const [open, setOpen] = useState(false)

  const date = new Date(item.received_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  const contentSections = item.content?.sections?.filter(
    s => s.links.length > 0 || (s.title && isRealContent(s.body))
  ) ?? []
  const hasContent = contentSections.length > 0
  const flatLinks = (item.links ?? []).filter(l => l.url && l.url !== '#')

  const tagDots = item.tags.map(tag => ({
    tag,
    color: TAG_COLORS[tagColorIndex(tag)],
  }))

  const tagPills = item.tags.map(tag => ({
    tag,
    color: getTagColor(tag),
  }))

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
          <TagDotList tags={tagDots} size="xs" tooltipRight />
          <AccordionToggle open={open} />
        </div>
      </button>
      <div className={clsx(
        'max-h-0 overflow-hidden transition-[max-height] duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]',
        open && 'max-h-[2000px]'
      )}>
        <div className="pb-6">
          <TagPillList tags={tagPills} className="mb-4" />

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
                <LinkItem
                  key={i}
                  url={link.url}
                  label={link.title || link.url}
                  description={link.description}
                />
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  )
}
