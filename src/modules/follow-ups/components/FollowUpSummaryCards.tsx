import { HugeiconsIcon } from '@hugeicons/react'
import {
  AlarmClockIcon,
  Calendar03Icon,
  CalendarCheckIn01Icon,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons'
import type { FollowUpSummary, FollowUpTab } from '../utils/followUpList'

type FollowUpSummaryCardsProps = {
  summary: FollowUpSummary
  onSelectTab?: (tab: FollowUpTab) => void
}

function Trend({
  current,
  previous,
  danger,
}: {
  current: number
  previous: number
  danger?: boolean
}) {
  const delta = current - previous
  if (delta === 0) {
    return (
      <span className="text-[11px] font-medium text-text-muted">Same as yesterday</span>
    )
  }
  const up = delta > 0
  const color = danger
    ? up
      ? 'text-[#e11d48]'
      : 'text-[#16a34a]'
    : up
      ? 'text-[#16a34a]'
      : 'text-[#e11d48]'
  return (
    <span className={`text-[11px] font-medium ${color}`}>
      {up ? '↑' : '↓'} {Math.abs(delta)} vs. yesterday
    </span>
  )
}

const CARDS = [
  {
    key: 'dueToday' as const,
    label: 'Due Today',
    tab: 'today' as FollowUpTab,
    icon: Calendar03Icon,
    iconWrap: 'bg-[#e7f8ef] text-[#16a34a]',
    valueClass: 'text-text-strong',
    dangerTrend: false,
  },
  {
    key: 'overdue' as const,
    label: 'Overdue',
    tab: 'overdue' as FollowUpTab,
    icon: AlarmClockIcon,
    iconWrap: 'bg-[#ffe8ee] text-[#e11d48]',
    valueClass: 'text-[#e11d48]',
    dangerTrend: true,
  },
  {
    key: 'upcoming' as const,
    label: 'Upcoming',
    tab: 'upcoming' as FollowUpTab,
    icon: CalendarCheckIn01Icon,
    iconWrap: 'bg-[#e8f1ff] text-[#2563eb]',
    valueClass: 'text-text-strong',
    dangerTrend: false,
  },
  {
    key: 'completedToday' as const,
    label: 'Completed Today',
    tab: 'completed' as FollowUpTab,
    icon: CheckmarkCircle02Icon,
    iconWrap: 'bg-[#e7f8ef] text-[#16a34a]',
    valueClass: 'text-text-strong',
    dangerTrend: false,
  },
]

export default function FollowUpSummaryCards({
  summary,
  onSelectTab,
}: FollowUpSummaryCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card) => {
        const value = summary[card.key]
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelectTab?.(card.tab)}
            className="cursor-pointer rounded-2xl border border-border bg-surface px-4 py-3.5 text-left shadow-soft transition-colors hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="m-0 text-[12px] font-medium text-text-muted">{card.label}</p>
                <p className={`m-0 mt-1 text-[28px] font-bold leading-none ${card.valueClass}`}>
                  {value}
                </p>
              </div>
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${card.iconWrap}`}
              >
                <HugeiconsIcon icon={card.icon} size={20} color="currentColor" strokeWidth={1.7} />
              </span>
            </div>
            <div className="mt-2.5">
              {card.key === 'completedToday' ? (
                <Trend
                  current={summary.completedToday}
                  previous={summary.completedYesterday}
                  danger={card.dangerTrend}
                />
              ) : (
                <span className="text-[11px] font-medium text-text-muted">Live count</span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
