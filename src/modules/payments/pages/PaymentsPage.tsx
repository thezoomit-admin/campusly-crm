import { useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { useDebounce } from '@/hooks/useDebounce'
import { formatMoney } from '@/modules/packages/utils/offerCalculator'
import {
  useGetPaymentCollectionSummaryQuery,
  useListPaymentsQuery,
} from '../api/paymentsApi'
import { adminCard, adminPage } from '../../../styles/admin'
import PaymentFilters from '../components/PaymentFilters'
import PaymentsTable from '../components/PaymentsTable'
import ReceiptViewModal from '../components/ReceiptViewModal'
import type { PaymentRecord } from '../types'

export default function PaymentsPage() {
  const [search, setSearch] = useState('')
  const [methodCode, setMethodCode] = useState<string | undefined>()
  const [status, setStatus] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [amountMin, setAmountMin] = useState<string | undefined>()
  const [amountMax, setAmountMax] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const debouncedSearch = useDebounce(search, 300)

  const { data: summary } = useGetPaymentCollectionSummaryQuery()
  const { data, isFetching, isError } = useListPaymentsQuery({
    search: debouncedSearch,
    methodCode,
    status,
    dateFrom: dateRange?.[0]?.format('YYYY-MM-DD'),
    dateTo: dateRange?.[1]?.format('YYYY-MM-DD'),
    amountMin,
    amountMax,
    page,
    limit,
  })

  const rows = useMemo(() => (data?.items || []) as PaymentRecord[], [data?.items])

  return (
    <div className={adminPage}>
      <PageMeta
        title="Payments"
        description="Record, search, and reconcile student payments and receipts."
      />
      <PageHeader
        title="Payments & Receipts"
        subtitle="Collection overview, payment history, and receipt lookup across leads."
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'Payments' },
        ]}
      />

      {summary ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Today's Collection", value: formatMoney(summary.todayCollection) },
            { label: 'This Month', value: formatMoney(summary.monthCollection) },
            { label: 'Pending Due', value: formatMoney(summary.pendingDue) },
            { label: 'Partial Payments', value: String(summary.partialPayments) },
            { label: 'Completed Payments', value: String(summary.completedPayments) },
          ].map((card) => (
            <div key={card.label} className={`${adminCard} px-4 py-3`}>
              <p className="m-0 text-xs text-text-muted">{card.label}</p>
              <p className="m-0 mt-1 text-lg font-semibold text-text-strong">{card.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className={`${adminCard} grid gap-3`}>
        <PaymentFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          methodCode={methodCode}
          onMethodChange={(value) => {
            setMethodCode(value)
            setPage(1)
          }}
          status={status}
          onStatusChange={(value) => {
            setStatus(value)
            setPage(1)
          }}
          dateRange={dateRange}
          onDateRangeChange={(value) => {
            setDateRange(value)
            setPage(1)
          }}
          amountMin={amountMin}
          amountMax={amountMax}
          onAmountMinChange={(value) => {
            setAmountMin(value)
            setPage(1)
          }}
          onAmountMaxChange={(value) => {
            setAmountMax(value)
            setPage(1)
          }}
        />

        {isError ? (
          <p className="m-0 text-danger">Could not load records. Check API connection.</p>
        ) : null}

        <PaymentsTable
          data={rows}
          loading={isFetching}
          page={page}
          limit={limit}
          total={data?.total || 0}
          onPageChange={setPage}
          onLimitChange={(value) => {
            setLimit(value)
            setPage(1)
          }}
          onViewReceipt={(id) => setReceiptId(id)}
        />
      </div>

      <ReceiptViewModal
        open={Boolean(receiptId)}
        receiptId={receiptId}
        onClose={() => setReceiptId(null)}
      />
    </div>
  )
}
