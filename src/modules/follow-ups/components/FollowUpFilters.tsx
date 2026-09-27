import { FormInput } from '@/components/common/Forms'

type FollowUpFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  placeholder?: string
}

export default function FollowUpFilters({
  search,
  onSearchChange,
  placeholder = 'Search contact, owner, type…',
}: FollowUpFiltersProps) {
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
