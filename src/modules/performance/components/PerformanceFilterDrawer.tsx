import { useEffect, useState } from 'react'
import { Select } from 'antd'
import { Cancel01Icon, FilterIcon } from '@hugeicons/core-free-icons'
import HugeIcon from '@/components/ui/Icon/HugeIcon'
import { PrimaryButton } from '@/components/ui'
import type { PerformanceList, PerformanceQuery } from '../api/performanceApi'
import { PRESETS } from '../format'

const inputClass =
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
                <div className="grid gap-1.5">
                  <span className="text-xs font-semibold text-text-muted">Date range</span>
                  <Select
                    className="w-full"
                    value={draft.preset || 'this_month'}
                    options={PRESETS.map((item) => ({
                      value: item.id,
                      label: item.label,
                    }))}
                    onChange={(value) => onChange({ preset: value })}
                  />
                </div>

                {draft.preset === 'custom' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1.5 text-xs font-semibold text-text-muted">
                      From
                      <input
                        className={inputClass}
                        type="date"
                        value={draft.from || ''}
                        onChange={(event) => onChange({ from: event.target.value })}
                      />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold text-text-muted">
                      To
                      <input
                        className={inputClass}
                        type="date"
                        value={draft.to || ''}
                        onChange={(event) => onChange({ to: event.target.value })}
                      />
                    </label>
                  </div>
                ) : null}

                <div className="grid gap-1.5">
                  <span className="text-xs font-semibold text-text-muted">Department</span>
                  <Select
                    className="w-full"
                    value={draft.departmentId || 'all'}
                    options={[
                      { value: 'all', label: 'All Teams' },
                      ...(options?.departments.map((item) => ({
                        value: item.id,
                        label: item.name,
                      })) ?? []),
                    ]}
                    onChange={(value) => onChange({ departmentId: value })}
                  />
                </div>

                <div className="grid gap-1.5">
                  <span className="text-xs font-semibold text-text-muted">Employee</span>
                  <Select
                    className="w-full"
                    value={draft.userId || 'all'}
                    options={[
                      { value: 'all', label: 'All Employees' },
                      ...(options?.employees.map((item) => ({
                        value: item.userId,
                        label: item.name,
                      })) ?? []),
                    ]}
                    onChange={(value) => onChange({ userId: value })}
                  />
                </div>

                <div className="grid gap-1.5">
                  <span className="text-xs font-semibold text-text-muted">Country</span>
                  <Select
                    className="w-full"
                    value={draft.country || 'all'}
                    options={[
                      { value: 'all', label: 'All Countries' },
                      ...(options?.countries.map((item) => ({
                        value: item,
                        label: item,
                      })) ?? []),
                    ]}
                    onChange={(value) => onChange({ country: value })}
                  />
                </div>

                <div className="grid gap-1.5">
                  <span className="text-xs font-semibold text-text-muted">Lead source</span>
                  <Select
                    className="w-full"
                    value={draft.source || 'all'}
                    options={[
                      { value: 'all', label: 'All Channels' },
                      ...(options?.sources.map((item) => ({
                        value: item,
                        label: item,
                      })) ?? []),
                    ]}
                    onChange={(value) => onChange({ source: value })}
                  />
                </div>

                <div className="grid gap-1.5">
                  <span className="text-xs font-semibold text-text-muted">Campaign</span>
                  <Select
                    className="w-full"
                    value={draft.campaignId || 'all'}
                    options={[
                      { value: 'all', label: 'All Campaigns' },
                      ...(options?.campaigns.map((item) => ({
                        value: item.id,
                        label: item.name,
                      })) ?? []),
                    ]}
                    onChange={(value) => onChange({ campaignId: value })}
                  />
                </div>

                <div className="grid gap-1.5">
                  <span className="text-xs font-semibold text-text-muted">Status</span>
                  <Select
                    className="w-full"
                    value={draft.status || 'all'}
                    options={[
                      { value: 'all', label: 'All Statuses' },
                      ...(options?.statuses.map((item) => ({
                        value: item,
                        label: item,
                      })) ?? []),
                    ]}
                    onChange={(value) => onChange({ status: value })}
                  />
                </div>

                <div className="grid gap-1.5">
                  <span className="text-xs font-semibold text-text-muted">Priority</span>
                  <Select
                    className="w-full"
                    value={draft.priority || 'all'}
                    options={[
                      { value: 'all', label: 'All Priorities' },
                      ...(options?.priorities.map((item) => ({
                        value: item,
                        label: item,
                      })) ?? []),
                    ]}
                    onChange={(value) => onChange({ priority: value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1.5 text-xs font-semibold text-text-muted">
                    Score from
                    <input
                      className={inputClass}
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
                      className={inputClass}
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
