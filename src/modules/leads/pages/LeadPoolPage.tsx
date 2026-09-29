import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { toast } from 'react-toastify'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { getApiError } from '@/lib/api'
import type { AuthSession } from '../../../types'
import { adminPage } from '../../../styles/admin'
import { useAssignLeadMutation, useListLeadPoolQuery } from '../api/leadsApi'
import LeadPoolFilters, { EMPTY_LEAD_POOL_FILTERS, type LeadPoolFilterValues } from '../components/LeadPoolFilters'
import LeadPoolTable from '../components/LeadPoolTable'
import { AssignLeadModal } from '../components/details/LeadDetailsModals'
import type { LeadPoolRow } from '../types'
import '../leadsList.css'

function rangeDates(filters: LeadPoolFilterValues) {
  const from = filters.createdRange?.[0]
  const to = filters.createdRange?.[1]
  return {
    createdFrom: from ? from.format('YYYY-MM-DD') : undefined,
    createdTo: to ? to.format('YYYY-MM-DD') : undefined,
  }
}

export default function LeadPoolPage() {
  useOutletContext<AuthSession>()
  const navigate = useNavigate()
  const [searchDraft, setSearchDraft] = useState('')
  const [filterDraft, setFilterDraft] = useState<LeadPoolFilterValues>(EMPTY_LEAD_POOL_FILTERS)
  const [applied, setApplied] = useState({
    search: '',
    ...EMPTY_LEAD_POOL_FILTERS,
  })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [now, setNow] = useState(() => Date.now())
  const [assigning, setAssigning] = useState<LeadPoolRow | null>(null)
  const [assignLead, { isLoading: assigningLead }] = useAssignLeadMutation()

  const { data, isFetching, isError } = useListLeadPoolQuery({
    search: applied.search,
    page,
    limit,
    source: applied.source,
    country: applied.country,
    ...rangeDates(applied),
  })

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  const rows = useMemo(() => data?.items || [], [data?.items])
  const hasActiveFilters = Boolean(applied.search || applied.source || applied.country || applied.createdRange)

  function applyFilters() {
    setApplied({ search: searchDraft.trim(), ...filterDraft })
    setPage(1)
  }

  function resetFilters() {
    setSearchDraft('')
    setFilterDraft(EMPTY_LEAD_POOL_FILTERS)
    setApplied({ search: '', ...EMPTY_LEAD_POOL_FILTERS })
    setPage(1)
  }

  async function onAssign(ownerId: string, reason: string) {
    if (!assigning) return
    try {
      await assignLead({ id: assigning.id, body: { ownerId, reason: reason || undefined } }).unwrap()
      toast.success('Lead assigned successfully.')
      setAssigning(null)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to assign the selected lead. Please try again.'))
    }
  }

  return (
    <div className={adminPage}>
      <PageMeta
        title="Lead Pool"
        description="Review unassigned leads and distribute them to the appropriate Call Executive."
      />
      <PageHeader
        title="Lead Pool"
        subtitle="Unassigned leads waiting for an owner. Oldest waiting leads appear first."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Lead Pool' }]}
        showDivider={false}
      />

      <div className="overflow-hidden rounded-[20px] border border-border bg-surface shadow-soft">
        <LeadPoolFilters
          search={searchDraft}
          filters={filterDraft}
          onSearchChange={setSearchDraft}
          onFiltersChange={setFilterDraft}
          onSearch={applyFilters}
          onReset={resetFilters}
        />

        <div className="p-3 sm:p-4">
          {isError ? (
            <p className="m-0 mb-3 text-danger">Unable to load Lead Pool. Please try again.</p>
          ) : null}

          {!isFetching && !isError && rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <p className="m-0 text-base font-semibold text-text-strong">Lead Pool is Empty</p>
              <p className="m-0 mt-1.5 text-sm text-text-muted">
                {hasActiveFilters
                  ? 'No unassigned leads match the selected filters.'
                  : 'There are currently no unassigned leads.'}
              </p>
            </div>
          ) : (
            <LeadPoolTable
              data={rows}
              loading={isFetching}
              now={now}
              page={page}
              limit={limit}
              total={data?.total || rows.length}
              onPageChange={setPage}
              onLimitChange={(value) => {
                setLimit(value)
                setPage(1)
              }}
              onView={(row) => navigate(`/leads/${row.id}`)}
              onAssign={setAssigning}
            />
          )}
        </div>
      </div>

      <AssignLeadModal
        open={Boolean(assigning)}
        leadName={assigning?.name || null}
        assignedTeamId={assigning?.assignedTeam?.id || null}
        saving={assigningLead}
        onClose={() => setAssigning(null)}
        onSubmit={onAssign}
      />
    </div>
  )
}
