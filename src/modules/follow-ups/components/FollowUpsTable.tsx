import { Button } from 'antd'
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
            render: (_: unknown, row: FollowUpRecord) => {
              if (!OPEN.has(row.status)) return '—'
              return (
                <div className="flex flex-wrap gap-1">
                  <Button type="link" size="small" className="!px-1" onClick={() => onComplete?.(row)}>
                    Complete
                  </Button>
                  <Button type="link" size="small" className="!px-1" onClick={() => onReschedule?.(row)}>
                    Reschedule
                  </Button>
                  <Button type="link" size="small" className="!px-1" danger onClick={() => onCancel?.(row)}>
                    Cancel
                  </Button>
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
