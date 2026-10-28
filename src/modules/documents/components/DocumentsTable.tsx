import { Empty } from 'antd'
import { DataTable, type DataTableActionItem } from '@/components/common/Tables'
import { PrimaryButton } from '@/components/ui'
import type { DocumentRow } from '../types'
import {
  buildDocumentColumns,
  type DocumentColumnKey,
} from '../utils/documentColumns'
import { groupDocumentsByLead } from '../utils/documentDisplay'
import { documentStatusClass } from '../utils/documentStatus'
import { displayStatusLabel } from '../utils/documentDisplay'

type DocumentsTableProps = {
  data: DocumentRow[]
  vault: 'file' | 'lead'
  loading?: boolean
  page: number
  limit: number
  total: number
  grouped: boolean
  visibleColumns: DocumentColumnKey[]
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  selectRow?: boolean
  clearSelectionTrigger?: unknown
  onSelectRowsChange?: (rows: DocumentRow[]) => void
  actions?: (record: DocumentRow) => DataTableActionItem[]
  onRowClick?: (row: DocumentRow) => void
  onOpenOwner?: (row: DocumentRow) => void
}

export default function DocumentsTable({
  data,
  vault,
  loading,
  page,
  limit,
  total,
  grouped,
  visibleColumns,
  onPageChange,
  onLimitChange,
  selectRow = false,
  clearSelectionTrigger,
  onSelectRowsChange,
  actions,
  onRowClick,
  onOpenOwner,
}: DocumentsTableProps) {
  if (!loading && data.length === 0) {
    return (
      <div>
        <div className="rounded-xl border border-dashed border-border px-4 py-12">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="grid gap-1">
                <span className="font-medium text-text-strong">No documents in this queue</span>
                <span className="text-sm text-text-muted">
                  Try another KPI filter, clear search, or open a converted lead to start file documents.
                </span>
              </div>
            }
          />
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 text-sm text-text-muted">
          <span>Rows per page</span>
          <select
            className="rounded-lg border border-border bg-surface px-2 py-1"
            value={limit}
            onChange={(event) => {
              onLimitChange(Number(event.target.value))
              onPageChange(1)
            }}
          >
            {[10, 20, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    )
  }

  if (grouped) {
    const groups = groupDocumentsByLead(data)
    return (
      <div>
        <div className="grid gap-3">
          {groups.map((group) => (
            <details
              key={group.key}
              open={group.actionNeeded > 0}
              className="overflow-hidden rounded-xl border border-border bg-surface"
            >
              <summary className="cursor-pointer list-none px-3 py-2.5 marker:content-none">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="m-0 truncate text-sm font-semibold text-text-strong">{group.owner}</p>
                    <p className="m-0 text-[12px] text-text-muted">
                      {group.documents.length} document{group.documents.length === 1 ? '' : 's'}
                      {group.actionNeeded
                        ? ` · ${group.actionNeeded} need action`
                        : ' · all clear'}
                    </p>
                  </div>
                  {group.actionNeeded > 0 ? (
                    <span className={documentStatusClass('Missing')}>{group.actionNeeded} action</span>
                  ) : (
                    <span className={documentStatusClass('Verified')}>Complete</span>
                  )}
                </div>
              </summary>
              <div className="border-t border-border-subtle">
                <DataTable
                  loading={loading}
                  data={group.documents}
                  columns={buildDocumentColumns({
                    vault,
                    visible: visibleColumns.filter((key) => key !== 'owner'),
                    grouped: true,
                    onOpenOwner,
                  })}
                  rowKey="id"
                  isPaginate={false}
                  showRowNumber={false}
                  selectRow={selectRow}
                  clearSelectionTrigger={clearSelectionTrigger}
                  onSelectRowsChange={
                    onSelectRowsChange
                      ? (rows) => onSelectRowsChange(rows as DocumentRow[])
                      : undefined
                  }
                  actions={
                    actions
                      ? (record) => actions(record as unknown as DocumentRow)
                      : undefined
                  }
                  onRow={(record) => ({
                    onClick: () => onRowClick?.(record as unknown as DocumentRow),
                    style: { cursor: 'pointer' },
                  })}
                  scrollX={900}
                />
              </div>
            </details>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3 text-sm">
          <span className="text-text-muted">
            Page {page} · {total} total
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-text-muted">Rows per page</span>
            <select
              className="rounded-lg border border-border bg-surface px-2 py-1"
              value={limit}
              onChange={(event) => {
                onLimitChange(Number(event.target.value))
                onPageChange(1)
              }}
            >
              {[10, 20, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <PrimaryButton
              type="button"
              size="sm"
              variant="outline"
              label="Prev"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            />
            <PrimaryButton
              type="button"
              size="sm"
              variant="outline"
              label="Next"
              disabled={page * limit >= total}
              onClick={() => onPageChange(page + 1)}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <DataTable
        loading={loading}
        data={data}
        columns={buildDocumentColumns({
          vault,
          visible: visibleColumns,
          onOpenOwner,
        })}
        rowKey="id"
        isPaginate
        currentPage={page}
        setCurrentPage={onPageChange}
        limit={limit}
        setLimit={onLimitChange}
        total={total}
        showSizeChanger
        alwaysShowPagination
        selectRow={selectRow}
        clearSelectionTrigger={clearSelectionTrigger}
        onSelectRowsChange={
          onSelectRowsChange
            ? (rows) => onSelectRowsChange(rows as DocumentRow[])
            : undefined
        }
        actions={
          actions
            ? (record) => actions(record as unknown as DocumentRow)
            : undefined
        }
        onRow={(record) => ({
          onClick: () => onRowClick?.(record as unknown as DocumentRow),
          style: { cursor: 'pointer' },
          title: displayStatusLabel(record as unknown as DocumentRow),
        })}
        scrollX={Math.max(720, visibleColumns.length * 130)}
      />
    </div>
  )
}
