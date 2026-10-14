export type ApplicationRow = {
  id: string
  code?: string
  applicant: string
  university: string
  program: string
  intake: string
  counsellor: string
  status: string
  country?: string
  submitted: string
  leadId?: string | null
  leadCode?: string | null
}

export type ApplicationFormValues = {
  applicant: string
  university: string
  program: string
  intake: string
}

export const APPLICATION_PIPELINE_STATUSES = [
  'Draft',
  'Documents Pending',
  'Under Review',
  'Submitted',
  'Offer Received',
  'Visa Processing',
  'Enrolled',
  'Rejected',
  'Withdrawn',
] as const
