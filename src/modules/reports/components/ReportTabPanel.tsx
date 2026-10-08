import { Button } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { EmployeePerformanceDetailPage, EmployeePerformancePage } from '@/modules/performance'
import type { MetricRow, ReportTabId } from '../types'
import {
  CONVERSION_TREND,
  EMPLOYEE_PERFORMANCE,
  FUNNEL_STAGES,
  LEAD_SOURCES,
  REPORT_METRICS,
  TOP_COUNSELLORS,
} from '../data/mockAnalytics'
import ReportOverview from './ReportOverview'
import { ConversionTrendChart, LeadFunnelChart, LeadsBySourceChart } from './ReportCharts'

const card = 'rounded-2xl border border-border bg-surface p-4'

type ReportTabPanelProps = {
  tabId: ReportTabId
  onDrillDown: (metric: string) => void
}

function EmployeePerformanceTab() {
  const [params] = useSearchParams()
  if (params.get('detail')) return <EmployeePerformanceDetailPage />
  return <EmployeePerformancePage embedded />
}

function MetricsGrid({
  title,
  subtitle,
  metrics,
  onDrillDown,
}: {
  title: string
  subtitle: string
  metrics: MetricRow[]
  onDrillDown: (metric: string) => void
}) {
  return (
    <div className="grid gap-3">
      <article className={card}>
        <h3 className="mb-1 mt-0 text-base font-semibold">{title}</h3>
        <p className="mb-4 mt-0 text-[0.84rem] text-text-muted">{subtitle}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <button
              key={metric.label}
              type="button"
              onClick={() => onDrillDown(metric.label)}
              className="cursor-pointer rounded-xl border border-border bg-[color-mix(in_srgb,var(--color-text)_2%,var(--color-surface))] px-3.5 py-3 text-left transition-colors hover:border-primary"
            >
              <p className="m-0 text-[0.76rem] text-text-muted">{metric.label}</p>
              <strong className="mt-1 block text-[1.15rem] tracking-[-0.02em]">{metric.value}</strong>
              {metric.hint ? <small className="mt-1 block text-[0.7rem] text-text-faint">{metric.hint}</small> : null}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <Button
            type="link"
            className="!h-auto !px-0 !font-semibold !text-primary hover:!text-primary-hover"
            onClick={() => onDrillDown(title)}
          >
            View underlying records
          </Button>
        </div>
      </article>
    </div>
  )
}

export default function ReportTabPanel({ tabId, onDrillDown }: ReportTabPanelProps) {
  if (tabId === 'overview') {
    return (
      <ReportOverview
        topCounsellors={TOP_COUNSELLORS}
        employeePerformance={EMPLOYEE_PERFORMANCE}
        onDrillDown={onDrillDown}
      />
    )
  }

  if (tabId === 'lead-conversion') {
    const sourceTotal = LEAD_SOURCES.reduce((sum, item) => sum + item.value, 0)
    return (
      <div className="grid gap-3">
        <MetricsGrid
          title="Lead & Conversion Report"
          subtitle="Analyze lead acquisition and conversion across sources, countries, services, and employees."
          metrics={REPORT_METRICS['lead-conversion']}
          onDrillDown={onDrillDown}
        />
        <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
          <article className={card}>
            <h3 className="mb-3 mt-0 text-base font-semibold">Lead Funnel</h3>
            <LeadFunnelChart stages={FUNNEL_STAGES} />
          </article>
          <article className={card}>
            <h3 className="mb-3 mt-0 text-base font-semibold">Leads by Source</h3>
            <LeadsBySourceChart segments={LEAD_SOURCES} total={sourceTotal} />
          </article>
        </div>
        <article className={card}>
          <h3 className="mb-3 mt-0 text-base font-semibold">Lead & Conversion Trend</h3>
          <ConversionTrendChart points={CONVERSION_TREND} />
        </article>
      </div>
    )
  }

  const titles: Record<Exclude<ReportTabId, 'overview' | 'lead-conversion'>, { title: string; subtitle: string }> = {
    'lead-quality': {
      title: 'Lead Quality & Scoring Report',
      subtitle: 'Score-wise conversion and quality analysis by source and country.',
    },
    'employee-performance': {
      title: 'Employee Performance Report',
      subtitle: 'Lead, follow-up, file, and service performance by employee.',
    },
    'follow-up': {
      title: 'Follow-up & Activity Report',
      subtitle: 'Monitor client communication, overdue actions, and activity mix.',
    },
    'service-file': {
      title: 'Service & File Report',
      subtitle: 'Track file lifecycle and service completion metrics.',
    },
    payment: {
      title: 'Payment & Collection Report',
      subtitle: 'Collection performance, payment methods, and due aging.',
    },
    closure: {
      title: 'Closure & Outcome Report',
      subtitle: 'File closure outcomes and employee-wise closure analysis.',
    },
    document: {
      title: 'Document Status Report',
      subtitle: 'Document processing status and verification workload.',
    },
  }

  if (tabId === 'employee-performance') {
    return <EmployeePerformanceTab />
  }

  const meta = titles[tabId]
  return (
    <MetricsGrid
      title={meta.title}
      subtitle={meta.subtitle}
      metrics={REPORT_METRICS[tabId]}
      onDrillDown={onDrillDown}
    />
  )
}
