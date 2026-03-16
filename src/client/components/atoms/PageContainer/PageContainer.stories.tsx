import type { Meta, StoryObj } from '@storybook/react-vite'
import { PageContainer } from './PageContainer'

const meta: Meta<typeof PageContainer> = {
  title: 'Atoms/PageContainer',
  component: PageContainer,
}
export default meta
type Story = StoryObj<typeof PageContainer>

export const Default: Story = {
  args: {
    children: 'Content goes here',
    className: 'py-8 bg-bg-secondary',
  },
}
export const AsFooter: Story = {
  args: {
    as: 'footer',
    children: 'Footer content',
    className: 'border-t border-border p-4',
  },
}
