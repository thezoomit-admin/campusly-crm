import { DataTable } from '@/components/common/Tables'
import type { LeadRow } from '../types'
import { getLeadColumns } from '../utils/leadColumns'

type LeadsTableProps = {
  data: LeadRow[]
  loading?: boolean
  page: number
  limit: number
  total: number
  canEdit?: boolean
  canChangeStatus?: boolean
  canClose?: boolean
  canReopen?: boolean
  canReassign?: boolean
  canOverridePriority?: boolean
  canConvert?: boolean
  showStatus?: boolean
  showCloseMeta?: boolean
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onView: (row: LeadRow) => void
  onEdit: (row: LeadRow) => void
  onChangeStatus?: (row: LeadRow) => void
  onCloseLead?: (row: LeadRow) => void
  onReopen?: (row: LeadRow) => void
  onAddNote?: (row: LeadRow) => void
  onAddFollowUp?: (row: LeadRow) => void
  onAddMeeting?: (row: LeadRow) => void
  onReassign?: (row: LeadRow) => void
  onChangePriority?: (row: LeadRow) => void
  onConvert?: (row: LeadRow) => void
  onOwnerClick?: (row: LeadRow) => void
}

export default function LeadsTable({
  data,
  loading,
  page,
  limit,
  total,
  canEdit,
  canChangeStatus,
  canClose,
  canReopen,
  canReassign,
  canOverridePriority,
  canConvert,
  showStatus = true,
  showCloseMeta = false,
  onPageChange,
  onLimitChange,
  onView,
  onEdit,
  onChangeStatus,
  onCloseLead,
  onReopen,
  onAddNote,
  onAddFollowUp,
  onAddMeeting,
  onReassign,
  onChangePriority,
  onConvert,
  onOwnerClick,
}: LeadsTableProps) {
  return (
    <DataTable
      className="leads-table-shell"
      loading={loading}
      data={data}
      columns={getLeadColumns({
        canEdit,
        canChangeStatus,
        canClose,
        canReopen,
        canReassign,
        canOverridePriority,
        canConvert,
        showStatus,
        showCloseMeta,
        onView,
        onEdit,
        onChangeStatus,
        onCloseLead,
        onReopen,
        onAddNote,
        onAddFollowUp,
        onAddMeeting,
        onReassign,
        onChangePriority,
        onConvert,
        onOwnerClick,
      })}
      rowKey="id"
      selectRow
      isPaginate
      alwaysShowPagination
      currentPage={page}
      setCurrentPage={onPageChange}
      limit={limit}
      setLimit={onLimitChange}
      total={total}
      showSizeChanger
      onRow={(record) => ({
        onClick: () => onView(record as unknown as LeadRow),
        style: { cursor: 'pointer' },
      })}
      pagination={{
        showTotal: (count: number, range: [number, number]) =>
          `Showing ${range[0]}-${range[1]} of ${count} leads`,
        pageSizeOptions: ['10', '25', '50'],
      }}
    />
  )
}
