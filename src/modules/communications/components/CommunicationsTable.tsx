import { Tooltip } from 'antd'
import { HugeiconsIcon } from '@hugeicons/react'
import { RefreshIcon } from '@hugeicons/core-free-icons'
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
            width: 88,
            align: 'center' as const,
            render: (_: unknown, row: CommunicationEvent) => {
              if (row.processingStatus !== 'FAILED' && row.processingStatus !== 'PENDING') {
                return '—'
              }
              return (
                <div
                  className="flex justify-center"
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <Tooltip title="Reprocess">
                    <button
                      type="button"
                      aria-label={`Reprocess ${row.senderName || row.senderEmail || 'communication'}`}
                      onClick={() => onReprocess?.(row)}
                      className="grid size-8 cursor-pointer place-items-center rounded-lg border border-[#d1d5db] text-primary transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      <HugeiconsIcon icon={RefreshIcon} size={15} color="currentColor" strokeWidth={1.7} />
                    </button>
                  </Tooltip>
                </div>
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
    <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.9fr)] items-center gap-2">
      <FormInput.Search
        allowClear
        placeholder="Search sender, lead, campaign…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="min-w-0 !w-full"
      />
      <FormSelect
        allowClear
        placeholder="Channel"
        className="min-w-0 !w-full"
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
        className="min-w-0 !w-full"
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
