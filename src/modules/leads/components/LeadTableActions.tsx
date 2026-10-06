import { Dropdown, type MenuProps } from 'antd'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDataTransferHorizontalIcon,
  Call02Icon,
  Cancel01Icon,
  Mail01Icon,
  MoreVerticalIcon,
  PencilEdit02Icon,
  RefreshIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import type { LeadRow } from '../types'

type LeadTableActionsProps = {
  row: LeadRow
  canEdit?: boolean
  canChangeStatus?: boolean
  canClose?: boolean
  canReopen?: boolean
  onView: (row: LeadRow) => void
  onEdit: (row: LeadRow) => void
  onChangeStatus?: (row: LeadRow) => void
  onCloseLead?: (row: LeadRow) => void
  onReopen?: (row: LeadRow) => void
}

export default function LeadTableActions({
  row,
  canEdit,
  canChangeStatus,
  canClose,
  canReopen,
  onView,
  onEdit,
  onChangeStatus,
  onCloseLead,
  onReopen,
}: LeadTableActionsProps) {
  const menuItems: MenuProps['items'] = [
    {
      key: 'view',
      label: (
        <span className="inline-flex items-center gap-2">
          <HugeiconsIcon icon={ViewIcon} size={14} />
          View details
        </span>
      ),
      onClick: () => onView(row),
    },
    canEdit
      ? {
          key: 'edit',
          label: (
            <span className="inline-flex items-center gap-2">
              <HugeiconsIcon icon={PencilEdit02Icon} size={14} />
              Edit lead
            </span>
          ),
          onClick: () => onEdit(row),
        }
      : null,
    canChangeStatus && onChangeStatus
      ? {
          key: 'change-status',
          label: (
            <span className="inline-flex items-center gap-2">
              <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} size={14} />
              Change status
            </span>
          ),
          onClick: () => onChangeStatus(row),
        }
      : null,
    canClose && onCloseLead
      ? {
          key: 'close',
          label: (
            <span className="inline-flex items-center gap-2">
              <HugeiconsIcon icon={Cancel01Icon} size={14} />
              Close
            </span>
          ),
          onClick: () => onCloseLead(row),
        }
      : null,
    canReopen && onReopen
      ? {
          key: 'reopen',
          label: (
            <span className="inline-flex items-center gap-2">
              <HugeiconsIcon icon={RefreshIcon} size={14} />
              Reopen lead
            </span>
          ),
          onClick: () => onReopen(row),
        }
      : null,
    { type: 'divider' },
    {
      key: 'call',
      label: (
        <span className="inline-flex items-center gap-2">
          <HugeiconsIcon icon={Call02Icon} size={14} />
          Call
        </span>
      ),
      disabled: !row.phone || row.phone === '—',
      onClick: () => {
        if (row.phone && row.phone !== '—') window.open(`tel:${row.phone}`)
      },
    },
    {
      key: 'email',
      label: (
        <span className="inline-flex items-center gap-2">
          <HugeiconsIcon icon={Mail01Icon} size={14} />
          Email
        </span>
      ),
      disabled: !row.email || row.email === '—',
      onClick: () => {
        if (row.email && row.email !== '—') window.open(`mailto:${row.email}`)
      },
    },
  ]

  return (
    <div
      className="flex items-center justify-end"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
        <button
          type="button"
          aria-label={`Actions for ${row.name}`}
          className="grid size-8 cursor-pointer place-items-center rounded-lg border border-[#d1d5db] text-[#6b7280] transition-colors hover:border-primary hover:text-primary"
        >
          <HugeiconsIcon icon={MoreVerticalIcon} size={15} color="currentColor" strokeWidth={1.7} />
        </button>
      </Dropdown>
    </div>
  )
}
