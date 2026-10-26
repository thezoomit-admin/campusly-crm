import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import type { AppNotification } from '../api/notificationsApi'

export type NotificationCategory = 'all' | 'lead' | 'follow_up' | 'payment' | 'offer' | 'file' | 'security' | 'email' | 'system'
export type NotificationChannelKey = 'all' | 'system' | 'email' | 'whatsapp' | 'browser'

const PAYLOAD_LABELS: Record<string, string> = {
  leadName: 'Lead',
  leadCode: 'Lead ID',
  country: 'Preferred Country',
  assignedBy: 'Assigned By',
  assignedAt: 'Assigned At',
  followUpType: 'Follow-up Type',
  amount: 'Amount',
  paymentType: 'Payment Type',
  receiptNumber: 'Receipt',
  fileCode: 'File ID',
  ownerName: 'Assigned To',
  offerName: 'Offer',
  previousStatus: 'Previous Status',
  newStatus: 'Current Status',
  status: 'Current Status',
  previousPriority: 'Previous Priority',
  priority: 'Priority',
  score: 'Score',
  source: 'Lead Source',
  leadSource: 'Lead Source',
  reminder: 'Reminder',
  scheduledAt: 'Scheduled',
  dueAt: 'Due',
}

export function formatWhen(iso: string) {
  const date = dayjs(iso)
  return date.isValid() ? date.format('MMM D, h:mm A') : iso
}

export function formatStamp(iso: string) {
  const date = dayjs(iso)
  return date.isValid() ? date.format('MMM D, YYYY, h:mm A') : iso
}

function formatPayloadValue(value: unknown) {
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}T/.test(text) && dayjs(text).isValid()) return formatStamp(text)
  return text
}

export function categoryOf(item: AppNotification): Exclude<NotificationCategory, 'all'> {
  const key = `${item.eventType || ''} ${item.type || ''}`.toLowerCase()
  if (key.includes('follow') || key.includes('meeting') || key.includes('counselling')) return 'follow_up'
  if (key.includes('payment')) return 'payment'
  if (key.includes('offer')) return 'offer'
  if (key.includes('file')) return 'file'
  if (key.includes('permission') || key.includes('security')) return 'security'
  if (key.includes('email') || key.includes('bounce')) return 'email'
  if (key.includes('lead')) return 'lead'
  return 'system'
}

export function channelOf(item: AppNotification): Exclude<NotificationChannelKey, 'all'> {
  const channels = new Set([item.channel, ...(item.deliveries || []).map((delivery) => delivery.channel)])
  if (channels.has('email')) return 'email'
  if (channels.has('whatsapp')) return 'whatsapp'
  if (channels.has('browser')) return 'browser'
  return 'system'
}

const STATIC_LEAD_PATHS = new Set(['pool', 'mine', 'closed', 'new'])

export function leadDetailsHref(item: AppNotification) {
  const leadId = item.lead?.id || item.leadId
  if (leadId) return `/leads/${leadId}`
  const link = item.link || item.actions?.find((action) => action.href)?.href || ''
  const match = link.match(/^\/leads\/([^/?#]+)/)
  if (match && !STATIC_LEAD_PATHS.has(match[1])) return `/leads/${match[1]}`
  return null
}

export function recordHref(item: AppNotification) {
  return item.actions?.find((action) => action.href)?.href || item.link || (item.lead ? `/leads/${item.lead.id}` : null)
}

export function recordLabel(item: AppNotification) {
  return item.actions?.find((action) => action.href)?.label || (item.lead ? 'Open Lead' : 'Open record')
}

export const TYPE_META: Record<Exclude<NotificationCategory, 'all'>, { label: string; className: string }> = {
  lead: { label: 'Lead', className: 'bg-[#e8f1ff] text-[#2f6fed] dark:bg-[rgba(47,111,237,0.18)] dark:text-[#9db7ff]' },
  follow_up: { label: 'Follow-up', className: 'bg-[#f4ebff] text-[#7a5af8] dark:bg-[rgba(122,90,248,0.18)] dark:text-[#d3c4ff]' },
  payment: { label: 'Payment', className: 'bg-[#fff6e8] text-[#f79009] dark:bg-[rgba(247,144,9,0.18)] dark:text-[#fdba74]' },
  offer: { label: 'Offer', className: 'bg-[#e7f8ef] text-[#12b76a] dark:bg-[rgba(18,183,106,0.18)] dark:text-[#86efac]' },
  file: { label: 'File', className: 'bg-[#e7f8ef] text-[#0f7a4a] dark:bg-[rgba(15,122,74,0.2)] dark:text-[#86efac]' },
  security: { label: 'Security', className: 'bg-[#fde8e8] text-[#d92d20] dark:bg-[rgba(217,45,32,0.18)] dark:text-[#fca5a5]' },
  email: { label: 'Email', className: 'bg-[#e7f8ef] text-[#12b76a] dark:bg-[rgba(18,183,106,0.18)] dark:text-[#86efac]' },
  system: { label: 'System', className: 'bg-[#f2f4f7] text-[#667085] dark:bg-[#24303a] dark:text-[#cbd5e1]' },
}

export const CHANNEL_META: Record<Exclude<NotificationChannelKey, 'all'>, { label: string; className: string }> = {
  system: { label: 'System', className: 'bg-[#eef2ff] text-[#4f46e5] dark:bg-[rgba(79,70,229,0.18)] dark:text-[#c7d2fe]' },
  email: { label: 'Email', className: 'bg-[#e7f8ef] text-[#12b76a] dark:bg-[rgba(18,183,106,0.18)] dark:text-[#86efac]' },
  whatsapp: { label: 'WhatsApp', className: 'bg-[#e7f8ef] text-[#128c7e] dark:bg-[rgba(18,140,126,0.18)] dark:text-[#86efac]' },
  browser: { label: 'Browser', className: 'bg-[#fff6e8] text-[#f79009] dark:bg-[rgba(247,144,9,0.18)] dark:text-[#fdba74]' },
}

export function priorityClass(priority?: string) {
  if (priority === 'Critical') return 'bg-[#fde8e8] text-[#d92d20] dark:bg-[rgba(217,45,32,0.18)] dark:text-[#fca5a5]'
  if (priority === 'Important') return 'bg-[#fff4e5] text-[#f79009] dark:bg-[rgba(247,144,9,0.18)] dark:text-[#fdba74]'
  return 'bg-[#f2f4f7] text-[#667085] dark:bg-[#24303a] dark:text-[#cbd5e1]'
}

export function statusClass(status: string) {
  if (status === 'Unread') return 'bg-[#fde8e8] text-[#d92d20] dark:bg-[rgba(217,45,32,0.18)] dark:text-[#fca5a5]'
  if (status === 'Archived') return 'bg-[#f2f4f7] text-[#667085] dark:bg-[#24303a] dark:text-[#cbd5e1]'
  if (status === 'Read') return 'bg-[#e7f8ef] text-[#12b76a] dark:bg-[rgba(18,183,106,0.18)] dark:text-[#86efac]'
  return 'bg-[#e8f1ff] text-[#2f6fed] dark:bg-[rgba(47,111,237,0.18)] dark:text-[#9db7ff]'
}

export function TypeIcon({ category }: { category: Exclude<NotificationCategory, 'all'> }) {
  if (category === 'follow_up') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    )
  }
  if (category === 'email') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 7 9-7" />
      </svg>
    )
  }
  if (category === 'payment') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" />
      </svg>
    )
  }
  if (category === 'lead') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 19c1.4-3 3.8-4.5 7-4.5S17.6 16 19 19" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2" />
    </svg>
  )
}

export function ChannelIcon({ channel }: { channel: Exclude<NotificationChannelKey, 'all'> }) {
  if (channel === 'email') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 7 9-7" />
      </svg>
    )
  }
  if (channel === 'whatsapp') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M6 18l-1 4 4-1a8 8 0 1 0-3-3z" />
      </svg>
    )
  }
  if (channel === 'browser') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="12" r="8" />
        <path d="M3 12h18M12 4a12 12 0 0 1 0 16" />
      </svg>
    )
  }
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 12h8M12 8v8" />
    </svg>
  )
}

export function Pill({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.72rem] font-semibold ${className}`}>{children}</span>
}

export function payloadLines(item: AppNotification) {
  const payload = item.payload
  if (!payload) return []
  return Object.entries(PAYLOAD_LABELS)
    .filter(([key]) => payload[key] !== undefined && payload[key] !== null && payload[key] !== '')
    .map(([key, label]) => ({ label, value: formatPayloadValue(payload[key]) }))
}
