import type { ColumnsType } from 'antd/es/table'
import type { PaymentRecord } from '../types'
import { paymentStatusClass } from './paymentStatus'
import { formatMoney } from '@/modules/packages/utils/offerCalculator'

export const paymentColumns: ColumnsType<PaymentRecord> = [
  {
    title: 'Payment ID',
    dataIndex: 'paymentNumber',
    key: 'paymentNumber',
    render: (v: string) => v || '—',
  },
  {
    title: 'Receipt',
    key: 'receipt',
    render: (_: unknown, row) => row.receipt?.receiptNumber || '—',
  },
  {
    title: 'Lead',
    key: 'lead',
    render: (_: unknown, row) => `${row.leadCode} — ${row.studentName}`,
  },
  {
    title: 'Package / Offer',
    key: 'package',
    render: (_: unknown, row) =>
      row.packageName || (row.offerVersion ? `Offer V${row.offerVersion}` : '—'),
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    render: (v: string) => formatMoney(v),
  },
  {
    title: 'Method',
    dataIndex: 'methodName',
    key: 'methodName',
    render: (v: string) => v || '—',
  },
  {
    title: 'Transaction',
    dataIndex: 'transactionRef',
    key: 'transactionRef',
    render: (v: string | null) => v || '—',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (v: string) => <span className={paymentStatusClass(v || '')}>{v || '—'}</span>,
  },
  {
    title: 'Received By',
    key: 'receivedBy',
    render: (_: unknown, row) => row.receivedBy?.fullName || '—',
  },
  {
    title: 'Date',
    dataIndex: 'paymentDate',
    key: 'paymentDate',
    render: (v: string) => v || '—',
  },
]
