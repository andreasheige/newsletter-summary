import type { Meta, StoryObj } from '@storybook/react-vite'
import { EmptyState } from './EmptyState'

const meta: Meta<typeof EmptyState> = {
  title: 'Atoms/EmptyState',
  component: EmptyState,
}
export default meta
type Story = StoryObj<typeof EmptyState>

export const Default: Story = {
  args: {
    title: 'No newsletters yet',
    description: 'Click "Check Now" to fetch newsletters from Mail.app.\nThey\'ll be summarized automatically with Ollama.',
  },
}
