import type { Meta, StoryObj } from '@storybook/react-vite'
import { Header } from './Header'

const meta: Meta<typeof Header> = {
  title: 'Organisms/Header',
  component: Header,
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof Header>

export const Default: Story = {
  args: {
    status: { status: 'ok', newsletters: 42, source: 'Mail.app', llmProvider: 'openai', llmModel: 'gpt-4.1-mini', cronSchedule: '0 */6 * * *' },
    statusError: false,
    theme: 'light',
    onToggleTheme: () => {},
    onReload: () => {},
  },
}
export const Error: Story = {
  args: {
    status: null,
    statusError: true,
    theme: 'dark',
    onToggleTheme: () => {},
    onReload: () => {},
  },
}
