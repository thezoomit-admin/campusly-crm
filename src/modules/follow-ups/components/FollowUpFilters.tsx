import { Button, Select } from 'antd'
import { HugeiconsIcon } from '@hugeicons/react'
import { RefreshIcon } from '@hugeicons/core-free-icons'
import { FormInput } from '@/components/common/Forms'
import {
  FOLLOW_UP_PRIORITIES,
  FOLLOW_UP_TYPES,
} from '../types'

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Due Soon', label: 'Due Soon' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Rescheduled', label: 'Rescheduled' },
  { value: 'Cancelled', label: 'Cancelled' },
]

const controlClass =
  'h-10 shrink-0 [&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:!items-center'

type FollowUpFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  type?: string
  onTypeChange: (value?: string) => void
  priority?: string
  onPriorityChange: (value?: string) => void
  status?: string
  onStatusChange: (value?: string) => void
  onReset: () => void
}

export default function FollowUpFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  priority,
  onPriorityChange,
  status,
  onStatusChange,
  onReset,
}: FollowUpFiltersProps) {
  return (
    <div className="flex w-full min-w-0 flex-nowrap items-center gap-2.5 overflow-x-auto pb-0.5">
      <FormInput.Search
        allowClear
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        onSearch={onSearchChange}
        placeholder="Search contact, owner, purpose..."
        className="h-10 min-w-[220px] flex-1 basis-[240px] [&_.ant-input-affix-wrapper]:!h-10"
      />

      <Select
        allowClear
        placeholder="All Types"
        className={`w-[140px] ${controlClass}`}
        value={type}
        onChange={(value) => onTypeChange(value)}
        options={FOLLOW_UP_TYPES.map((value) => ({ value, label: value }))}
      />

      <Select
        allowClear
        placeholder="All Priorities"
        className={`w-[140px] ${controlClass}`}
        value={priority}
        onChange={(value) => onPriorityChange(value)}
        options={FOLLOW_UP_PRIORITIES.map((value) => ({ value, label: value }))}
      />

      <Select
        allowClear
        placeholder="All Status"
        className={`w-[140px] ${controlClass}`}
        value={status}
        onChange={(value) => onStatusChange(value)}
        options={STATUS_OPTIONS}
      />

      <Button
        onClick={onReset}
        className="inline-flex h-10 shrink-0 items-center"
        icon={<HugeiconsIcon icon={RefreshIcon} size={14} color="currentColor" strokeWidth={1.8} />}
      >
        Reset
      </Button>
    </div>
  )
}
