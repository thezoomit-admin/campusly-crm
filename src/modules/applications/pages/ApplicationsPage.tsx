import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { useDebounce } from '@/hooks/useDebounce'
import { useListApplicationsQuery } from '../api/applicationsApi'
import { adminCard, adminPage } from '../../../styles/admin'
import ApplicationFilters from '../components/ApplicationFilters'
import ApplicationsTable from '../components/ApplicationsTable'
import type { ApplicationRow } from '../types'

export default function ApplicationsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isFetching, isError } = useListApplicationsQuery({
    search: debouncedSearch,
    page,
    limit,
  })

  const rows = useMemo(() => (data?.items || []) as ApplicationRow[], [data?.items])

  return (
    <div className={adminPage}>
      <PageMeta
        title="Applications"
        description="Track university applications from documents through offers and enrollment."
      />
      <PageHeader
        title="Applications"
        subtitle="Admission pipeline after a lead is Converted. Create applications from the lead workspace."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Applications' }]}
      />

      <div className={`${adminCard} grid gap-3`}>
        <ApplicationFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
        />

        {isError ? (
          <p className="m-0 text-danger">Could not load records. Check API connection.</p>
        ) : null}

        <ApplicationsTable
          data={rows}
          loading={isFetching}
          page={page}
          limit={limit}
          total={data?.total || rows.length}
          onPageChange={setPage}
          onLimitChange={setLimit}
          onRowClick={(row) => navigate(`/applications/${row.id}`)}
        />
      </div>
    </div>
  )
}
