import { DataTable } from '@/components/common/Tables'
import type { ApplicationRow } from '../types'
import { applicationColumns } from '../utils/applicationColumns'

type ApplicationsTableProps = {
  data: ApplicationRow[]
  loading?: boolean
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onRowClick?: (row: ApplicationRow) => void
}

export default function ApplicationsTable({
  data,
  loading,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  onRowClick,
}: ApplicationsTableProps) {
  return (
    <DataTable
      loading={loading}
      data={data}
      columns={applicationColumns}
      rowKey="id"
      isPaginate
      currentPage={page}
      setCurrentPage={onPageChange}
      limit={limit}
      setLimit={onLimitChange}
      total={total}
      showSizeChanger={total > 10}
      onRow={
        onRowClick
          ? (record) => ({
              onClick: () => onRowClick(record as ApplicationRow),
              className: 'cursor-pointer',
            })
          : undefined
      }
    />
  )
}
