import { FormInput } from '@/components/common/Forms'

type LeadFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  placeholder?: string
}

export default function LeadFilters({
  search,
  onSearchChange,
  placeholder = 'Search lead, phone, country…',
}: LeadFiltersProps) {
  return (
    <FormInput.Search
      allowClear
      value={search}
      onChange={(event) => onSearchChange(event.target.value)}
      onSearch={onSearchChange}
      placeholder={placeholder}
    />
  )
}
