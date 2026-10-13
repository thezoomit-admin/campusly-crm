import type { EmployeePerformanceRow, PerformanceMetrics } from '../api/performanceApi'

export function HistoryTrendChart({
  history,
}: {
  history: Array<{ month: string; assigned: number; converted: number; followUpOnTimeRate: number }>
}) {
  if (!history.length) {
    return <p className="m-0 text-sm text-text-muted">No trend data for this period.</p>
  }

  const width = 560
  const height = 240
  const pad = { top: 18, right: 16, bottom: 36, left: 36 }
  const max = Math.max(...history.flatMap((p) => [p.assigned, p.converted]), 1)
  const innerWidth = width - pad.left - pad.right
  const innerHeight = height - pad.top - pad.bottom

  const series = (key: 'assigned' | 'converted') =>
    history.map((point, index) => {
      const x = pad.left + (index / Math.max(history.length - 1, 1)) * innerWidth
      const y = pad.top + innerHeight - (point[key] / max) * innerHeight
      return { label: point.month, x, y, value: point[key] }
    })

  const pathFor = (items: Array<{ x: number; y: number }>) =>
    items.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')

  const assigned = series('assigned')
  const converted = series('converted')
  const followUp = history.map((point, index) => {
    const x = pad.left + (index / Math.max(history.length - 1, 1)) * innerWidth
    const y = pad.top + innerHeight - (point.followUpOnTimeRate / 100) * innerHeight
    return { label: point.month, x, y }
  })

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-4 text-[0.75rem] text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-full bg-[#3b82f6]" /> Assigned
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-full bg-[#22c55e]" /> Converted
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-full bg-[#8b5cf6]" /> Follow-up %
        </span>
      </div>
      <svg
        className="h-auto w-full max-w-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Performance history trend"
      >
        {[0.25, 0.5, 0.75, 1].map((step) => {
          const y = pad.top + innerHeight * (1 - step)
          return (
            <line
              key={step}
              x1={pad.left}
              x2={width - pad.right}
              y1={y}
              y2={y}
              className="stroke-chart-track"
              strokeWidth={1}
            />
          )
        })}
        <path d={pathFor(assigned)} className="fill-none stroke-[#3b82f6]" strokeWidth={2.5} />
        <path d={pathFor(converted)} className="fill-none stroke-[#22c55e]" strokeWidth={2.5} />
        <path d={pathFor(followUp)} className="fill-none stroke-[#8b5cf6]" strokeWidth={2.5} strokeDasharray="4 3" />
        {assigned.map((point) => (
          <circle key={`a-${point.label}`} cx={point.x} cy={point.y} r="3.5" className="fill-surface stroke-[#3b82f6]" strokeWidth={2} />
        ))}
        {converted.map((point) => (
          <circle key={`c-${point.label}`} cx={point.x} cy={point.y} r="3.5" className="fill-surface stroke-[#22c55e]" strokeWidth={2} />
        ))}
        {history.map((point, index) => {
          const x = pad.left + (index / Math.max(history.length - 1, 1)) * innerWidth
          return (
            <text key={point.month} x={x} y={height - 10} textAnchor="middle" className="fill-text-faint text-[10px]">
              {point.month}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

export function ScoreGauge({
  score,
  label,
}: {
  score: number | null
  label?: string
}) {
  const value = score ?? 0
  const radius = 54
  const stroke = 10
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, value)) / 100
  const tone =
    value >= 80 ? '#16a34a' : value >= 60 ? '#f59e0b' : value > 0 ? '#ef4444' : '#94a3b8'
  const grade =
    value >= 90 ? 'Excellent' : value >= 75 ? 'Good' : value >= 60 ? 'Average' : value > 0 ? 'Needs focus' : 'N/A'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg className="h-auto w-35" viewBox="0 0 140 140" aria-hidden="true">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          className="stroke-chart-track"
          strokeWidth={stroke}
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * progress} ${circumference * (1 - progress)}`}
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="66" textAnchor="middle" className="fill-text text-[22px] font-bold">
          {score == null ? '—' : value}
        </text>
        <text x="70" y="86" textAnchor="middle" className="fill-text-faint text-[11px]">
          {label || '/100'}
        </text>
      </svg>
      <span className="text-sm font-semibold" style={{ color: tone }}>
        {grade}
      </span>
    </div>
  )
}

export function PerformanceTrendChart({
  employees,
}: {
  employees: EmployeePerformanceRow[]
}) {
  const points = employees
    .slice()
    .sort((a, b) => b.converted - a.converted)
    .slice(0, 8)
    .map((row) => ({
      label: row.name.split(' ')[0] || row.name,
      contacted: row.contacted,
      applications: row.offersCreated || row.qualified,
      conversions: row.converted,
    }))

  if (!points.length) {
    return <p className="m-0 text-sm text-text-muted">No trend data for this period.</p>
  }

  const width = 520
  const height = 220
  const pad = { top: 18, right: 16, bottom: 36, left: 36 }
  const max = Math.max(
    ...points.flatMap((p) => [p.contacted, p.applications, p.conversions]),
    1,
  )
  const innerWidth = width - pad.left - pad.right
  const innerHeight = height - pad.top - pad.bottom

  const series = (key: 'contacted' | 'applications' | 'conversions') =>
    points.map((point, index) => {
      const x = pad.left + (index / Math.max(points.length - 1, 1)) * innerWidth
      const y = pad.top + innerHeight - (point[key] / max) * innerHeight
      return { ...point, x, y }
    })

  const pathFor = (items: Array<{ x: number; y: number }>) =>
    items.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')

  const contacted = series('contacted')
  const applications = series('applications')
  const conversions = series('conversions')

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-4 text-[0.75rem] text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-full bg-[#3b82f6]" /> Contacted
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-full bg-[#22c55e]" /> Applications
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-full bg-[#8b5cf6]" /> Conversions
        </span>
      </div>
      <svg
        className="h-auto w-full max-w-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Employee performance trend"
      >
        {[0.25, 0.5, 0.75, 1].map((step) => {
          const y = pad.top + innerHeight * (1 - step)
          return (
            <line
              key={step}
              x1={pad.left}
              x2={width - pad.right}
              y1={y}
              y2={y}
              className="stroke-chart-track"
              strokeWidth={1}
            />
          )
        })}
        <path d={pathFor(contacted)} className="fill-none stroke-[#3b82f6]" strokeWidth={2.5} />
        <path d={pathFor(applications)} className="fill-none stroke-[#22c55e]" strokeWidth={2.5} />
        <path d={pathFor(conversions)} className="fill-none stroke-[#8b5cf6]" strokeWidth={2.5} />
        {contacted.map((point) => (
          <circle
            key={`c-${point.label}`}
            cx={point.x}
            cy={point.y}
            r="3.5"
            className="fill-surface stroke-[#3b82f6]"
            strokeWidth={2}
          />
        ))}
        {applications.map((point) => (
          <circle
            key={`a-${point.label}`}
            cx={point.x}
            cy={point.y}
            r="3.5"
            className="fill-surface stroke-[#22c55e]"
            strokeWidth={2}
          />
        ))}
        {conversions.map((point) => (
          <circle
            key={`v-${point.label}`}
            cx={point.x}
            cy={point.y}
            r="3.5"
            className="fill-surface stroke-[#8b5cf6]"
            strokeWidth={2}
          />
        ))}
        {points.map((point, index) => {
          const x = pad.left + (index / Math.max(points.length - 1, 1)) * innerWidth
          return (
            <text
              key={point.label}
              x={x}
              y={height - 10}
              textAnchor="middle"
              className="fill-text-faint text-[10px]"
            >
              {point.label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

export function EmployeeComparisonChart({
  employees,
  onSelect,
}: {
  employees: EmployeePerformanceRow[]
  onSelect?: (userId: string) => void
}) {
  const rows = employees
    .slice()
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 6)
  const max = Math.max(...rows.map((row) => row.conversionRate), 1)
  const rankTone = [
    'bg-[#fef3c7] text-[#b45309]',
    'bg-[#f1f5f9] text-[#475569]',
    'bg-[#ffedd5] text-[#c2410c]',
  ]

  if (!rows.length) {
    return <p className="m-0 text-sm text-text-muted">No employees to compare.</p>
  }

  return (
    <div className="grid gap-3">
      {rows.map((row, index) => {
        const width = Math.max(8, (row.conversionRate / max) * 100)
        return (
          <button
            key={row.userId}
            type="button"
            onClick={() => onSelect?.(row.userId)}
            className="grid cursor-pointer gap-1 border-0 bg-transparent p-0 text-left"
          >
            <div className="flex items-center justify-between gap-2 text-[0.78rem]">
              <span className="flex min-w-0 items-center gap-2 font-medium text-text">
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full text-[0.65rem] font-bold ${
                    rankTone[index] || 'bg-hover-bg text-text-muted'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="truncate">{row.name}</span>
              </span>
              <strong className="shrink-0 text-text">{row.conversionRate}%</strong>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-text)_6%,var(--color-surface))]">
              <div
                className="h-full rounded-full bg-[#22c55e] transition-[width] duration-300"
                style={{ width: `${width}%` }}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}

export function AdmissionFunnelChart({ summary }: { summary: PerformanceMetrics }) {
  const stages = [
    { label: 'Assigned Leads', value: summary.assigned, color: '#166534' },
    { label: 'Contacted', value: summary.contacted, color: '#15803d' },
    { label: 'Qualified', value: summary.qualified, color: '#16a34a' },
    { label: 'Applications', value: summary.offersCreated, color: '#22c55e' },
    { label: 'Converted', value: summary.converted, color: '#4ade80' },
  ]
  const base = Math.max(stages[0]?.value || 1, 1)

  return (
    <div className="grid gap-2.5">
      {stages.map((stage, index) => {
        const percent = Math.round((stage.value / base) * 100)
        const width = Math.max(28, 100 - index * 12)
        return (
          <div key={stage.label} className="grid gap-1">
            <div className="flex items-center justify-between gap-2 text-[0.78rem]">
              <span className="font-medium text-text">{stage.label}</span>
              <span className="text-text-muted">
                {stage.value.toLocaleString()} · {percent}%
              </span>
            </div>
            <div className="flex justify-center">
              <div
                className="flex h-8 items-center justify-center rounded-lg text-[0.72rem] font-semibold text-white transition-[width] duration-300"
                style={{ width: `${width}%`, background: stage.color }}
              >
                {percent}%
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
