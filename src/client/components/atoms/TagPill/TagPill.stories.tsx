import type { Meta, StoryObj } from '@storybook/react-vite'
import { TagPill } from './TagPill'

const meta: Meta<typeof TagPill> = {
  title: 'Atoms/TagPill',
  component: TagPill,
}
export default meta
type Story = StoryObj<typeof TagPill>

export const Active: Story = {
  args: { tag: 'AI', color: { bg: '#e8f0fe', border: '#a4c2f4', dot: '#4a86d4' }, active: true },
}
export const Inactive: Story = {
  args: { tag: 'Security', color: { bg: '#fce8e6', border: '#f4a4a0', dot: '#d44a44' }, active: false },
}
