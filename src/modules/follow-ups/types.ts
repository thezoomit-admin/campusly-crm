export const FOLLOW_UP_TYPES = [
  'Call',
  'WhatsApp',
  'Email',
  'SMS',
  'Counselling',
  'Meeting',
  'Document Request',
  'Payment Discussion',
  'Service Discussion',
  'Other',
] as const

export const FOLLOW_UP_PRIORITIES = ['High', 'Medium', 'Low'] as const

export const FOLLOW_UP_PURPOSES = [
  'Initial Contact',
  'Information Sharing',
  'Counselling',
  'University Discussion',
  'Course Discussion',
  'Service Discussion',
  'Service Charge Discussion',
  'Payment Follow-up',
  'Document Collection',
  'Visa Discussion',
  'Application Update',
  'Offer Discussion',
  'Other',
] as const

export const FOLLOW_UP_REMINDERS = [
  'No Reminder',
  'At the time',
  '5 Minutes Before',
  '15 Minutes Before',
  '30 Minutes Before',
  '1 Hour Before',
  '1 Day Before',
] as const

export const FOLLOW_UP_OUTCOMES = [
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

export const FOLLOW_UP_OPEN_STATUSES = ['Pending', 'Due Soon', 'Overdue'] as const

export type FollowUpScheduleHistoryEntry = {
  previousDueAt: string | null
  newDueAt: string | null
  reason: string
  at: string
  byId: string
  byName: string
}

export type FollowUpRecord = {
  id: string
  contact: string
  contactName: string
  leadId: string | null
  lead: { id: string; code: string; name: string } | null
  type: string
  owner: string
  ownerName: string | null
  ownerId: string | null
  due: string
  dueAt: string | null
  priority: string
  status: string
  purpose: string | null
  purposeOther: string | null
  notes: string | null
  nextAction: string | null
  reminder: string
  outcome: string | null
  completedAt: string | null
  completedByName: string | null
  cancelledAt: string | null
  cancelledByName: string | null
  cancelReason: string | null
  source: string
  sourceReason: string | null
  scheduleHistory: FollowUpScheduleHistoryEntry[]
  createdAt: string
  updatedAt: string
}

export type FollowUpRow = FollowUpRecord

export type FollowUpFormValues = {
  leadId: string
  type: string
  dueAt: string
  priority: string
  purpose: string
  purposeOther?: string
  notes?: string
  nextAction: string
  reminder: string
}

export type CompleteFollowUpValues = {
  outcome: string
  notes?: string
  nextAction: string
  createNextFollowUp: boolean
  nextDueAt?: string
  nextType?: string
  nextPriority?: string
  nextReminder?: string
}

export type RescheduleFollowUpValues = {
  dueAt: string
  reason: string
}

export type CancelFollowUpValues = {
  reason: string
}
