import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatusDot } from './StatusDot'

const meta: Meta<typeof StatusDot> = {
  title: 'Atoms/StatusDot',
  component: StatusDot,
  argTypes: {
    status: { control: 'select', options: ['ok', 'error', 'busy', 'unknown'] },
  },
}
export default meta
type Story = StoryObj<typeof StatusDot>

export const Ok: Story = { args: { status: 'ok', title: '5 newsletters | Model: llama3.2' } }
export const Error: Story = { args: { status: 'error', title: 'Cannot reach server' } }
export const Busy: Story = { args: { status: 'busy', title: 'Running: check...' } }
export const Unknown: Story = { args: { status: 'unknown', title: 'Checking status...' } }
