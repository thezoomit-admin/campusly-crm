export type CommunicationChannel =
  | 'WEBSITE'
  | 'WHATSAPP'
  | 'EMAIL'
  | 'META_FACEBOOK'
  | 'META_INSTAGRAM'

export type CommunicationStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'DUPLICATE'

export type CommunicationEvent = {
  id: string
  channel: CommunicationChannel
  eventAt: string
  senderName: string | null
  senderPhone: string | null
  senderEmail: string | null
  preferredCountryCode: string | null
  subject: string | null
  message: string | null
  sourceCode: string | null
  campaignName: string | null
  campaign: { id: string; code: string; name: string } | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  landingPageUrl?: string | null
  phoneCountryCode?: string | null
  whatsapp?: string | null
  whatsappSameAsPhone?: boolean | null
  currentLocation?: string | null
  highestQualificationCode?: string | null
  preferredIntakeCode?: string | null
  preferredDegreeCode?: string | null
  direction: string
  externalId: string | null
  formName: string | null
  processingStatus: CommunicationStatus
  processingError: string | null
  leadId: string | null
  leadCreated: boolean
  activityId: string | null
  processedAt: string | null
  createdAt: string
  updatedAt: string
  /** Present for CRM email thread items merged into lead communications. */
  threadId?: string | null
  lead: {
    id: string
    code: string
    name: string
    ownerId: string | null
    ownerName: string | null
    status: string
  } | null
}

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'

export type CampaignRecord = {
  id: string
  code: string
  name: string
  description: string | null
  sourceCode: string | null
  channel: string | null
  status: CampaignStatus
  startDate: string | null
  endDate: string | null
  budget: number | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  createdAt: string
  updatedAt: string
  leadsCount: number
  eventsCount: number
}

export type CampaignFormValues = {
  name: string
  code?: string
  description?: string
  sourceCode?: string
  channel?: string
  status: CampaignStatus
  startDate?: string
  endDate?: string
  budget?: number | null
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

export const CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  WEBSITE: 'Website',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'Email',
  META_FACEBOOK: 'Facebook Lead Ads',
  META_INSTAGRAM: 'Instagram Lead Forms',
}

export const STATUS_LABELS: Record<CommunicationStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  PROCESSED: 'Processed',
  FAILED: 'Failed',
  DUPLICATE: 'Duplicate',
}
