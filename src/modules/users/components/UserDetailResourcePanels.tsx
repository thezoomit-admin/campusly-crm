import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Skeleton } from 'antd'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  AnalyticsUpIcon,
  File01Icon,
  LicenseIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { adminTable, muted, tableWrap } from '@/styles/admin'
import { useListLeadsQuery } from '@/modules/leads/api/leadsApi'
import { useListApplicationsQuery } from '@/modules/applications/api/applicationsApi'
import { useListDocumentsQuery } from '@/modules/documents/api/documentsApi'
import {
  useGetPerformanceDetailQuery,
  type PerformanceMetrics,
} from '@/modules/performance/api/performanceApi'
import { minutes, percent } from '@/modules/performance/format'
import { PrimaryButton } from '@/components/ui'
import { getApiError } from '@/lib/api'

const panelCard =
  'rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:justify-between [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong'

function PanelHeader({
  icon,
  title,
  total,
  action,
}: {
  icon: IconSvgElement
  title: string
  total?: number
  action?: ReactNode
}) {
  return (
    <header>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5b67e8]">
          <HugeiconsIcon icon={icon} size={16} color="currentColor" strokeWidth={1.7} />
        </span>
        <h4>
          {title}
          {typeof total === 'number' ? (
            <span className="ml-2 text-[0.78rem] font-semibold text-[#7b8498]">({total})</span>
          ) : null}
        </h4>
      </div>
      {action}
    </header>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid min-h-[120px] place-items-center rounded-xl border border-dashed border-[#e0e6f0] bg-[#fafbfe] px-4 py-8 text-center dark:border-border dark:bg-[#1a222c]">
      <p className={`${muted} m-0`}>{message}</p>
    </div>
  )
}

function ErrorState({ error, fallback }: { error: unknown; fallback: string }) {
  return (
    <div className="rounded-xl border border-[#ffe0e6] bg-[#fff7f8] px-4 py-3 text-[0.84rem] text-[#be123c] dark:border-[rgba(190,18,60,0.35)] dark:bg-[rgba(190,18,60,0.12)]">
      {getApiError(error, fallback)}
    </div>
  )
}

function statusTone(status: string) {
  const key = status.toLowerCase()
  if (key.includes('convert') || key.includes('enroll') || key.includes('verif') || key.includes('active')) {
    return 'bg-[#e7f8ef] text-[#15803d]'
  }
  if (key.includes('pending') || key.includes('draft') || key.includes('review') || key.includes('offer')) {
    return 'bg-[#fff1e6] text-[#c2410c]'
  }
  if (key.includes('reject') || key.includes('withdraw') || key.includes('lost') || key.includes('expired')) {
    return 'bg-[#ffe8ee] text-[#be123c]'
  }
  return 'bg-[#eef1ff] text-[#4f5de4]'
}

function formatShortDate(value?: string | null) {
  if (!value || value === '—') return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function MetricTile({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-2xl border border-[#e8edf6] bg-[#f7f8fd] px-3.5 py-3 dark:border-border dark:bg-[#1a222c]">
      <span className="block text-[0.72rem] font-semibold uppercase tracking-wide text-[#7b8498]">{label}</span>
      <strong className="mt-1 block text-[1.25rem] text-[#24324d] dark:text-text-strong">{value}</strong>
      {hint ? <p className="m-0 mt-0.5 text-[0.75rem] text-[#7b8498]">{hint}</p> : null}
    </div>
  )
}

function metricSnapshot(metrics: PerformanceMetrics) {
  return [
    { label: 'Assigned', value: String(metrics.assigned), hint: `${metrics.activeLeads} active` },
    { label: 'Contacted', value: String(metrics.contacted), hint: `${percent(metrics.contactRate)} rate` },
    { label: 'Follow-ups', value: percent(metrics.followUpCompletionRate), hint: `${metrics.followUpsOnTime} on-time` },
    { label: 'Converted', value: String(metrics.converted), hint: `${percent(metrics.conversionRate)} rate` },
    { label: 'Response', value: minutes(metrics.avgResponseMinutes), hint: 'Avg first response' },
    { label: 'Overdue', value: String(metrics.overdueFollowUps), hint: `${metrics.pendingFollowUps} pending` },
  ]
}

export function UserAssignedLeadsPanel({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const { data, isFetching, isError, error } = useListLeadsQuery({
    ownerId: userId,
    page: 1,
    limit: 20,
  })

  const items = data?.items || []
  const total = data?.total ?? 0

  return (
    <article className={panelCard}>
      <PanelHeader
        icon={UserGroupIcon}
        title="Assigned Leads"
        total={isFetching ? undefined : total}
        action={
          <Link to="/leads" className="text-[0.78rem] font-semibold text-[#5b67e8] no-underline hover:underline">
            Open leads
          </Link>
        }
      />
      {isFetching ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : isError ? (
        <ErrorState error={error} fallback="Unable to load assigned leads." />
      ) : items.length === 0 ? (
        <EmptyState message="No leads are currently assigned to this user." />
      ) : (
        <div className={tableWrap}>
          <table className={adminTable}>
            <thead>
              <tr>
                <th>Lead</th>
                <th>Country</th>
                <th>Source</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Next follow-up</th>
              </tr>
            </thead>
            <tbody>
              {items.map((lead) => (
                <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                  <td>
                    <Link
                      to={`/leads/${lead.id}`}
                      className="font-semibold text-[#24324d] no-underline hover:text-[#5b67e8] dark:text-text-strong"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {lead.name}
                    </Link>
                    <div className={muted}>{lead.code || lead.phone}</div>
                  </td>
                  <td>{lead.country || '—'}</td>
                  <td>{lead.source || '—'}</td>
                  <td>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.72rem] font-bold ${statusTone(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td>{lead.priority || '—'}</td>
                  <td>{formatShortDate(lead.nextFollowUpAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}

export function UserApplicationsPanel({ userId }: { userId: string }) {
  const { data, isFetching, isError, error } = useListApplicationsQuery({
    counsellorId: userId,
    page: 1,
    limit: 20,
  })

  const items = data?.items || []
  const total = data?.total ?? 0

  return (
    <article className={panelCard}>
      <PanelHeader
        icon={LicenseIcon}
        title="Applications"
        total={isFetching ? undefined : total}
        action={
          <Link
            to="/applications"
            className="text-[0.78rem] font-semibold text-[#5b67e8] no-underline hover:underline"
          >
            Open applications
          </Link>
        }
      />
      {isFetching ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : isError ? (
        <ErrorState error={error} fallback="Unable to load applications." />
      ) : items.length === 0 ? (
        <EmptyState message="No applications are linked to this counsellor yet." />
      ) : (
        <div className={tableWrap}>
          <table className={adminTable}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Applicant</th>
                <th>University</th>
                <th>Program</th>
                <th>Intake</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {items.map((app) => (
                <tr key={app.id}>
                  <td>
                    <Link
                      to={`/applications/${app.id}`}
                      className="font-semibold text-[#5b67e8] no-underline hover:underline"
                    >
                      {app.code}
                    </Link>
                  </td>
                  <td>
                    <div className="font-semibold text-[#24324d] dark:text-text-strong">{app.applicant}</div>
                    {app.leadCode ? <div className={muted}>{app.leadCode}</div> : null}
                  </td>
                  <td>{app.university}</td>
                  <td>{app.program}</td>
                  <td>{app.intake}</td>
                  <td>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.72rem] font-bold ${statusTone(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td>{formatShortDate(app.submitted)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}

export function UserDocumentsPanel({ userId }: { userId: string }) {
  const { data, isFetching, isError, error } = useListDocumentsQuery({
    ownerId: userId,
    page: 1,
    limit: 20,
  })

  const items = data?.items || []
  const total = data?.total ?? 0

  return (
    <article className={panelCard}>
      <PanelHeader
        icon={File01Icon}
        title="Documents"
        total={isFetching ? undefined : total}
        action={
          <Link to="/documents" className="text-[0.78rem] font-semibold text-[#5b67e8] no-underline hover:underline">
            Open documents
          </Link>
        }
      />
      {isFetching ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : isError ? (
        <ErrorState error={error} fallback="Unable to load documents." />
      ) : items.length === 0 ? (
        <EmptyState message="No documents found on leads owned by this user." />
      ) : (
        <div className={tableWrap}>
          <table className={adminTable}>
            <thead>
              <tr>
                <th>Lead</th>
                <th>Document</th>
                <th>Category</th>
                <th>Uploaded by</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {items.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    {doc.leadId ? (
                      <Link
                        to={`/leads/${doc.leadId}`}
                        className="font-semibold text-[#5b67e8] no-underline hover:underline"
                      >
                        {doc.leadCode || doc.leadName || doc.owner}
                      </Link>
                    ) : (
                      <span className="font-semibold">{doc.owner}</span>
                    )}
                    {doc.leadName && doc.leadCode ? <div className={muted}>{doc.leadName}</div> : null}
                  </td>
                  <td>{doc.type}</td>
                  <td>{doc.category}</td>
                  <td>{doc.uploadedBy}</td>
                  <td>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.72rem] font-bold ${statusTone(doc.status)}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td>{doc.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}

export function UserPerformancePanel({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const { data, isFetching, isError, error } = useGetPerformanceDetailQuery({
    userId,
    preset: 'this_month',
  })

  const metrics = data?.metrics
  const employee = data?.employee

  return (
    <article className={panelCard}>
      <PanelHeader
        icon={AnalyticsUpIcon}
        title="Performance"
        action={
          <PrimaryButton
            size="sm"
            variant="outline"
            label="Full performance"
            onClick={() => navigate(`/dashboard/employee-performance/${userId}`)}
          />
        }
      />
      {isFetching ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : isError ? (
        <ErrorState error={error} fallback="Unable to load performance metrics." />
      ) : !metrics ? (
        <EmptyState message="No performance data is available for this user yet." />
      ) : (
        <div className="grid gap-3.5">
          <p className={`${muted} m-0`}>
            {employee?.name || 'This user'} · This month
            {data?.message ? ` · ${data.message}` : ''}
          </p>
          <div className="grid grid-cols-1 gap-2.5 min-[640px]:grid-cols-2 min-[961px]:grid-cols-3">
            {metricSnapshot(metrics).map((item) => (
              <MetricTile key={item.label} {...item} />
            ))}
          </div>
          {data?.kpis?.length ? (
            <div className="grid gap-2">
              <strong className="text-[0.84rem] text-[#24324d] dark:text-text-strong">KPI targets</strong>
              <div className="grid gap-2">
                {data.kpis.slice(0, 6).map((kpi) => (
                  <div
                    key={kpi.key}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e8edf6] px-3 py-2.5 dark:border-border"
                  >
                    <div>
                      <div className="font-semibold text-[#24324d] dark:text-text-strong">{kpi.name}</div>
                      <div className={muted}>
                        Target {kpi.unit === 'percent' ? percent(kpi.target) : kpi.unit === 'minutes' ? minutes(kpi.target) : kpi.target}
                      </div>
                    </div>
                    <div className="text-right">
                      <strong className="block text-[#24324d] dark:text-text-strong">
                        {kpi.unit === 'percent'
                          ? percent(kpi.actual)
                          : kpi.unit === 'minutes'
                            ? minutes(kpi.actual)
                            : String(kpi.actual)}
                      </strong>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[0.7rem] font-bold ${
                          kpi.status === 'Exceeded'
                            ? 'bg-[#e7f8ef] text-[#15803d]'
                            : kpi.status === 'Achieved'
                              ? 'bg-[#e8f1ff] text-[#1d4ed8]'
                              : 'bg-[#ffe8ee] text-[#be123c]'
                        }`}
                      >
                        {kpi.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {data?.overdue?.length ? (
            <div className="grid gap-2">
              <strong className="text-[0.84rem] text-[#24324d] dark:text-text-strong">Overdue follow-ups</strong>
              <ul className="m-0 grid list-none gap-2 p-0">
                {data.overdue.slice(0, 5).map((row) => (
                  <li
                    key={row.followUpId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#ffe8ee] bg-[#fff7f8] px-3 py-2.5 dark:border-[rgba(190,18,60,0.3)] dark:bg-[rgba(190,18,60,0.1)]"
                  >
                    <div>
                      <Link
                        to={`/leads/${row.leadId}`}
                        className="font-semibold text-[#be123c] no-underline hover:underline"
                      >
                        {row.leadName}
                      </Link>
                      <div className={muted}>
                        {row.leadCode} · Due {formatShortDate(row.dueAt)}
                      </div>
                    </div>
                    <span className="inline-flex rounded-full bg-[#ffe8ee] px-2 py-0.5 text-[0.7rem] font-bold text-[#be123c]">
                      {row.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </article>
  )
}
