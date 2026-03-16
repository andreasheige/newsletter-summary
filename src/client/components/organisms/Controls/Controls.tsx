import { Select } from '../../atoms/Select'
import { TagDropdown } from '../../molecules/TagDropdown'
import { ActiveTagBar } from '../../molecules/ActiveTagBar'
import { getTagColor } from '../../../tagColors'
import type { ControlsProps } from './types'

export function Controls({
  total,
  limit,
  onLimitChange,
  senders,
  sender,
  onSenderChange,
  tags,
  activeTags,
  onTagToggle,
  onClearTags,
}: ControlsProps) {
  const senderOptions = [
    { value: '', label: 'All senders' },
    ...senders.map(s => ({ value: s, label: s })),
  ]

  const limitOptions = [
    { value: 25, label: '25 per page' },
    { value: 50, label: '50 per page' },
    { value: 75, label: '75 per page' },
    { value: 100, label: '100 per page' },
    { value: 0, label: 'All' },
  ]

  const tagDropdownItems = tags.map(tag => ({ tag, color: getTagColor(tag) }))
  const activeTagItems = activeTags.map(tag => ({ tag, color: getTagColor(tag) }))

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-8">
      <div className="border-b border-border pb-4 -mx-6 px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <p className="text-sm text-text-secondary">
            {total} newsletter{total !== 1 ? 's' : ''} summarized
          </p>
          <div className="flex items-center gap-4">
            <Select
              value={sender}
              options={senderOptions}
              onChange={onSenderChange}
            />
            <TagDropdown
              tags={tagDropdownItems}
              activeTags={activeTags}
              onTagToggle={onTagToggle}
            />
            <Select
              value={limit}
              options={limitOptions}
              onChange={(v) => onLimitChange(parseInt(v))}
            />
          </div>
        </div>
        <ActiveTagBar
          tags={activeTagItems}
          onTagToggle={onTagToggle}
          onClearTags={onClearTags}
        />
      </div>
    </section>
  )
}
