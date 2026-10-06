import { Search01Icon, UserMultiple02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { AdminFilterDrawer, countActiveFilters } from '@/components/common/Filters'
import { FormInput } from '@/components/common/Forms'
import { PrimaryButton } from '@/components/ui'
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
  duplicatesOnly?: boolean
  onDuplicatesOnlyChange?: (value: boolean) => void
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
  duplicatesOnly = false,
  onDuplicatesOnlyChange,
}: LeadFiltersProps) {
  const sourceOptions = useNamedOptions('LEAD_SOURCE')
  const countryOptions = useNamedOptions('COUNTRY')
  const activeCount = countActiveFilters(filters)

  return (
    <div className="leads-filters flex w-full min-w-0 items-center gap-2 pb-3 min-[961px]:ml-auto min-[961px]:h-[58px] min-[961px]:w-auto min-[961px]:shrink-0 min-[961px]:pb-0">
      <FormInput
        allowClear
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by name, phone, email..."
        prefix={<HugeiconsIcon icon={Search01Icon} size={16} color="currentColor" strokeWidth={1.7} />}
        className="leads-list-search min-w-0 flex-1 min-[961px]:w-[280px] min-[961px]:max-w-[42vw] min-[961px]:flex-none"
      />
      <AdminFilterDrawer
        title="Filters"
        description="Narrow the pipeline by source, priority, or destination country."
        buttonLabel="Filters"
        buttonClassName="leads-filter-btn shrink-0"
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
      {onDuplicatesOnlyChange ? (
        <PrimaryButton
          variant={duplicatesOnly ? 'primary' : 'outline'}
          className="leads-filter-btn shrink-0"
          icon={<HugeiconsIcon icon={UserMultiple02Icon} size={16} color="currentColor" strokeWidth={1.7} />}
          label="Duplicate"
          aria-pressed={duplicatesOnly}
          onClick={() => onDuplicatesOnlyChange(!duplicatesOnly)}
        />
      ) : null}
    </div>
  )
}
