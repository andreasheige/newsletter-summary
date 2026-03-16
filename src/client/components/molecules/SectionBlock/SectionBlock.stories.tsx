import type { Meta, StoryObj } from '@storybook/react-vite'
import { SectionBlock } from './SectionBlock'

const meta: Meta<typeof SectionBlock> = {
  title: 'Molecules/SectionBlock',
  component: SectionBlock,
}
export default meta
type Story = StoryObj<typeof SectionBlock>

export const WithLinks: Story = {
  args: {
    section: {
      title: 'Big Tech & Startups',
      body: '',
      links: [
        { label: 'OpenAI Launches GPT-5', url: 'https://example.com/1' },
        { label: 'Google Cloud Next Recap', url: 'https://example.com/2' },
      ],
    },
  },
}
export const TitleOnly: Story = {
  args: {
    section: {
      title: 'Quick Links',
      body: 'Some interesting content here.',
      links: [],
    },
  },
}
