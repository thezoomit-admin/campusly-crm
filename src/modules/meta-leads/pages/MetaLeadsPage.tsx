import { useMemo, useState, type ReactNode } from 'react'
import { Input, Select } from 'antd'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'react-toastify'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Analytics01Icon,
  Cancel01Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Search01Icon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { DataTable } from '@/components/common/Tables'
import { PrimaryButton } from '@/components/ui'
import { getApiError } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import { useDebounce } from '@/hooks/useDebounce'
import type { AuthSession } from '@/types'
import { adminBanner, adminPage } from '@/styles/admin'
import {
  useGetMetaPerformanceQuery,
  useGetMetaSettingsQuery,
  useListMetaLeadsQuery,
  useReceiveMetaLeadMutation,
} from '../api/metaLeadsApi'
import MetaLeadDetail from '../components/MetaLeadDetail'
import ReceiveMetaLeadModal from '../components/ReceiveMetaLeadModal'
import { PlatformBadge, RateBar, ResultText, formatRate } from '../metaLeadUi'
import {
  FORM_TYPE_OPTIONS,
  PLATFORM_OPTIONS,
  formatMetaDate,
  type MetaLead,
  type MetaLeadFormValues,
  type MetaPerformanceBucket,
} from '../types'
import '../metaLeads.css'

const OUTCOME_OPTIONS = [
  { value: 'created', label: 'New leads' },
  { value: 'duplicate', label: 'Existing leads' },
  { value: 'pool', label: 'Lead Pool' },
  { value: 'failed', label: 'Failed' },
]

const COUNT_COLUMN = { align: 'right' as const, width: 110 }

function StatCard({
  label,
  value,
  hint,
  icon,
  iconWrap,
  valueClass = 'text-text-strong',
  bar,
  className = '',
}: {
  label: string
  value: string | number
  hint?: string
  icon: typeof UserMultiple02Icon
  iconWrap: string
  valueClass?: string
  bar?: number
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-soft ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-[12px] font-medium text-text-muted">{label}</p>
          <p className={`m-0 mt-1 text-[28px] font-bold leading-none tabular-nums ${valueClass}`}>{value}</p>
        </div>
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${iconWrap}`}>
          <HugeiconsIcon icon={icon} size={20} color="currentColor" strokeWidth={1.7} />
        </span>
      </div>
      <div className="mt-2.5 flex h-4 items-center">
        {bar == null ? (
          <span className="text-[11px] font-medium text-text-muted">{hint}</span>
        ) : (
          <span className="h-1.5 w-full overflow-hidden rounded-full bg-[#eef2f6] dark:bg-[#24303a]">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${Math.max(0, Math.min(100, bar))}%` }}
            />
          </span>
        )}
      </div>
    </div>
  )
}

function SectionCard({
  title,
  subtitle,
  extra,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  extra?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
      <header className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="m-0 flex items-center gap-2 text-[0.98rem] font-semibold text-text-strong">
            <span className="h-4 w-[3px] shrink-0 rounded-full bg-primary" />
            {title}
          </h2>
          {subtitle ? <p className="m-0 mt-1 pl-[11px] text-[0.78rem] text-text-muted">{subtitle}</p> : null}
        </div>
        {extra}
      </header>
      <div className="px-2 pb-3 sm:px-3">{children}</div>
      {footer ? <footer className="border-t border-border-subtle px-4 py-3 sm:px-5">{footer}</footer> : null}
    </section>
  )
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-[#f8fafc] px-2.5 py-1 text-[0.75rem] font-medium text-text hover:border-primary hover:text-primary dark:bg-[#161d24]"
    >
      <span>{label}</span>
      <HugeiconsIcon icon={Cancel01Icon} size={12} color="currentColor" strokeWidth={2} />
    </button>
  )
}

function Breakdown({ title, items }: { title: string; items: MetaPerformanceBucket[] }) {
  if (!items.length) return null
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[0.72rem] font-semibold tracking-wide text-text-muted uppercase">{title}</span>
      {items.map((item) => (
        <span
          key={item.key}
          className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-[#f8fafc] px-2.5 py-1 text-[0.75rem] text-text dark:bg-[#161d24]"
        >
          <span>{item.label}</span>
          <span className="font-semibold tabular-nums text-text-strong">{item.generated}</span>
        </span>
      ))}
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
  const { data: performance, isLoading: performanceLoading } = useGetMetaPerformanceQuery({ platform })
  const { data, isFetching, isError } = useListMetaLeadsQuery(filters)
  const [receive, { isLoading: receiving }] = useReceiveMetaLeadMutation()

  const rows = useMemo(() => data?.items || [], [data?.items])
  const totals = performance?.totals
  const lost = totals?.lost ?? 0

  const activeFilters = [
    platform
      ? {
          key: 'platform',
          label: PLATFORM_OPTIONS.find((item) => item.value === platform)?.label || platform,
          clear: () => {
            setPlatform(undefined)
            resetPage()
          },
        }
      : null,
    formType
      ? {
          key: 'form',
          label: FORM_TYPE_OPTIONS.find((item) => item.value === formType)?.label || formType,
          clear: () => {
            setFormType(undefined)
            resetPage()
          },
        }
      : null,
    outcome
      ? {
          key: 'outcome',
          label: OUTCOME_OPTIONS.find((item) => item.value === outcome)?.label || outcome,
          clear: () => {
            setOutcome(undefined)
            resetPage()
          },
        }
      : null,
    campaign
      ? {
          key: 'campaign',
          label: campaign,
          clear: () => {
            setCampaign(undefined)
            resetPage()
          },
        }
      : null,
  ].filter((item): item is { key: string; label: string; clear: () => void } => Boolean(item))

  function resetPage() {
    setPage(1)
  }

  function clearFilters() {
    setSearch('')
    setPlatform(undefined)
    setFormType(undefined)
    setOutcome(undefined)
    setCampaign(undefined)
    resetPage()
  }

  function onCampaignClick(row: MetaPerformanceBucket) {
    if (row.label === 'Unattributed') {
      setCampaign(undefined)
    } else {
      setCampaign((current) => (current === row.label ? undefined : row.label))
    }
    resetPage()
  }

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
    {
      title: 'Received',
      dataIndex: 'receivedAt',
      key: 'receivedAt',
      width: 108,
      render: (value: string) => <span className="whitespace-nowrap">{formatMetaDate(value)}</span>,
    },
    {
      title: 'Name',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 120,
      ellipsis: true,
      render: (value: string | null) => value || '—',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (value: string | null) => <span className="whitespace-nowrap">{value || '—'}</span>,
    },
    {
      title: 'Platform',
      dataIndex: 'platformLabel',
      key: 'platform',
      width: 108,
      render: (value: string, row: MetaLead) => <PlatformBadge platform={row.platform} label={value} />,
    },
    { title: 'Form', dataIndex: 'formLabel', key: 'form', width: 136, ellipsis: true },
    {
      title: 'Campaign',
      dataIndex: 'campaignName',
      key: 'campaign',
      width: 116,
      ellipsis: true,
      render: (value: string | null) => value || '—',
    },
    {
      title: 'Country',
      dataIndex: 'preferredCountryCode',
      key: 'country',
      width: 120,
      ellipsis: true,
      render: (value: string | null) => value || '—',
    },
    {
      title: 'Lead',
      key: 'lead',
      width: 72,
      render: (_: unknown, row: MetaLead) =>
        row.lead ? <span className="font-semibold whitespace-nowrap text-primary">{row.lead.code}</span> : '—',
    },
    {
      title: 'Result',
      key: 'result',
      width: 168,
      ellipsis: true,
      render: (_: unknown, row: MetaLead) => <ResultText lead={row} truncate />,
    },
  ]

  const hasFilters = Boolean(search || activeFilters.length)

  return (
    <div className={`${adminPage} meta-leads`}>
      <PageMeta
        title="Meta Lead Ads"
        description="Facebook and Instagram Lead Ads collected into the CRM with campaign performance."
      />
      <PageHeader
        title="Meta Lead Management"
        subtitle="Facebook and Instagram lead forms enter the Communication Hub, then follow duplicate check, assignment, timeline, and notification."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Meta Lead Ads' }]}
        showDivider={false}
        extra={
          canReceive && settings?.mockMode ? (
            <PrimaryButton size="sm" onClick={() => setReceiveOpen(true)}>
              Receive test lead
            </PrimaryButton>
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
        <StatCard
          label="Generated"
          value={totals?.generated ?? 0}
          hint="Unique leads received"
          icon={UserMultiple02Icon}
          iconWrap="bg-[#eef2f6] text-[#51657a] dark:bg-[#24303a] dark:text-[#cbd5e1]"
        />
        <StatCard
          label="Contacted"
          value={totals?.contacted ?? 0}
          hint="Moved past new"
          icon={Clock01Icon}
          iconWrap="bg-[#e8f1ff] text-[#2563eb] dark:bg-[rgba(37,99,235,0.18)] dark:text-[#93c5fd]"
        />
        <StatCard
          label="Converted"
          value={totals?.converted ?? 0}
          hint="Converted or file opened"
          icon={CheckmarkCircle02Icon}
          iconWrap="bg-[#e7f8ef] text-[#16a34a] dark:bg-[rgba(22,163,74,0.18)] dark:text-[#86efac]"
        />
        <StatCard
          label="Lost"
          value={lost}
          hint="Closed as lost"
          icon={CancelCircleIcon}
          iconWrap={
            lost > 0
              ? 'bg-[#ffe8ee] text-[#e11d48] dark:bg-[rgba(225,29,72,0.18)] dark:text-[#fda4af]'
              : 'bg-[#f3f4f6] text-[#6b7280] dark:bg-[#24303a] dark:text-[#cbd5e1]'
          }
          valueClass={lost > 0 ? 'text-[#e11d48]' : 'text-text-strong'}
        />
        <StatCard
          className="sm:col-span-2 xl:col-span-1"
          label="Conversion rate"
          value={formatRate(totals?.conversionRate)}
          icon={Analytics01Icon}
          iconWrap="bg-[#e7f8ef] text-[#16a34a] dark:bg-[rgba(22,163,74,0.18)] dark:text-[#86efac]"
          bar={totals?.conversionRate ?? 0}
        />
      </div>

      <SectionCard
        title="Campaign performance"
        subtitle="Select a campaign to filter the list below. Select it again to clear."
        footer={
          performance?.byPlatform?.length || performance?.byCountry?.length ? (
            <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-6 lg:gap-y-2">
              <Breakdown title="Platform" items={performance?.byPlatform || []} />
              <Breakdown title="Country" items={performance?.byCountry || []} />
            </div>
          ) : (
            <p className="m-0 text-[0.82rem] text-text-muted">Campaign performance appears after Meta leads are received.</p>
          )
        }
      >
        <DataTable
          rowKey="key"
          loading={performanceLoading}
          data={performance?.byCampaign || []}
          isPaginate={false}
          columns={[
            { title: 'Campaign', dataIndex: 'label', key: 'label', ellipsis: true },
            { title: 'Generated', dataIndex: 'generated', key: 'generated', ...COUNT_COLUMN },
            { title: 'Contacted', dataIndex: 'contacted', key: 'contacted', ...COUNT_COLUMN },
            { title: 'Converted', dataIndex: 'converted', key: 'converted', ...COUNT_COLUMN },
            { title: 'Lost', dataIndex: 'lost', key: 'lost', ...COUNT_COLUMN },
            {
              title: 'Conversion rate',
              dataIndex: 'conversionRate',
              key: 'rate',
              width: 160,
              align: 'right' as const,
              render: (value: number) => <RateBar value={value} />,
            },
          ]}
          onRow={(record) => {
            const row = record as MetaPerformanceBucket
            const active = Boolean(campaign) && row.label === campaign
            return {
              onClick: () => onCampaignClick(row),
              className: active ? 'meta-row-selected' : undefined,
              style: { cursor: 'pointer' },
            }
          }}
        />
      </SectionCard>

      <SectionCard
        title="Incoming leads"
        subtitle="Open a row to see the form, campaign, and assignment."
        extra={
          <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-[0.75rem] font-semibold text-text-muted tabular-nums dark:bg-[#24303a]">
            {data?.total ?? 0} {data?.total === 1 ? 'lead' : 'leads'}
          </span>
        }
      >
        <div className="grid gap-3 px-2 pb-1 sm:px-2">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_repeat(3,minmax(140px,1fr))]">
            <Input
              allowClear
              prefix={<HugeiconsIcon icon={Search01Icon} size={16} color="currentColor" strokeWidth={1.8} />}
              placeholder="Search name, phone, campaign"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                resetPage()
              }}
              className="[&_.ant-input-prefix]:text-text-muted"
            />
            <Select
              allowClear
              placeholder="Platform"
              options={PLATFORM_OPTIONS}
              value={platform}
              onChange={(value) => {
                setPlatform(value)
                resetPage()
              }}
            />
            <Select
              allowClear
              placeholder="Form"
              options={FORM_TYPE_OPTIONS}
              value={formType}
              onChange={(value) => {
                setFormType(value)
                resetPage()
              }}
            />
            <Select
              allowClear
              placeholder="Outcome"
              options={OUTCOME_OPTIONS}
              value={outcome}
              onChange={(value) => {
                setOutcome(value)
                resetPage()
              }}
            />
          </div>
          {hasFilters ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {activeFilters.map((item) => (
                <FilterChip key={item.key} label={item.label} onClear={item.clear} />
              ))}
              <PrimaryButton variant="text" size="sm" onClick={clearFilters}>
                Clear
              </PrimaryButton>
            </div>
          ) : null}
          {isError ? <p className="m-0 text-danger">Unable to load Meta leads.</p> : null}
        </div>
        <DataTable
          className="meta-leads-inbox"
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
      </SectionCard>

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
