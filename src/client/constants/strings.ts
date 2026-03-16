// App title
export const APP_TITLE = 'Newsletter'
export const APP_TITLE_SUFFIX = 'Summary'

// Hero
export const HERO_LINES = ['Your newsletters,', 'distilled.']

// Footer
export const FOOTER_TEXT = 'Powered by Ollama \u00b7 Design inspired by'
export const FOOTER_LINK_TEXT = 'Grebban'
export const FOOTER_LINK_URL = 'https://grebban.com'

// Empty state
export const EMPTY_TITLE = 'No newsletters yet'
export const EMPTY_DESCRIPTION =
  'Click "Check Now" to fetch newsletters from Mail.app.\nThey\'ll be summarized automatically with Ollama.'

// Loading
export const LOADING_TEXT = 'Loading...'

// Theme toggle
export const THEME_TOGGLE_LIGHT_ICON = '\u263E' // ☾
export const THEME_TOGGLE_DARK_ICON = '\u2600' // ☀
export const THEME_TOGGLE_LABEL = (current: 'light' | 'dark') =>
  `Switch to ${current === 'dark' ? 'light' : 'dark'} mode`

// Action buttons
export const BTN_RESUMMARIZE = 'Resummarize'
export const BTN_REFETCH = 'Refetch'
export const BTN_CHECK_NOW = 'Check Now'

// Tooltip
export const TOOLTIP_BUSY = 'Please wait \u2014 another action is in progress'

// Status messages
export const STATUS_RUNNING = (type: string) => `Running: ${type}...`
export const STATUS_UNREACHABLE = 'Cannot reach server'
export const STATUS_INFO = (count: number, model: string) =>
  `${count} newsletters | Model: ${model}`
export const STATUS_CHECKING = 'Checking status...'
export const STATUS_DONE_ERROR = 'Error'

// Filter labels
export const ALL_SENDERS = 'All senders'
export const ALL_TAGS = 'All tags'
export const TAGS_LABEL = 'Tags'
export const CLEAR_TAGS_TITLE = 'Clear tag filters'

// Pagination labels
export const PAGE_PREV = 'Previous'
export const PAGE_NEXT = 'Next'
export const PAGE_OF = (page: number, totalPages: number) =>
  `Page ${page} of ${totalPages}`

// Controls summary
export const NEWSLETTERS_SUMMARIZED = (total: number) =>
  `${total} newsletter${total !== 1 ? 's' : ''} summarized`
