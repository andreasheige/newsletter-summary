import type { Meta, StoryObj } from '@storybook/react-vite'
import { LinkItem } from './LinkItem'

const meta: Meta<typeof LinkItem> = {
  title: 'Molecules/LinkItem',
  component: LinkItem,
  decorators: [(Story) => <ul className="list-none p-0">{Story()}</ul>],
}
export default meta
type Story = StoryObj<typeof LinkItem>

export const Default: Story = {
  args: { url: 'https://example.com', label: 'Example Article' },
}
export const WithDescription: Story = {
  args: { url: 'https://example.com', label: 'AI Research Paper', description: 'New findings on transformer architectures' },
}
