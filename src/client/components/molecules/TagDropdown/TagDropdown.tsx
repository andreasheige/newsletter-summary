import { useState, useRef } from 'react'
import clsx from 'clsx'
import { useClickOutside } from '../../../hooks/useClickOutside'
import type { TagDropdownProps } from './types'

export function TagDropdown({ tags, activeTags, onTagToggle, className }: TagDropdownProps) {
  const [open, setOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useClickOutside(dropRef, () => setOpen(false), open)

  return (
    <div className={clsx('relative', className)} ref={dropRef}>
      <button
        className={clsx(
          'sender-filter text-left whitespace-nowrap',
          activeTags.length > 0 && '!border-text-primary',
        )}
        onClick={() => setOpen(!open)}
      >
        {activeTags.length === 0 ? 'All tags' : 'Tags'}
      </button>
      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 bg-bg border border-border rounded-xl p-2 min-w-[220px] max-h-80 overflow-y-auto z-50 shadow-lg">
          <div className="flex flex-col gap-0.5">
            {tags.map(({ tag, color }) => {
              const active = activeTags.includes(tag)
              return (
                <button
                  key={tag}
                  className={clsx(
                    'font-sans text-[0.78rem] flex items-center gap-2 px-2.5 py-1.5 border border-transparent rounded-full bg-transparent text-text-secondary cursor-pointer text-left transition-all whitespace-nowrap hover:text-text-primary hover:bg-bg-secondary',
                    active && 'font-medium',
                  )}
                  onClick={() => onTagToggle(tag)}
                  style={active ? { background: color.bg, borderColor: color.border, color: color.dot } : undefined}
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
  )
}
