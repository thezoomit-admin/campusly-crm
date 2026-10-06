import { Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ViewIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import LeadPhoneCell from '../components/LeadPhoneCell'
import type { MyLeadRow } from '../types'
import { countryFlag, emptyLeadValue, formatLeadCreatedOn, leadAvatarTone } from './leadList'
import { leadInitials, priorityBadgeClass, stageBadgeClass } from './leadDetails'

type MyLeadColumnOptions = {
  sort?: string
  order?: 'asc' | 'desc'
  onView: (row: MyLeadRow) => void
}

function followUpClass(value?: string | null) {
  if (!value) return 'text-text-faint'
  const due = new Date(value)
  if (Number.isNaN(due.getTime())) return 'text-text-faint'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDay = new Date(due)
  dueDay.setHours(0, 0, 0, 0)
  if (dueDay.getTime() < today.getTime()) return 'text-[#e11d48]'
  if (dueDay.getTime() === today.getTime()) return 'text-[#d97706]'
  return 'text-text'
}

export function getMyLeadColumns({ sort, order, onView }: MyLeadColumnOptions): ColumnsType<MyLeadRow> {
  return [
    {
      title: 'Lead ID',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (value: string, row) => (
        <button
          type="button"
          className="cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-[#0f9d8e] no-underline hover:no-underline"
          onClick={(event) => {
            event.stopPropagation()
            onView(row)
          }}
        >
          {emptyLeadValue(value)}
        </button>
      ),
    },
    {
      title: 'Student Name',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (_value, row) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-bold ${leadAvatarTone(row.name)}`}>
            {leadInitials(row.name)}
          </span>
          <p className="m-0 truncate text-[13px] font-semibold text-text">{row.name || '—'}</p>
        </div>
      ),
    },
    {
      title: 'Phone Number',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (value: string, row) => (
        <LeadPhoneCell phone={value} isDuplicate={row.isDuplicate} hasPhoneDuplicate={row.hasPhoneDuplicate} />
      ),
    },
    {
      title: 'Preferred Country',
      dataIndex: 'country',
      key: 'country',
      width: 150,
      render: (value: string) => {
        const flag = countryFlag(value)
        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            {flag ? <span className="text-base leading-none">{flag}</span> : null}
            <span>{emptyLeadValue(value)}</span>
          </span>
        )
      },
    },
    {
      title: 'Current Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value: string) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${stageBadgeClass(value || '')}`}>
          {emptyLeadValue(value)}
        </span>
      ),
    },
    {
      title: 'Lead Score',
      dataIndex: 'score',
      key: 'score',
      width: 110,
      render: (value: number) => <span className="font-semibold text-text">{Number.isFinite(value) ? value : '—'}</span>,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      sorter: true,
      sortOrder: sort === 'priority' ? (order === 'asc' ? 'ascend' : 'descend') : undefined,
      render: (value: string) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityBadgeClass(value)}`}>
          {emptyLeadValue(value)}
        </span>
      ),
    },
    {
      title: 'Next Follow-up',
      dataIndex: 'nextFollowUpAt',
      key: 'nextFollowUpAt',
      width: 150,
      render: (value: string | null) => {
        const next = formatLeadCreatedOn(value)
        return (
          <div className={`leading-tight ${followUpClass(value)}`}>
            <p className="m-0 text-[13px]">{next.date}</p>
            {next.time ? <p className="m-0 text-[11px] opacity-80">{next.time}</p> : null}
          </div>
        )
      },
    },
    {
      title: 'Last Activity',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      width: 180,
      ellipsis: true,
      render: (value: string, row) => {
        const at = formatLeadCreatedOn(row.lastActivityAt)
        return (
          <div className="min-w-0 leading-tight">
            <p className="m-0 truncate text-[13px] text-text">{emptyLeadValue(value)}</p>
            {row.lastActivityAt ? <p className="m-0 text-[11px] text-text-faint">{at.date}</p> : null}
          </div>
        )
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 88,
      align: 'center',
      fixed: 'right',
      render: (_value, row) => (
        <div
          className="flex justify-center"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <Tooltip title="Open Lead Details">
            <button
              type="button"
              aria-label="Open Lead Details"
              onClick={() => onView(row)}
              className="grid size-8 cursor-pointer place-items-center rounded-lg border border-[#d1d5db] text-[#6b7280] transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
            >
              <HugeiconsIcon icon={ViewIcon} size={16} color="currentColor" strokeWidth={1.7} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ]
}
