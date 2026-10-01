import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { toast } from 'react-toastify'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Upload04Icon } from '@hugeicons/core-free-icons'
import { PrimaryButton } from '@/components/ui'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { useDebounce } from '@/hooks/useDebounce'
import { hasPermission } from '../../../lib/access'
import type { AuthSession } from '../../../types'
import { adminPage } from '../../../styles/admin'
import { useListLeadsQuery } from '../api/leadsApi'
import LeadFilters, { EMPTY_LEAD_FILTERS, type LeadFilterValues } from '../components/LeadFilters'
import LeadStatusTabs from '../components/LeadStatusTabs'
import LeadsTable from '../components/LeadsTable'
import type { LeadRow } from '../types'
import type { LeadPipelineTab } from '../utils/leadList'
import '../leadsList.css'

export default function LeadsPage() {
  const auth = useOutletContext<AuthSession>()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<LeadPipelineTab>('all')
  const [filters, setFilters] = useState<LeadFilterValues>(EMPTY_LEAD_FILTERS)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const debouncedSearch = useDebounce(search, 300)
  const canCreate = hasPermission(auth, 'lead:create')
  const canEdit = hasPermission(auth, 'lead:edit')

  const { data, isFetching, isError } = useListLeadsQuery({
    search: debouncedSearch,
    page,
    limit,
    status,
    source: filters.source,
    priority: filters.priority,
    country: filters.country,
  })

  const rows = useMemo(() => (data?.items || []) as LeadRow[], [data?.items])

  function resetPage() {
    setPage(1)
  }

  return (
    <div className={adminPage}>
      <PageMeta
        title="Leads"
        description="Capture, qualify, and nurture prospective students through your consultancy pipeline."
      />
      <PageHeader
        title="Leads"
        subtitle="Capture, qualify, and nurture prospective students through your consultancy pipeline."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Leads' }]}
        showDivider={false}
        extra={
          <>
            {canCreate ? (
              <PrimaryButton
                variant="outline"
                label="Import"
                icon={<HugeiconsIcon icon={Upload04Icon} size={16} />}
                onClick={() => toast.info('CSV import will be available in a later update.')}
              />
            ) : null}
            {canCreate ? (
              <PrimaryButton
                variant="primary"
                label="Add New Lead"
                icon={<HugeiconsIcon icon={Add01Icon} size={16} />}
                onClick={() => navigate('/leads/new')}
              />
            ) : null}
          </>
        }
      />

      <div className="overflow-hidden rounded-[20px] border border-border bg-surface shadow-soft">
        <div className="leads-toolbar flex min-w-0 max-w-full flex-col gap-4 border-b border-border px-3 min-[961px]:flex-row min-[961px]:flex-nowrap min-[961px]:items-center min-[961px]:gap-x-3 min-[961px]:gap-y-0 min-[961px]:px-4">
          <LeadStatusTabs
            value={status}
            summary={data?.summary}
            onChange={(next) => {
              setStatus(next)
              resetPage()
            }}
          />
          <LeadFilters
            search={search}
            filters={filters}
            onSearchChange={(value) => {
              setSearch(value)
              resetPage()
            }}
            onFiltersChange={(value) => {
              setFilters(value)
              resetPage()
            }}
          />
        </div>

        <div className="p-3 sm:p-4">
          {isError ? (
            <p className="m-0 mb-3 text-danger">Could not load records. Check API connection.</p>
          ) : null}

          <LeadsTable
            data={rows}
            loading={isFetching}
            page={page}
            limit={limit}
            total={data?.total || rows.length}
            canEdit={canEdit}
            showStatus={status === 'all'}
            onPageChange={setPage}
            onLimitChange={(value) => {
              setLimit(value)
              resetPage()
            }}
            onView={(row) => navigate(`/leads/${row.id}`)}
            onEdit={(row) => navigate(`/leads/${row.id}/edit`)}
          />
        </div>
      </div>
    </div>
  )
}
