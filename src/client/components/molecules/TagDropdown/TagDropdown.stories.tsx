import type { Meta, StoryObj } from '@storybook/react-vite'
import { TagDropdown } from './TagDropdown'

const sampleTags = [
  { tag: 'AI', color: { bg: '#e8f0fe', border: '#a4c2f4', dot: '#4a86d4' } },
  { tag: 'Security', color: { bg: '#fce8e6', border: '#f4a4a0', dot: '#d44a44' } },
  { tag: 'DevOps', color: { bg: '#e6f4ea', border: '#a0d4a8', dot: '#3a9e4a' } },
  { tag: 'Cloud', color: { bg: '#fef7e0', border: '#f4d88a', dot: '#c49a1a' } },
  { tag: 'Open Source', color: { bg: '#f3e8fd', border: '#c4a0f4', dot: '#8a4ad4' } },
]

const meta: Meta<typeof TagDropdown> = {
  title: 'Molecules/TagDropdown',
  component: TagDropdown,
}
export default meta
type Story = StoryObj<typeof TagDropdown>

export const NoActive: Story = {
  args: { tags: sampleTags, activeTags: [], onTagToggle: () => {} },
}
export const WithActive: Story = {
  args: { tags: sampleTags, activeTags: ['AI', 'Security'], onTagToggle: () => {} },
}
