export interface ControlsProps {
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
