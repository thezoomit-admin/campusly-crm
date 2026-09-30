import { Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { PrimaryButton } from '@/components/ui'
import { FormInput, FormSelect } from '@/components/common/Forms'
import { useListMasterDataOptionsQuery } from '@/redux/features/masterData/masterDataApi'

export type MyLeadFilterValues = {
  status: string
  country: string
  source: string
  priority: string
  followUpStatus: string
}

export const EMPTY_MY_LEAD_FILTERS: MyLeadFilterValues = {
  status: '',
  country: '',
  source: '',
  priority: '',
  followUpStatus: '',
}

export const FOLLOW_UP_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: "Today's Follow-ups", value: 'today' },
  { label: 'Overdue', value: 'overdue' },
]

type MyLeadsFiltersProps = {
  search: string
  filters: MyLeadFilterValues
  onSearchChange: (value: string) => void
  onFiltersChange: (value: MyLeadFilterValues) => void
  onSearch: () => void
  onReset: () => void
}

function useNamedOptions(category: string) {
  const { data } = useListMasterDataOptionsQuery({ category })
  return (data?.items || [])
    .filter((item) => item.name)
    .map((item) => ({ label: item.name, value: item.name }))
}

export default function MyLeadsFilters({
  search,
  filters,
  onSearchChange,
  onFiltersChange,
  onSearch,
  onReset,
}: MyLeadsFiltersProps) {
  const statusOptions = useNamedOptions('LEAD_STATUS')
  const countryOptions = useNamedOptions('COUNTRY')
  const sourceOptions = useNamedOptions('LEAD_SOURCE')

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <FormInput
        allowClear
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        onPressEnter={onSearch}
        placeholder="Search by Lead ID, student name, or phone number"
        prefix={<HugeiconsIcon icon={Search01Icon} size={16} color="currentColor" strokeWidth={1.7} />}
        className="leads-list-search w-full max-w-xl"
      />
      <div className="flex flex-wrap items-center gap-2">
        <FormSelect
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Current Status"
          className="min-w-[160px] flex-1"
          value={filters.status || undefined}
          options={statusOptions}
          onChange={(value) => onFiltersChange({ ...filters, status: value || '' })}
        />
        <FormSelect
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Preferred Country"
          className="min-w-[160px] flex-1"
          value={filters.country || undefined}
          options={countryOptions}
          onChange={(value) => onFiltersChange({ ...filters, country: value || '' })}
        />
        <FormSelect
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Lead Source"
          className="min-w-[160px] flex-1"
          value={filters.source || undefined}
          options={sourceOptions}
          onChange={(value) => onFiltersChange({ ...filters, source: value || '' })}
        />
        <FormSelect
          allowClear
          placeholder="Priority"
          className="min-w-[140px] flex-1"
          value={filters.priority || undefined}
          options={[
            { label: 'High', value: 'High' },
            { label: 'Medium', value: 'Medium' },
            { label: 'Low', value: 'Low' },
          ]}
          onChange={(value) => onFiltersChange({ ...filters, priority: value || '' })}
        />
        <FormSelect
          allowClear
          placeholder="Follow-up Status"
          className="min-w-[180px] flex-1"
          value={filters.followUpStatus || undefined}
          options={FOLLOW_UP_STATUS_OPTIONS}
          onChange={(value) => onFiltersChange({ ...filters, followUpStatus: value || '' })}
        />
        <PrimaryButton type="button" onClick={onSearch}>
          Search
        </PrimaryButton>
        <PrimaryButton type="button" variant="outline" onClick={onReset}>
          Reset
        </PrimaryButton>
      </div>
    </div>
  )
}
