import { useMemo, useState } from 'react'
import { Input, Select } from 'antd'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'react-toastify'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { DataTable } from '@/components/common/Tables'
import { Button } from '@/components/ui'
import { getApiError } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import { useDebounce } from '@/hooks/useDebounce'
import type { AuthSession } from '@/types'
import { adminBanner, adminCard, adminPage } from '@/styles/admin'
import {
  useGetMetaPerformanceQuery,
  useGetMetaSettingsQuery,
  useListMetaLeadsQuery,
  useReceiveMetaLeadMutation,
} from '../api/metaLeadsApi'
import MetaLeadDetail from '../components/MetaLeadDetail'
import ReceiveMetaLeadModal from '../components/ReceiveMetaLeadModal'
import {
  FORM_TYPE_OPTIONS,
  PLATFORM_OPTIONS,
  formatMetaDate,
  type MetaLead,
  type MetaLeadFormValues,
  type MetaPerformanceBucket,
} from '../types'

const OUTCOME_OPTIONS = [
  { value: 'created', label: 'New leads' },
  { value: 'duplicate', label: 'Existing leads' },
  { value: 'pool', label: 'Lead Pool' },
  { value: 'failed', label: 'Failed' },
]

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={`${adminCard} grid gap-1`}>
      <p className="m-0 text-[0.78rem] text-text-muted">{label}</p>
      <p className="m-0 text-2xl font-semibold text-text-strong">{value}</p>
    </div>
  )
}

export default function MetaLeadsPage() {
  const auth = useOutletContext<AuthSession>()
  const canReceive = hasPermission(auth, 'communication:reprocess')
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState<string | undefined>()
  const [formType, setFormType] = useState<string | undefined>()
  const [outcome, setOutcome] = useState<string | undefined>()
  const [campaign, setCampaign] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selected, setSelected] = useState<MetaLead | null>(null)
  const [receiveOpen, setReceiveOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const filters = {
    search: debouncedSearch || undefined,
    platform,
    formType,
    outcome,
    campaign,
    page,
    limit,
  }
  const { data: settings } = useGetMetaSettingsQuery()
  const { data: performance } = useGetMetaPerformanceQuery({ platform, campaign })
  const { data, isFetching, isError } = useListMetaLeadsQuery(filters)
  const [receive, { isLoading: receiving }] = useReceiveMetaLeadMutation()

  const rows = useMemo(() => data?.items || [], [data?.items])
  const totals = performance?.totals

  async function onReceive(values: MetaLeadFormValues) {
    try {
      const result = await receive(values).unwrap()
      const extra = result.campaignMessage ? ` ${result.campaignMessage}` : ''
      toast.success(`${result.message}${extra}`)
      setReceiveOpen(false)
      setSelected(result.metaLead)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to process Meta Lead.'))
    }
  }

  const columns = [
    { title: 'Received', dataIndex: 'receivedAt', key: 'receivedAt', render: (value: string) => formatMetaDate(value) },
    { title: 'Name', dataIndex: 'fullName', key: 'fullName', render: (value: string | null) => value || '—' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (value: string | null) => value || '—' },
    { title: 'Platform', dataIndex: 'platformLabel', key: 'platform' },
    { title: 'Form', dataIndex: 'formLabel', key: 'form' },
    { title: 'Campaign', dataIndex: 'campaignName', key: 'campaign', render: (value: string | null) => value || '—' },
    { title: 'Country', dataIndex: 'preferredCountryCode', key: 'country', render: (value: string | null) => value || '—' },
    {
      title: 'Lead',
      key: 'lead',
      render: (_: unknown, row: MetaLead) => (row.lead ? row.lead.code : '—'),
    },
    {
      title: 'Result',
      key: 'result',
      render: (_: unknown, row: MetaLead) => row.message || row.processingStatus,
    },
  ]

  return (
    <div className={adminPage}>
      <PageMeta
        title="Meta Lead Ads"
        description="Facebook and Instagram Lead Ads collected into the CRM with campaign performance."
      />
      <PageHeader
        title="Meta Lead Management"
        subtitle="Facebook and Instagram lead forms enter the Communication Hub, then follow duplicate check, assignment, timeline, and notification."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Meta Lead Ads' }]}
        extra={
          canReceive && settings?.mockMode ? (
            <Button size="sm" onClick={() => setReceiveOpen(true)}>
              Receive test lead
            </Button>
          ) : null
        }
      />

      {settings?.mockMode ? (
        <p className={adminBanner}>
          Meta page access token is not configured. Lead Ads can still arrive at POST {settings.webhookPath} with a
          normalized form payload. Set META_PAGE_ACCESS_TOKEN to pull lead details from Meta automatically.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Generated" value={totals?.generated ?? 0} />
        <Stat label="Contacted" value={totals?.contacted ?? 0} />
        <Stat label="Converted" value={totals?.converted ?? 0} />
        <Stat label="Lost" value={totals?.lost ?? 0} />
        <Stat label="Conversion rate" value={`${totals?.conversionRate ?? 0}%`} />
      </div>

      <div className={`${adminCard} grid gap-3`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-[1rem] font-semibold text-text-strong">Campaign performance</h2>
        </div>
        <DataTable
          rowKey="key"
          loading={false}
          data={performance?.byCampaign || []}
          isPaginate={false}
          columns={[
            { title: 'Campaign', dataIndex: 'label', key: 'label' },
            { title: 'Generated', dataIndex: 'generated', key: 'generated' },
            { title: 'Contacted', dataIndex: 'contacted', key: 'contacted' },
            { title: 'Converted', dataIndex: 'converted', key: 'converted' },
            { title: 'Lost', dataIndex: 'lost', key: 'lost' },
            {
              title: 'Conversion rate',
              dataIndex: 'conversionRate',
              key: 'rate',
              render: (value: number) => `${value}%`,
            },
          ]}
          onRow={(record) => ({
            onClick: () => {
              const row = record as MetaPerformanceBucket
              setCampaign(row.label === 'Unattributed' ? undefined : row.label)
              setPage(1)
            },
            style: { cursor: 'pointer' },
          })}
        />
        {performance?.byPlatform?.length ? (
          <p className="m-0 text-[0.82rem] text-text-muted">
            {performance.byPlatform.map((item) => `${item.label}: ${item.generated}`).join(' · ')}
            {performance.byCountry.length
              ? ` · ${performance.byCountry.map((item) => `${item.label}: ${item.generated}`).join(' · ')}`
              : ''}
          </p>
        ) : (
          <p className="m-0 text-[0.82rem] text-text-muted">Campaign performance appears after Meta leads are received.</p>
        )}
      </div>

      <div className={`${adminCard} grid gap-3`}>
        <div className="flex flex-wrap gap-2">
          <Input.Search
            allowClear
            placeholder="Search name, phone, campaign"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            className="max-w-xs"
          />
          <Select
            allowClear
            placeholder="Platform"
            options={PLATFORM_OPTIONS}
            value={platform}
            onChange={(value) => {
              setPlatform(value)
              setPage(1)
            }}
            className="min-w-36"
          />
          <Select
            allowClear
            placeholder="Form"
            options={FORM_TYPE_OPTIONS}
            value={formType}
            onChange={(value) => {
              setFormType(value)
              setPage(1)
            }}
            className="min-w-52"
          />
          <Select
            allowClear
            placeholder="Outcome"
            options={OUTCOME_OPTIONS}
            value={outcome}
            onChange={(value) => {
              setOutcome(value)
              setPage(1)
            }}
            className="min-w-40"
          />
          {campaign ? (
            <Button size="sm" onClick={() => setCampaign(undefined)}>
              Campaign: {campaign}
            </Button>
          ) : null}
        </div>
        {isError ? <p className="m-0 text-danger">Unable to load Meta leads.</p> : null}
        <DataTable
          rowKey="id"
          loading={isFetching}
          data={rows}
          columns={columns}
          total={data?.total || 0}
          currentPage={page}
          limit={limit}
          setCurrentPage={setPage}
          setLimit={setLimit}
          onRow={(record) => ({
            onClick: () => setSelected(record as MetaLead),
            style: { cursor: 'pointer' },
          })}
        />
      </div>

      <MetaLeadDetail lead={selected} onClose={() => setSelected(null)} />
      <ReceiveMetaLeadModal
        open={receiveOpen}
        loading={receiving}
        onClose={() => setReceiveOpen(false)}
        onSubmit={onReceive}
      />
    </div>
  )
}
