import type { ColumnsType } from 'antd/es/table'
import { Link } from 'react-router-dom'
import { statusClass } from '@/lib/statusClass'
import type { CommunicationEvent } from '../types'
import { CHANNEL_LABELS, STATUS_LABELS } from '../types'

function formatWhen(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const communicationColumns: ColumnsType<CommunicationEvent> = [
  {
    title: 'Received',
    dataIndex: 'eventAt',
    key: 'eventAt',
    width: 160,
    render: (v: string) => formatWhen(v),
  },
  {
    title: 'Channel',
    dataIndex: 'channel',
    key: 'channel',
    render: (v: CommunicationEvent['channel']) => CHANNEL_LABELS[v] || v,
  },
  {
    title: 'Sender',
    key: 'sender',
    render: (_v, row) => (
      <div className="grid gap-0.5">
        <span className="font-medium text-text-strong">{row.senderName || '—'}</span>
        <span className="text-[0.78rem] text-text-muted">{row.senderPhone || row.senderEmail || '—'}</span>
      </div>
    ),
  },
  {
    title: 'Campaign',
    dataIndex: 'campaignName',
    key: 'campaignName',
    render: (v: string | null, row) => row.campaign?.name || v || '—',
  },
  {
    title: 'Lead',
    key: 'lead',
    render: (_v, row) =>
      row.lead ? (
        <Link to={`/leads/${row.lead.id}`} className="text-primary hover:underline">
          {row.lead.code} — {row.lead.name}
        </Link>
      ) : (
        '—'
      ),
  },
  {
    title: 'Status',
    dataIndex: 'processingStatus',
    key: 'processingStatus',
    render: (v: CommunicationEvent['processingStatus']) => (
      <span className={statusClass(STATUS_LABELS[v] || v)}>{STATUS_LABELS[v] || v}</span>
    ),
  },
]
