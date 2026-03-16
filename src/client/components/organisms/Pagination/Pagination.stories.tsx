import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pagination } from './Pagination'

const meta: Meta<typeof Pagination> = {
  title: 'Organisms/Pagination',
  component: Pagination,
}
export default meta
type Story = StoryObj<typeof Pagination>

export const FirstPage: Story = { args: { page: 1, totalPages: 5, onPrev: () => {}, onNext: () => {} } }
export const MiddlePage: Story = { args: { page: 3, totalPages: 5, onPrev: () => {}, onNext: () => {} } }
export const LastPage: Story = { args: { page: 5, totalPages: 5, onPrev: () => {}, onNext: () => {} } }
