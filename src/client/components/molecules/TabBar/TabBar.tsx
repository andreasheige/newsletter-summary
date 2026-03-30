import clsx from 'clsx'
import type { TabId } from '../../../../shared/types'

interface TabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'newsletters', label: 'Newsletters' },
  { id: 'trending', label: 'Trending' },
  { id: 'status', label: 'Status' },
]

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="bg-bg border-b border-border">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 flex gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium transition-colors -mb-px',
              tab.id === activeTab
                ? 'border-b-2 border-text-link text-text-link'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
