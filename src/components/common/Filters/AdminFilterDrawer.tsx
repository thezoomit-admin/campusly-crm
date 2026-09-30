import type { Dayjs } from 'dayjs'
import { Cancel01Icon, FilterIcon } from '@hugeicons/core-free-icons'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import HugeIcon from '@/components/ui/Icon/HugeIcon'
import { PrimaryButton } from '@/components/ui'
import { FormDatePicker, FormInputNumber, FormSelect, FormSwitch } from '@/components/common/Forms'

export type FilterValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | [Dayjs | null, Dayjs | null]
  | [number | null, number | null]

export type FilterValues = Record<string, FilterValue>

export type FilterOption = {
  label: ReactNode
  value: string | number | boolean
  searchLabel?: string
}

type BaseField = {
  key: string
  label: string
  helperText?: string
}

export type SelectFilterField = BaseField & {
  type: 'select'
  placeholder?: string
  options: FilterOption[]
  loading?: boolean
  showSearch?: boolean
  allowClear?: boolean
  includeAllOption?: boolean
  allLabel?: string
}

export type DateRangeFilterField = BaseField & {
  type: 'dateRange'
  format?: string
}

export type NumberRangeFilterField = BaseField & {
  type: 'numberRange'
  minPlaceholder?: string
  maxPlaceholder?: string
  min?: number
  max?: number
}

export type SwitchFilterField = BaseField & {
  type: 'switch'
  checkedLabel?: string
  uncheckedLabel?: string
}

export type CustomFilterField = BaseField & {
  type: 'custom'
  render: (value: FilterValue, setValue: (value: FilterValue) => void) => ReactNode
}

export type FilterField =
  | SelectFilterField
  | DateRangeFilterField
  | NumberRangeFilterField
  | SwitchFilterField
  | CustomFilterField

type AdminFilterDrawerProps<TValues extends FilterValues> = {
  title?: string
  description?: string
  fields: FilterField[]
  value: TValues
  defaultValue: TValues
  onApply: (value: TValues) => void
  activeCount?: number
  buttonLabel?: string
  buttonClassName?: string
}

function isEmptyValue(value: FilterValue): boolean {
  if (value === undefined || value === null || value === '') return true
  if (Array.isArray(value)) {
    return value.every((item) => item == null)
  }
  return false
}

export function countActiveFilters(values: FilterValues): number {
  return Object.values(values).reduce<number>((count, value) => count + (isEmptyValue(value) ? 0 : 1), 0)
}

export default function AdminFilterDrawer<TValues extends FilterValues>({
  title = 'Filters',
  description,
  fields,
  value,
  defaultValue,
  onApply,
  activeCount,
  buttonLabel = 'Filter',
  buttonClassName = '',
}: AdminFilterDrawerProps<TValues>) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPanelVisible, setIsPanelVisible] = useState(false)
  const [draftValue, setDraftValue] = useState<TValues>(value)

  useEffect(() => {
    if (!isOpen) setDraftValue(value)
  }, [isOpen, value])

  const resolvedActiveCount = useMemo(
    () => activeCount ?? countActiveFilters(value),
    [activeCount, value],
  )

  const openDrawer = () => {
    setDraftValue(value)
    setIsOpen(true)
    window.requestAnimationFrame(() => setIsPanelVisible(true))
  }

  const closeDrawer = () => {
    setIsPanelVisible(false)
    window.setTimeout(() => setIsOpen(false), 260)
  }

  const updateDraftValue = (key: string, nextValue: FilterValue) => {
    setDraftValue((previous) => ({ ...previous, [key]: nextValue }))
  }

  const applyDraft = () => {
    onApply(draftValue)
    closeDrawer()
  }

  const renderField = (field: FilterField) => {
    const fieldValue = draftValue[field.key]

    if (field.type === 'select') {
      return (
        <FormSelect
          placeholder={field.loading ? 'Loading...' : field.placeholder}
          value={isEmptyValue(fieldValue) ? undefined : fieldValue}
          onChange={(nextValue) => updateDraftValue(field.key, nextValue)}
          className="w-full"
          showSearch={field.showSearch}
          allowClear={field.allowClear ?? true}
          optionFilterProp="label"
          loading={field.loading}
          options={[
            ...(field.includeAllOption
              ? [{ value: '', label: field.allLabel ?? 'All' }]
              : []),
            ...field.options.map((option) => ({
              value: option.value as string | number,
              label: option.label,
            })),
          ]}
        />
      )
    }

    if (field.type === 'dateRange') {
      return (
        <FormDatePicker.Range
          value={(fieldValue as [Dayjs | null, Dayjs | null] | undefined) ?? null}
          onChange={(dates) => updateDraftValue(field.key, dates)}
          className="w-full"
          format={field.format ?? 'YYYY-MM-DD'}
          allowClear
        />
      )
    }

    if (field.type === 'numberRange') {
      const rangeValue = (fieldValue as [number | null, number | null] | undefined) ?? [null, null]
      const toNumber = (value: string | number | null) => (typeof value === 'number' ? value : null)
      return (
        <div className="grid grid-cols-2 gap-3">
          <FormInputNumber
            value={rangeValue[0]}
            min={field.min}
            max={field.max}
            placeholder={field.minPlaceholder ?? 'Min'}
            className="w-full"
            onChange={(nextValue) => updateDraftValue(field.key, [toNumber(nextValue), rangeValue[1]])}
          />
          <FormInputNumber
            value={rangeValue[1]}
            min={field.min}
            max={field.max}
            placeholder={field.maxPlaceholder ?? 'Max'}
            className="w-full"
            onChange={(nextValue) => updateDraftValue(field.key, [rangeValue[0], toNumber(nextValue)])}
          />
        </div>
      )
    }

    if (field.type === 'switch') {
      return (
        <div className="flex items-center justify-between rounded-lg border border-header-border px-3 py-2">
          <span className="text-sm text-text-muted">
            {fieldValue ? field.checkedLabel ?? 'Enabled' : field.uncheckedLabel ?? 'Disabled'}
          </span>
          <FormSwitch checked={Boolean(fieldValue)} onChange={(checked) => updateDraftValue(field.key, checked)} />
        </div>
      )
    }

    return field.render(fieldValue, (nextValue) => updateDraftValue(field.key, nextValue))
  }

  return (
    <>
      <PrimaryButton
        variant="outline"
        icon={<HugeIcon icon={FilterIcon} size={16} />}
        onClick={openDrawer}
        className={`relative ${buttonClassName}`.trim()} label={<>{buttonLabel}
        {resolvedActiveCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-on-primary">
            {resolvedActiveCount}
          </span>
        ) : null}</>} />

      {isOpen ? (
        <div className="fixed inset-0 z-1000">
          <PrimaryButton
            type="button"
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${isPanelVisible ? 'opacity-100' : 'opacity-0'}`}
            aria-label="Close filters"
            onClick={closeDrawer}
          />
          <aside
            className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-hidden bg-surface shadow-card transition-transform duration-300 ease-out ${isPanelVisible ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-5 sm:px-6">
              <div className="min-w-0 pr-2">
                <h2 className="text-lg leading-snug font-semibold text-text-strong">{title}</h2>
                {description ? <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{description}</p> : null}
              </div>
              <PrimaryButton
                type="button"
                onClick={closeDrawer}
                className="-mt-0.5 -mr-1 shrink-0 rounded-full p-2 text-text-muted transition-colors hover:bg-hover-bg hover:text-text-strong"
                aria-label="Close filters"
              >
                <HugeIcon icon={Cancel01Icon} size={18} />
              </PrimaryButton>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-6">
                {fields.map((field) => (
                  <div key={field.key} className="flex flex-col gap-2">
                    <label className="block text-sm leading-none font-medium text-text-strong">{field.label}</label>
                    {renderField(field)}
                    {field.helperText ? <p className="text-xs leading-relaxed text-text-muted">{field.helperText}</p> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-border-subtle bg-page-bg px-5 py-4 sm:px-6">
              <PrimaryButton
                type="button"
                onClick={() => setDraftValue(defaultValue)}
                className="h-11 flex-1 rounded-lg border border-header-border px-4 text-sm font-medium text-text-strong transition-colors hover:bg-surface" label="Reset" />
              <PrimaryButton
                type="button"
                onClick={applyDraft}
                className="h-11 flex-1 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover" label="Show results" />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}
