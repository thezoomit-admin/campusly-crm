import type { IconSvgElement } from '@hugeicons/react'
import {
  Call02Icon,
  CheckmarkCircle02Icon,
  FavouriteIcon,
  File01Icon,
  UserAdd01Icon,
  UserGroupIcon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import type { LeadListSummary, LeadListSummaryStat, LeadRow } from '../types'

export const LEAD_PIPELINE_TABS = [
  { key: 'all', label: 'All Leads' },
  { key: 'New', label: 'New' },
  { key: 'Contacted', label: 'Contacted' },
  { key: 'Qualified', label: 'Qualified' },
  { key: 'Counselling', label: 'Counselling' },
  { key: 'Offered', label: 'Offered' },
  { key: 'Converted', label: 'Converted' },
] as const

export type LeadPipelineTab = (typeof LEAD_PIPELINE_TABS)[number]['key']

const COUNTRY_FLAGS: Record<string, string> = {
  canada: '🇨🇦',
  uk: '🇬🇧',
  'united kingdom': '🇬🇧',
  australia: '🇦🇺',
  usa: '🇺🇸',
  us: '🇺🇸',
  'united states': '🇺🇸',
  'united states of america': '🇺🇸',
  germany: '🇩🇪',
  malaysia: '🇲🇾',
  sweden: '🇸🇪',
  netherlands: '🇳🇱',
  ireland: '🇮🇪',
  'new zealand': '🇳🇿',
  france: '🇫🇷',
  italy: '🇮🇹',
  spain: '🇪🇸',
  japan: '🇯🇵',
  'south korea': '🇰🇷',
  korea: '🇰🇷',
  singapore: '🇸🇬',
  denmark: '🇩🇰',
  finland: '🇫🇮',
  norway: '🇳🇴',
  poland: '🇵🇱',
  hungary: '🇭🇺',
  cyprus: '🇨🇾',
  malta: '🇲🇹',
  uae: '🇦🇪',
  'united arab emirates': '🇦🇪',
  bangladesh: '🇧🇩',
  india: '🇮🇳',
  china: '🇨🇳',
}

const AVATAR_TONES = [
  'bg-[#d1fae5] text-[#047857]',
  'bg-[#dbeafe] text-[#1d4ed8]',
  'bg-[#fce7f3] text-[#be185d]',
  'bg-[#ffedd5] text-[#c2410c]',
  'bg-[#ede9fe] text-[#6d28d9]',
  'bg-[#cffafe] text-[#0e7490]',
  'bg-[#fef3c7] text-[#b45309]',
  'bg-[#e0e7ff] text-[#4338ca]',
]

export type LeadStatTone = 'teal' | 'blue' | 'violet' | 'amber' | 'purple' | 'orange' | 'green'

export const LEAD_STAT_ICON_TONE: Record<LeadStatTone, string> = {
  teal: 'bg-[#e6f7f3] text-[#0f9d8e]',
  blue: 'bg-[#e8f1ff] text-[#3b82f6]',
  violet: 'bg-[#eee8ff] text-[#7c5cfc]',
  amber: 'bg-[#fff6db] text-[#d97706]',
  purple: 'bg-[#f3e8ff] text-[#9333ea]',
  orange: 'bg-[#fff1e6] text-[#ea580c]',
  green: 'bg-[#e7f8ef] text-[#16a34a]',
}

export type LeadStatCard = {
  key: string
  label: string
  count: number
  change: number
  tone: LeadStatTone
  icon: IconSvgElement
  status: LeadPipelineTab
}

export function countryFlag(country?: string | null) {
  if (!country || country === '—') return ''
  return COUNTRY_FLAGS[country.trim().toLowerCase()] || ''
}

export function leadAvatarTone(name: string) {
  const hash = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return AVATAR_TONES[hash % AVATAR_TONES.length]
}

export function formatLeadCreatedOn(value?: string | null) {
  if (!value) return { date: '—', time: '' }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { date: '—', time: '' }
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  }
}

export function tabCount(summary: LeadListSummary | undefined, tab: LeadPipelineTab) {
  if (!summary) return 0
  if (tab === 'all') return summary.total
  return summary.statuses.find((item) => item.label === tab)?.count || 0
}

function statusStat(summary: LeadListSummary | undefined, label: string): LeadListSummaryStat {
  return (
    summary?.statuses.find((item) => item.label === label) || {
      key: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      count: 0,
      change: 0,
    }
  )
}

export function leadStatCards(summary: LeadListSummary | undefined): LeadStatCard[] {
  const all = { count: summary?.total || 0, change: summary?.change || 0 }
  const contacted = statusStat(summary, 'Contacted')
  const qualified = statusStat(summary, 'Qualified')
  const counselling = statusStat(summary, 'Counselling')
  const offered = statusStat(summary, 'Offered')
  const converted = statusStat(summary, 'Converted')
  const created = statusStat(summary, 'New')

  return [
    { key: 'all', label: 'All Leads', count: all.count, change: all.change, tone: 'teal', icon: UserGroupIcon, status: 'all' },
    { key: 'new', label: 'New', count: created.count, change: created.change, tone: 'blue', icon: UserAdd01Icon, status: 'New' },
    { key: 'contacted', label: 'Contacted', count: contacted.count, change: contacted.change, tone: 'violet', icon: Call02Icon, status: 'Contacted' },
    { key: 'qualified', label: 'Qualified', count: qualified.count, change: qualified.change, tone: 'amber', icon: FavouriteIcon, status: 'Qualified' },
    { key: 'counselling', label: 'Counselling', count: counselling.count, change: counselling.change, tone: 'purple', icon: UserMultiple02Icon, status: 'Counselling' },
    { key: 'offered', label: 'Offered', count: offered.count, change: offered.change, tone: 'orange', icon: File01Icon, status: 'Offered' },
    { key: 'converted', label: 'Converted', count: converted.count, change: converted.change, tone: 'green', icon: CheckmarkCircle02Icon, status: 'Converted' },
  ]
}

export function emptyLeadValue(value?: string | null) {
  if (!value || value === '—') return '—'
  return value
}

export function leadDisplaySubtitle(row: LeadRow) {
  return row.subtitle?.trim() || ''
}
