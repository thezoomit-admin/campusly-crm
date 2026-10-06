import type { Dayjs } from 'dayjs'
import { RefreshIcon, Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { PrimaryButton } from '@/components/ui'
import { FormDatePicker, FormInput, FormSelect } from '@/components/common/Forms'
import { useListMasterDataOptionsQuery } from '@/redux/features/masterData/masterDataApi'

export type LeadPoolFilterValues = {
  country: string
  source: string
  createdRange: [Dayjs | null, Dayjs | null] | null
}

export const EMPTY_LEAD_POOL_FILTERS: LeadPoolFilterValues = {
  country: '',
  source: '',
  createdRange: null,
}

type LeadPoolFiltersProps = {
  search: string
  filters: LeadPoolFilterValues
  onSearchChange: (value: string) => void
  onFiltersChange: (value: LeadPoolFilterValues) => void
  onRefresh: () => void
  refreshing?: boolean
}

function useNamedOptions(category: string) {
  const { data } = useListMasterDataOptionsQuery({ category })
  return (data?.items || [])
    .filter((item) => item.name)
    .map((item) => ({ label: item.name, value: item.name }))
}

export default function LeadPoolFilters({
  search,
  filters,
  onSearchChange,
  onFiltersChange,
  onRefresh,
  refreshing = false,
}: LeadPoolFiltersProps) {
  const sourceOptions = useNamedOptions('LEAD_SOURCE')
  const countryOptions = useNamedOptions('COUNTRY')

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-4">
      <FormInput
        allowClear
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by Lead ID, student name, or phone number"
        prefix={<HugeiconsIcon icon={Search01Icon} size={16} color="currentColor" strokeWidth={1.7} />}
        className="leads-list-search min-w-[220px] flex-1"
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
      <FormDatePicker.Range
        allowClear
        className="min-w-[220px] flex-1"
        value={filters.createdRange}
        onChange={(dates) => onFiltersChange({ ...filters, createdRange: dates })}
      />
      <PrimaryButton
        type="button"
        variant="outline"
        onClick={onRefresh}
        loading={refreshing}
        icon={<HugeiconsIcon icon={RefreshIcon} size={15} />}
        label="Refresh"
      />
    </div>
  )
}
