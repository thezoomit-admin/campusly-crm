import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import type { CommunicationChannel, CommunicationEvent } from '../types'

dayjs.extend(relativeTime)

export type HubChannelFilter = 'all' | 'messenger' | 'whatsapp' | 'email'

export function formatRelativeTime(iso: string | null | undefined) {
  if (!iso) return ''
  const value = dayjs(iso)
  if (!value.isValid()) return ''
  const diffMin = dayjs().diff(value, 'minute')
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = dayjs().diff(value, 'hour')
  if (diffHr < 24) return `${diffHr} hr ago`
  return value.fromNow()
}

export function formatThreadStamp(iso: string) {
  const value = dayjs(iso)
  if (value.isSame(dayjs(), 'day')) return `Today, ${value.format('h:mm A')}`
  if (value.isSame(dayjs().subtract(1, 'day'), 'day')) {
    return `Yesterday, ${value.format('h:mm A')}`
  }
  return value.format('D MMM YYYY, h:mm A')
}

export function formatBubbleTime(iso: string) {
  return dayjs(iso).format('h:mm A')
}

export function hubInitials(name: string | null | undefined) {
  const parts = (name || '').replace(/^\+/, '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (/^\d/.test(parts[0]!)) return '#'
  return parts
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

export function displayName(event: CommunicationEvent) {
  return event.lead?.name || event.senderName || event.senderPhone || event.senderEmail || 'Unknown'
}

export function messagePreview(event: CommunicationEvent) {
  const text = (event.message || event.subject || '').replace(/\s+/g, ' ').trim()
  return text || 'No message preview'
}

export function matchesChannelFilter(channel: CommunicationChannel, filter: HubChannelFilter) {
  if (filter === 'all') return true
  if (filter === 'whatsapp') return channel === 'WHATSAPP'
  if (filter === 'email') return channel === 'EMAIL'
  if (filter === 'messenger') {
    return channel === 'META_FACEBOOK' || channel === 'META_INSTAGRAM'
  }
  return true
}

export function isUnread(event: CommunicationEvent) {
  return event.processingStatus === 'PENDING' || event.processingStatus === 'PROCESSING'
}

export function avatarTone(channel: CommunicationChannel) {
  switch (channel) {
    case 'WHATSAPP':
      return 'bg-[#e8f8ef] text-[#128c7e] dark:bg-emerald-500/15 dark:text-emerald-300'
    case 'EMAIL':
      return 'bg-[#fff4e8] text-[#c2410c] dark:bg-orange-500/15 dark:text-orange-300'
    case 'META_FACEBOOK':
    case 'META_INSTAGRAM':
      return 'bg-[#e8f1ff] text-[#1877f2] dark:bg-blue-500/15 dark:text-sky-300'
    default:
      return 'bg-[#eef2ff] text-[#3b82f6] dark:bg-blue-500/15 dark:text-link'
  }
}
