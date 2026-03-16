import type { Meta, StoryObj } from '@storybook/react-vite'
import { TagDotList } from './TagDotList'

const sampleTags = [
  { tag: 'AI', color: { bg: '#e8f0fe', border: '#a4c2f4', dot: '#4a86d4' } },
  { tag: 'Security', color: { bg: '#fce8e6', border: '#f4a4a0', dot: '#d44a44' } },
  { tag: 'DevOps', color: { bg: '#e6f4ea', border: '#a0d4a8', dot: '#3a9e4a' } },
]

const meta: Meta<typeof TagDotList> = {
  title: 'Molecules/TagDotList',
  component: TagDotList,
}
export default meta
type Story = StoryObj<typeof TagDotList>

export const Small: Story = { args: { tags: sampleTags, size: 'xs' } }
export const Medium: Story = { args: { tags: sampleTags, size: 'sm' } }
export const Clickable: Story = { args: { tags: sampleTags, size: 'sm', onClick: () => {} } }
