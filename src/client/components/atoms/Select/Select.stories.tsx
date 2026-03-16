import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select } from './Select'

const meta: Meta<typeof Select> = {
  title: 'Atoms/Select',
  component: Select,
}
export default meta
type Story = StoryObj<typeof Select>

export const Senders: Story = {
  args: {
    value: '',
    options: [
      { value: '', label: 'All senders' },
      { value: 'TLDR', label: 'TLDR' },
      { value: 'Morning Brew', label: 'Morning Brew' },
    ],
  },
}
export const PerPage: Story = {
  args: {
    value: '25',
    options: [
      { value: '25', label: '25 per page' },
      { value: '50', label: '50 per page' },
      { value: '75', label: '75 per page' },
      { value: '100', label: '100 per page' },
      { value: '0', label: 'All' },
    ],
  },
}
