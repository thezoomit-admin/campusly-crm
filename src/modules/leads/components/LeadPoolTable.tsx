import { DataTable } from '@/components/common/Tables'
import type { LeadPoolRow } from '../types'
import { getLeadPoolColumns } from '../utils/leadPoolColumns'

type LeadPoolTableProps = {
  data: LeadPoolRow[]
  loading?: boolean
  now: number
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onView: (row: LeadPoolRow) => void
  onAssign: (row: LeadPoolRow) => void
}

export default function LeadPoolTable({
  data,
  loading,
  now,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  onView,
  onAssign,
}: LeadPoolTableProps) {
  return (
    <DataTable
      className="leads-table-shell"
      loading={loading}
      data={data}
      columns={getLeadPoolColumns({ now, onView, onAssign })}
      rowKey="id"
      isPaginate
      alwaysShowPagination
      currentPage={page}
      setCurrentPage={onPageChange}
      limit={limit}
      setLimit={onLimitChange}
      total={total}
      showSizeChanger
      onRow={(record) => ({
        onClick: () => onView(record as unknown as LeadPoolRow),
        style: { cursor: 'pointer' },
      })}
      pagination={{
        showTotal: (count: number, range: [number, number]) =>
          `Showing ${range[0]}-${range[1]} of ${count} unassigned leads`,
        pageSizeOptions: ['10', '25', '50'],
      }}
    />
  )
}
