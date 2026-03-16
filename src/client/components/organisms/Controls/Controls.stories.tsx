import type { Meta, StoryObj } from '@storybook/react-vite'
import { Controls } from './Controls'

const meta: Meta<typeof Controls> = {
  title: 'Organisms/Controls',
  component: Controls,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof Controls>

export const Default: Story = {
  args: {
    total: 42,
    limit: 25,
    onLimitChange: () => {},
    senders: ['TLDR', 'Morning Brew', 'Hacker News'],
    sender: '',
    onSenderChange: () => {},
    tags: ['AI', 'Security', 'DevOps', 'Cloud', 'Open Source'],
    activeTags: [],
    onTagToggle: () => {},
    onClearTags: () => {},
  },
}
export const WithActiveTags: Story = {
  args: {
    total: 42,
    limit: 25,
    onLimitChange: () => {},
    senders: ['TLDR'],
    sender: 'TLDR',
    onSenderChange: () => {},
    tags: ['AI', 'Security', 'DevOps'],
    activeTags: ['AI', 'Security'],
    onTagToggle: () => {},
    onClearTags: () => {},
  },
}
