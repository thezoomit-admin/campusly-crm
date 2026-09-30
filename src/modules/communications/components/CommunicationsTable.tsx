import { Button } from 'antd'
import { FormInput, FormSelect } from '@/components/common/Forms'
import { DataTable } from '@/components/common/Tables'
import type { CommunicationEvent } from '../types'
import { communicationColumns } from '../utils/communicationColumns'

type Props = {
  data: CommunicationEvent[]
  loading?: boolean
  page: number
  limit: number
  total: number
  canReprocess?: boolean
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onReprocess?: (row: CommunicationEvent) => void
  onOpen?: (row: CommunicationEvent) => void
}

export default function CommunicationsTable({
  data,
  loading,
  page,
  limit,
  total,
  canReprocess,
  onPageChange,
  onLimitChange,
  onReprocess,
  onOpen,
}: Props) {
  const columns = [
    ...communicationColumns,
    ...(canReprocess
      ? [
          {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_: unknown, row: CommunicationEvent) => {
              if (row.processingStatus !== 'FAILED' && row.processingStatus !== 'PENDING') {
                return '—'
              }
              return (
                <Button type="link" size="small" className="!px-1" onClick={() => onReprocess?.(row)}>
                  Reprocess
                </Button>
              )
            },
          },
        ]
      : []),
  ]

  return (
    <DataTable
      loading={loading}
      data={data}
      columns={columns}
      rowKey="id"
      isPaginate
      currentPage={page}
      setCurrentPage={onPageChange}
      limit={limit}
      setLimit={onLimitChange}
      total={total}
      showSizeChanger={total > 10}
      onRow={(record) => ({
        onClick: () => onOpen?.(record as unknown as CommunicationEvent),
        style: { cursor: 'pointer' },
      })}
    />
  )
}

export function CommunicationFilters({
  search,
  channel,
  status,
  onSearchChange,
  onChannelChange,
  onStatusChange,
}: {
  search: string
  channel?: string
  status?: string
  onSearchChange: (value: string) => void
  onChannelChange: (value?: string) => void
  onStatusChange: (value?: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FormInput.Search
        allowClear
        placeholder="Search sender, lead, campaign…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="min-w-[220px] max-w-sm flex-1"
      />
      <FormSelect
        allowClear
        placeholder="Channel"
        className="min-w-[160px]"
        value={channel || undefined}
        onChange={(value) => onChannelChange(value || undefined)}
        options={[
          { value: 'WEBSITE', label: 'Website' },
          { value: 'WHATSAPP', label: 'WhatsApp' },
          { value: 'EMAIL', label: 'Email' },
          { value: 'META_FACEBOOK', label: 'Facebook' },
          { value: 'META_INSTAGRAM', label: 'Instagram' },
        ]}
      />
      <FormSelect
        allowClear
        placeholder="Status"
        className="min-w-[140px]"
        value={status || undefined}
        onChange={(value) => onStatusChange(value || undefined)}
        options={[
          { value: 'PENDING', label: 'Pending' },
          { value: 'PROCESSING', label: 'Processing' },
          { value: 'PROCESSED', label: 'Processed' },
          { value: 'DUPLICATE', label: 'Duplicate' },
          { value: 'FAILED', label: 'Failed' },
        ]}
      />
    </div>
  )
}
