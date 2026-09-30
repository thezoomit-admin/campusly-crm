import dayjs from 'dayjs'
import { statusPill } from '@/styles/admin'
import type { EmailThreadStatus } from '../types'

export function formatListTime(iso: string | null) {
  if (!iso) return ''
  const value = dayjs(iso)
  const now = dayjs()
  if (value.isSame(now, 'day')) return value.format('h:mm A')
  if (value.isSame(now.subtract(1, 'day'), 'day')) return 'Yesterday'
  if (value.isSame(now, 'year')) return value.format('D MMM')
  return value.format('D MMM YYYY')
}

export function formatBubbleTime(iso: string) {
  return dayjs(iso).format('h:mm A')
}

export function formatDayDivider(iso: string) {
  const value = dayjs(iso)
  const now = dayjs()
  if (value.isSame(now, 'day')) return 'Today'
  if (value.isSame(now.subtract(1, 'day'), 'day')) return 'Yesterday'
  return value.format('dddd, D MMMM YYYY')
}

export function formatBytes(size: number | null | undefined) {
  if (!size) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'E'
  if (parts[0]?.includes('@')) return parts[0][0]!.toUpperCase()
  return parts
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

const STATUS_TONE: Record<EmailThreadStatus, string> = {
  NEW: 'bg-[#e8f1ff] text-[#2563eb] dark:bg-blue-600/20 dark:text-[#93c5fd]',
  ASSIGNED: 'bg-[#eee8ff] text-[#7c3aed] dark:bg-violet-600/20 dark:text-[#c4b5fd]',
  PROCESSING: 'bg-[#e7f8ef] text-[#16a34a] dark:bg-green-600/20 dark:text-[#86efac]',
  REPLIED: 'bg-[#e6f6f4] text-[#0f766e] dark:bg-teal-600/20 dark:text-[#5eead4]',
  WAITING_REPLY: 'bg-[#fff1e6] text-[#d97706] dark:bg-amber-600/20 dark:text-[#fcd34d]',
  CLOSED: 'bg-[#f3f4f6] text-[#4b5563] dark:bg-[#24303a] dark:text-[#cbd5e1]',
}

export function emailStatusClass(status: EmailThreadStatus) {
  return `${statusPill} ${STATUS_TONE[status]}`
}

export function applyTemplate(body: string, studentName: string, employeeName: string) {
  return body.replaceAll('{{studentName}}', studentName || 'Student').replaceAll('{{employeeName}}', employeeName || 'Campusly')
}
