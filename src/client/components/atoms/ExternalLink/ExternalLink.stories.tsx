import type { Meta, StoryObj } from '@storybook/react-vite'
import { ExternalLink } from './ExternalLink'

const meta: Meta<typeof ExternalLink> = {
  title: 'Atoms/ExternalLink',
  component: ExternalLink,
}
export default meta
type Story = StoryObj<typeof ExternalLink>

export const Default: Story = {
  args: { href: 'https://example.com', children: 'Example Link' },
}
