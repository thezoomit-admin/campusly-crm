import { useMemo, type SVGProps } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useGetDashboardQuery } from '../api/dashboardApi'
import { PrimaryButton } from '@/components/ui'
import { Spinner } from '@/components/common/Loading'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import type { AuthSession } from '../../../types'
import type { DashIconName, DashboardQuickAction } from '../types'

const QUICK_ACTIONS: DashboardQuickAction[] = [
  { label: 'Add New Lead', hint: 'Create a student enquiry', tone: 'blue', icon: 'plus', to: '/leads/new' },
  { label: 'Follow-ups', hint: 'See overdue & due today', tone: 'rose', icon: 'phone', to: '/follow-ups' },
  { label: 'Applications', hint: 'Track university apps', tone: 'green', icon: 'file', to: '/applications' },
  { label: 'Payments', hint: 'View fee collections', tone: 'orange', icon: 'card', to: '/payments' },
]

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const card =
  'bg-surface border border-border rounded-[20px]'

const dashCard = `${card} p-4 px-[18px] pb-[18px] max-sm:p-3.5`

const cardHead =
  'flex items-center justify-between gap-3 mb-3 max-sm:flex-wrap'

const chip =
  'px-2.5 py-1.5 rounded-full bg-hover-bg text-text-muted text-[0.75rem]'

const toneIcon: Record<string, string> = {
  blue: 'bg-[#e8f1ff] text-[#3b82f6] dark:bg-blue-500/20 dark:text-[#93c5fd]',
  green: 'bg-[#e7f8ef] text-[#22c55e] dark:bg-green-500/20 dark:text-[#86efac]',
  purple: 'bg-[#eee8ff] text-[#8b5cf6] dark:bg-violet-500/20 dark:text-[#c4b5fd]',
  orange: 'bg-[#fff1e6] text-[#f59e0b] dark:bg-amber-500/20 dark:text-[#fcd34d]',
  rose: 'bg-[#ffe8ee] text-[#f43f5e] dark:bg-rose-500/20 dark:text-[#fda4af]',
}

const sparkStroke: Record<string, string> = {
  blue: 'stroke-[#60a5fa]',
  green: 'stroke-[#34d399]',
  purple: 'stroke-[#a78bfa]',
  orange: 'stroke-[#fb923c]',
  rose: 'stroke-[#fb7185]',
}

const followupBg: Record<string, string> = {
  rose: 'bg-[#fff5f7] dark:bg-rose-500/10',
  blue: 'bg-[#f4f8ff] dark:bg-blue-500/10',
  purple: 'bg-[#f7f4ff] dark:bg-violet-500/10',
  orange: 'bg-[#fff8f1] dark:bg-amber-500/10',
  green: 'bg-[#f3fbf6] dark:bg-green-500/10',
}

const statusTone: Record<string, string> = {
  new: 'bg-[#e8f1ff] text-[#2563eb] dark:bg-blue-600/20 dark:text-[#93c5fd]',
  contacted: 'bg-[#e7f8ef] text-[#16a34a] dark:bg-green-600/20 dark:text-[#86efac]',
  qualified: 'bg-[#eee8ff] text-[#7c3aed] dark:bg-violet-600/20 dark:text-[#c4b5fd]',
  counselling: 'bg-[#fff1e6] text-[#d97706] dark:bg-amber-600/20 dark:text-[#fcd34d]',
  'follow-up': 'bg-[#ffe8ee] text-[#e11d48] dark:bg-rose-600/20 dark:text-[#fda4af]',
}

const dotTone: Record<string, string> = {
  followup: 'bg-[#f43f5e]',
  meeting: 'bg-[#f59e0b]',
  application: 'bg-[#22c55e]',
  payment: 'bg-[#3b82f6]',
}

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(' ')
}

function greetingForHour(hour: number) {
  if (hour < 12) {
    return 'Good Morning'
  }

  if (hour < 17) {
    return 'Good Afternoon'
  }

  return 'Good Evening'
}

function displayName(auth: AuthSession | null | undefined) {
  if (auth?.user?.fullName) {
    return auth.user.fullName.split(' ')[0]
  }
  const raw = auth?.user?.username || auth?.user?.email || 'there'
  const first = String(raw).split(/[.@]/)[0]
  return first.charAt(0).toUpperCase() + first.slice(1)
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function statusClass(status: string) {
  const key = status.toLowerCase().replace(/\s+/g, '-')
  return cx(
    'inline-flex px-2.5 py-1 rounded-full text-[0.75rem] font-bold',
    statusTone[key] || statusTone.new,
  )
}

function Icon({ name }: { name: DashIconName }) {
  const common: SVGProps<SVGSVGElement> = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (name === 'users') {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  }

  if (name === 'calendar') {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    )
  }

  if (name === 'graduate') {
    return (
      <svg {...common}>
        <path d="M22 10 12 5 2 10l10 5 10-5Z" />
        <path d="M6 12v5c3 2 9 2 12 0v-5" />
      </svg>
    )
  }

  if (name === 'revenue') {
    return (
      <svg {...common}>
        <path d="M12 1v22" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  }

  if (name === 'phone') {
    return (
      <svg {...common}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    )
  }

  if (name === 'mail') {
    return (
      <svg {...common}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 7L2 7" />
      </svg>
    )
  }

  if (name === 'clock') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    )
  }

  if (name === 'plus') {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    )
  }

  if (name === 'file') {
    return (
      <svg {...common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
      </svg>
    )
  }

  if (name === 'card') {
    return (
      <svg {...common}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    )
  }

  if (name === 'bell') {
    return (
      <svg {...common}>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    )
  }

  if (name === 'quote') {
    return (
      <svg {...common} width="16" height="16">
        <path d="M10 8H6l2-5H4L2 10v6h8V8zM22 8h-4l2-5h-4l-2 7v6h8V8z" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  return null
}

type ChartSegment = {
  label: string
  value: number
  color: string
}

function DonutChart({ segments, total }: { segments: ChartSegment[]; total: number }) {
  const radius = 68
  const stroke = 22
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
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
      <text x="90" y="86" textAnchor="middle" className="fill-text text-[22px] font-bold">
        {total}
      </text>
      <text x="90" y="106" textAnchor="middle" className="fill-text-faint text-[10px]">
        Total Leads
      </text>
    </svg>
  )
}

type TrendPoint = { label: string; value: number }

function LineChart({ points }: { points: TrendPoint[] }) {
  const width = 420
  const height = 180
  const pad = { top: 16, right: 12, bottom: 28, left: 28 }
  const max = Math.max(...points.map((point) => point.value), 1)
  const innerWidth = width - pad.left - pad.right
  const innerHeight = height - pad.top - pad.bottom

  if (points.length === 0) {
    return (
      <p className="m-0 grid h-[180px] place-items-center text-[0.85rem] text-text-faint">
        No lead activity in the last 7 days.
      </p>
    )
  }

  const coords = points.map((point, index) => {
    const x = pad.left + (index / Math.max(points.length - 1, 1)) * innerWidth
    const y = pad.top + innerHeight - (point.value / max) * innerHeight
    return { ...point, x, y }
  })

  const last = coords[coords.length - 1]
  const first = coords[0]
  const line = coords.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')
  const area = last && first ? `${line} L${last.x},${height - pad.bottom} L${first.x},${height - pad.bottom} Z` : ''

  return (
    <svg className="h-auto w-full max-w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Lead trend">
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
      <path d={area} className="fill-blue-500/10" />
      <path d={line} className="fill-none stroke-[#3b82f6]" strokeWidth={2.5} />
      {coords.map((point) => (
        <circle
          key={point.label}
          cx={point.x}
          cy={point.y}
          r="4.5"
          className="fill-surface stroke-[#3b82f6]"
          strokeWidth={2.5}
        />
      ))}
      {coords.map((point) => (
        <text
          key={`${point.label}-label`}
          x={point.x}
          y={height - 8}
          textAnchor="middle"
          className="fill-text-faint text-[10px]"
        >
          {point.label}
        </text>
      ))}
    </svg>
  )
}

function CalendarCard({
  year,
  month,
  events,
}: {
  year: number
  month: number
  events: Record<string, string[]>
}) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const title = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1),
  )
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)] as Array<
    number | null
  >

  return (
    <article className={cx(dashCard, 'flex h-full min-h-0 min-w-0 flex-col')}>
      <div className={cardHead}>
        <h3 className="m-0 text-base">Calendar</h3>
        <strong>{title}</strong>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 content-start gap-1.5 text-center">
        {WEEKDAYS.map((day) => (
          <span key={day} className="text-[0.75rem] text-text-faint font-semibold">
            {day}
          </span>
        ))}
        {cells.map((day, index) => {
          if (!day) {
            return <span key={`empty-${index}`} />
          }

          const marks = events[String(day)] || []
          const isToday =
            today.getFullYear() === year && today.getMonth() === month && today.getDate() === day

          return (
            <span
              key={day}
              className={cx(
                'relative min-h-[34px] grid place-items-start justify-items-center pt-1.5 rounded-[10px] text-[0.75rem] text-text',
                isToday && 'bg-[#3b82f6] text-white',
              )}
            >
              {day}
              <span className="flex justify-center gap-[3px] min-h-2">
                {marks
                  .filter((mark) => mark !== 'today')
                  .map((mark) => (
                    <i
                      key={mark}
                      className={cx(
                        'inline-block size-1.5 rounded-full',
                        isToday ? 'bg-white' : dotTone[mark] || 'bg-[#3b82f6]',
                      )}
                    />
                  ))}
              </span>
            </span>
          )
        })}
      </div>
      <div className="mt-auto flex flex-wrap gap-2.5 pt-3 text-text-muted text-[0.72rem]">
        {(
          [
            ['followup', 'Follow-ups'],
            ['meeting', 'Meetings'],
            ['application', 'Applications'],
            ['payment', 'Payments'],
          ] as const
        ).map(([key, label]) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <i className={cx('inline-block size-1.5 rounded-full', dotTone[key])} /> {label}
          </span>
        ))}
      </div>
    </article>
  )
}

function MonthSnapshotCard({
  events,
  onNavigate,
}: {
  events: Record<string, string[]>
  onNavigate: (path: string) => void
}) {
  const counts = useMemo(() => {
    const next = { followup: 0, meeting: 0, application: 0, payment: 0 }
    for (const marks of Object.values(events)) {
      for (const mark of marks) {
        if (mark in next) {
          next[mark as keyof typeof next] += 1
        }
      }
    }
    return next
  }, [events])

  const rows = [
    { key: 'followup', label: 'Follow-ups', value: counts.followup, path: '/follow-ups', tone: 'rose' },
    { key: 'meeting', label: 'Meetings', value: counts.meeting, path: '/activity-history', tone: 'orange' },
    { key: 'application', label: 'Applications', value: counts.application, path: '/applications', tone: 'green' },
    { key: 'payment', label: 'Payments', value: counts.payment, path: '/payments', tone: 'blue' },
  ] as const

  return (
    <article className={cx(dashCard, 'flex h-full min-h-0 min-w-0 flex-col')}>
      <div className={cardHead}>
        <h3 className="m-0 text-base">This Month</h3>
        <span className={chip}>Calendar summary</span>
      </div>
      <ul className="m-0 grid min-h-0 flex-1 list-none content-start gap-2.5 p-0">
        {rows.map((row) => (
          <li key={row.key}>
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[14px] border-0 bg-[#f8fafc] px-3 py-3 text-left dark:bg-hover-bg"
              onClick={() => onNavigate(row.path)}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <i className={cx('inline-block size-2 shrink-0 rounded-full', dotTone[row.key])} />
                <span className="truncate text-[0.86rem] font-medium text-text">{row.label}</span>
              </span>
              <strong className="text-[1.05rem] text-text">{row.value}</strong>
            </button>
          </li>
        ))}
      </ul>
    </article>
  )
}

function QuickActionsCard({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <article className={cx(dashCard, 'min-w-0')}>
      <div className={cardHead}>
        <h3 className="m-0 text-base">Quick Actions</h3>
        <span className={chip}>Shortcuts</span>
      </div>
      <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 lg:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <li key={action.to} className="min-w-0">
            <button
              type="button"
              className="flex h-full w-full cursor-pointer items-center gap-2.5 rounded-[14px] border border-border bg-[#f8fafc] px-2.5 py-3 text-left transition-colors hover:border-primary/40 max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-2 sm:gap-3 sm:px-3 dark:bg-hover-bg"
              onClick={() => onNavigate(action.to)}
            >
              <span className={cx('grid size-[34px] shrink-0 place-items-center rounded-[10px]', toneIcon[action.tone])}>
                <Icon name={action.icon} />
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-[0.86rem] text-text max-[640px]:text-[0.78rem]">{action.label}</strong>
                <small className="mt-0.5 block truncate text-[0.75rem] text-text-muted max-[640px]:text-[0.68rem]">{action.hint}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </article>
  )
}

export default function DashboardPage() {
  const auth = useOutletContext<AuthSession>()
  const navigate = useNavigate()
  const now = useMemo(() => new Date(), [])
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const { data, isFetching, isError } = useGetDashboardQuery({ year, month })
  const name = displayName(auth)
  const stats = data?.stats || []
  const leadSources = data?.leadSources || []
  const leadTrend = data?.leadTrend || []
  const recentLeads = (data?.recentLeads || []).slice(0, 5)
  const upcomingFollowUps = (data?.upcomingFollowUps || []).slice(0, 2)
  const calendarEvents = data?.calendarEvents || {}
  const followUpMetrics = data?.followUpMetrics || {
    overdue: 0,
    dueToday: 0,
    completedToday: 0,
    pending: 0,
    completionRate: 0,
    onTimeRate: 0,
  }
  const leadTotal = leadSources.reduce((sum, source) => sum + source.value, 0)
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(now)

  return (
    <section className="@container grid min-w-0 max-w-full gap-3 overflow-x-hidden text-text">
      <PageMeta
        title="Dashboard"
        description="Overview of leads, applications, follow-ups, and consultancy performance in EduConsult CRM."
      />
      <PageHeader
        title={`${greetingForHour(now.getHours())}, ${name}`}
        subtitle="Here's what's happening with your consultancy today."
        breadcrumbs={[{ title: 'Dashboard' }]}
        showDivider={false}
        extra={
          <div className="grid gap-1 text-right text-text-muted max-[960px]:gap-0.5">
            <span className="inline-flex items-center justify-end gap-1.5 text-[0.88rem] font-semibold text-text max-[960px]:text-[0.68rem]">
              <Icon name="calendar" />
              {dateLabel}
            </span>
            <span className="inline-flex items-center justify-end gap-1.5 text-[0.75rem] max-[960px]:text-[0.64rem]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
                className="max-[960px]:size-3"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Dhaka, Bangladesh
            </span>
          </div>
        }
      />

      {isError ? (
        <p className="m-0 text-danger">Could not load dashboard. Check API connection.</p>
      ) : null}

      {isFetching && !data ? (
        <div className="grid min-h-[240px] place-items-center">
          <Spinner />
        </div>
      ) : null}

      <div className="grid min-w-0 grid-cols-2 gap-3 *:min-w-0 lg:grid-cols-5">
        {stats.map((stat) => (
          <article
            key={stat.key}
            className={cx(card, 'relative min-h-[118px] min-w-0 overflow-hidden px-3 py-3 max-[640px]:min-h-[108px] max-[640px]:px-2.5 max-[640px]:py-2.5 xl:px-3.5 xl:py-3.5')}
          >
            <div className={cx('grid size-8 place-items-center rounded-[10px] xl:size-9', toneIcon[stat.tone])}>
              <Icon name={stat.icon} />
            </div>
            <p className="mt-2 mb-0.5 truncate text-[0.75rem] leading-snug text-text-muted xl:text-[0.8rem]">
              {stat.label}
            </p>
            <strong className="block text-[1.25rem] leading-none tracking-[-0.03em] xl:text-[1.4rem]">
              {stat.value}
            </strong>
            <div className="mt-1.5 flex min-w-0 items-center gap-1.5 pr-12 text-[0.68rem] xl:pr-16 xl:text-[0.72rem]">
              <span className={cx('shrink-0 font-medium', stat.change >= 0 ? 'text-[#16a34a]' : 'text-[#e11d48]')}>
                {stat.change >= 0 ? '↑' : '↓'} {Math.abs(stat.change)}%
              </span>
              <small className="min-w-0 truncate text-text-faint">vs. last 30 days</small>
            </div>
            <svg
              className={cx(
                'pointer-events-none absolute right-2 bottom-2 h-5 w-12 xl:h-6 xl:w-[72px]',
                sparkStroke[stat.tone],
              )}
              viewBox="0 0 120 28"
              aria-hidden="true"
            >
              <path
                d="M0 20 C20 18, 30 22, 45 14 S70 6, 90 12 S110 8, 120 4"
                className="fill-none"
                strokeWidth={2}
              />
            </svg>
          </article>
        ))}
      </div>

      <QuickActionsCard onNavigate={navigate} />

      <div className="grid min-w-0 grid-cols-1 gap-3 *:min-w-0 lg:grid-cols-2">
        <article className={cx(dashCard, 'min-w-0')}>
          <div className={cardHead}>
            <h3 className="m-0 text-base">Lead Source Overview</h3>
            <span className={chip}>Last 30 Days</span>
          </div>
          {leadSources.length === 0 ? (
            <p className="m-0 py-8 text-center text-[0.85rem] text-text-faint">No leads in the last 30 days.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <div className="mx-auto w-[min(100%,150px)] shrink-0 xl:w-[min(100%,170px)]">
                <DonutChart segments={leadSources} total={leadTotal} />
              </div>
              <ul className="m-0 grid min-w-[140px] flex-1 list-none gap-1.5 p-0">
                {leadSources.map((source) => (
                  <li key={source.label} className="flex justify-between gap-2 text-[0.8rem]">
                    <span className="flex min-w-0 items-center gap-2">
                      <i className="size-2 shrink-0 rounded-full" style={{ background: source.color }} />
                      <span className="truncate">{source.label}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <em className="min-w-7 not-italic text-text-faint">{source.percent}%</em>
                      <strong className="min-w-5 text-right">{source.value}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>

        <article className={cx(dashCard, 'min-w-0')}>
          <div className={cardHead}>
            <h3 className="m-0 text-base">Lead Trend</h3>
            <span className={chip}>Last 7 Days</span>
          </div>
          <LineChart points={leadTrend} />
        </article>
      </div>

      <div className="grid min-w-0 grid-cols-1 items-stretch gap-3 *:min-w-0 md:grid-cols-2 lg:h-[28rem] lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:grid-rows-1">
        <article className={cx(dashCard, 'flex h-full min-h-0 min-w-0 flex-col overflow-hidden')}>
          <div className={cx(cardHead, 'shrink-0')}>
            <h3 className="m-0 text-base">Recent Leads</h3>
            <PrimaryButton
              type="button"
              className="cursor-pointer border-0 bg-transparent font-semibold text-[#3b82f6]"
              onClick={() => navigate('/leads')}
              label="View All"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[620px] border-collapse">
              <thead>
                <tr>
                  <th className="px-1.5 py-2 text-left text-[0.75rem] font-semibold text-text-faint">Name</th>
                  <th className="px-1.5 py-2 text-left text-[0.75rem] font-semibold text-text-faint">Country</th>
                  <th className="px-1.5 py-2 text-left text-[0.75rem] font-semibold text-text-faint">Source</th>
                  <th className="px-1.5 py-2 text-left text-[0.75rem] font-semibold text-text-faint">Status</th>
                  <th className="px-1.5 py-2 text-left text-[0.75rem] font-semibold text-text-faint">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[0.85rem] text-text-faint">
                      No leads found.
                    </td>
                  </tr>
                ) : null}
                {recentLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="border-t border-border-subtle px-1.5 py-2.5 text-[0.86rem]">
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-[34px] place-items-center rounded-full bg-[#e8f1ff] text-[0.72rem] font-bold text-[#3b82f6] dark:bg-blue-500/20 dark:text-[#93c5fd]">
                          {initials(lead.name)}
                        </span>
                        <span>
                          <strong className="block">{lead.name}</strong>
                          <small className="block text-text-faint">{lead.email}</small>
                        </span>
                      </div>
                    </td>
                    <td className="border-t border-border-subtle px-1.5 py-2.5 text-[0.86rem]">
                      {lead.flag} {lead.country}
                    </td>
                    <td className="border-t border-border-subtle px-1.5 py-2.5 text-[0.86rem]">{lead.source}</td>
                    <td className="border-t border-border-subtle px-1.5 py-2.5 text-[0.86rem]">
                      <span className={statusClass(lead.status)}>{lead.status}</span>
                    </td>
                    <td className="border-t border-border-subtle px-1.5 py-2.5 text-[0.86rem] text-text-faint">
                      {lead.created}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className={cx(dashCard, 'flex h-full min-h-0 min-w-0 flex-col overflow-hidden')}>
          <div className={cx(cardHead, 'shrink-0')}>
            <h3 className="m-0 text-base">Today&apos;s Follow-ups</h3>
            <PrimaryButton
              type="button"
              className="cursor-pointer border-0 bg-transparent font-semibold text-[#3b82f6]"
              onClick={() => navigate('/follow-ups')}
              label="View All"
            />
          </div>
          <div className="mb-3 grid shrink-0 grid-cols-3 gap-2">
            <div
              role="button"
              tabIndex={0}
              className="cursor-pointer rounded-[14px] bg-[#fff5f7] px-3 py-3 text-left dark:bg-rose-500/10"
              onClick={() => navigate('/follow-ups')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate('/follow-ups')
                }
              }}
            >
              <span className="block text-[0.72rem] font-medium text-[#e11d48]">Overdue</span>
              <strong className="mt-1 block text-[1.35rem] text-[#e11d48]">{followUpMetrics.overdue}</strong>
            </div>
            <div
              role="button"
              tabIndex={0}
              className="cursor-pointer rounded-[14px] bg-[#f4f8ff] px-3 py-3 text-left dark:bg-blue-500/10"
              onClick={() => navigate('/follow-ups')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate('/follow-ups')
                }
              }}
            >
              <span className="block text-[0.72rem] font-medium text-[#2563eb]">Due Today</span>
              <strong className="mt-1 block text-[1.35rem] text-[#2563eb]">{followUpMetrics.dueToday}</strong>
            </div>
            <div
              role="button"
              tabIndex={0}
              className="cursor-pointer rounded-[14px] bg-[#f3fbf6] px-3 py-3 text-left dark:bg-green-500/10"
              onClick={() => navigate('/follow-ups')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate('/follow-ups')
                }
              }}
            >
              <span className="block text-[0.72rem] font-medium text-[#16a34a]">Completed</span>
              <strong className="mt-1 block text-[1.35rem] text-[#16a34a]">{followUpMetrics.completedToday}</strong>
            </div>
          </div>
          <div className="mb-3 grid shrink-0 grid-cols-2 gap-2">
            <div className="rounded-[14px] bg-[#f8fafc] px-3 py-2.5 dark:bg-hover-bg">
              <span className="block text-[0.72rem] text-text-muted">Completion Rate (30d)</span>
              <strong className="mt-0.5 block text-[1.1rem] text-text">{followUpMetrics.completionRate ?? 0}%</strong>
            </div>
            <div className="rounded-[14px] bg-[#f8fafc] px-3 py-2.5 dark:bg-hover-bg">
              <span className="block text-[0.72rem] text-text-muted">On-time Rate (30d)</span>
              <strong className="mt-0.5 block text-[1.1rem] text-text">{followUpMetrics.onTimeRate ?? 0}%</strong>
            </div>
          </div>
          {followUpMetrics.overdue > 0 ? (
            <p className="m-0 mb-3 shrink-0 rounded-xl bg-[#fff5f7] px-3 py-2 text-[0.82rem] font-medium text-[#e11d48] dark:bg-rose-500/10">
              ⚠ Overdue Follow-ups: {followUpMetrics.overdue}
            </p>
          ) : null}
          <ul className="m-0 grid min-h-0 flex-1 list-none gap-2.5 overflow-y-auto p-0">
            {upcomingFollowUps.length === 0 ? (
              <li className="py-8 text-center text-[0.85rem] text-text-faint">No upcoming follow-ups.</li>
            ) : null}
            {upcomingFollowUps.map((item) => (
              <li
                key={item.id}
                className={cx(
                  'flex items-start gap-3 rounded-[14px] px-3 py-2.5 max-sm:p-2.5',
                  followupBg[item.tone] || 'bg-[#f8fbff] dark:bg-blue-500/10',
                )}
              >
                <span
                  className={cx(
                    'grid size-[34px] shrink-0 place-items-center rounded-[10px]',
                    toneIcon[item.tone],
                  )}
                >
                  <Icon name={item.icon} />
                </span>
                <span>
                  <strong className="block">{item.title}</strong>
                  <small className="mt-0.5 block text-[0.75rem] text-text-muted">{item.detail}</small>
                </span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="grid min-w-0 grid-cols-1 items-stretch gap-3 *:min-w-0 lg:grid-cols-2">
        <CalendarCard year={now.getFullYear()} month={now.getMonth()} events={calendarEvents} />
        <MonthSnapshotCard events={calendarEvents} onNavigate={navigate} />
      </div>

      <footer className="flex justify-between gap-3 text-[0.78rem] text-text-faint max-sm:grid max-sm:grid-cols-1">
        <span>EduConsult CRM &nbsp; v1.0.0</span>
        <span>© {now.getFullYear()} Education Consultancy CRM. All rights reserved.</span>
      </footer>
    </section>
  )
}
