import type { Meta, StoryObj } from '@storybook/react-vite'
import { AccordionToggle } from './AccordionToggle'

const meta: Meta<typeof AccordionToggle> = {
  title: 'Atoms/AccordionToggle',
  component: AccordionToggle,
  argTypes: {
    open: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof AccordionToggle>

export const Closed: Story = { args: { open: false } }
export const Open: Story = { args: { open: true } }
