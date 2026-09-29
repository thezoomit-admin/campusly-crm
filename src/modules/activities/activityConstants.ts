export const ACTIVITY_TYPE_OPTIONS = [
  { value: 'CALL', label: 'Call' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
  { value: 'COUNSELLING', label: 'Counselling' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'DOCUMENT_REQUEST', label: 'Document Request' },
  { value: 'PAYMENT_DISCUSSION', label: 'Payment Discussion' },
  { value: 'SERVICE_DISCUSSION', label: 'Service Discussion' },
  { value: 'OTHER', label: 'Other' },
] as const

export const CALL_OUTCOMES = [
  'Connected',
  'No Answer',
  'Busy',
  'Call Back Requested',
  'Interested',
  'Not Interested',
  'Information Requested',
  'Counselling Scheduled',
  'Payment Discussed',
  'Documents Requested',
  'Other',
] as const

export const COUNSELLING_OUTCOMES = [
  'Scheduled',
  'Completed',
  'Rescheduled',
  'Cancelled',
  'No Show',
] as const

export const GENERIC_ACTIVITY_OUTCOMES = [
  'Completed',
  'Interested',
  'Not Interested',
  'Information Requested',
  'Follow-up Required',
  'Other',
] as const

export function outcomesForActivityType(type: string): readonly string[] {
  if (type === 'CALL') return CALL_OUTCOMES
  if (type === 'COUNSELLING') return COUNSELLING_OUTCOMES
  return GENERIC_ACTIVITY_OUTCOMES
}

export type LogActivityFormValues = {
  type: string
  outcome: string
  notes: string
  durationMin?: string
  nextAction: string
  createNextFollowUp: boolean
  nextDueAt?: string
  nextFollowUpType?: string
  nextFollowUpPriority?: string
}
