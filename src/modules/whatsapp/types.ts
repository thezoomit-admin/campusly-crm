export type WhatsAppConversationStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_REPLY'
  | 'RESOLVED'
  | 'CLOSED'

export type WhatsAppMessageType = 'TEXT' | 'IMAGE' | 'PDF' | 'DOCUMENT' | 'VIDEO' | 'VOICE' | 'TEMPLATE'

export type WhatsAppConversation = {
  id: string
  waNumber: string
  phone: string
  contactName: string | null
  displayName: string
  status: WhatsAppConversationStatus
  unreadCount: number
  lastMessageAt: string | null
  lastMessagePreview: string | null
  lastDirection: 'incoming' | 'outgoing' | null
  lastInboundAt: string | null
  replyWindowOpen: boolean
  replyWindowExpiresAt: string | null
  identified: boolean
  lead: {
    id: string
    code: string
    name: string
    phone: string | null
    email: string | null
    country: string | null
    status: string
  } | null
  assignedUser: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
}

export type WhatsAppMessage = {
  id: string
  conversationId: string
  direction: 'incoming' | 'outgoing'
  type: WhatsAppMessageType
  body: string | null
  deliveryStatus: string
  errorMessage: string | null
  sentAt: string
  sentBy: { id: string; name: string } | null
  attachment: {
    url: string
    mimeType: string | null
    fileName: string | null
    size: number | null
    docCategory: string | null
  } | null
}

export type WhatsAppSettings = {
  configured: boolean
  mockMode: boolean
  autoCreateLead: boolean
  allowVideo: boolean
  allowVoice: boolean
  defaultTemplate: string
  canManage: boolean
}

export const WA_STATUS_LABELS: Record<WhatsAppConversationStatus, string> = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  WAITING_REPLY: 'Waiting Reply',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
}

export const WA_STATUS_ORDER: WhatsAppConversationStatus[] = [
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_REPLY',
  'RESOLVED',
  'CLOSED',
]

export const WA_DOC_CATEGORIES = [
  'Passport',
  'Certificate',
  'Transcript',
  'IELTS Result',
  'Offer Letter',
  'Other',
] as const

export const WA_ERRORS = {
  sendFailed: 'Unable to send WhatsApp message.',
  attachmentFailed: 'Unable to upload attachment.',
  unavailable: 'Conversation could not be loaded.',
  denied: 'You do not have permission to access this conversation.',
} as const
