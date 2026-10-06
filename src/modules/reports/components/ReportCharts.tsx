import type { FunnelStage, SourceSegment, TrendSeriesPoint } from '../types'

export function LeadFunnelChart({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(...stages.map((stage) => stage.value), 1)

  return (
    <div className="grid gap-2.5">
      {stages.map((stage) => {
        const width = Math.max(28, (stage.value / max) * 100)
        return (
          <div key={stage.label} className="grid gap-1">
            <div className="flex items-center justify-between gap-2 text-[0.78rem]">
              <span className="font-medium text-text">{stage.label}</span>
              <span className="text-text-muted">
                {stage.value.toLocaleString()} · {stage.percent}%
              </span>
            </div>
            <div className="h-8 overflow-hidden rounded-lg bg-[color-mix(in_srgb,var(--color-text)_4%,var(--color-surface))]">
              <div
                className="flex h-full items-center px-3 text-[0.72rem] font-semibold text-white transition-[width] duration-300"
                style={{ width: `${width}%`, background: stage.color }}
              >
                {stage.value.toLocaleString()}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ConversionTrendChart({ points }: { points: TrendSeriesPoint[] }) {
  const width = 520
  const height = 220
  const pad = { top: 18, right: 16, bottom: 32, left: 36 }
  const max = Math.max(...points.flatMap((point) => [point.totalLeads, point.convertedLeads]), 1)
  const innerWidth = width - pad.left - pad.right
  const innerHeight = height - pad.top - pad.bottom

  const coords = (key: 'totalLeads' | 'convertedLeads') =>
    points.map((point, index) => {
      const x = pad.left + (index / Math.max(points.length - 1, 1)) * innerWidth
      const y = pad.top + innerHeight - (point[key] / max) * innerHeight
      return { label: point.label, x, y, value: point[key] }
    })

  const totalCoords = coords('totalLeads')
  const convertedCoords = coords('convertedLeads')

  const pathFor = (items: Array<{ x: number; y: number }>) =>
    items.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-4 text-[0.75rem] text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-full bg-[#3b82f6]" /> Total Leads
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-full bg-[#22c55e]" /> Converted Leads
        </span>
      </div>
      <svg className="h-auto w-full max-w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Lead and conversion trend">
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
        <path d={pathFor(totalCoords)} className="fill-none stroke-[#3b82f6]" strokeWidth={2.5} />
        <path d={pathFor(convertedCoords)} className="fill-none stroke-[#22c55e]" strokeWidth={2.5} />
        {totalCoords.map((point) => (
          <circle
            key={`total-${point.label}`}
            cx={point.x}
            cy={point.y}
            r="4"
            className="fill-surface stroke-[#3b82f6]"
            strokeWidth={2}
          />
        ))}
        {convertedCoords.map((point) => (
          <circle
            key={`converted-${point.label}`}
            cx={point.x}
            cy={point.y}
            r="4"
            className="fill-surface stroke-[#22c55e]"
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

export function LeadsBySourceChart({
  segments,
  total,
}: {
  segments: SourceSegment[]
  total: number
}) {
  const radius = 68
  const stroke = 22
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="mx-auto w-[min(100%,170px)] shrink-0">
        <svg className="h-auto w-full" viewBox="0 0 180 180" aria-hidden="true">
          <circle className="stroke-chart-track" cx="90" cy="90" r={radius} fill="none" strokeWidth={stroke} />
          <g transform="rotate(-90 90 90)">
            {segments.map((segment) => {
              const length = total > 0 ? (segment.value / total) * circumference : 0
              const circle = (
                <circle
                  key={segment.label}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={stroke}
                  strokeLinecap="butt"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                />
              )
              offset += length
              return circle
            })}
          </g>
          <text x="90" y="86" textAnchor="middle" className="fill-text text-[20px] font-bold">
            {total.toLocaleString()}
          </text>
          <text x="90" y="106" textAnchor="middle" className="fill-text-faint text-[10px]">
            Total Leads
          </text>
        </svg>
      </div>
      <ul className="m-0 grid min-w-[160px] flex-1 list-none gap-1.5 p-0">
        {segments.map((segment) => (
          <li key={segment.label} className="flex justify-between gap-2 text-[0.8rem]">
            <span className="flex min-w-0 items-center gap-2">
              <i className="size-2 shrink-0 rounded-full" style={{ background: segment.color }} />
              <span className="truncate">{segment.label}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <em className="min-w-7 not-italic text-text-faint">{segment.percent}%</em>
              <strong className="min-w-6 text-right">{segment.value}</strong>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
