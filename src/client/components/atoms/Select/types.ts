export interface SelectOption {
  value: string | number
  label: string
}

export interface SelectProps {
  value: string | number
  options: SelectOption[]
  onChange: (value: string) => void
  className?: string
}
