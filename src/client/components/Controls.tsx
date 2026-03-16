import { useState, useRef, useEffect } from 'react'
import { getTagColor } from '../tagColors'

interface ControlsProps {
  total: number
  limit: number
  onLimitChange: (limit: number) => void
  senders: string[]
  sender: string
  onSenderChange: (sender: string) => void
  tags: string[]
  activeTags: string[]
  onTagToggle: (tag: string) => void
  onClearTags: () => void
}

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
  const [tagOpen, setTagOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tagOpen) return
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setTagOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [tagOpen])

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-8">
      <div className="border-b border-border pb-4 -mx-6 px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <p className="text-sm text-text-secondary">
            {total} newsletter{total !== 1 ? 's' : ''} summarized
          </p>
          <div className="flex items-center gap-4">
            <select
              className="sender-filter"
              value={sender}
              onChange={(e) => onSenderChange(e.target.value)}
            >
              <option value="">All senders</option>
              {senders.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <div className="relative" ref={dropRef}>
              <button
                className={`sender-filter text-left whitespace-nowrap ${activeTags.length > 0 ? '!border-text-primary' : ''}`}
                onClick={() => setTagOpen(!tagOpen)}
              >
                {activeTags.length === 0 ? 'All tags' : 'Tags'}
              </button>
              {tagOpen && (
                <div className="absolute top-[calc(100%+6px)] right-0 bg-bg border border-border rounded-xl p-2 min-w-[220px] max-h-80 overflow-y-auto z-50 shadow-lg">
                  <div className="flex flex-col gap-0.5">
                    {tags.map((tag) => {
                      const active = activeTags.includes(tag)
                      const color = getTagColor(tag)
                      return (
                        <button
                          key={tag}
                          className={`font-sans text-[0.78rem] flex items-center gap-2 px-2.5 py-1.5 border border-transparent rounded-full bg-transparent text-text-secondary cursor-pointer text-left transition-all whitespace-nowrap hover:text-text-primary hover:bg-bg-secondary ${active ? 'font-medium' : ''}`}
                          onClick={() => onTagToggle(tag)}
                          style={active
                            ? { background: color.bg, borderColor: color.border, color: color.dot }
                            : undefined
                          }
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color.dot }} />
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <select
              className="sender-filter"
              value={limit}
              onChange={(e) => onLimitChange(parseInt(e.target.value))}
            >
              {[25, 50, 75, 100].map((n) => (
                <option key={n} value={n}>{n} per page</option>
              ))}
              <option value={0}>All</option>
            </select>
          </div>
        </div>
        {activeTags.length > 0 && (
          <div className="flex items-center gap-2.5 pt-3">
            <div className="flex gap-1.5 items-center flex-wrap">
              {activeTags.map((tag) => {
                const color = getTagColor(tag)
                return (
                  <span
                    key={tag}
                    className="relative w-[9px] h-[9px] rounded-full shrink-0 cursor-pointer transition-transform hover:scale-[1.4] hover:opacity-70"
                    style={{ background: color.dot }}
                    data-tooltip={tag}
                    onClick={() => onTagToggle(tag)}
                  />
                )
              })}
            </div>
            <button
              className="font-sans text-lg leading-none text-text-secondary bg-transparent border-none cursor-pointer px-0.5 transition-colors hover:text-text-primary"
              onClick={onClearTags}
              title="Clear tag filters"
            >
              &times;
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
