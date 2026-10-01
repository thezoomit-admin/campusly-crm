import { Tooltip } from 'antd'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, CancelCircleIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { DataTable } from '@/components/common/Tables'
import type { FollowUpRecord } from '../types'
import { followUpColumns } from '../utils/followUpColumns'

const OPEN = new Set(['Pending', 'Due Soon', 'Overdue'])

type FollowUpsTableProps = {
  data: FollowUpRecord[]
  loading?: boolean
  page: number
  limit: number
  total: number
  canEdit?: boolean
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onComplete?: (row: FollowUpRecord) => void
  onReschedule?: (row: FollowUpRecord) => void
  onCancel?: (row: FollowUpRecord) => void
}

export default function FollowUpsTable({
  data,
  loading,
  page,
  limit,
  total,
  canEdit,
  onPageChange,
  onLimitChange,
  onComplete,
  onReschedule,
  onCancel,
}: FollowUpsTableProps) {
  const columns = [
    ...followUpColumns,
    ...(canEdit
      ? [
          {
            title: 'Actions',
            key: 'actions',
            width: 132,
            align: 'center' as const,
            render: (_: unknown, row: FollowUpRecord) => {
              if (!OPEN.has(row.status)) return '—'
              return (
                <div
                  className="flex items-center justify-center gap-1.5"
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <Tooltip title="Complete">
                    <button
                      type="button"
                      aria-label={`Complete follow-up for ${row.contact || 'contact'}`}
                      onClick={() => onComplete?.(row)}
                      className="grid size-8 cursor-pointer place-items-center rounded-lg border border-[#d1d5db] text-emerald-600 transition-colors hover:border-emerald-500 hover:bg-emerald-50"
                    >
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} color="currentColor" strokeWidth={1.7} />
                    </button>
                  </Tooltip>
                  <Tooltip title="Reschedule">
                    <button
                      type="button"
                      aria-label={`Reschedule follow-up for ${row.contact || 'contact'}`}
                      onClick={() => onReschedule?.(row)}
                      className="grid size-8 cursor-pointer place-items-center rounded-lg border border-[#d1d5db] text-primary transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      <HugeiconsIcon icon={Calendar03Icon} size={15} color="currentColor" strokeWidth={1.7} />
                    </button>
                  </Tooltip>
                  <Tooltip title="Cancel">
                    <button
                      type="button"
                      aria-label={`Cancel follow-up for ${row.contact || 'contact'}`}
                      onClick={() => onCancel?.(row)}
                      className="grid size-8 cursor-pointer place-items-center rounded-lg border border-[#d1d5db] text-red-500 transition-colors hover:border-red-400 hover:bg-red-50"
                    >
                      <HugeiconsIcon icon={CancelCircleIcon} size={15} color="currentColor" strokeWidth={1.7} />
                    </button>
                  </Tooltip>
                </div>
              )
            },
          },
        ]
      : []),
  ]

  return (
    <DataTable
      loading={loading}
      data={data}
      columns={columns}
      rowKey="id"
      isPaginate
      currentPage={page}
      setCurrentPage={onPageChange}
      limit={limit}
      setLimit={onLimitChange}
      total={total}
      showSizeChanger={total > 10}
    />
  )
}
