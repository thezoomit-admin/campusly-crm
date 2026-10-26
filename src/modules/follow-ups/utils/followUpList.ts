import dayjs from 'dayjs'
import type { FollowUpRecord } from '../types'
import { FOLLOW_UP_OPEN_STATUSES } from '../types'

export type FollowUpTab =
  | 'open'
  | 'all'
  | 'today'
  | 'overdue'
  | 'upcoming'
  | 'completed'
  | 'cancelled'

export type FollowUpSummary = {
  dueToday: number
  overdue: number
  upcoming: number
  completedToday: number
  completedYesterday: number
  open: number
  all: number
  today: number
  completed: number
  cancelled: number
}

export const FOLLOW_UP_TABS: { key: FollowUpTab; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const OPEN = new Set<string>(FOLLOW_UP_OPEN_STATUSES)

const AVATAR_TONES = [
  'bg-[#e8f7f0] text-[#0f7a4a]',
  'bg-[#e8f1ff] text-[#2563eb]',
  'bg-[#fff1e6] text-[#d97706]',
  'bg-[#fce7f3] text-[#be185d]',
  'bg-[#eee8ff] text-[#7c3aed]',
  'bg-[#ecfeff] text-[#0e7490]',
]

export function followUpInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'F'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

export function followUpAvatarTone(name: string) {
  const hash = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return AVATAR_TONES[hash % AVATAR_TONES.length]
}

export function isOpenFollowUp(status: string) {
  return OPEN.has(status)
}

export function isDueToday(dueAt?: string | null) {
  if (!dueAt) return false
  return dayjs(dueAt).isSame(dayjs(), 'day')
}

export function isDueAfterToday(dueAt?: string | null) {
  if (!dueAt) return false
  return dayjs(dueAt).isAfter(dayjs(), 'day')
}

/** Today or any future day (open pipeline dates shown on Leads). */
export function isDueTodayOrLater(dueAt?: string | null) {
  if (!dueAt) return false
  return !dayjs(dueAt).isBefore(dayjs(), 'day')
}

export function isCompletedToday(completedAt?: string | null) {
  if (!completedAt) return false
  return dayjs(completedAt).isSame(dayjs(), 'day')
}

export function isCompletedYesterday(completedAt?: string | null) {
  if (!completedAt) return false
  return dayjs(completedAt).isSame(dayjs().subtract(1, 'day'), 'day')
}

/** Map API status to the badge label used in the redesigned table. */
export function displayFollowUpStatus(status: string) {
  if (status === 'Pending' || status === 'Due Soon') return 'Upcoming'
  return status || '—'
}

export function followUpPriorityClass(priority: string) {
  const key = priority.toLowerCase()
  if (key === 'high') return 'bg-[#ffe8ee] text-[#e11d48]'
  if (key === 'low') return 'bg-[#e7f8ef] text-[#16a34a]'
  return 'bg-[#fff1e6] text-[#d97706]'
}

export function followUpDisplayStatusClass(status: string) {
  const label = displayFollowUpStatus(status).toLowerCase()
  if (label === 'upcoming') {
    return 'bg-[#e8f1ff] text-[#2563eb]'
  }
  if (label === 'overdue') {
    return 'bg-[#ffe8ee] text-[#e11d48]'
  }
  if (label === 'completed') {
    return 'bg-[#e7f8ef] text-[#16a34a]'
  }
  if (label === 'cancelled') {
    return 'bg-[#ffe8ee] text-[#e11d48]'
  }
  if (label === 'rescheduled') {
    return 'bg-[#f3f4f6] text-[#4b5563]'
  }
  return 'bg-[#f3f4f6] text-[#4b5563]'
}

export function matchesFollowUpTab(row: FollowUpRecord, tab: FollowUpTab) {
  switch (tab) {
    case 'open':
      // Same set as Leads list "Follow-up" column (next open follow-up).
      return isOpenFollowUp(row.status)
    case 'today':
      return isOpenFollowUp(row.status) && isDueToday(row.dueAt)
    case 'overdue':
      return row.status === 'Overdue'
    case 'upcoming':
      return (
        (row.status === 'Pending' || row.status === 'Due Soon') &&
        isDueTodayOrLater(row.dueAt)
      )
    case 'completed':
      return row.status === 'Completed' || row.status === 'Done'
    case 'cancelled':
      return row.status === 'Cancelled' || row.status === 'Rescheduled'
    default:
      return true
  }
}

export function computeFollowUpSummary(items: FollowUpRecord[]): FollowUpSummary {
  let dueToday = 0
  let overdue = 0
  let upcoming = 0
  let completedToday = 0
  let completedYesterday = 0
  let completed = 0
  let cancelled = 0
  let open = 0

  for (const row of items) {
    if (isOpenFollowUp(row.status)) open += 1
    if (row.status === 'Overdue') overdue += 1
    if (isOpenFollowUp(row.status) && isDueToday(row.dueAt)) dueToday += 1
    if (
      (row.status === 'Pending' || row.status === 'Due Soon') &&
      isDueTodayOrLater(row.dueAt)
    ) {
      upcoming += 1
    }
    if (row.status === 'Completed' || row.status === 'Done') {
      completed += 1
      if (isCompletedToday(row.completedAt)) completedToday += 1
      if (isCompletedYesterday(row.completedAt)) completedYesterday += 1
    }
    if (row.status === 'Cancelled' || row.status === 'Rescheduled') cancelled += 1
  }

  return {
    dueToday,
    overdue,
    upcoming,
    completedToday,
    completedYesterday,
    open,
    all: items.length,
    today: dueToday,
    completed,
    cancelled,
  }
}

export function tabCount(summary: FollowUpSummary, tab: FollowUpTab) {
  return summary[tab]
}

export type FollowUpFilterState = {
  type?: string
  priority?: string
  status?: string
}

/** Open follow-ups first, then earliest due date so overdue items lead. */
export function sortFollowUpsForTable(items: FollowUpRecord[]) {
  return [...items].sort((a, b) => {
    const aOpen = isOpenFollowUp(a.status) ? 0 : 1
    const bOpen = isOpenFollowUp(b.status) ? 0 : 1
    if (aOpen !== bOpen) return aOpen - bOpen
    const aDue = a.dueAt ? dayjs(a.dueAt).valueOf() : Number.POSITIVE_INFINITY
    const bDue = b.dueAt ? dayjs(b.dueAt).valueOf() : Number.POSITIVE_INFINITY
    if (aDue !== bDue) return aDue - bDue
    return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
  })
}

export function filterFollowUps(
  items: FollowUpRecord[],
  options: {
    tab: FollowUpTab
    search?: string
    filters: FollowUpFilterState
  },
) {
  const search = options.search?.trim().toLowerCase() || ''

  const filtered = items.filter((row) => {
    if (!matchesFollowUpTab(row, options.tab)) return false
    if (options.filters.type && row.type !== options.filters.type) return false
    if (options.filters.priority && row.priority !== options.filters.priority) {
      return false
    }
    if (options.filters.status && row.status !== options.filters.status) {
      return false
    }
    if (!search) return true
    return [
      row.contact,
      row.contactName,
      row.type,
      row.owner,
      row.ownerName,
      row.priority,
      row.status,
      row.purpose,
      row.purposeOther,
      row.nextAction,
      row.lead?.code,
      row.lead?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(search)
  })

  return sortFollowUpsForTable(filtered)
}
