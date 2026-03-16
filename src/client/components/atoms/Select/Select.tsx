import clsx from 'clsx'
import type { SelectProps } from './types'

export function Select({ value, options, onChange, className }: SelectProps) {
  return (
    <select
      className={clsx('sender-filter', className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
