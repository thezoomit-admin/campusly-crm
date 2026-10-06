import { useEffect, useState } from 'react'
import { DatePicker, Select } from 'antd'
import { Cancel01Icon, FilterIcon } from '@hugeicons/core-free-icons'
import dayjs, { type Dayjs } from 'dayjs'
import HugeIcon from '@/components/ui/Icon/HugeIcon'
import { PrimaryButton } from '@/components/ui'
import type { DatePreset, EmployeeScope, ReportFiltersState, ReportTabId, SavedReport } from '../types'
import { FILTER_OPTIONS } from '../data/mockAnalytics'

const { RangePicker } = DatePicker

const DATE_PRESETS: Array<{ id: DatePreset; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'custom', label: 'Custom Range' },
]

const linkBtn =
  'h-auto cursor-pointer border-0 bg-transparent p-0 text-[0.78rem] font-semibold text-primary hover:text-primary-hover'

type ReportFilterDrawerProps = {
  open: boolean
  filters: ReportFiltersState
  savedReports: SavedReport[]
  activeCount?: number
  onOpen: () => void
  onClose: () => void
  onChange: (patch: Partial<ReportFiltersState>) => void
  onReset: () => void
  onApplySaved: (tabId: ReportTabId) => void
  onViewAllSaved: () => void
  onSchedule: () => void
}

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(' ')
}

export default function ReportFilterDrawer({
  open,
  filters,
  savedReports,
  activeCount = 0,
  onOpen,
  onClose,
  onChange,
  onReset,
  onApplySaved,
  onViewAllSaved,
  onSchedule,
}: ReportFilterDrawerProps) {
  const [isPanelVisible, setIsPanelVisible] = useState(false)

  useEffect(() => {
    if (!open) {
      setIsPanelVisible(false)
      return
    }
    const frame = window.requestAnimationFrame(() => setIsPanelVisible(true))
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  const handleClose = () => {
    setIsPanelVisible(false)
    window.setTimeout(() => onClose(), 280)
  }

  const rangeValue: [Dayjs, Dayjs] | null =
    filters.customFrom && filters.customTo
      ? [dayjs(filters.customFrom), dayjs(filters.customTo)]
      : null

  return (
    <>
      <PrimaryButton
        variant="outline"
        size="md"
        icon={<HugeIcon icon={FilterIcon} size={16} />}
        onClick={onOpen}
        className="relative h-8"
        label="Filters"
      >
        {activeCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-on-primary">
            {activeCount}
          </span>
        ) : null}
      </PrimaryButton>

      {open ? (
        <div className="fixed inset-0 z-1000">
          <button
            type="button"
            className={cx(
              'absolute inset-0 cursor-pointer border-0 bg-black/40 transition-opacity duration-300 ease-out',
              isPanelVisible ? 'opacity-100' : 'opacity-0',
            )}
            aria-label="Close filters"
            onClick={handleClose}
          />
          <aside
            className={cx(
              'absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-hidden bg-surface shadow-card transition-transform duration-300 ease-out',
              isPanelVisible ? 'translate-x-0' : 'translate-x-full',
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-5 sm:px-6">
              <div className="min-w-0 pr-2">
                <h2 className="text-lg leading-snug font-semibold text-text-strong">Filters</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                  Narrow reports by date, employee, country, source, service, and status.
                </p>
              </div>
              <PrimaryButton
                type="button"
                onClick={handleClose}
                className="-mt-0.5 -mr-1 shrink-0 rounded-full p-2 text-text-muted transition-colors hover:bg-hover-bg hover:text-text-strong"
                aria-label="Close filters"
                icon={<HugeIcon icon={Cancel01Icon} size={18} />}
              />
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="m-0 text-base font-semibold text-text">Report Filters</h3>
                <button type="button" className={linkBtn} onClick={onReset}>
                  Reset
                </button>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <span className="text-[0.78rem] font-semibold text-text-muted">Date Range</span>
                  <div className="flex flex-wrap gap-1.5">
                    {DATE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => onChange({ datePreset: preset.id })}
                        className={cx(
                          'cursor-pointer rounded-lg border px-2.5 py-1.5 text-[0.75rem] font-medium transition-colors',
                          filters.datePreset === preset.id
                            ? 'border-primary bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] text-primary'
                            : 'border-border bg-transparent text-text-muted hover:bg-hover-bg hover:text-text',
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  {filters.datePreset === 'custom' ? (
                    <RangePicker
                      className="w-full"
                      value={rangeValue}
                      onChange={(values) => {
                        if (!values?.[0] || !values?.[1]) {
                          onChange({ customFrom: null, customTo: null })
                          return
                        }
                        if (values[0].isAfter(values[1])) return
                        onChange({
                          customFrom: values[0].format('YYYY-MM-DD'),
                          customTo: values[1].format('YYYY-MM-DD'),
                        })
                      }}
                    />
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <span className="text-[0.78rem] font-semibold text-text-muted">Employee</span>
                  <Select
                    className="w-full"
                    value={filters.employeeId}
                    options={FILTER_OPTIONS.employees}
                    onChange={(value) => onChange({ employeeId: value })}
                  />
                  <div className="flex gap-1.5">
                    {(['employee', 'team', 'department'] as EmployeeScope[]).map((scope) => (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => onChange({ employeeScope: scope })}
                        className={cx(
                          'flex-1 cursor-pointer rounded-lg border px-2 py-1.5 text-[0.72rem] font-semibold capitalize transition-colors',
                          filters.employeeScope === scope
                            ? 'border-primary bg-primary text-on-primary'
                            : 'border-border bg-transparent text-text-muted hover:bg-hover-bg',
                        )}
                      >
                        {scope}
                      </button>
                    ))}
                  </div>
                </div>

                {(
                  [
                    ['country', 'Country', FILTER_OPTIONS.countries],
                    ['leadSource', 'Lead Source', FILTER_OPTIONS.leadSources],
                    ['service', 'Service', FILTER_OPTIONS.services],
                    ['fileStatus', 'File Status', FILTER_OPTIONS.fileStatuses],
                    ['paymentStatus', 'Payment Status', FILTER_OPTIONS.paymentStatuses],
                  ] as const
                ).map(([key, label, options]) => (
                  <div key={key} className="grid gap-1.5">
                    <span className="text-[0.78rem] font-semibold text-text-muted">{label}</span>
                    <Select
                      className="w-full"
                      value={filters[key]}
                      options={options}
                      onChange={(value) => onChange({ [key]: value })}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-border-subtle pt-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="m-0 text-base font-semibold text-text">Saved Reports</h3>
                  <button type="button" className={linkBtn} onClick={onSchedule}>
                    Schedule
                  </button>
                </div>
                <ul className="m-0 grid list-none gap-2 p-0">
                  {savedReports.map((report) => (
                    <li key={report.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onApplySaved(report.tabId)
                          handleClose()
                        }}
                        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-border bg-[color-mix(in_srgb,var(--color-text)_2%,var(--color-surface))] px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-surface))]"
                      >
                        <span className="text-[0.86rem] font-medium text-text">{report.name}</span>
                        <span className="text-[0.72rem] font-semibold text-primary">Open</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" className={`${linkBtn} mt-3 text-[0.82rem]`} onClick={onViewAllSaved}>
                  View All Saved Reports
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}
