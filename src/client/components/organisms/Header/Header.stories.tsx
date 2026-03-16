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
    status: { status: 'ok', newsletters: 42, source: 'Mail.app', ollamaUrl: 'http://localhost:11434', ollamaModel: 'llama3.2', cronSchedule: '0 */6 * * *' },
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
