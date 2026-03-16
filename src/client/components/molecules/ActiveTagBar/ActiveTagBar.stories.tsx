import type { Meta, StoryObj } from '@storybook/react-vite'
import { ActiveTagBar } from './ActiveTagBar'

const sampleTags = [
  { tag: 'AI', color: { bg: '#e8f0fe', border: '#a4c2f4', dot: '#4a86d4' } },
  { tag: 'Security', color: { bg: '#fce8e6', border: '#f4a4a0', dot: '#d44a44' } },
  { tag: 'DevOps', color: { bg: '#e6f4ea', border: '#a0d4a8', dot: '#3a9e4a' } },
]

const meta: Meta<typeof ActiveTagBar> = {
  title: 'Molecules/ActiveTagBar',
  component: ActiveTagBar,
}
export default meta
type Story = StoryObj<typeof ActiveTagBar>

export const Default: Story = {
  args: { tags: sampleTags, onTagToggle: () => {}, onClearTags: () => {} },
}
