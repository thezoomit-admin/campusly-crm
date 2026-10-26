import { useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Calendar03Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Notification03Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { DataTable, type DataTableActionItem } from '@/components/common/Tables'
import type { FollowUpRecord } from '../types'
import { followUpColumns } from '../utils/followUpColumns'
import { isOpenFollowUp } from '../utils/followUpList'

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
  onViewDetails?: (row: FollowUpRecord) => void
  onEditReminder?: (row: FollowUpRecord) => void
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
  onViewDetails,
  onEditReminder,
}: FollowUpsTableProps) {
  const navigate = useNavigate()

  const resolveActions = (record: Record<string, unknown>): DataTableActionItem[] => {
    const row = record as unknown as FollowUpRecord
    const open = isOpenFollowUp(row.status)
    const items: DataTableActionItem[] = []

    if (canEdit && open) {
      items.push(
        {
          key: 'complete',
          label: 'Mark as Completed',
          icon: (
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={14}
              color="currentColor"
              strokeWidth={1.7}
            />
          ),
          onClick: () => onComplete?.(row),
        },
        {
          key: 'reschedule',
          label: 'Reschedule',
          icon: (
            <HugeiconsIcon
              icon={Calendar03Icon}
              size={14}
              color="currentColor"
              strokeWidth={1.7}
            />
          ),
          onClick: () => onReschedule?.(row),
        },
        {
          key: 'cancel',
          label: 'Cancel',
          danger: true,
          icon: (
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={14}
              color="currentColor"
              strokeWidth={1.7}
            />
          ),
          onClick: () => onCancel?.(row),
        },
      )
    }

    items.push({
      key: 'view',
      label: 'View Details',
      icon: (
        <HugeiconsIcon icon={ViewIcon} size={14} color="currentColor" strokeWidth={1.7} />
      ),
      onClick: () => onViewDetails?.(row),
    })

    if (canEdit && open && onEditReminder) {
      items.push({
        key: 'reminder',
        label: 'Edit reminder',
        icon: (
          <HugeiconsIcon
            icon={Notification03Icon}
            size={14}
            color="currentColor"
            strokeWidth={1.7}
          />
        ),
        onClick: () => onEditReminder(row),
      })
    }

    return items
  }

  return (
    <DataTable
      loading={loading}
      data={data}
      columns={followUpColumns}
      rowKey="id"
      selectRow
      isPaginate
      currentPage={page}
      setCurrentPage={onPageChange}
      limit={limit}
      setLimit={onLimitChange}
      total={total}
      showSizeChanger={total > 10}
      alwaysShowPagination={total > 0}
      actions={resolveActions}
      actionsMode="dropdown"
      actionsAlign="center"
      onRow={(record) => {
        const row = record as unknown as FollowUpRecord
        if (!row.leadId) return {}
        return {
          onClick: (event) => {
            const target = event.target
            if (
              target instanceof Element &&
              target.closest(
                'a, button, input, label, .ant-checkbox, .ant-dropdown, .ant-table-selection-column',
              )
            ) {
              return
            }
            navigate(`/leads/${row.leadId}`)
          },
          style: { cursor: 'pointer' },
        }
      }}
      pagination={{
        showTotal: (count: number, range: [number, number]) =>
          `Showing ${range[0]}-${range[1]} of ${count} follow-ups`,
      }}
    />
  )
}
