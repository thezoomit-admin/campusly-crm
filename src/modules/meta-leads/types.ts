export type MetaPlatform = 'FACEBOOK' | 'INSTAGRAM'

export type MetaFormType = 'STUDY_ABROAD' | 'COUNTRY_SPECIFIC' | 'SCHOLARSHIP' | 'IELTS' | 'EVENT'

export type MetaLead = {
  id: string
  platform: MetaPlatform
  platformLabel: string
  formType: MetaFormType
  formLabel: string
  externalId: string | null
  fullName: string | null
  phone: string | null
  email: string | null
  whatsapp: string | null
  currentEducation: string | null
  preferredCountryCode: string | null
  preferredIntake: string | null
  campaignName: string | null
  metaCampaignId: string | null
  adSetName: string | null
  adName: string | null
  campaign: { id: string; code: string; name: string } | null
  receivedAt: string
  processingStatus: string
  processingError: string | null
  message: string | null
  duplicate: boolean
  pooled: boolean
  leadId: string | null
  communicationEventId: string | null
  createdAt: string
  lead: {
    id: string
    code: string
    name: string
    status: string
    statusCode: string | null
    ownerId: string | null
    ownerName: string | null
    source: string | null
    sourceCode: string | null
    latestSource: string | null
  } | null
}

export type MetaPerformanceBucket = {
  key: string
  label: string
  generated: number
  contacted: number
  converted: number
  lost: number
  conversionRate: number
}

export type MetaPerformance = {
  totals: {
    generated: number
    contacted: number
    converted: number
    lost: number
    conversionRate: number
  }
  byPlatform: MetaPerformanceBucket[]
  byCountry: MetaPerformanceBucket[]
  byCampaign: MetaPerformanceBucket[]
}

export type MetaLeadFormValues = {
  platform: MetaPlatform
  formType: MetaFormType
  fullName: string
  phone: string
  email?: string
  whatsapp?: string
  currentEducation?: string
  preferredCountry?: string
  preferredIntake?: string
  campaignName?: string
  metaCampaignId?: string
  adSetName?: string
  adName?: string
}

export type CampaignTouch = {
  id: string
  platform: MetaPlatform | null
  platformLabel: string
  formType: MetaFormType | null
  formLabel: string
  campaignName: string | null
  metaCampaignId: string | null
  adSetName: string | null
  adName: string | null
  sourceCode: string | null
  channelCode?: string | null
  receivedAt: string
}

export const FORM_TYPE_OPTIONS = [
  { value: 'STUDY_ABROAD', label: 'Study Abroad Consultation' },
  { value: 'COUNTRY_SPECIFIC', label: 'Country Specific Campaign' },
  { value: 'SCHOLARSHIP', label: 'Scholarship Campaign' },
  { value: 'IELTS', label: 'IELTS Campaign' },
  { value: 'EVENT', label: 'Event Registration' },
]

export const PLATFORM_OPTIONS = [
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'INSTAGRAM', label: 'Instagram' },
]

export function formatMetaDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
}
