import type { LeadRecord } from '../types'
import type { MasterOption } from '../hooks/useLeadMasterOptions'

export type LeadTabKey =
  | 'overview'
  | 'academic'
  | 'study'
  | 'documents'
  | 'communications'
  | 'whatsapp'
  | 'email'
  | 'activities'
  | 'followups'
  | 'notes'

export const LEAD_TABS: Array<{ key: LeadTabKey; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'academic', label: 'Academic' },
  { key: 'study', label: 'Study & Visa' },
  { key: 'documents', label: 'Documents' },
  { key: 'communications', label: 'Communication' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'email', label: 'Email' },
  { key: 'activities', label: 'Activities' },
  { key: 'followups', label: 'Follow-ups' },
  { key: 'notes', label: 'Notes' },
]

export function leadInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'L'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

export function hasText(value: unknown) {
  if (value === null || value === undefined) return false
  return String(value).trim().length > 0
}

export function optionLabel(options: MasterOption[], code?: string | null) {
  if (!code) return ''
  return options.find((item) => item.value === code)?.label || code
}

export function formatDisplayDate(value?: string | Date | null) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDisplayDateTime(value?: string | Date | null) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDob(value?: string | null) {
  if (!value) return ''
  const [year, month, day] = value.slice(0, 10).split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

export function formatFollowUpDue(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const label = formatDisplayDate(date)
  const startToday = new Date()
  startToday.setHours(0, 0, 0, 0)
  const startDue = new Date(date)
  startDue.setHours(0, 0, 0, 0)
  const days = Math.round((startDue.getTime() - startToday.getTime()) / 86400000)
  if (days > 1) return `${label} (in ${days} days)`
  if (days === 1) return `${label} (tomorrow)`
  if (days === 0) return `${label} (today)`
  if (days === -1) return `${label} (yesterday)`
  return `${label} (${Math.abs(days)} days ago)`
}

export function yesNoLabel(value: boolean | null | undefined) {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  return ''
}

export function stageBadgeClass(status: string) {
  const key = status.toLowerCase()
  if (key === 'new') {
    return 'bg-[#f3e8ff] text-[#7c3aed] dark:bg-violet-600/20 dark:text-[#c4b5fd]'
  }
  if (key === 'contacted') {
    return 'bg-[#fef9c3] text-[#a16207] dark:bg-yellow-600/20 dark:text-[#fde047]'
  }
  if (key === 'qualified') {
    return 'bg-[#ffedd5] text-[#c2410c] dark:bg-orange-600/20 dark:text-[#fdba74]'
  }
  if (key === 'counselling') {
    return 'bg-[#fed7aa] text-[#9a3412] dark:bg-orange-700/20 dark:text-[#fdba74]'
  }
  if (key === 'offered' || key === 'offer sent') {
    return 'bg-[#ccfbf1] text-[#0f766e] dark:bg-teal-600/20 dark:text-[#5eead4]'
  }
  if (key === 'file opening pending') {
    return 'bg-[#e0f2fe] text-[#0369a1] dark:bg-sky-600/20 dark:text-[#7dd3fc]'
  }
  if (key === 'file opened') {
    return 'bg-[#dcfce7] text-[#047857] dark:bg-emerald-600/20 dark:text-[#6ee7b7]'
  }
  if (['converted', 'enrolled', 'completed', 'active'].includes(key)) {
    return 'bg-[#dcfce7] text-[#15803d] dark:bg-green-600/20 dark:text-[#86efac]'
  }
  if (['lost', 'rejected', 'cancelled', 'unqualified', 'invalid', 'duplicate', 'closed'].includes(key)) {
    return 'bg-[#ffe8ee] text-[#e11d48] dark:bg-rose-600/20 dark:text-[#fda4af]'
  }
  return 'bg-[#f3f4f6] text-[#4b5563] dark:bg-[#24303a] dark:text-[#cbd5e1]'
}

export function priorityBadgeClass(priority?: string | null) {
  const key = (priority || '').toLowerCase()
  if (key === 'high' || key === 'urgent') {
    return 'bg-[#ffe4e6] text-[#e11d48] dark:bg-rose-600/20 dark:text-[#fda4af]'
  }
  if (key === 'medium') {
    return 'bg-[#ffedd5] text-[#c2410c] dark:bg-orange-600/20 dark:text-[#fdba74]'
  }
  if (key === 'low') {
    return 'bg-[#fef9c3] text-[#a16207] dark:bg-yellow-600/20 dark:text-[#fde047]'
  }
  return 'bg-[#f3f4f6] text-[#4b5563] dark:bg-[#24303a] dark:text-[#cbd5e1]'
}

export type CompletionRow = {
  key: string
  label: string
  filled: number
  total: number
  done: boolean
}

function countTexts(values: unknown[]): Omit<CompletionRow, 'key' | 'label'> {
  const filled = values.filter((value) => hasText(value)).length
  return { filled, total: values.length, done: filled === values.length && values.length > 0 }
}

function countAnswered(values: Array<boolean | null | undefined>): Omit<CompletionRow, 'key' | 'label'> {
  const filled = values.filter((value) => value !== null && value !== undefined).length
  return { filled, total: values.length, done: filled === values.length && values.length > 0 }
}

export function completionRows(lead: LeadRecord): CompletionRow[] {
  const personal = countTexts([
    lead.name,
    lead.phone,
    lead.email,
    lead.dateOfBirth,
    lead.currentLocation,
    lead.whatsappSameAsPhone ? lead.phone : lead.whatsapp,
    lead.sourceCode,
  ])
  const study = countTexts([
    lead.preferredCountryCode,
    lead.preferredDegreeCode,
    lead.preferredCourse,
    lead.preferredIntakeCode,
  ])
  const academic = countTexts([lead.highestQualificationCode, lead.institutionName, lead.passingYear])
  const financial = countTexts([
    lead.estimatedBudgetCode,
    lead.fundingSourceCode,
    lead.financialReadinessCode,
  ])
  const visa = countAnswered([lead.previousVisaApplication, lead.previousVisaRefusal])
  const language = countTexts([lead.englishTestCode, lead.testStatusCode])
  const other = countTexts([lead.notes || lead.remarks])

  return [
    { key: 'personal', label: 'Personal Information', ...personal },
    { key: 'study', label: 'Study Preference', ...study },
    { key: 'academic', label: 'Academic Information', ...academic },
    { key: 'financial', label: 'Financial Information', ...financial },
    { key: 'visa', label: 'Visa History', ...visa },
    { key: 'language', label: 'Language & Test', ...language },
    { key: 'other', label: 'Other Details', ...other },
  ]
}

export function activityTitle(action: string, details?: string | null) {
  const text = `${action} ${details || ''}`.toLowerCase()
  if (text.includes('status')) return 'Status updated'
  if (text.includes('created') || action.toLowerCase() === 'lead created') return 'Lead created'
  if (text.includes('follow-up') || text.includes('follow up')) return 'Follow-up scheduled'
  if (text.includes('updated') || text.includes('profile')) return 'Profile updated'
  if (text.includes('note')) return 'Note added'
  if (text.includes('call')) return 'Call logged'
  if (text.includes('email')) return 'Email sent'
  return action
}
