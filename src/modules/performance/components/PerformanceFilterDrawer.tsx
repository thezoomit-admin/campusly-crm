import { useEffect, useState } from 'react'
import { Cancel01Icon, FilterIcon } from '@hugeicons/core-free-icons'
import HugeIcon from '@/components/ui/Icon/HugeIcon'
import { PrimaryButton } from '@/components/ui'
import type { PerformanceList, PerformanceQuery } from '../api/performanceApi'
import { PRESETS } from '../format'

const selectClass =
  'h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text'

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(' ')
}

type PerformanceFilterDrawerProps = {
  open: boolean
  draft: PerformanceQuery
  options?: PerformanceList['options']
  activeCount: number
  onOpen: () => void
  onClose: () => void
  onChange: (patch: Partial<PerformanceQuery>) => void
  onApply: () => void
  onReset: () => void
}

export default function PerformanceFilterDrawer({
  open,
  draft,
  options,
  activeCount,
  onOpen,
  onClose,
  onChange,
  onApply,
  onReset,
}: PerformanceFilterDrawerProps) {
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

  const handleApply = () => {
    onApply()
    handleClose()
  }

  return (
    <>
      <PrimaryButton
        variant="outline"
        size="md"
        icon={<HugeIcon icon={FilterIcon} size={16} />}
        onClick={onOpen}
        className="relative"
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
                <h2 className="text-lg leading-snug font-semibold text-text-strong">
                  Filters
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                  Narrow employee performance by date, team, channel, and score.
                </p>
              </div>
              <PrimaryButton
                type="button"
                variant="text"
                onClick={handleClose}
                className="-mt-0.5 -mr-1 shrink-0 rounded-full p-2 text-text-muted transition-colors hover:bg-hover-bg hover:text-text-strong"
                aria-label="Close filters"
                icon={<HugeIcon icon={Cancel01Icon} size={18} />}
              />
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="m-0 text-base font-semibold text-text">
                  Performance Filters
                </h3>
                <button
                  type="button"
                  className="h-auto cursor-pointer border-0 bg-transparent p-0 text-[0.78rem] font-semibold text-primary hover:text-primary-hover"
                  onClick={onReset}
                >
                  Reset
                </button>
              </div>

              <div className="grid gap-4">
                <label className="grid gap-1.5 text-xs font-semibold text-text-muted">
                  Date range
                  <select
                    className={selectClass}
                    value={draft.preset || 'this_month'}
                    onChange={(event) => onChange({ preset: event.target.value })}
                  >
                    {PRESETS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                {draft.preset === 'custom' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1.5 text-xs font-semibold text-text-muted">
                      From
                      <input
                        className={selectClass}
                        type="date"
                        value={draft.from || ''}
                        onChange={(event) => onChange({ from: event.target.value })}
                      />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold text-text-muted">
                      To
                      <input
                        className={selectClass}
                        type="date"
                        value={draft.to || ''}
                        onChange={(event) => onChange({ to: event.target.value })}
                      />
                    </label>
                  </div>
                ) : null}

                <label className="grid gap-1.5 text-xs font-semibold text-text-muted">
                  Department
                  <select
                    className={selectClass}
                    value={draft.departmentId || 'all'}
                    onChange={(event) =>
                      onChange({ departmentId: event.target.value })
                    }
                  >
                    <option value="all">All Teams</option>
                    {options?.departments.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-text-muted">
                  Employee
                  <select
                    className={selectClass}
                    value={draft.userId || 'all'}
                    onChange={(event) => onChange({ userId: event.target.value })}
                  >
                    <option value="all">All Employees</option>
                    {options?.employees.map((item) => (
                      <option key={item.userId} value={item.userId}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-text-muted">
                  Country
                  <select
                    className={selectClass}
                    value={draft.country || 'all'}
                    onChange={(event) => onChange({ country: event.target.value })}
                  >
                    <option value="all">All Countries</option>
                    {options?.countries.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-text-muted">
                  Lead source
                  <select
                    className={selectClass}
                    value={draft.source || 'all'}
                    onChange={(event) => onChange({ source: event.target.value })}
                  >
                    <option value="all">All Channels</option>
                    {options?.sources.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-text-muted">
                  Campaign
                  <select
                    className={selectClass}
                    value={draft.campaignId || 'all'}
                    onChange={(event) =>
                      onChange({ campaignId: event.target.value })
                    }
                  >
                    <option value="all">All Campaigns</option>
                    {options?.campaigns.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-text-muted">
                  Status
                  <select
                    className={selectClass}
                    value={draft.status || 'all'}
                    onChange={(event) => onChange({ status: event.target.value })}
                  >
                    <option value="all">All Statuses</option>
                    {options?.statuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-text-muted">
                  Priority
                  <select
                    className={selectClass}
                    value={draft.priority || 'all'}
                    onChange={(event) => onChange({ priority: event.target.value })}
                  >
                    <option value="all">All Priorities</option>
                    {options?.priorities.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1.5 text-xs font-semibold text-text-muted">
                    Score from
                    <input
                      className={selectClass}
                      type="number"
                      min={0}
                      value={draft.scoreMin || ''}
                      onChange={(event) =>
                        onChange({ scoreMin: event.target.value })
                      }
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-text-muted">
                    Score to
                    <input
                      className={selectClass}
                      type="number"
                      min={0}
                      value={draft.scoreMax || ''}
                      onChange={(event) =>
                        onChange({ scoreMax: event.target.value })
                      }
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border-subtle px-5 py-4 sm:px-6">
              <PrimaryButton
                variant="outline"
                size="md"
                label="Cancel"
                onClick={handleClose}
              />
              <PrimaryButton
                variant="primary"
                size="md"
                label="Apply Filters"
                onClick={handleApply}
              />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}
