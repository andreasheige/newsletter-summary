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
    <section className="controls">
      <div className="controls-inner">
        <div className="controls-row">
          <p className="count-label">
            {total} newsletter{total !== 1 ? 's' : ''} summarized
          </p>
          <div className="controls-right">
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

            <div className="tag-filter-wrap" ref={dropRef}>
              <button
                className={`sender-filter tag-filter-btn ${activeTags.length > 0 ? 'has-active' : ''}`}
                onClick={() => setTagOpen(!tagOpen)}
              >
                {activeTags.length === 0 ? 'All tags' : 'Tags'}
              </button>
              {tagOpen && (
                <div className="tag-dropdown">
                  <div className="tag-dropdown-list">
                    {tags.map((tag) => {
                      const active = activeTags.includes(tag)
                      const color = getTagColor(tag)
                      return (
                        <button
                          key={tag}
                          className={`tag-dropdown-item ${active ? 'active' : ''}`}
                          onClick={() => onTagToggle(tag)}
                          style={active
                            ? { background: color.bg, borderColor: color.border, color: color.dot }
                            : undefined
                          }
                        >
                          <span className="tag-dropdown-dot" style={{ background: color.dot }} />
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
          <div className="active-tags-bar">
            <div className="active-tag-dots">
              {activeTags.map((tag) => {
                const color = getTagColor(tag)
                return (
                  <span
                    key={tag}
                    className="active-tag-dot"
                    style={{ background: color.dot }}
                    data-tooltip={tag}
                    onClick={() => onTagToggle(tag)}
                  />
                )
              })}
            </div>
            <button className="tag-clear-btn" onClick={onClearTags} title="Clear tag filters">
              &times;
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
