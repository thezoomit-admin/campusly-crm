export type EmailThreadStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'PROCESSING'
  | 'REPLIED'
  | 'WAITING_REPLY'
  | 'CLOSED'

export type EmailThread = {
  id: string
  participantEmail: string
  contactName: string | null
  displayName: string
  subject: string | null
  status: EmailThreadStatus
  unreadCount: number
  lastMessageAt: string | null
  lastMessagePreview: string | null
  lastDirection: 'incoming' | 'outgoing' | null
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

export type EmailAttachment = {
  id: string
  url: string
  mimeType: string | null
  fileName: string | null
  size: number | null
  docCategory: string | null
}

export type EmailMessage = {
  id: string
  threadId: string
  direction: 'incoming' | 'outgoing'
  subject: string
  body: string | null
  fromEmail: string
  fromName: string | null
  toEmail: string
  deliveryStatus: string
  errorMessage: string | null
  templateCode: string | null
  sentAt: string
  sentBy: { id: string; name: string } | null
  attachments: EmailAttachment[]
}

export type EmailTemplate = {
  id: string
  code: string
  name: string
  subject: string
  body: string
}

export type EmailSettings = {
  configured: boolean
  mockMode: boolean
  autoCreateLead: boolean
  fromAddress: string
  canManage: boolean
}

export const EMAIL_STATUS_LABELS: Record<EmailThreadStatus, string> = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  PROCESSING: 'Processing',
  REPLIED: 'Replied',
  WAITING_REPLY: 'Waiting Reply',
  CLOSED: 'Closed',
}

export const EMAIL_STATUS_ORDER: EmailThreadStatus[] = [
  'NEW',
  'ASSIGNED',
  'PROCESSING',
  'REPLIED',
  'WAITING_REPLY',
  'CLOSED',
]

export const EMAIL_DOC_CATEGORIES = [
  'Passport',
  'Academic Certificate',
  'Transcript',
  'IELTS Certificate',
  'Offer Letter',
  'Payment Receipt',
  'Other',
] as const

export const EMAIL_ERRORS = {
  sendFailed: 'Unable to send email. Please try again.',
  attachmentFailed: 'Unable to upload attachment.',
  unavailable: 'Email conversation not found.',
  denied: 'You do not have permission to access this email.',
} as const
