import type { ColumnsType } from 'antd/es/table'
import type { LeadRow } from '../types'
import LeadPhoneCell from '../components/LeadPhoneCell'
import LeadTableActions from '../components/LeadTableActions'
import { leadInitials, stageBadgeClass } from './leadDetails'
import { countryFlag, emptyLeadValue, formatLeadCreatedOn, leadAvatarTone, leadDisplaySubtitle } from './leadList'

type LeadColumnOptions = {
  canEdit?: boolean
  canChangeStatus?: boolean
  canClose?: boolean
  canReopen?: boolean
  showStatus?: boolean
  onView: (row: LeadRow) => void
  onEdit: (row: LeadRow) => void
  onChangeStatus?: (row: LeadRow) => void
  onCloseLead?: (row: LeadRow) => void
  onReopen?: (row: LeadRow) => void
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

export function getLeadColumns({
  canEdit,
  canChangeStatus,
  canClose,
  canReopen,
  showStatus = true,
  onView,
  onEdit,
  onChangeStatus,
  onCloseLead,
  onReopen,
}: LeadColumnOptions): ColumnsType<LeadRow> {
  const columns: ColumnsType<LeadRow> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      render: (_value, row) => {
        const subtitle = leadDisplaySubtitle(row)
        return (
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-bold ${leadAvatarTone(row.name)}`}
            >
              {leadInitials(row.name)}
            </span>
            <div className="min-w-0">
              <p className="m-0 truncate text-[13px] font-semibold text-[#0f9d8e]">{row.name || '—'}</p>
              {subtitle ? <p className="m-0 truncate text-[11px] text-text-faint">{subtitle}</p> : null}
            </div>
          </div>
        )
      },
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (value: string, row) => (
        <LeadPhoneCell phone={value} isDuplicate={row.isDuplicate} hasPhoneDuplicate={row.hasPhoneDuplicate} />
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 190,
      ellipsis: true,
      render: (value: string) => emptyLeadValue(value),
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      width: 130,
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
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 110,
      render: (value: string) => emptyLeadValue(value),
    },
  ]

  if (showStatus) {
    columns.push({
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: string) => (
        <span className={`inline-flex rounded-md border border-current/40 px-2.5 py-1 text-[11px] font-semibold ${stageBadgeClass(value || '')}`}>
          {emptyLeadValue(value)}
        </span>
      ),
    })
  }

  columns.push(
    {
      title: 'Follow-up',
      dataIndex: 'nextFollowUpAt',
      key: 'nextFollowUpAt',
      width: 140,
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
      title: 'Assigned To',
      dataIndex: 'owner',
      key: 'owner',
      width: 140,
      ellipsis: true,
      render: (value: string) => emptyLeadValue(value),
    },
    {
      title: 'Created On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (value: string) => {
        const created = formatLeadCreatedOn(value)
        return (
          <div className="leading-tight">
            <p className="m-0 text-[13px] text-text">{created.date}</p>
            {created.time ? <p className="m-0 text-[11px] text-text-faint">{created.time}</p> : null}
          </div>
        )
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 72,
      align: 'right',
      fixed: 'right',
      render: (_value, row) => (
        <LeadTableActions
          row={row}
          canEdit={canEdit}
          canChangeStatus={canChangeStatus}
          canClose={canClose}
          canReopen={canReopen}
          onView={onView}
          onEdit={onEdit}
          onChangeStatus={onChangeStatus}
          onCloseLead={onCloseLead}
          onReopen={onReopen}
        />
      ),
    },
  )

  return columns
}
