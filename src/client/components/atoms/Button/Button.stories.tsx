import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  argTypes: {
    variant: { control: 'select', options: ['primary', 'outline', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md'] },
    state: { control: 'select', options: ['idle', 'loading', 'done', 'error'] },
    disabled: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = { args: { children: 'Check Now', variant: 'primary' } }
export const Outline: Story = { args: { children: 'Refetch', variant: 'outline' } }
export const Ghost: Story = { args: { children: '☾', variant: 'ghost', size: 'sm' } }
export const Loading: Story = { args: { children: 'Resummarize', state: 'loading' } }
export const Done: Story = { args: { children: '5/5', state: 'done' } }
export const Error: Story = { args: { children: 'Error', state: 'error' } }
export const Disabled: Story = { args: { children: 'Check Now', disabled: true } }
