import clsx from 'clsx'
import { ExternalLink } from '../../atoms/ExternalLink'
import { stripEmojis } from '../../../utils/text'
import type { SectionBlockProps } from './types'

export function SectionBlock({ section, className }: SectionBlockProps) {
  return (
    <div className={clsx('pb-3 border-b border-border last:border-b-0', className)}>
      {section.title && (
        <h4 className="text-[0.95rem] font-semibold tracking-tight mb-1.5 text-text-primary">
          {stripEmojis(section.title)}
        </h4>
      )}
      {section.links.length > 0 && (
        <ul className="list-none mt-5 p-0 flex flex-col gap-2.5">
          {section.links.map((link, i) => (
            <li key={i} className="text-sm leading-relaxed">
              <ExternalLink href={link.url || '#'}>
                {link.label || link.url}
              </ExternalLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
