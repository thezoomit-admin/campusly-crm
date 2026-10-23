import { Button } from 'antd'
import type { CSSProperties, SVGProps } from 'react'
import type { CounsellorRow, InsightItem, KpiCard, ReportOverviewData } from '../types'
import { ConversionTrendChart, LeadFunnelChart, LeadsBySourceChart } from './ReportCharts'

const card = 'rounded-2xl border border-border bg-surface p-4'

const KPI_SKELETONS: Array<{ key: KpiCard['key']; label: string; tone: KpiCard['tone'] }> = [
  { key: 'total-leads', label: 'Total Leads', tone: 'blue' },
  { key: 'converted', label: 'Converted Leads', tone: 'green' },
  { key: 'conversion-rate', label: 'Conversion Rate', tone: 'purple' },
  { key: 'files-opened', label: 'Files Opened', tone: 'orange' },
  { key: 'collection', label: 'Total Collection', tone: 'rose' },
]

function Bone({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#d5e0ec] dark:bg-[#3a4856] ${className || ''}`}
      style={style}
      aria-hidden="true"
    />
  )
}

const toneIcon: Record<KpiCard['tone'], string> = {
  blue: 'bg-[#e8f1ff] text-[#3b82f6] dark:bg-blue-500/20 dark:text-[#93c5fd]',
  green: 'bg-[#e7f8ef] text-[#22c55e] dark:bg-green-500/20 dark:text-[#86efac]',
  purple: 'bg-[#eee8ff] text-[#8b5cf6] dark:bg-violet-500/20 dark:text-[#c4b5fd]',
  orange: 'bg-[#fff1e6] text-[#f59e0b] dark:bg-amber-500/20 dark:text-[#fcd34d]',
  rose: 'bg-[#ffe8ee] text-[#f43f5e] dark:bg-rose-500/20 dark:text-[#fda4af]',
}

function KpiIcon({ name }: { name: KpiCard['key'] }) {
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

  if (name === 'total-leads') {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  }
  if (name === 'converted') {
    return (
      <svg {...common}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="M22 4 12 14.01l-3-3" />
      </svg>
    )
  }
  if (name === 'conversion-rate') {
    return (
      <svg {...common}>
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 4 4 5-6" />
      </svg>
    )
  }
  if (name === 'files-opened') {
    return (
      <svg {...common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M12 1v22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

const insightTone: Record<InsightItem['tone'], string> = {
  success: 'border-l-[#22c55e] bg-[#f3fbf6] dark:bg-green-500/10',
  warning: 'border-l-[#f59e0b] bg-[#fff8f1] dark:bg-amber-500/10',
  info: 'border-l-[#3b82f6] bg-[#f4f8ff] dark:bg-blue-500/10',
}

function ChangeValue({ change }: { change: number }) {
  if (change === 0) return <span className="font-medium text-text-faint">0%</span>
  return (
    <span className={change > 0 ? 'font-medium text-[#16a34a]' : 'font-medium text-[#e11d48]'}>
      {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
    </span>
  )
}

function PerformanceTable({
  title,
  periodLabel,
  rows,
}: {
  title: string
  periodLabel: string
  rows: CounsellorRow[]
}) {
  return (
    <article className={card}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="m-0 text-base font-semibold">{title}</h3>
        <span className="rounded-full bg-hover-bg px-2.5 py-1 text-[0.72rem] text-text-muted">{periodLabel}</span>
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[360px] border-collapse">
          <thead>
            <tr className="text-left text-[0.72rem] text-text-faint">
              <th className="px-1.5 py-2 font-semibold">Name</th>
              <th className="px-1.5 py-2 font-semibold">Leads</th>
              <th className="px-1.5 py-2 font-semibold">Converted</th>
              <th className="px-1.5 py-2 font-semibold">Rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-1.5 py-6 text-center text-[0.82rem] text-text-muted">
                  No assigned leads in this period.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-border-subtle text-[0.84rem]">
                  <td className="px-1.5 py-2.5 font-medium">{row.name}</td>
                  <td className="px-1.5 py-2.5">{row.leads}</td>
                  <td className="px-1.5 py-2.5">{row.converted}</td>
                  <td className="px-1.5 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <strong>{row.rate}%</strong>
                      <ChangeValue change={row.change} />
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  )
}

type ReportOverviewProps = {
  data?: ReportOverviewData
  isLoading: boolean
  errorMessage?: string
  onRetry: () => void
  onDrillDown: (metric: string) => void
}

function OverviewSkeleton() {
  return (
    <div className="grid gap-3" aria-busy="true">
      <span className="sr-only">Loading overview</span>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {KPI_SKELETONS.map((kpi) => (
          <article key={kpi.key} className={`${card} px-3.5 py-3.5`}>
            <div className={`mb-2 grid size-8 place-items-center rounded-[10px] ${toneIcon[kpi.tone]}`}>
              <KpiIcon name={kpi.key} />
            </div>
            <p className="m-0 truncate text-[0.78rem] text-text-muted">{kpi.label}</p>
            <Bone className="mt-2 h-7 w-24" />
            <Bone className="mt-2 h-3 w-32" />
          </article>
        ))}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)_minmax(0,0.95fr)]">
        <article className={card}>
          <h3 className="m-0 text-base font-semibold">Lead Funnel</h3>
          <div className="mt-3 grid gap-2.5">
            {['100%', '82%', '64%', '46%', '32%'].map((width) => (
              <div key={width} className="grid gap-1">
                <div className="flex items-center justify-between gap-2">
                  <Bone className="h-3 w-24" />
                  <Bone className="h-3 w-16" />
                </div>
                <Bone className="h-8 rounded-lg" style={{ width }} />
              </div>
            ))}
          </div>
        </article>

        <article className={card}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="m-0 text-base font-semibold">Lead & Conversion Trend</h3>
            <Bone className="h-6 w-16 rounded-full" />
          </div>
          <div className="mb-3 flex gap-4">
            <Bone className="h-3 w-20" />
            <Bone className="h-3 w-28" />
          </div>
          <div className="flex h-[180px] items-end gap-3 px-1">
            {['46%', '58%', '42%', '70%', '54%', '82%'].map((height, index) => (
              <div key={index} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
                <div className="animate-pulse rounded-t-lg bg-[#d5e0ec] dark:bg-[#3a4856]" style={{ height }} />
                <Bone className="mx-auto h-2.5 w-6" />
              </div>
            ))}
          </div>
        </article>

        <article className={card}>
          <h3 className="m-0 text-base font-semibold">Leads by Source</h3>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="relative mx-auto size-[150px] shrink-0">
              <div className="absolute inset-0 animate-pulse rounded-full bg-[#d5e0ec] dark:bg-[#3a4856]" />
              <div className="absolute inset-[18%] rounded-full bg-surface" />
            </div>
            <ul className="m-0 grid min-w-[160px] flex-1 list-none gap-2 p-0">
              {Array.from({ length: 5 }, (_, index) => (
                <li key={index} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <Bone className="size-2 shrink-0 rounded-full" />
                    <Bone className="h-3.5" style={{ width: `${72 - index * 8}px` }} />
                  </span>
                  <Bone className="h-3.5 w-10" />
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(280px,0.75fr)]">
        {['Top Performing Counsellors', 'Employee Performance'].map((title) => (
          <article key={title} className={card}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="m-0 text-base font-semibold">{title}</h3>
              <Bone className="h-6 w-20 rounded-full" />
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <Bone key={index} className="h-3 w-14" />
                ))}
              </div>
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="grid grid-cols-4 gap-2 border-t border-border-subtle pt-2">
                  <Bone className="h-4 w-24" />
                  <Bone className="h-4 w-8" />
                  <Bone className="h-4 w-8" />
                  <Bone className="h-4 w-16" />
                </div>
              ))}
            </div>
          </article>
        ))}

        <article className={card}>
          <h3 className="mb-3 mt-0 text-base font-semibold">Quick Insights</h3>
          <ul className="m-0 grid list-none gap-2 p-0">
            {Array.from({ length: 5 }, (_, index) => (
              <li key={index} className="rounded-xl border border-transparent border-l-4 border-l-[#d5e0ec] px-3 py-2.5 dark:border-l-[#3a4856]">
                <Bone className="h-3.5 w-full" />
                <Bone className="mt-1.5 h-3.5 w-4/5" />
              </li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  )
}

export default function ReportOverview({
  data,
  isLoading,
  errorMessage,
  onRetry,
  onDrillDown,
}: ReportOverviewProps) {
  if (isLoading && !data) return <OverviewSkeleton />

  if (!data) {
    return (
      <div className={`${card} grid justify-items-center gap-3 py-10 text-center`}>
        <p className="m-0 text-[0.9rem] text-text-muted">{errorMessage || 'Unable to load the overview.'}</p>
        <Button onClick={onRetry}>Try again</Button>
      </div>
    )
  }

  const sourceTotal = data.sources.reduce((sum, item) => sum + item.value, 0)
  const trend = data.trend.length > 0 ? data.trend : [{ label: '—', totalLeads: 0, convertedLeads: 0 }]

  return (
    <div className="grid gap-3">
      {data.notice ? (
        <p className="m-0 rounded-xl border border-border bg-hover-bg px-3 py-2 text-[0.82rem] text-text-muted">
          {data.notice}
        </p>
      ) : null}
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {data.kpis.map((kpi) => (
          <button
            key={kpi.key}
            type="button"
            onClick={() => onDrillDown(kpi.label)}
            className={`${card} relative cursor-pointer overflow-hidden px-3.5 py-3.5 text-left transition-shadow hover:shadow-[0_8px_24px_rgba(16,24,40,0.08)]`}
          >
            <div className={`mb-2 grid size-8 place-items-center rounded-[10px] ${toneIcon[kpi.tone]}`}>
              <KpiIcon name={kpi.key} />
            </div>
            <p className="m-0 truncate text-[0.78rem] text-text-muted">{kpi.label}</p>
            <strong className="mt-1 block text-[1.3rem] tracking-[-0.03em]">{kpi.value}</strong>
            <div className="mt-1.5 flex items-center gap-1.5 text-[0.7rem]">
              <ChangeValue change={kpi.change} />
              <small className="text-text-faint">{data.comparisonLabel}</small>
            </div>
          </button>
        ))}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)_minmax(0,0.95fr)]">
        <article className={card}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="m-0 text-base font-semibold">Lead Funnel</h3>
            <Button
              type="link"
              className="!h-auto !p-0 !text-[0.78rem] !font-semibold !text-primary hover:!text-primary-hover"
              onClick={() => onDrillDown('Lead Funnel')}
            >
              View details
            </Button>
          </div>
          <LeadFunnelChart stages={data.funnel} />
        </article>

        <article className={card}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="m-0 text-base font-semibold">Lead & Conversion Trend</h3>
            <span className="rounded-full bg-hover-bg px-2.5 py-1 text-[0.72rem] text-text-muted">6 months</span>
          </div>
          <ConversionTrendChart points={trend} />
        </article>

        <article className={card}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="m-0 text-base font-semibold">Leads by Source</h3>
            <Button
              type="link"
              className="!h-auto !p-0 !text-[0.78rem] !font-semibold !text-primary hover:!text-primary-hover"
              onClick={() => onDrillDown('Leads by Source')}
            >
              Drill-down
            </Button>
          </div>
          {sourceTotal === 0 ? (
            <p className="m-0 py-8 text-center text-[0.84rem] text-text-muted">No leads in this period.</p>
          ) : (
            <LeadsBySourceChart segments={data.sources} total={sourceTotal} />
          )}
        </article>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(280px,0.75fr)]">
        <PerformanceTable title="Top Performing Counsellors" periodLabel={data.periodLabel} rows={data.topCounsellors} />
        <PerformanceTable title="Employee Performance" periodLabel={data.periodLabel} rows={data.employeePerformance} />

        <article className={card}>
          <h3 className="mb-3 mt-0 text-base font-semibold">Quick Insights</h3>
          <ul className="m-0 grid list-none gap-2 p-0">
            {data.insights.map((insight) => (
              <li
                key={insight.id}
                className={`rounded-xl border border-transparent border-l-4 px-3 py-2.5 text-[0.8rem] leading-relaxed text-text ${insightTone[insight.tone]}`}
              >
                {insight.text}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  )
}
