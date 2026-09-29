import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  Calendar03Icon,
  Clock01Icon,
  FavouriteIcon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import type { MyLeadsSummary as MyLeadsSummaryData } from '../types'
import { LEAD_STAT_ICON_TONE, type LeadStatTone } from '../utils/leadList'

type SummaryKey = keyof MyLeadsSummaryData

type MyLeadsSummaryProps = {
  summary?: MyLeadsSummaryData
  activeKey?: SummaryKey | null
  onSelect?: (key: SummaryKey) => void
}

const CARDS: Array<{
  key: SummaryKey
  label: string
  tone: LeadStatTone
  icon: typeof UserMultiple02Icon
}> = [
  { key: 'totalAssigned', label: 'Total Assigned Leads', tone: 'teal', icon: UserMultiple02Icon },
  { key: 'highPriority', label: 'High Priority Leads', tone: 'orange', icon: FavouriteIcon },
  { key: 'pendingFollowUps', label: 'Pending Follow-ups', tone: 'violet', icon: Clock01Icon },
  { key: 'todayFollowUps', label: "Today's Follow-ups", tone: 'blue', icon: Calendar03Icon },
  { key: 'overdueFollowUps', label: 'Overdue Follow-ups', tone: 'amber', icon: Alert02Icon },
]

export default function MyLeadsSummary({ summary, activeKey, onSelect }: MyLeadsSummaryProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {CARDS.map((card) => {
        const active = activeKey === card.key
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelect?.(card.key)}
            className={`flex items-start gap-3 rounded-[20px] border bg-surface p-4 text-left shadow-soft transition-colors ${
              active ? 'border-primary' : 'border-border hover:border-primary/40'
            }`}
          >
            <span className={`grid size-[42px] shrink-0 place-items-center rounded-xl ${LEAD_STAT_ICON_TONE[card.tone]}`}>
              <HugeiconsIcon icon={card.icon} size={18} />
            </span>
            <div className="min-w-0">
              <p className="m-0 text-[0.82rem] text-text-muted">{card.label}</p>
              <strong className="mt-0.5 block text-[1.45rem] leading-[1.15] tracking-[-0.03em] text-text">
                {(summary?.[card.key] || 0).toLocaleString()}
              </strong>
            </div>
          </button>
        )
      })}
    </div>
  )
}
