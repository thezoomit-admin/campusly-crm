import type { ColumnsType } from 'antd/es/table'
import { PrimaryButton } from '@/components/ui'
import type { LeadPoolRow } from '../types'
import { countryFlag, emptyLeadValue, formatLeadCreatedOn, leadAvatarTone } from './leadList'
import { leadInitials } from './leadDetails'
import { formatWaitingTime } from './waitingTime'

type LeadPoolColumnOptions = {
  now: number
  onView: (row: LeadPoolRow) => void
  onAssign: (row: LeadPoolRow) => void
}

export function getLeadPoolColumns({ now, onView, onAssign }: LeadPoolColumnOptions): ColumnsType<LeadPoolRow> {
  return [
    {
      title: 'Lead ID',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (value: string, row) => (
        <PrimaryButton
          type="button"
          className="cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-[#0f9d8e] hover:underline"
          onClick={(event) => {
            event.stopPropagation()
            onView(row)
          }}
        >
          {emptyLeadValue(value)}
        </PrimaryButton>
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
      render: (value: string) => <span className="whitespace-nowrap">{emptyLeadValue(value)}</span>,
    },
    {
      title: 'Preferred Country',
      dataIndex: 'country',
      key: 'country',
      width: 160,
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
      title: 'Lead Source',
      dataIndex: 'source',
      key: 'source',
      width: 130,
      render: (value: string) => emptyLeadValue(value),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
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
      title: 'Waiting Time',
      dataIndex: 'waitingTime',
      key: 'waitingTime',
      width: 130,
      render: (_value, row) => (
        <span className="whitespace-nowrap font-medium text-[#b45309]">{formatWaitingTime(row.createdAt, now)}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      align: 'right',
      fixed: 'right',
      render: (_value, row) => (
        <div
          className="flex justify-end"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <PrimaryButton type="button" size="sm" onClick={() => onAssign(row)}>
            Assign Lead
          </PrimaryButton>
        </div>
      ),
    },
  ]
}
