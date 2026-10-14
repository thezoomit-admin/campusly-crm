import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { useDebounce } from '@/hooks/useDebounce'
import { useListStudentsQuery } from '../api/studentsApi'
import { adminCard, adminPage } from '../../../styles/admin'
import StudentFilters from '../components/StudentFilters'
import StudentsTable from '../components/StudentsTable'
import type { StudentRow } from '../types'

export default function StudentsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isFetching, isError } = useListStudentsQuery({
    search: debouncedSearch,
    page,
    limit,
  })

  const rows = useMemo(() => (data?.items || []) as StudentRow[], [data?.items])

  return (
    <div className={adminPage}>
      <PageMeta
        title="Students"
        description="Student profiles created from Converted leads when applications are opened."
      />
      <PageHeader
        title="Students"
        subtitle="One student per converted lead. Open a row for shared profile, documents, and all university applications."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Students' }]}
      />

      <div className={`${adminCard} grid gap-3`}>
        <StudentFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
        />

        {isError ? (
          <p className="m-0 text-danger">Could not load records. Check API connection.</p>
        ) : null}

        <StudentsTable
          data={rows}
          loading={isFetching}
          page={page}
          limit={limit}
          total={data?.total || rows.length}
          onPageChange={setPage}
          onLimitChange={setLimit}
          onRowClick={(row) => navigate(`/students/${row.id}`)}
        />
      </div>
    </div>
  )
}
