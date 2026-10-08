import { Link } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type { DocumentRow } from '../types'
import { documentStatusClass } from './documentStatus'

export const documentColumns: ColumnsType<DocumentRow> = [
  {
    title: 'Lead',
    dataIndex: 'owner',
    key: 'owner',
    render: (v: string, row) =>
      row.leadId ? (
        <Link to={`/leads/${row.leadId}?tab=${row.vault === 'file' ? 'file-documents' : 'attachments'}`} className="text-primary no-underline hover:underline">
          {v || '—'}
        </Link>
      ) : (
        v || '—'
      ),
  },
  { title: 'Document', dataIndex: 'type', key: 'type', render: (v: string) => v || '—' },
  { title: 'Category', dataIndex: 'category', key: 'category', render: (v: string) => v || '—' },
  { title: 'Uploaded by', dataIndex: 'uploadedBy', key: 'uploadedBy', render: (v: string) => v || '—' },
  { title: 'Verified by', dataIndex: 'verifiedBy', key: 'verifiedBy', render: (v: string) => v || '—' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (v: string) => <span className={documentStatusClass(v || '')}>{v || '—'}</span>,
  },
  { title: 'Updated', dataIndex: 'updated', key: 'updated', render: (v: string) => v || '—' },
]
