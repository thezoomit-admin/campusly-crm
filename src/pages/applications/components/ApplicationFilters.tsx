import { FormInput } from '@/components/common/Forms'

type ApplicationFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  placeholder?: string
}

export default function ApplicationFilters({
  search,
  onSearchChange,
  placeholder = 'Search applicant, university, program…',
}: ApplicationFiltersProps) {
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
