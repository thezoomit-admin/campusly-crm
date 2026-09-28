import { Input } from 'antd'
import { Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { AdminFilterDrawer, countActiveFilters } from '@/components/common/Filters'
import { useListMasterDataOptionsQuery } from '@/redux/features/masterData/masterDataApi'

export type LeadFilterValues = {
  source: string
  priority: string
  country: string
}

export const EMPTY_LEAD_FILTERS: LeadFilterValues = {
  source: '',
  priority: '',
  country: '',
}

type LeadFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  filters: LeadFilterValues
  onFiltersChange: (value: LeadFilterValues) => void
}

function useNamedOptions(category: string) {
  const { data } = useListMasterDataOptionsQuery({ category })
  return (data?.items || [])
    .filter((item) => item.name)
    .map((item) => ({ label: item.name, value: item.name }))
}

export default function LeadFilters({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
}: LeadFiltersProps) {
  const sourceOptions = useNamedOptions('LEAD_SOURCE')
  const countryOptions = useNamedOptions('COUNTRY')
  const activeCount = countActiveFilters(filters)

  return (
    <div className="ml-auto flex h-[58px] shrink-0 items-center gap-2">
      <Input
        allowClear
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by name, phone, email..."
        prefix={<HugeiconsIcon icon={Search01Icon} size={16} color="currentColor" strokeWidth={1.7} />}
        className="leads-list-search w-[280px] max-w-[42vw]"
      />
      <AdminFilterDrawer
        title="Filters"
        description="Narrow the pipeline by source, priority, or destination country."
        buttonLabel="Filters"
        buttonClassName="leads-filter-btn"
        value={filters}
        defaultValue={EMPTY_LEAD_FILTERS}
        activeCount={activeCount}
        onApply={onFiltersChange}
        fields={[
          {
            key: 'source',
            label: 'Source',
            type: 'select',
            placeholder: 'All sources',
            allowClear: true,
            showSearch: true,
            options: sourceOptions,
          },
          {
            key: 'priority',
            label: 'Priority',
            type: 'select',
            placeholder: 'All priorities',
            allowClear: true,
            options: [
              { label: 'High', value: 'High' },
              { label: 'Medium', value: 'Medium' },
              { label: 'Low', value: 'Low' },
            ],
          },
          {
            key: 'country',
            label: 'Country',
            type: 'select',
            placeholder: 'All countries',
            allowClear: true,
            showSearch: true,
            options: countryOptions,
          },
        ]}
      />
    </div>
  )
}
