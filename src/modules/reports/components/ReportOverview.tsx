import { Button } from 'antd'
import type { SVGProps } from 'react'
import type { CounsellorRow, InsightItem, KpiCard } from '../types'
import {
  CONVERSION_TREND,
  FUNNEL_STAGES,
  LEAD_SOURCES,
  OVERVIEW_KPIS,
  QUICK_INSIGHTS,
} from '../data/mockAnalytics'
import { ConversionTrendChart, LeadFunnelChart, LeadsBySourceChart } from './ReportCharts'

const card = 'rounded-2xl border border-border bg-surface p-4'

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

type ReportOverviewProps = {
  topCounsellors: CounsellorRow[]
  employeePerformance: CounsellorRow[]
  onDrillDown: (metric: string) => void
}

function PerformanceTable({
  title,
  rows,
}: {
  title: string
  rows: CounsellorRow[]
}) {
  return (
    <article className={card}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="m-0 text-base font-semibold">{title}</h3>
        <span className="rounded-full bg-hover-bg px-2.5 py-1 text-[0.72rem] text-text-muted">This Month</span>
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
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border-subtle text-[0.84rem]">
                <td className="px-1.5 py-2.5 font-medium">{row.name}</td>
                <td className="px-1.5 py-2.5">{row.leads}</td>
                <td className="px-1.5 py-2.5">{row.converted}</td>
                <td className="px-1.5 py-2.5">
                  <span className="inline-flex items-center gap-1.5">
                    <strong>{row.rate}%</strong>
                    <span className={row.change >= 0 ? 'text-[#16a34a]' : 'text-[#e11d48]'}>
                      {row.change >= 0 ? '↑' : '↓'} {Math.abs(row.change)}%
                    </span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}

export default function ReportOverview({
  topCounsellors,
  employeePerformance,
  onDrillDown,
}: ReportOverviewProps) {
  const sourceTotal = LEAD_SOURCES.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="grid gap-3">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {OVERVIEW_KPIS.map((kpi) => (
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
              <span className={kpi.change >= 0 ? 'font-medium text-[#16a34a]' : 'font-medium text-[#e11d48]'}>
                {kpi.change >= 0 ? '↑' : '↓'} {Math.abs(kpi.change)}%
              </span>
              <small className="text-text-faint">vs previous 30 days</small>
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
          <LeadFunnelChart stages={FUNNEL_STAGES} />
        </article>

        <article className={card}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="m-0 text-base font-semibold">Lead & Conversion Trend</h3>
            <span className="rounded-full bg-hover-bg px-2.5 py-1 text-[0.72rem] text-text-muted">6 months</span>
          </div>
          <ConversionTrendChart points={CONVERSION_TREND} />
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
          <LeadsBySourceChart segments={LEAD_SOURCES} total={sourceTotal} />
        </article>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(280px,0.75fr)]">
        <PerformanceTable title="Top Performing Counsellors" rows={topCounsellors} />
        <PerformanceTable title="Employee Performance" rows={employeePerformance} />

        <article className={card}>
          <h3 className="mb-3 mt-0 text-base font-semibold">Quick Insights</h3>
          <ul className="m-0 grid list-none gap-2 p-0">
            {QUICK_INSIGHTS.map((insight) => (
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
