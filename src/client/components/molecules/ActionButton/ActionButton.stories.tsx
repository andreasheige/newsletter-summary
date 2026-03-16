import type { Meta, StoryObj } from '@storybook/react-vite'
import { ActionButton } from './ActionButton'

const meta: Meta<typeof ActionButton> = {
  title: 'Molecules/ActionButton',
  component: ActionButton,
  argTypes: {
    state: { control: 'select', options: ['idle', 'loading', 'done', 'error'] },
    disabled: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof ActionButton>

export const Idle: Story = { args: { label: 'Check Now', state: 'idle', onClick: () => {} } }
export const Loading: Story = { args: { label: 'Resummarize', state: 'loading', disabled: true, onClick: () => {} } }
export const DisabledWithTooltip: Story = {
  args: { label: 'Refetch', state: 'idle', disabled: true, tooltip: 'Please wait — another action is in progress', onClick: () => {} },
}
export const Done: Story = { args: { label: '5/5', state: 'done', onClick: () => {} } }
export const Error: Story = { args: { label: 'Error', state: 'error', onClick: () => {} } }
