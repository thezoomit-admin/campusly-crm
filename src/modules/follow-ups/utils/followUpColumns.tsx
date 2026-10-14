import type { ColumnsType } from 'antd/es/table'
import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Call02Icon,
  Clock01Icon,
  DocumentAttachmentIcon,
  Mail01Icon,
  MeetingRoomIcon,
  Message01Icon,
} from '@hugeicons/core-free-icons'
import type { FollowUpRecord } from '../types'
import {
  displayFollowUpStatus,
  followUpAvatarTone,
  followUpDisplayStatusClass,
  followUpInitials,
  followUpPriorityClass,
  isOpenFollowUp,
} from './followUpList'

function typeIcon(type: string): IconSvgElement {
  const key = type.toLowerCase()
  if (key.includes('whatsapp') || key.includes('sms')) return Message01Icon
  if (key.includes('email')) return Mail01Icon
  if (key.includes('meeting') || key.includes('counselling')) return MeetingRoomIcon
  if (key.includes('document')) return DocumentAttachmentIcon
  return Call02Icon
}

function formatDueParts(dueAt?: string | null, fallback?: string) {
  if (!dueAt) {
    return { primary: fallback || '—', secondary: '' }
  }
  const date = new Date(dueAt)
  if (Number.isNaN(date.getTime())) {
    return { primary: fallback || '—', secondary: '' }
  }
  return {
    primary: date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    secondary: date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
  }
}

export const followUpColumns: ColumnsType<FollowUpRecord> = [
  {
    title: 'Contact',
    dataIndex: 'contact',
    key: 'contact',
    width: 220,
    render: (_v, row) => {
      const name = row.contact || row.contactName || '—'
      const code = row.lead?.code
      return (
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-bold ${followUpAvatarTone(name)}`}
          >
            {followUpInitials(name)}
          </span>
          <div className="min-w-0">
            {row.leadId ? (
              <Link
                to={`/leads/${row.leadId}`}
                className="m-0 block truncate text-[13px] font-semibold text-primary hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                {name}
              </Link>
            ) : (
              <p className="m-0 truncate text-[13px] font-semibold text-text-strong">{name}</p>
            )}
            {row.leadId || code ? (
              <p className="m-0 truncate text-[11px] text-text-faint">
                <span className="font-semibold text-[#2563eb]">Lead</span>
                {code ? ` • ${code}` : ''}
              </p>
            ) : (
              <p className="m-0 truncate text-[11px] text-text-faint">Contact</p>
            )}
          </div>
        </div>
      )
    },
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    width: 150,
    render: (value: string) => (
      <span className="inline-flex items-center gap-1.5 text-[13px] text-text-strong">
        <HugeiconsIcon
          icon={typeIcon(value || '')}
          size={15}
          color="currentColor"
          strokeWidth={1.7}
        />
        {value || '—'}
      </span>
    ),
  },
  {
    title: 'Purpose',
    dataIndex: 'purpose',
    key: 'purpose',
    width: 160,
    ellipsis: true,
    render: (_v, row) => {
      if (row.purpose === 'Other' && row.purposeOther) return row.purposeOther
      return row.purpose || '—'
    },
  },
  {
    title: 'Due Date & Time',
    dataIndex: 'due',
    key: 'due',
    width: 170,
    render: (_v, row) => {
      const parts = formatDueParts(row.dueAt, row.due)
      const showOverdueBadge = row.status === 'Overdue' && isOpenFollowUp(row.status)
      return (
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[13px] text-text-strong">
            <HugeiconsIcon
              icon={Clock01Icon}
              size={14}
              color="currentColor"
              strokeWidth={1.7}
            />
            <span>
              {parts.primary}
              {parts.secondary ? (
                <span className="text-text-muted">, {parts.secondary}</span>
              ) : null}
            </span>
          </span>
          {showOverdueBadge ? (
            <span className="mt-1 inline-flex rounded-full bg-[#ffe8ee] px-2 py-0.5 text-[10px] font-bold text-[#e11d48]">
              Overdue
            </span>
          ) : null}
        </div>
      )
    },
  },
  {
    title: 'Owner',
    dataIndex: 'owner',
    key: 'owner',
    width: 160,
    render: (_v, row) => {
      const name = row.owner || row.ownerName || '—'
      return (
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${followUpAvatarTone(name)}`}
          >
            {followUpInitials(name)}
          </span>
          <span className="truncate text-[13px] text-text-strong">{name}</span>
        </div>
      )
    },
  },
  {
    title: 'Priority',
    dataIndex: 'priority',
    key: 'priority',
    width: 100,
    render: (value: string) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${followUpPriorityClass(value || 'Medium')}`}
      >
        {value || 'Medium'}
      </span>
    ),
  },
  {
    title: 'Next Action',
    dataIndex: 'nextAction',
    key: 'nextAction',
    width: 180,
    ellipsis: true,
    render: (value: string | null) => value || '—',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: (value: string) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${followUpDisplayStatusClass(value || '')}`}
      >
        {displayFollowUpStatus(value || '')}
      </span>
    ),
  },
]
