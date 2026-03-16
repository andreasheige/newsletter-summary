import type { Meta, StoryObj } from '@storybook/react-vite'
import { AccordionItem } from './AccordionItem'

const meta: Meta<typeof AccordionItem> = {
  title: 'Organisms/AccordionItem',
  component: AccordionItem,
}
export default meta
type Story = StoryObj<typeof AccordionItem>

const sampleItem = {
  id: 1,
  subject: '\u{1F680} TLDR Newsletter - AI Takes Over the World',
  sender: 'TLDR',
  received_at: '2026-03-15T10:00:00Z',
  summary: 'Here is a summary of the latest tech news covering AI developments, new product launches, and programming trends.',
  tags: ['AI', 'Product Launch', 'Programming'],
  links: [
    { url: 'https://example.com/1', title: 'OpenAI GPT-5 Released', description: 'The next generation of language models' },
    { url: 'https://example.com/2', title: 'React 20 Announced', description: '' },
  ],
  content: { sections: [], links: [] },
  created_at: '2026-03-15T10:00:00Z',
}

export const Collapsed: Story = {
  args: { item: sampleItem },
}
