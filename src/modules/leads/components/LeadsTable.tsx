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
  showStatus?: boolean
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onView: (row: LeadRow) => void
  onEdit: (row: LeadRow) => void
  onChangeStatus?: (row: LeadRow) => void
  onCloseLead?: (row: LeadRow) => void
  onReopen?: (row: LeadRow) => void
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
  showStatus = true,
  onPageChange,
  onLimitChange,
  onView,
  onEdit,
  onChangeStatus,
  onCloseLead,
  onReopen,
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
        showStatus,
        onView,
        onEdit,
        onChangeStatus,
        onCloseLead,
        onReopen,
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
