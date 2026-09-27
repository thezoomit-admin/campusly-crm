import { Button } from 'antd'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { useDebounce } from '@/hooks/useDebounce'
import { useListReportsQuery } from '../api/reportsApi'
import { adminCard, adminPage, muted } from '../../../styles/admin'
import ReportFilters from '../components/ReportFilters'
import ReportFormModal from '../components/ReportFormModal'
import ReportsTable from '../components/ReportsTable'
import type { ReportRow } from '../types'

export default function ReportsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isFetching, isError } = useListReportsQuery({
    search: debouncedSearch,
  })

  const rows = useMemo(() => (data?.items || []) as ReportRow[], [data?.items])

  return (
    <div className={adminPage}>
      <PageMeta
        title="Reports"
        description="Analyze lead conversion, advisor performance, and operational CRM metrics."
      />
      <PageHeader
        title="Reports"
        subtitle="Analyze lead conversion, advisor performance, and operational CRM metrics."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Reports' }]}
        extra={
          <Button type="primary" onClick={() => setFormOpen(true)}>
            Add metric
          </Button>
        }
      />

      <div className={`${adminCard} grid gap-3`}>
        <ReportFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
        />

        {isError ? (
          <p className="m-0 text-danger">Could not load records. Check API connection.</p>
        ) : null}

        <ReportsTable
          data={rows}
          loading={isFetching}
          page={page}
          limit={limit}
          total={data?.total || rows.length}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      <p className={`${muted} mt-3 mb-0 text-sm`}>Demo list data — wire create/update when report APIs are ready.</p>

      <ReportFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
