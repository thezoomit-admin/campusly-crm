/** Visual admission pipeline shown on Application Details (aligned to backend statuses). */
export const APPLICATION_PROGRESS_STEPS = [
  { key: 'Draft', label: 'Draft' },
  { key: 'Documents Pending', label: 'Documents' },
  { key: 'Under Review', label: 'Ready to Submit' },
  { key: 'Submitted', label: 'Submitted' },
  { key: 'Offer Received', label: 'Offer Received' },
  { key: 'Visa Processing', label: 'Visa Processing' },
  { key: 'Enrolled', label: 'Enrolled' },
] as const

const STEP_INDEX: Record<string, number> = Object.fromEntries(
  APPLICATION_PROGRESS_STEPS.map((step, index) => [step.key, index]),
)

export function applicationProgressIndex(status: string): number {
  if (status === 'Rejected' || status === 'Withdrawn') return -1
  return STEP_INDEX[status] ?? 0
}

export function progressBadgeLabel(status: string) {
  if (status === 'Enrolled') return 'Completed'
  if (status === 'Rejected' || status === 'Withdrawn') return status
  return 'In Progress'
}

export function primaryStatusActionLabel(next?: string) {
  if (next === 'Submitted') return 'Submit to University'
  if (next === 'Offer Received') return 'Mark Offer Received'
  if (next === 'Visa Processing') return 'Start Visa Processing'
  if (next === 'Enrolled') return 'Mark Enrolled'
  if (next === 'Under Review') return 'Mark Ready to Submit'
  if (next === 'Documents Pending') return 'Move to Documents'
  if (!next) return null
  return `Move to ${next}`
}
