import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { Drawer, Button } from 'antd'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'react-toastify'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { getApiError } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import { useDebounce } from '@/hooks/useDebounce'
import { statusClass } from '@/lib/statusClass'
import type { AuthSession } from '@/types'
import { adminCard, adminPage } from '@/styles/admin'
import {
  useListCommunicationsQuery,
  useReprocessCommunicationMutation,
} from '../api/communicationsApi'
import CommunicationsTable, { CommunicationFilters } from '../components/CommunicationsTable'
import type { CommunicationEvent } from '../types'
import { CHANNEL_LABELS, STATUS_LABELS } from '../types'

export default function CommunicationHubPage() {
  const auth = useOutletContext<AuthSession>()
  const canReprocess = hasPermission(auth, 'communication:reprocess')

  const [search, setSearch] = useState('')
  const [channel, setChannel] = useState<string | undefined>()
  const [status, setStatus] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selected, setSelected] = useState<CommunicationEvent | null>(null)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isFetching, isError } = useListCommunicationsQuery({
    search: debouncedSearch,
    channel,
    status,
    page,
    limit,
  })
  const [reprocess, { isLoading: reprocessing }] = useReprocessCommunicationMutation()

  const rows = useMemo(() => data?.items || [], [data?.items])
  const summary = data?.summary

  async function onReprocess(row: CommunicationEvent) {
    try {
      const result = await reprocess(row.id).unwrap()
      toast.success(result.message || 'Communication reprocessed.')
      setSelected(result.event)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to process the communication.'))
    }
  }

  return (
    <div className={adminPage}>
      <PageMeta
        title="Communication Hub"
        description="Centralized entry point for website, WhatsApp, email, and Meta lead communications."
      />
      <PageHeader
        title="Communication Hub"
        subtitle="All inbound enquiries are matched to leads, assigned by country, and tracked here."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Communication Hub' }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={`${adminCard} grid gap-1`}>
          <p className="m-0 text-[0.78rem] text-text-muted">Pending</p>
          <p className="m-0 text-2xl font-semibold text-text-strong">{summary?.pending ?? 0}</p>
        </div>
        <div className={`${adminCard} grid gap-1`}>
          <p className="m-0 text-[0.78rem] text-text-muted">Processed</p>
          <p className="m-0 text-2xl font-semibold text-text-strong">{summary?.processed ?? 0}</p>
        </div>
        <div className={`${adminCard} grid gap-1`}>
          <p className="m-0 text-[0.78rem] text-text-muted">Failed</p>
          <p className="m-0 text-2xl font-semibold text-text-strong">{summary?.failed ?? 0}</p>
        </div>
      </div>

      <div className={`${adminCard} grid gap-3`}>
        <CommunicationFilters
          search={search}
          channel={channel}
          status={status}
          onSearchChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          onChannelChange={(value) => {
            setChannel(value)
            setPage(1)
          }}
          onStatusChange={(value) => {
            setStatus(value)
            setPage(1)
          }}
        />

        {isError ? (
          <p className="m-0 text-danger">Could not load communications. Check API connection.</p>
        ) : null}

        <CommunicationsTable
          data={rows}
          loading={isFetching}
          page={page}
          limit={limit}
          total={data?.total || 0}
          canReprocess={canReprocess}
          onPageChange={setPage}
          onLimitChange={(value) => {
            setLimit(value)
            setPage(1)
          }}
          onReprocess={onReprocess}
          onOpen={setSelected}
        />
      </div>

      <Drawer
        title="Communication details"
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        width={420}
        extra={
          selected &&
          canReprocess &&
          (selected.processingStatus === 'FAILED' || selected.processingStatus === 'PENDING') ? (
            <Button type="primary" loading={reprocessing} onClick={() => onReprocess(selected)}>
              Reprocess
            </Button>
          ) : null
        }
      >
        {selected ? (
          <div className="grid gap-3 text-[0.9rem]">
            <Detail label="Channel" value={CHANNEL_LABELS[selected.channel]} />
            <Detail
              label="Status"
              value={
                <span className={statusClass(STATUS_LABELS[selected.processingStatus])}>
                  {STATUS_LABELS[selected.processingStatus]}
                </span>
              }
            />
            <Detail label="Sender" value={selected.senderName || '—'} />
            <Detail label="Phone" value={selected.senderPhone || '—'} />
            <Detail label="Email" value={selected.senderEmail || '—'} />
            <Detail label="Country" value={selected.preferredCountryCode || '—'} />
            <Detail label="Campaign" value={selected.campaign?.name || selected.campaignName || '—'} />
            <Detail
              label="UTM"
              value={
                [selected.utmSource, selected.utmMedium, selected.utmCampaign].filter(Boolean).join(' / ') || '—'
              }
            />
            <Detail label="Landing Page" value={selected.landingPageUrl || '—'} />
            <Detail label="Form" value={selected.formName || '—'} />
            <Detail label="Subject" value={selected.subject || '—'} />
            <Detail label="Message" value={selected.message || '—'} />
            {selected.processingError ? (
              <Detail label="Error" value={<span className="text-danger">{selected.processingError}</span>} />
            ) : null}
            <Detail
              label="Lead"
              value={
                selected.lead
                  ? `${selected.lead.code} — ${selected.lead.name}${selected.leadCreated ? ' (new)' : ''}`
                  : '—'
              }
            />
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border-subtle pb-2 last:border-b-0">
      <span className="text-[0.75rem] text-text-muted">{label}</span>
      <div className="text-text-strong whitespace-pre-wrap">{value}</div>
    </div>
  )
}
