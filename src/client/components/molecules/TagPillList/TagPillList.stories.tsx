import type { Meta, StoryObj } from '@storybook/react-vite'
import { TagPillList } from './TagPillList'

const sampleTags = [
  { tag: 'AI', color: { bg: '#e8f0fe', border: '#a4c2f4', dot: '#4a86d4' } },
  { tag: 'Security', color: { bg: '#fce8e6', border: '#f4a4a0', dot: '#d44a44' } },
  { tag: 'DevOps', color: { bg: '#e6f4ea', border: '#a0d4a8', dot: '#3a9e4a' } },
]

const meta: Meta<typeof TagPillList> = {
  title: 'Molecules/TagPillList',
  component: TagPillList,
}
export default meta
type Story = StoryObj<typeof TagPillList>

export const Default: Story = { args: { tags: sampleTags } }
