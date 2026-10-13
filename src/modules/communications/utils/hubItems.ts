import type { EmailThread } from '@/modules/email/types'
import type { WhatsAppConversation } from '@/modules/whatsapp/types'
import type { CommunicationChannel, CommunicationEvent } from '../types'
import type { HubChannelFilter } from './hubFormat'
import { matchesChannelFilter } from './hubFormat'

export type HubSource = 'event' | 'whatsapp' | 'email'

export type HubItem = {
  /** Prefixed id for URL selection: ce: / wa: / em: */
  hubId: string
  source: HubSource
  sourceId: string
  channel: CommunicationChannel
  name: string
  preview: string
  at: string
  unreadCount: number
  phone?: string | null
  email?: string | null
  location?: string | null
  assignedUserId?: string | null
  assignedUserName?: string | null
  leadId?: string | null
  lead?: {
    id: string
    code: string
    name: string
    ownerId?: string | null
    ownerName?: string | null
    status?: string
    phone?: string | null
    email?: string | null
    country?: string | null
  } | null
  event?: CommunicationEvent
  whatsapp?: WhatsAppConversation
  emailThread?: EmailThread
}

export function hubIdFor(source: HubSource, id: string) {
  if (source === 'whatsapp') return `wa:${id}`
  if (source === 'email') return `em:${id}`
  return `ce:${id}`
}

export function parseHubId(value: string | null): { source: HubSource; sourceId: string } | null {
  if (!value) return null
  if (value.startsWith('wa:')) return { source: 'whatsapp', sourceId: value.slice(3) }
  if (value.startsWith('em:')) return { source: 'email', sourceId: value.slice(3) }
  if (value.startsWith('ce:')) return { source: 'event', sourceId: value.slice(3) }
  // Legacy bare ids — treat as communication events
  return { source: 'event', sourceId: value }
}

export function fromCommunicationEvent(event: CommunicationEvent): HubItem {
  return {
    hubId: hubIdFor('event', event.id),
    source: 'event',
    sourceId: event.id,
    channel: event.channel,
    name: event.lead?.name || event.senderName || event.senderPhone || event.senderEmail || 'Unknown',
    preview: (event.message || event.subject || '').replace(/\s+/g, ' ').trim() || 'No message preview',
    at: event.eventAt || event.createdAt,
    unreadCount:
      event.processingStatus === 'PENDING' || event.processingStatus === 'PROCESSING' ? 1 : 0,
    phone: event.senderPhone,
    email: event.senderEmail,
    location: event.currentLocation || event.preferredCountryCode,
    assignedUserId: event.lead?.ownerId || null,
    assignedUserName: event.lead?.ownerName || null,
    leadId: event.leadId || event.lead?.id || null,
    lead: event.lead
      ? {
          id: event.lead.id,
          code: event.lead.code,
          name: event.lead.name,
          ownerId: event.lead.ownerId,
          ownerName: event.lead.ownerName,
          status: event.lead.status,
        }
      : null,
    event,
  }
}

export function fromWhatsApp(conversation: WhatsAppConversation): HubItem {
  return {
    hubId: hubIdFor('whatsapp', conversation.id),
    source: 'whatsapp',
    sourceId: conversation.id,
    channel: 'WHATSAPP',
    name: conversation.displayName || conversation.contactName || conversation.phone,
    preview: conversation.lastMessagePreview || 'No messages yet',
    at: conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt,
    unreadCount: conversation.unreadCount || 0,
    phone: conversation.phone,
    email: conversation.lead?.email || null,
    location: conversation.lead?.country || null,
    assignedUserId: conversation.assignedUser?.id || null,
    assignedUserName: conversation.assignedUser?.name || null,
    leadId: conversation.lead?.id || null,
    lead: conversation.lead
      ? {
          id: conversation.lead.id,
          code: conversation.lead.code,
          name: conversation.lead.name,
          status: conversation.lead.status,
          phone: conversation.lead.phone,
          email: conversation.lead.email,
          country: conversation.lead.country,
        }
      : null,
    whatsapp: conversation,
  }
}

export function fromEmail(thread: EmailThread): HubItem {
  return {
    hubId: hubIdFor('email', thread.id),
    source: 'email',
    sourceId: thread.id,
    channel: 'EMAIL',
    name: thread.displayName || thread.contactName || thread.participantEmail,
    preview: thread.lastMessagePreview || thread.subject || 'No messages yet',
    at: thread.lastMessageAt || thread.updatedAt || thread.createdAt,
    unreadCount: thread.unreadCount || 0,
    phone: thread.lead?.phone || null,
    email: thread.participantEmail,
    location: thread.lead?.country || null,
    assignedUserId: thread.assignedUser?.id || null,
    assignedUserName: thread.assignedUser?.name || null,
    leadId: thread.lead?.id || null,
    lead: thread.lead
      ? {
          id: thread.lead.id,
          code: thread.lead.code,
          name: thread.lead.name,
          status: thread.lead.status,
          phone: thread.lead.phone,
          email: thread.lead.email,
          country: thread.lead.country,
        }
      : null,
    emailThread: thread,
  }
}

/** Inbox APIs own live WA/Email threads — skip duplicate channel events from the hub feed. */
export function isInboxOwnedChannel(channel: CommunicationChannel) {
  return channel === 'WHATSAPP' || channel === 'EMAIL'
}

export function mergeHubItems(args: {
  events: CommunicationEvent[]
  whatsapp: WhatsAppConversation[]
  email: EmailThread[]
}): HubItem[] {
  const items: HubItem[] = [
    ...args.events.filter((event) => !isInboxOwnedChannel(event.channel)).map(fromCommunicationEvent),
    ...args.whatsapp.map(fromWhatsApp),
    ...args.email.map(fromEmail),
  ]
  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}

export function filterHubItems(
  items: HubItem[],
  channelFilter: HubChannelFilter,
  listTab: 'all' | 'unread' | 'assigned',
  userId: string,
) {
  let next = items
  if (channelFilter !== 'all') {
    next = next.filter((item) => matchesChannelFilter(item.channel, channelFilter))
  }
  if (listTab === 'unread') next = next.filter((item) => item.unreadCount > 0)
  if (listTab === 'assigned') next = next.filter((item) => item.assignedUserId === userId)
  return next
}
