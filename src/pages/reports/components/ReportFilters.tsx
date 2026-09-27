import { FormInput } from '@/components/common/Forms'

type ReportFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  placeholder?: string
}

export default function ReportFilters({
  search,
  onSearchChange,
  placeholder = 'Search report metric…',
}: ReportFiltersProps) {
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
