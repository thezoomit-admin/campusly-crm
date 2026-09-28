import { Dropdown, type MenuProps, Tooltip } from 'antd'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Call02Icon,
  Mail01Icon,
  MoreVerticalIcon,
  PencilEdit02Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import type { LeadRow } from '../types'

type LeadTableActionsProps = {
  row: LeadRow
  canEdit?: boolean
  onView: (row: LeadRow) => void
  onEdit: (row: LeadRow) => void
}

export default function LeadTableActions({ row, canEdit, onView, onEdit }: LeadTableActionsProps) {
  const menuItems: MenuProps['items'] = [
    {
      key: 'view',
      label: 'View details',
      onClick: () => onView(row),
    },
    canEdit
      ? {
          key: 'edit',
          label: 'Edit lead',
          onClick: () => onEdit(row),
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
      className="flex items-center justify-end gap-1.5"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <Tooltip title="View">
        <button
          type="button"
          aria-label={`View ${row.name}`}
          onClick={() => onView(row)}
          className="grid size-8 place-items-center rounded-lg border border-[#d1d5db] text-[#6b7280] transition-colors hover:border-primary hover:text-primary"
        >
          <HugeiconsIcon icon={ViewIcon} size={15} color="currentColor" strokeWidth={1.7} />
        </button>
      </Tooltip>
      {canEdit ? (
        <Tooltip title="Edit">
          <button
            type="button"
            aria-label={`Edit ${row.name}`}
            onClick={() => onEdit(row)}
            className="grid size-8 place-items-center rounded-lg border border-[#d1d5db] text-[#6b7280] transition-colors hover:border-primary hover:text-primary"
          >
            <HugeiconsIcon icon={PencilEdit02Icon} size={15} color="currentColor" strokeWidth={1.7} />
          </button>
        </Tooltip>
      ) : null}
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
        <button
          type="button"
          aria-label={`More actions for ${row.name}`}
          className="grid size-8 place-items-center rounded-lg border border-[#d1d5db] text-[#6b7280] transition-colors hover:border-primary hover:text-primary"
        >
          <HugeiconsIcon icon={MoreVerticalIcon} size={15} color="currentColor" strokeWidth={1.7} />
        </button>
      </Dropdown>
    </div>
  )
}
