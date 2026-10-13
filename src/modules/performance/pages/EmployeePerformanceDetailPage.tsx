import { useEffect, useMemo, useState, type ReactNode, type SVGProps } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, Input, Modal, Pagination, Select } from 'antd'
import { PageMeta } from '@/components/common/Meta'
import { Spinner } from '@/components/common/Loading'
import { PrimaryButton, UserAvatar } from '@/components/ui'
import { getApiError } from '@/lib/api'
import {
  adminPage,
  adminTable,
  employeeAvatar,
  employeeAvatarLg,
  employeeAvatarSm,
  mdTab,
  mdTabActive,
  muted,
  tableWrap,
} from '@/styles/admin'
import {
  useGetPerformanceDetailQuery,
  useLazyGetPerformanceDrillQuery,
  type DrillResponse,
  type KpiResult,
  type PerformanceDetail,
} from '../api/performanceApi'
import {
  AdmissionFunnelChart,
  HistoryTrendChart,
  ScoreGauge,
} from '../components/EmployeePerformanceCharts'
import { PRESETS, kpiTone, kpiValue, minutes, money, percent, when } from '../format'

const card =
  'rounded-2xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]'

type DetailTab = 'overview' | 'activity' | 'targets'

const DETAIL_TABS: Array<{ id: DetailTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'targets', label: 'Targets' },
]

type TableTab = 'assigned' | 'contacted' | 'qualified' | 'converted' | 'follow_ups' | 'overdue'

const TABLE_TABS: Array<{ id: TableTab; label: string; metric: string }> = [
  { id: 'assigned', label: 'Assigned Leads', metric: 'assigned' },
  { id: 'contacted', label: 'Contacted', metric: 'contacted' },
  { id: 'qualified', label: 'Qualified', metric: 'qualified' },
  { id: 'converted', label: 'Converted', metric: 'converted' },
  { id: 'follow_ups', label: 'Follow-ups', metric: 'follow_ups' },
  { id: 'overdue', label: 'Overdue', metric: 'overdue' },
]

type KpiTone = 'blue' | 'green' | 'purple' | 'orange' | 'rose' | 'teal'

const toneIcon: Record<KpiTone, string> = {
  blue: 'bg-[#e8f1ff] text-[#3b82f6] dark:bg-blue-500/20 dark:text-[#93c5fd]',
  green: 'bg-[#e7f8ef] text-[#22c55e] dark:bg-green-500/20 dark:text-[#86efac]',
  purple: 'bg-[#eee8ff] text-[#8b5cf6] dark:bg-violet-500/20 dark:text-[#c4b5fd]',
  orange: 'bg-[#fff1e6] text-[#f59e0b] dark:bg-amber-500/20 dark:text-[#fcd34d]',
  rose: 'bg-[#ffe8ee] text-[#f43f5e] dark:bg-rose-500/20 dark:text-[#fda4af]',
  teal: 'bg-[#e6f7f5] text-[#0d9488] dark:bg-teal-500/20 dark:text-[#5eead4]',
}

function readFilters(params: URLSearchParams) {
  return {
    preset: params.get('preset') || 'this_month',
    from: params.get('from') || undefined,
    to: params.get('to') || undefined,
    country: params.get('country') || undefined,
    source: params.get('source') || undefined,
    campaignId: params.get('campaignId') || undefined,
    status: params.get('status') || undefined,
    priority: params.get('priority') || undefined,
    scoreMin: params.get('scoreMin') || undefined,
    scoreMax: params.get('scoreMax') || undefined,
  }
}

function employeePhotoSrc(employeeId: string | null, photoUrl?: string | null) {
  if (!photoUrl) return null
  if (photoUrl.startsWith('http') || photoUrl.startsWith('/')) return photoUrl
  if (employeeId) return `/api/employees/${employeeId}/photo`
  return null
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function statusPill(status: string) {
  const key = status.toLowerCase()
  if (key.includes('convert') || key.includes('qualif') || key.includes('enroll')) {
    return 'bg-[#e7f8ef] text-[#15803d]'
  }
  if (key.includes('contact') || key.includes('progress') || key.includes('follow')) {
    return 'bg-[#e8f1ff] text-[#1d4ed8]'
  }
  if (key.includes('new') || key.includes('pending')) {
    return 'bg-[#fff1e6] text-[#c2410c]'
  }
  if (key.includes('lost') || key.includes('overdue') || key.includes('reject')) {
    return 'bg-[#ffe8ee] text-[#be123c]'
  }
  return 'bg-hover-bg text-text-muted'
}

function MetricIcon({ name }: { name: string }) {
  const common: SVGProps<SVGSVGElement> = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  switch (name) {
    case 'users':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="M22 4 12 14.01l-3-3" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      )
    case 'file':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
        </svg>
      )
    case 'trend':
      return (
        <svg {...common}>
          <path d="M3 3v18h18" />
          <path d="M7 14l4-4 4 4 5-6" />
        </svg>
      )
    case 'phone':
      return (
        <svg {...common}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      )
  }
}

function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="m-0 text-base font-semibold text-text">{title}</h3>
      {action}
    </div>
  )
}

function SummaryKpiCard({
  label,
  value,
  hint,
  tone,
  icon,
  onClick,
}: {
  label: string
  value: string
  hint?: string
  tone: KpiTone
  icon: string
  onClick?: () => void
}) {
  const body = (
    <>
      <div className={`mb-2.5 grid size-9 place-items-center rounded-[10px] ${toneIcon[tone]}`}>
        <MetricIcon name={icon} />
      </div>
      <p className="m-0 truncate text-[0.78rem] text-text-muted">{label}</p>
      <strong className="mt-1 block text-[1.35rem] tracking-[-0.03em] text-text">{value}</strong>
      {hint ? <small className="mt-1.5 block text-[0.7rem] text-text-faint">{hint}</small> : null}
    </>
  )
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${card} cursor-pointer px-3.5 py-3.5 text-left transition-shadow hover:shadow-[0_8px_24px_rgba(16,24,40,0.08)]`}
      >
        {body}
      </button>
    )
  }
  return <article className={`${card} px-3.5 py-3.5`}>{body}</article>
}

function DrillModal({
  title,
  data,
  onClose,
}: {
  title: string
  data: DrillResponse | undefined
  onClose: () => void
}) {
  return (
    <Modal open title={title} onCancel={onClose} footer={<Button onClick={onClose}>Close</Button>} width={880} destroyOnHidden>
      {!data?.rows.length ? (
        <p className={muted}>No performance data available for the selected period.</p>
      ) : (
        <div className={tableWrap}>
          <table className={adminTable}>
            <thead>
              <tr>
                <th>Lead ID</th>
                <th>Student</th>
                <th>Country</th>
                <th>Source</th>
                <th>Score</th>
                <th>Service</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={`${row.kind}-${row.id}`}>
                  <td>
                    <Link to={`/leads/${row.leadId}`}>{row.code}</Link>
                  </td>
                  <td>{row.name}</td>
                  <td>{row.country}</td>
                  <td>{row.source}</td>
                  <td>{row.score}</td>
                  <td>{row.service}</td>
                  <td>{row.status}</td>
                  <td>{when(row.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border-subtle px-3 py-2.5">
      <span className="block text-xs text-text-muted">{label}</span>
      <strong className="mt-1 block text-lg text-text">{value}</strong>
    </div>
  )
}

function kpiProgress(item: KpiResult) {
  if (item.unit === 'minutes') {
    return item.target > 0
      ? Math.min(100, Math.round((Math.max(item.target - item.actual, 0) / item.target) * 100))
      : 0
  }
  return item.target > 0
    ? Math.min(100, Math.round((item.actual / item.target) * 100))
    : 0
}

function KpiTargetRow({
  item,
  showWeight = false,
}: {
  item: KpiResult
  showWeight?: boolean
}) {
  const progress = kpiProgress(item)
  return (
    <div className="rounded-xl border border-border-subtle px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <strong className="block truncate text-sm">{item.name}</strong>
          <span className="text-xs text-text-muted">
            {kpiValue(item.unit, item.actual)} / {kpiValue(item.unit, item.target)}
            {showWeight && item.weight ? ` · Weight ${item.weight}%` : ''}
          </span>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${kpiTone[item.status]}`}>
          {item.status}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-text)_6%,var(--color-surface))]">
        <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

function RecentActivityList({
  items,
  limit,
}: {
  items: PerformanceDetail['recentActivity']
  limit: number
}) {
  if (!items.length) {
    return <p className={muted}>No recent activity for this period.</p>
  }
  return (
    <ul className="m-0 grid list-none gap-2.5 p-0">
      {items.slice(0, limit).map((item) => (
        <li
          key={`${item.at}-${item.leadId}-${item.label}`}
          className="flex items-start gap-3 rounded-xl border border-border-subtle px-3 py-2.5"
        >
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-[#e7f8ef] text-[#15803d]">
            <MetricIcon name="check" />
          </span>
          <div className="min-w-0">
            <strong className="block text-sm">{item.label}</strong>
            <span className="block truncate text-xs text-text-muted">
              <Link to={`/leads/${item.leadId}`} className="text-primary">
                {item.leadCode}
              </Link>
              {item.leadName ? ` · ${item.leadName}` : ''}
            </span>
            <span className="mt-0.5 block text-[0.7rem] text-text-faint">{when(item.at)}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

const PAGE_SIZE = 8

export default function EmployeePerformanceDetailPage() {
  const [params, setParams] = useSearchParams()
  const userId = params.get('detail') || ''
  const filters = readFilters(params)
  const { data, isLoading, isError, error } = useGetPerformanceDetailQuery(
    { userId, ...filters },
    { skip: !userId },
  )
  const [loadDrill, drill] = useLazyGetPerformanceDrillQuery()
  const [loadTableDrill] = useLazyGetPerformanceDrillQuery()
  const [drillTitle, setDrillTitle] = useState('')
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const [tableTab, setTableTab] = useState<TableTab>('assigned')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [tableRows, setTableRows] = useState<DrillResponse['rows']>([])
  const [tableLoading, setTableLoading] = useState(false)

  function backToList() {
    const next = new URLSearchParams(params)
    next.delete('detail')
    next.set('tab', 'employee-performance')
    setParams(next)
  }

  function updatePreset(preset: string) {
    const next = new URLSearchParams(params)
    next.set('tab', 'employee-performance')
    if (userId) next.set('detail', userId)
    if (!preset || preset === 'this_month') next.delete('preset')
    else next.set('preset', preset)
    if (preset !== 'custom') {
      next.delete('from')
      next.delete('to')
    }
    setParams(next)
  }

  async function openDrill(metric: string, title: string) {
    setDrillTitle(title)
    await loadDrill({ ...filters, userId, metric })
  }

  useEffect(() => {
    let cancelled = false
    async function loadTable() {
      const metric = TABLE_TABS.find((tab) => tab.id === tableTab)?.metric || 'assigned'
      setTableLoading(true)
      try {
        const result = await loadTableDrill({ ...filters, userId, metric }).unwrap()
        if (!cancelled) {
          setTableRows(result.rows || [])
          setPage(1)
        }
      } catch {
        if (!cancelled) setTableRows([])
      } finally {
        if (!cancelled) setTableLoading(false)
      }
    }
    if (userId) void loadTable()
    return () => {
      cancelled = true
    }
  }, [userId, tableTab, filters.preset, filters.from, filters.to, filters.country, filters.source, filters.campaignId, filters.status, filters.priority, filters.scoreMin, filters.scoreMax, loadTableDrill])

  const metrics = data?.metrics
  const employee = data?.employee

  const filteredTableRows = useMemo(() => {
    let rows = tableRows
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter(
        (row) =>
          row.name.toLowerCase().includes(q) ||
          row.code.toLowerCase().includes(q) ||
          row.source.toLowerCase().includes(q) ||
          row.status.toLowerCase().includes(q),
      )
    }
    if (statusFilter !== 'all') {
      rows = rows.filter((row) => row.status === statusFilter)
    }
    return rows
  }, [tableRows, search, statusFilter])

  const pageRows = filteredTableRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const statusOptions = useMemo(
    () => [...new Set(tableRows.map((row) => row.status).filter(Boolean))].sort(),
    [tableRows],
  )

  const rangeLabel =
    data?.from && data?.to
      ? `${formatDate(data.from)} – ${formatDate(data.to)}`
      : PRESETS.find((item) => item.id === filters.preset)?.label || 'This Month'

  return (
    <div className={`${adminPage} gap-3`}>
      <PageMeta
        title={employee?.name ? `${employee.name} · Performance` : 'Employee Performance'}
        description="Detailed performance report for individual employee."
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <nav className="mb-1 text-xs text-text-muted">
            <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-primary" onClick={backToList}>
              Reports & Analytics
            </button>
            <span className="mx-1.5">/</span>
            <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-primary" onClick={backToList}>
              Employee Performance
            </button>
            <span className="mx-1.5">/</span>
            <span>Employee Details</span>
          </nav>
          <h2 className="m-0 text-xl font-bold tracking-[-0.02em] text-text">Employee Performance</h2>
          <p className="mt-1 mb-0 text-sm text-text-muted">
            Detailed performance report for individual employee.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm text-text-muted">
            <MetricIcon name="clock" />
            {rangeLabel}
          </span>
          <Select
            value={filters.preset || 'this_month'}
            onChange={updatePreset}
            className="min-w-36"
            options={PRESETS.map((item) => ({ value: item.id, label: item.label }))}
          />
          <PrimaryButton size="md" variant="outline" label="Back to list" onClick={backToList} />
        </div>
      </div>

      {isLoading ? <Spinner /> : null}
      {isError ? (
        <p className={card}>{getApiError(error, 'Unable to load employee performance.')}</p>
      ) : null}
      {data?.message ? <p className={card}>{data.message}</p> : null}

      {metrics && data && employee ? (
        <>
          <section className={`${card} grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]`}>
            <div className="flex min-w-0 items-start gap-4">
              <UserAvatar
                name={employee.name}
                photoUrl={employeePhotoSrc(employee.employeeId, employee.photoUrl)}
                className={`${employeeAvatar} ${employeeAvatarLg}`}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="m-0 text-lg font-bold text-text">{employee.name}</h3>
                  {employee.employmentStatus ? (
                    <span className="rounded-full bg-[#e7f8ef] px-2 py-0.5 text-xs font-bold text-[#15803d]">
                      {employee.employmentStatus}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 mb-2 text-sm text-text-muted">
                  {employee.designation || 'Counselor'}
                  {employee.teamName || employee.departmentName
                    ? ` · ${employee.teamName || employee.departmentName}`
                    : ''}
                  {employee.employeeCode ? ` · ${employee.employeeCode}` : ''}
                </p>
                <div className="grid gap-1 text-sm text-text-muted">
                  {employee.email ? <span>{employee.email}</span> : null}
                  {employee.phone ? <span>{employee.phone}</span> : null}
                  <span>
                    Reporting Manager:{' '}
                    <strong className="font-medium text-text">
                      {employee.reportingManager || '—'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="block text-xs text-text-muted">Joining Date</span>
                <strong className="text-sm">{formatDate(employee.joiningDate)}</strong>
              </div>
              <div>
                <span className="block text-xs text-text-muted">Employment Type</span>
                <strong className="text-sm">{employee.employmentType || '—'}</strong>
              </div>
              <div>
                <span className="block text-xs text-text-muted">Department</span>
                <strong className="text-sm">{employee.departmentName || '—'}</strong>
              </div>
              <div>
                <span className="block text-xs text-text-muted">Team</span>
                <strong className="text-sm">{employee.teamName || '—'}</strong>
              </div>
              {employee.employeeId ? (
                <div className="sm:col-span-2 flex justify-end">
                  <Link
                    to={`/employees/${employee.employeeId}`}
                    className="text-sm font-semibold text-primary hover:text-primary-hover"
                  >
                    View Profile →
                  </Link>
                </div>
              ) : null}
            </div>
          </section>

          <div className="overflow-x-auto border-b border-border-subtle">
            <div className="flex min-w-max items-center gap-1">
              {DETAIL_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`cursor-pointer ${mdTab} ${activeTab === tab.id ? mdTabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'overview' ? (
            <>
              <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                <SummaryKpiCard
                  label="Assigned Leads"
                  value={String(metrics.assigned)}
                  hint={`${metrics.activeLeads} active now`}
                  tone="blue"
                  icon="users"
                  onClick={() => void openDrill('assigned', 'Assigned Leads')}
                />
                <SummaryKpiCard
                  label="Contacted Leads"
                  value={String(metrics.contacted)}
                  hint={percent(metrics.contactRate)}
                  tone="teal"
                  icon="phone"
                  onClick={() => void openDrill('contacted', 'Contacted Leads')}
                />
                <SummaryKpiCard
                  label="Applications Created"
                  value={String(metrics.offersCreated)}
                  hint={`${percent(metrics.offerAcceptanceRate)} accepted`}
                  tone="purple"
                  icon="file"
                />
                <SummaryKpiCard
                  label="Follow-up Completion"
                  value={percent(metrics.followUpCompletionRate)}
                  hint={`${metrics.followUpsOnTime} on-time`}
                  tone="green"
                  icon="check"
                  onClick={() => void openDrill('follow_ups', 'Follow-ups')}
                />
                <SummaryKpiCard
                  label="Avg. Response Time"
                  value={minutes(metrics.avgResponseMinutes)}
                  hint={`${metrics.followUpsOverdue} overdue`}
                  tone="orange"
                  icon="clock"
                />
                <SummaryKpiCard
                  label="Conversion Rate"
                  value={percent(metrics.conversionRate)}
                  hint={`${metrics.converted} converted`}
                  tone="rose"
                  icon="trend"
                  onClick={() => void openDrill('converted', 'Converted Leads')}
                />
              </section>

              <section className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                <article className={card}>
                  <SectionTitle
                    title="Performance Trend"
                    action={
                      <span className="rounded-full bg-hover-bg px-2.5 py-1 text-[0.72rem] text-text-muted">
                        Last 6 months
                      </span>
                    }
                  />
                  <HistoryTrendChart history={data.history} />
                </article>
                <article className={card}>
                  <SectionTitle title="Performance Score" />
                  <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                    <ScoreGauge
                      score={data.overallScoreEnabled ? metrics.overallScore : null}
                      label="/100"
                    />
                    <div className="grid gap-2.5">
                      <p className="m-0 text-sm font-semibold text-text">Score Breakdown</p>
                      {data.kpis
                        .filter((item) => item.isActive)
                        .slice(0, 5)
                        .map((item) => {
                          const progress = kpiProgress(item)
                          return (
                            <div key={item.key} className="grid gap-1">
                              <div className="flex items-center justify-between gap-2 text-[0.78rem]">
                                <span className="truncate text-text-muted">{item.name}</span>
                                <strong>{progress}%</strong>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-text)_6%,var(--color-surface))]">
                                <div
                                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      {!data.overallScoreEnabled ? (
                        <p className="m-0 text-xs text-text-muted">
                          Overall score is disabled in KPI configuration.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </article>
              </section>

              <section className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-3">
                <article className={card}>
                  <SectionTitle title="Conversion Funnel" />
                  <AdmissionFunnelChart summary={metrics} />
                </article>
                <article className={card}>
                  <SectionTitle
                    title="Targets Snapshot"
                    action={
                      <button
                        type="button"
                        className="cursor-pointer border-0 bg-transparent p-0 text-[0.78rem] font-semibold text-primary"
                        onClick={() => setActiveTab('targets')}
                      >
                        View all
                      </button>
                    }
                  />
                  <div className="grid gap-2.5">
                    {data.kpis
                      .filter((item) => item.isActive)
                      .slice(0, 4)
                      .map((item) => (
                        <KpiTargetRow key={item.key} item={item} />
                      ))}
                  </div>
                </article>
                <article className={card}>
                  <SectionTitle
                    title="Recent Activities"
                    action={
                      <button
                        type="button"
                        className="cursor-pointer border-0 bg-transparent p-0 text-[0.78rem] font-semibold text-primary"
                        onClick={() => setActiveTab('activity')}
                      >
                        View all
                      </button>
                    }
                  />
                  <RecentActivityList items={data.recentActivity} limit={5} />
                </article>
              </section>

              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile label="Qualified" value={metrics.qualified} />
                <StatTile label="Avg Lead Score" value={metrics.avgLeadScore} />
                <StatTile label="Files Opened" value={metrics.filesOpened} />
                <StatTile
                  label="Collection"
                  value={metrics.collectionVisible ? money(metrics.collectionAmount) : '—'}
                />
              </section>
            </>
          ) : null}

          {activeTab === 'activity' ? (
            <>
              <section className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
                <article className={card}>
                  <SectionTitle title="Lead Handling Performance" />
                  <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <StatTile label="Assigned" value={metrics.assigned} />
                    <StatTile label="Accepted" value={metrics.accepted} />
                    <StatTile label="Contacted" value={metrics.contacted} />
                    <StatTile label="Unreachable" value={metrics.unreachable} />
                  </div>
                  <div className="grid gap-2">
                    {[
                      { label: 'Contact Rate', value: metrics.contactRate, color: '#3b82f6' },
                      { label: 'Qualification Rate', value: metrics.qualificationRate, color: '#8b5cf6' },
                      { label: 'Offer Acceptance', value: metrics.offerAcceptanceRate, color: '#22c55e' },
                    ].map((item) => (
                      <div key={item.label} className="grid gap-1">
                        <div className="flex justify-between text-[0.78rem]">
                          <span className="text-text-muted">{item.label}</span>
                          <strong>{item.value}%</strong>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-text)_6%,var(--color-surface))]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, item.value)}%`,
                              background: item.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className={card}>
                  <SectionTitle title="Follow-ups & Meetings" />
                  <div className="mb-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border-subtle p-3">
                      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Follow-ups
                      </p>
                      <div className="mt-2 grid gap-1.5 text-sm">
                        <div className="flex justify-between">
                          <span>Completed</span>
                          <strong>{metrics.followUpsCompleted}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>On-time</span>
                          <strong>{metrics.followUpsOnTime}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Overdue</span>
                          <strong className="text-[#be123c]">{metrics.followUpsOverdue}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Missed</span>
                          <strong>{metrics.followUpsMissed}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border-subtle p-3">
                      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Counselling
                      </p>
                      <div className="mt-2 grid gap-1.5 text-sm">
                        <div className="flex justify-between">
                          <span>Scheduled</span>
                          <strong>{metrics.counsellingScheduled}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed</span>
                          <strong>{metrics.counsellingCompleted}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Missed</span>
                          <strong>{metrics.counsellingMissed}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Rescheduled</span>
                          <strong>{metrics.counsellingRescheduled}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <StatTile label="Completion Rate" value={percent(metrics.followUpCompletionRate)} />
                    <StatTile label="On-time Rate" value={percent(metrics.followUpOnTimeRate)} />
                  </div>
                </article>
              </section>

              <section className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <article className={card}>
                  <SectionTitle title="Recent Activities" />
                  <RecentActivityList items={data.recentActivity} limit={12} />
                </article>
                <div className="grid min-w-0 gap-3">
                  <BreakdownCard title="By Country" rows={data.countries} />
                  <BreakdownCard title="By Source" rows={data.sources} />
                  <BreakdownCard title="By Campaign" rows={data.campaigns} />
                </div>
              </section>

              <section className={card}>
                <div className="mb-3 overflow-x-auto border-b border-border-subtle">
                  <div className="flex min-w-max items-center gap-1">
                    {TABLE_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        className={`cursor-pointer ${mdTab} ${tableTab === tab.id ? mdTabActive : ''}`}
                        onClick={() => setTableTab(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3 flex flex-nowrap items-center justify-between gap-3 overflow-x-auto">
                  <h3 className="m-0 shrink-0 text-base font-semibold whitespace-nowrap">
                    {TABLE_TABS.find((tab) => tab.id === tableTab)?.label}
                  </h3>
                  <div className="flex shrink-0 flex-nowrap items-center gap-2">
                    <Input.Search
                      allowClear
                      placeholder="Search lead..."
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value)
                        setPage(1)
                      }}
                      className="w-55"
                    />
                    <Select
                      value={statusFilter}
                      onChange={(value) => {
                        setStatusFilter(value)
                        setPage(1)
                      }}
                      className="min-w-36"
                      options={[
                        { value: 'all', label: 'All Status' },
                        ...statusOptions.map((status) => ({ value: status, label: status })),
                      ]}
                    />
                  </div>
                </div>

                {tableLoading ? (
                  <Spinner />
                ) : (
                  <>
                    <div className={tableWrap}>
                      <table className={adminTable}>
                        <thead>
                          <tr className="text-[0.72rem] text-text-faint">
                            <th>#</th>
                            <th>Lead</th>
                            <th>Country</th>
                            <th>Source</th>
                            <th>Score</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!pageRows.length ? (
                            <tr>
                              <td colSpan={8} className="cursor-default! py-10 text-center text-text-muted">
                                No records for this view.
                              </td>
                            </tr>
                          ) : (
                            pageRows.map((row, index) => (
                              <tr key={`${row.kind}-${row.id}`} className="cursor-default!">
                                <td className="text-text-muted">
                                  {(page - 1) * PAGE_SIZE + index + 1}
                                </td>
                                <td>
                                  <div className="flex items-center gap-2.5">
                                    <UserAvatar
                                      name={row.name}
                                      className={`${employeeAvatar} ${employeeAvatarSm}`}
                                    />
                                    <div className="min-w-0">
                                      <strong className="block truncate text-sm">{row.name}</strong>
                                      <span className="block truncate text-xs text-text-muted">
                                        {row.code}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td>{row.country}</td>
                                <td>{row.source}</td>
                                <td>{row.score}</td>
                                <td>
                                  <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${statusPill(row.status)}`}
                                  >
                                    {row.status || '—'}
                                  </span>
                                </td>
                                <td>{when(row.date)}</td>
                                <td>
                                  <Link
                                    to={`/leads/${row.leadId}`}
                                    className="text-sm font-semibold text-primary"
                                  >
                                    View
                                  </Link>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm text-text-muted">
                        Showing{' '}
                        {filteredTableRows.length
                          ? `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, filteredTableRows.length)}`
                          : '0'}{' '}
                        of {filteredTableRows.length} records
                      </span>
                      <Pagination
                        current={page}
                        pageSize={PAGE_SIZE}
                        total={filteredTableRows.length}
                        onChange={setPage}
                        showSizeChanger={false}
                        size="small"
                      />
                    </div>
                  </>
                )}
              </section>
            </>
          ) : null}

          {activeTab === 'targets' ? (
            <>
              <section className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.4fr)]">
                <article className={card}>
                  <SectionTitle title="Overall Performance Score" />
                  <div className="flex flex-col items-center gap-3 py-2">
                    <ScoreGauge
                      score={data.overallScoreEnabled ? metrics.overallScore : null}
                      label="/100"
                    />
                    <p className="m-0 max-w-xs text-center text-sm text-text-muted">
                      {data.overallScoreEnabled
                        ? 'Weighted score from active KPI targets. Separate from lead score.'
                        : 'Overall score is disabled in KPI configuration.'}
                    </p>
                  </div>
                </article>
                <article className={card}>
                  <SectionTitle title="Targets vs Actual" />
                  <div className="grid gap-2.5">
                    {data.kpis
                      .filter((item) => item.isActive)
                      .map((item) => (
                        <KpiTargetRow key={item.key} item={item} showWeight />
                      ))}
                    {!data.kpis.some((item) => item.isActive) ? (
                      <p className={muted}>No active KPIs configured.</p>
                    ) : null}
                  </div>
                </article>
              </section>

              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile label="Conversion Rate" value={percent(metrics.conversionRate)} />
                <StatTile label="Follow-up On-time" value={percent(metrics.followUpOnTimeRate)} />
                <StatTile label="Contact Rate" value={percent(metrics.contactRate)} />
                <StatTile label="Offer Acceptance" value={percent(metrics.offerAcceptanceRate)} />
              </section>
            </>
          ) : null}
        </>
      ) : null}

      {drillTitle ? (
        <DrillModal title={drillTitle} data={drill.data} onClose={() => setDrillTitle('')} />
      ) : null}
    </div>
  )
}

function BreakdownCard({
  title,
  rows,
}: {
  title: string
  rows: PerformanceDetail['countries']
}) {
  return (
    <article className={card}>
      <SectionTitle title={title} />
      {!rows.length ? (
        <p className={muted}>No data for this period.</p>
      ) : (
        <div className="grid gap-2">
          {rows.slice(0, 5).map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-2 rounded-lg border border-border-subtle px-2.5 py-2 text-sm"
            >
              <span className="truncate font-medium">{row.label}</span>
              <span className="shrink-0 text-text-muted">
                {row.assigned} → {row.converted} · {percent(row.conversionRate)}
              </span>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
