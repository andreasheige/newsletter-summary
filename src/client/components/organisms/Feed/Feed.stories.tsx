import type { Meta, StoryObj } from '@storybook/react-vite'
import { Feed } from './Feed'

const meta: Meta<typeof Feed> = {
  title: 'Organisms/Feed',
  component: Feed,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof Feed>

export const Loading: Story = { args: { items: [], loading: true } }
export const Empty: Story = { args: { items: [], loading: false } }
export const WithItems: Story = {
  args: {
    loading: false,
    items: [
      {
        id: 1,
        subject: 'TLDR Newsletter - AI News',
        sender: 'TLDR',
        received_at: '2026-03-15T10:00:00Z',
        summary: 'Latest AI developments and tech news.',
        tags: ['AI', 'Tech'],
        links: [],
        content: { sections: [], links: [] },
        created_at: '2026-03-15T10:00:00Z',
      },
    ],
  },
}
