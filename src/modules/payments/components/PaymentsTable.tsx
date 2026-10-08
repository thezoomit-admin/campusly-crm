import { Button } from 'antd'
import { DataTable } from '@/components/common/Tables'
import type { PaymentRecord } from '../types'
import { paymentColumns } from '../utils/paymentColumns'

type PaymentsTableProps = {
  data: PaymentRecord[]
  loading?: boolean
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onViewReceipt?: (receiptId: string) => void
}

export default function PaymentsTable({
  data,
  loading,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  onViewReceipt,
}: PaymentsTableProps) {
  const columns = [
    ...paymentColumns,
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, row: PaymentRecord) =>
        row.receipt && onViewReceipt ? (
          <Button type="link" size="small" onClick={() => onViewReceipt(row.receipt!.id)}>
            View Receipt
          </Button>
        ) : (
          '—'
        ),
    },
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
