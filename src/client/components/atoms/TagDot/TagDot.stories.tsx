import type { Meta, StoryObj } from '@storybook/react-vite'
import { TagDot } from './TagDot'

const meta: Meta<typeof TagDot> = {
  title: 'Atoms/TagDot',
  component: TagDot,
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm'] },
  },
}
export default meta
type Story = StoryObj<typeof TagDot>

export const Small: Story = {
  args: { tag: 'AI', color: { bg: '#e8f0fe', border: '#a4c2f4', dot: '#4a86d4' }, size: 'xs' },
}
export const Medium: Story = {
  args: { tag: 'Security', color: { bg: '#fce8e6', border: '#f4a4a0', dot: '#d44a44' }, size: 'sm' },
}
export const Clickable: Story = {
  args: { tag: 'DevOps', color: { bg: '#e6f4ea', border: '#a0d4a8', dot: '#3a9e4a' }, size: 'sm', onClick: () => {} },
}
