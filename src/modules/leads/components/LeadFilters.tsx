import { useMemo } from 'react'
import { Checkbox, Dropdown } from 'antd'
import { LayoutThreeColumnIcon, Search01Icon, UserMultiple02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { FormInput, FormSelect } from '@/components/common/Forms'
import { PrimaryButton } from '@/components/ui'
import { useListMasterDataOptionsQuery } from '@/redux/features/masterData/masterDataApi'
import {
  LEAD_COLUMN_OPTIONS,
  type LeadColumnKey,
} from '../utils/leadColumns'

export type LeadFilterValues = {
  status: string
  source: string
  priority: string
  country: string
}

export const EMPTY_LEAD_FILTERS: LeadFilterValues = {
  status: '',
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
  /** Show pipeline status select (main leads list). */
  showStatusFilter?: boolean
  /** Include closed-lead columns in the Columns picker. */
  showCloseMetaColumns?: boolean
  visibleColumns?: LeadColumnKey[]
  onVisibleColumnsChange?: (value: LeadColumnKey[]) => void
  /** Keep false until the page list query has been dispatched. */
  loadOptions?: boolean
}

function useNamedOptions(category: string, enabled: boolean) {
  const { data } = useListMasterDataOptionsQuery({ category }, { skip: !enabled })
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
  showStatusFilter = false,
  showCloseMetaColumns = false,
  visibleColumns,
  onVisibleColumnsChange,
  loadOptions = true,
}: LeadFiltersProps) {
  const statusOptions = useNamedOptions('LEAD_STATUS', loadOptions)
  const sourceOptions = useNamedOptions('LEAD_SOURCE', loadOptions)
  const countryOptions = useNamedOptions('COUNTRY', loadOptions)

  const columnOptions = useMemo(
    () =>
      LEAD_COLUMN_OPTIONS.filter(
        (item) => showCloseMetaColumns || !item.closedOnly,
      ),
    [showCloseMetaColumns],
  )

  function toggleColumn(key: LeadColumnKey, checked: boolean) {
    if (!visibleColumns || !onVisibleColumnsChange) return
    const option = LEAD_COLUMN_OPTIONS.find((item) => item.key === key)
    if (option?.locked) return

    if (checked) {
      const next = columnOptions
        .map((item) => item.key)
        .filter((item) => visibleColumns.includes(item) || item === key)
      onVisibleColumnsChange(next)
      return
    }

    const next = visibleColumns.filter((item) => item !== key)
    // Keep at least Lead + Action visible.
    if (!next.includes('name')) next.unshift('name')
    if (!next.includes('actions')) next.push('actions')
    onVisibleColumnsChange(next)
  }

  return (
    <div className="leads-filters flex w-full min-w-0 flex-wrap items-center gap-2 px-3 py-2.5 min-[961px]:px-4">
      <FormInput
        allowClear
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by name, phone, email..."
        prefix={<HugeiconsIcon icon={Search01Icon} size={14} color="currentColor" strokeWidth={1.7} />}
        className="leads-list-search min-w-[260px] flex-[2]"
      />
      {showStatusFilter ? (
        <FormSelect
          allowClear
          showSearch
          size="middle"
          optionFilterProp="label"
          placeholder="Status"
          className="leads-inline-filter min-w-[110px] flex-1"
          value={filters.status || undefined}
          options={statusOptions}
          onChange={(value) => onFiltersChange({ ...filters, status: value || '' })}
        />
      ) : null}
      <FormSelect
        allowClear
        showSearch
        size="middle"
        optionFilterProp="label"
        placeholder="Source"
        className="leads-inline-filter min-w-[110px] flex-1"
        value={filters.source || undefined}
        options={sourceOptions}
        onChange={(value) => onFiltersChange({ ...filters, source: value || '' })}
      />
      <FormSelect
        allowClear
        size="middle"
        placeholder="Priority"
        className="leads-inline-filter min-w-[100px] flex-1"
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
        showSearch
        size="middle"
        optionFilterProp="label"
        placeholder="Country"
        className="leads-inline-filter min-w-[110px] flex-1"
        value={filters.country || undefined}
        options={countryOptions}
        onChange={(value) => onFiltersChange({ ...filters, country: value || '' })}
      />
      {onVisibleColumnsChange && visibleColumns ? (
        <Dropdown
          trigger={['click']}
          placement="bottomRight"
          align={{ overflow: { adjustY: false } }}
          getPopupContainer={(node) => node.parentElement || document.body}
          dropdownRender={() => (
            <div className="leads-columns-dropdown w-[320px] rounded-xl border border-border bg-surface p-2 shadow-soft">
              <p className="m-0 px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Columns
              </p>
              <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                {columnOptions.map((item) => {
                  const checked = visibleColumns.includes(item.key)
                  return (
                    <label
                      key={item.key}
                      className={`flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-text hover:bg-hover-bg ${
                        item.locked ? 'opacity-70' : ''
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={item.locked}
                        onChange={(event) =>
                          toggleColumn(item.key, event.target.checked)
                        }
                      />
                      <span className="min-w-0 truncate">{item.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        >
          <PrimaryButton
            type="button"
            variant="outline"
            size="sm"
            className="leads-filter-btn shrink-0"
            icon={
              <HugeiconsIcon
                icon={LayoutThreeColumnIcon}
                size={14}
                color="currentColor"
                strokeWidth={1.7}
              />
            }
            label="Columns"
          />
        </Dropdown>
      ) : null}
      {onDuplicatesOnlyChange ? (
        <PrimaryButton
          variant={duplicatesOnly ? 'primary' : 'outline'}
          size="sm"
          className="leads-filter-btn shrink-0"
          icon={<HugeiconsIcon icon={UserMultiple02Icon} size={14} color="currentColor" strokeWidth={1.7} />}
          label="Duplicate"
          aria-pressed={duplicatesOnly}
          onClick={() => onDuplicatesOnlyChange(!duplicatesOnly)}
        />
      ) : null}
    </div>
  )
}
