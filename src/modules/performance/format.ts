export const PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_quarter', label: 'This Quarter' },
  { id: 'custom', label: 'Custom Date Range' },
] as const

export const RANK_OPTIONS = [
  { id: 'conversion_rate', label: 'Conversion' },
  { id: 'follow_up_on_time', label: 'Follow-up On-time' },
  { id: 'response_time', label: 'Response Time' },
  { id: 'offer_acceptance', label: 'Offer Acceptance' },
  { id: 'collection', label: 'Collection' },
  { id: 'overall', label: 'Overall KPI' },
  { id: 'contact_rate', label: 'Contact Rate' },
]

export function percent(value: number) {
  return `${value}%`
}

export function minutes(value: number) {
  if (!value) return '0 min'
  if (value < 60) return `${value} min`
  const hours = Math.floor(value / 60)
  const rest = value % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

export function money(value: number) {
  return `BDT ${Math.round(value).toLocaleString('en-IN')}`
}

export function when(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function kpiValue(unit: string, value: number) {
  if (unit === 'minutes') return minutes(value)
  if (unit === 'currency') return money(value)
  if (unit === 'count') return String(value)
  return percent(value)
}

export const kpiTone: Record<string, string> = {
  Exceeded: 'bg-[#e7f8ef] text-[#15803d]',
  Achieved: 'bg-[#e8f1ff] text-[#1d4ed8]',
  'Below Target': 'bg-[#ffe8ee] text-[#be123c]',
}
