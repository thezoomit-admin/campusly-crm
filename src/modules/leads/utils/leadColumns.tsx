import type { ColumnsType } from 'antd/es/table'
import type { LeadRow } from '../types'
import LeadTableActions from '../components/LeadTableActions'
import { leadInitials, priorityBadgeClass, stageBadgeClass } from './leadDetails'
import { countryFlag, emptyLeadValue, formatLeadCreatedOn, leadAvatarTone, leadDisplaySubtitle } from './leadList'

type LeadColumnOptions = {
  canEdit?: boolean
  showStatus?: boolean
  onView: (row: LeadRow) => void
  onEdit: (row: LeadRow) => void
}

export function getLeadColumns({ canEdit, showStatus = true, onView, onEdit }: LeadColumnOptions): ColumnsType<LeadRow> {
  const columns: ColumnsType<LeadRow> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      render: (_value, row) => {
        const subtitle = leadDisplaySubtitle(row)
        return (
          <div className="group flex min-w-0 items-center gap-2.5">
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-bold ${leadAvatarTone(row.name)}`}
            >
              {leadInitials(row.name)}
            </span>
            <div className="min-w-0">
              <p className="m-0 truncate text-[13px] font-semibold text-[#0f9d8e] group-hover:underline">{row.name || '—'}</p>
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
      render: (value: string) => <span className="whitespace-nowrap">{emptyLeadValue(value)}</span>,
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
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${stageBadgeClass(value || '')}`}>
          {emptyLeadValue(value)}
        </span>
      ),
    })
  }

  columns.push(
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (value: string) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityBadgeClass(value)}`}>
          {emptyLeadValue(value)}
        </span>
      ),
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
      width: 118,
      align: 'right',
      fixed: 'right',
      render: (_value, row) => (
        <LeadTableActions row={row} canEdit={canEdit} onView={onView} onEdit={onEdit} />
      ),
    },
  )

  return columns
}
