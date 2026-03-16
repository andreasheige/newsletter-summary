import { useState } from 'react'
import { Header } from './components/organisms/Header'
import { Hero } from './components/organisms/Hero'
import { Controls } from './components/organisms/Controls'
import { Feed } from './components/organisms/Feed'
import { Pagination } from './components/organisms/Pagination'
import { Footer } from './components/organisms/Footer'
import { useNewsletters } from './hooks/useNewsletters'
import { useSenders } from './hooks/useSenders'
import { useTags } from './hooks/useTags'
import { useStatus } from './hooks/useStatus'
import { useTheme } from './hooks/useTheme'

export function App() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [sender, setSender] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const { theme, toggle: toggleTheme } = useTheme()
  const { data, loading, reload } = useNewsletters(page, limit, sender)
  const senders = useSenders()
  const allTags = useTags()
  const { status, error: statusError } = useStatus()

  const filteredItems = activeTags.length > 0
    ? (data?.items ?? []).filter(item => activeTags.some(t => item.tags.includes(t)))
    : (data?.items ?? [])

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  const handleSenderChange = (newSender: string) => {
    setSender(newSender)
    setPage(1)
  }

  const handleTagToggle = (tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleClearTags = () => {
    setActiveTags([])
  }

  return (
    <>
      <Header
        status={status}
        statusError={statusError}
        theme={theme}
        onToggleTheme={toggleTheme}
        onReload={reload}
      />
      <main>
        <Hero />
        <Controls
          total={data?.total ?? 0}
          limit={limit}
          onLimitChange={handleLimitChange}
          senders={senders}
          sender={sender}
          onSenderChange={handleSenderChange}
          tags={allTags}
          activeTags={activeTags}
          onTagToggle={handleTagToggle}
          onClearTags={handleClearTags}
        />
        <Feed items={filteredItems} loading={loading} />
        {data && data.totalPages > 1 && limit !== 0 && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => p + 1)}
          />
        )}
      </main>
      <Footer />
    </>
  )
}
