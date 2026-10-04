import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { useDebounce } from '@/hooks/useDebounce'
import { useListDocumentsQuery } from '../api/documentsApi'
import { adminCard, adminPage } from '../../../styles/admin'
import DocumentFilters from '../components/DocumentFilters'
import DocumentsTable from '../components/DocumentsTable'
import type { DocumentRow } from '../types'

export default function DocumentsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isFetching, isError } = useListDocumentsQuery({
    search: debouncedSearch,
  })

  const rows = useMemo(() => (data?.items || []) as DocumentRow[], [data?.items])

  return (
    <div className={adminPage}>
      <PageMeta
        title="Documents"
        description="Upload, review, and organize student and staff documents for admissions workflows."
      />
      <PageHeader
        title="Documents"
        subtitle="Upload, review, and organize student and staff documents for admissions workflows."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Documents' }]}
      />

      <div className={`${adminCard} grid gap-3`}>
        <DocumentFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
        />

        {isError ? (
          <p className="m-0 text-danger">Could not load records. Check API connection.</p>
        ) : null}

        <DocumentsTable
          data={rows}
          loading={isFetching}
          page={page}
          limit={limit}
          total={data?.total || rows.length}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>
    </div>
  )
}
