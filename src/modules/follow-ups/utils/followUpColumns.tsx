import type { ColumnsType } from 'antd/es/table'
import { Link } from 'react-router-dom'
import type { FollowUpRecord } from '../types'
import { followUpStatusClass } from './followUpStatus'

export const followUpColumns: ColumnsType<FollowUpRecord> = [
  {
    title: 'Contact',
    dataIndex: 'contact',
    key: 'contact',
    render: (_v, row) =>
      row.leadId ? (
        <Link to={`/leads/${row.leadId}`} className="text-primary hover:underline">
          {row.contact || '—'}
        </Link>
      ) : (
        row.contact || '—'
      ),
  },
  { title: 'Type', dataIndex: 'type', key: 'type', render: (v: string) => v || '—' },
  {
    title: 'Purpose',
    dataIndex: 'purpose',
    key: 'purpose',
    render: (v: string | null) => v || '—',
  },
  { title: 'Owner', dataIndex: 'owner', key: 'owner', render: (v: string) => v || '—' },
  { title: 'Due', dataIndex: 'due', key: 'due', render: (v: string) => v || '—' },
  { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (v: string) => v || '—' },
  {
    title: 'Next Action',
    dataIndex: 'nextAction',
    key: 'nextAction',
    ellipsis: true,
    render: (v: string | null) => v || '—',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (v: string) => <span className={followUpStatusClass(v || '')}>{v || '—'}</span>,
  },
]
