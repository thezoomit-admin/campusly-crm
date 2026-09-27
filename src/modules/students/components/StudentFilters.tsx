import { FormInput } from '@/components/common/Forms'

type StudentFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  placeholder?: string
}

export default function StudentFilters({
  search,
  onSearchChange,
  placeholder = 'Search student, ID, destination…',
}: StudentFiltersProps) {
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
