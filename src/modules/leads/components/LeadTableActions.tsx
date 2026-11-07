import { Dropdown, Tooltip, type MenuProps } from 'antd'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Calendar03Icon,
  CalendarAdd01Icon,
  CancelCircleIcon,
  MoreVerticalIcon,
  Mortarboard01Icon,
  Note01Icon,
  PencilEdit02Icon,
  RefreshIcon,
  StarIcon,
  UserSwitchIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import type { LeadRow } from '../types'

type LeadTableActionsProps = {
  row: LeadRow
  canEdit?: boolean
  canClose?: boolean
  canReopen?: boolean
  canReassign?: boolean
  canOverridePriority?: boolean
  canConvert?: boolean
  onView: (row: LeadRow) => void
  onEdit: (row: LeadRow) => void
  onCloseLead?: (row: LeadRow) => void
  onReopen?: (row: LeadRow) => void
  onAddNote?: (row: LeadRow) => void
  onAddFollowUp?: (row: LeadRow) => void
  onAddMeeting?: (row: LeadRow) => void
  onReassign?: (row: LeadRow) => void
  onChangePriority?: (row: LeadRow) => void
  onConvert?: (row: LeadRow) => void
}

const iconButtonClass =
  'grid size-8 cursor-pointer place-items-center rounded-lg border border-[#d1d5db] text-[#6b7280] transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary'

function MenuLabel({
  icon,
  label,
  danger,
}: {
  icon: typeof ViewIcon
  label: string
  danger?: boolean
}) {
  return (
    <span
      className={`inline-flex w-full items-center gap-2 ${danger ? 'text-[#e11d48]' : ''}`}
    >
      <HugeiconsIcon icon={icon} size={14} color="currentColor" />
      <span className="flex-1">{label}</span>
    </span>
  )
}

export default function LeadTableActions({
  row,
  canEdit,
  canClose,
  canReopen,
  canReassign,
  canOverridePriority,
  canConvert,
  onView,
  onEdit,
  onCloseLead,
  onReopen,
  onAddNote,
  onAddFollowUp,
  onAddMeeting,
  onReassign,
  onChangePriority,
  onConvert,
}: LeadTableActionsProps) {
  const menuItems: MenuProps['items'] = [
    onAddMeeting
      ? {
          key: 'meeting',
          label: <MenuLabel icon={Calendar03Icon} label="Add meeting" />,
          onClick: () => onAddMeeting(row),
        }
      : null,
    { type: 'divider' },
    {
      key: 'view',
      label: <MenuLabel icon={ViewIcon} label="View details" />,
      onClick: () => onView(row),
    },
    canEdit
      ? {
          key: 'edit',
          label: <MenuLabel icon={PencilEdit02Icon} label="Edit lead" />,
          onClick: () => onEdit(row),
        }
      : null,
    { type: 'divider' },
    canReassign && onReassign
      ? {
          key: 'reassign',
          label: <MenuLabel icon={UserSwitchIcon} label="Reassign" />,
          onClick: () => onReassign(row),
        }
      : null,
    canOverridePriority && onChangePriority
      ? {
          key: 'priority',
          label: <MenuLabel icon={StarIcon} label="Change priority" />,
          onClick: () => onChangePriority(row),
        }
      : null,
    canConvert && onConvert
      ? {
          key: 'convert',
          label: <MenuLabel icon={Mortarboard01Icon} label="Convert to student" />,
          onClick: () => onConvert(row),
        }
      : null,
    { type: 'divider' },
    canClose && onCloseLead
      ? {
          key: 'lost',
          danger: true,
          label: (
            <MenuLabel icon={CancelCircleIcon} label="Mark as lost" danger />
          ),
          onClick: () => onCloseLead(row),
        }
      : null,
    canReopen && onReopen
      ? {
          key: 'reopen',
          label: <MenuLabel icon={RefreshIcon} label="Reopen lead" />,
          onClick: () => onReopen(row),
        }
      : null,
  ]

  return (
    <div
      className="flex items-center justify-end gap-1.5"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {onAddNote ? (
        <Tooltip title="Add note">
          <button
            type="button"
            aria-label={`Add note for ${row.name}`}
            onClick={() => onAddNote(row)}
            className={iconButtonClass}
          >
            <HugeiconsIcon icon={Note01Icon} size={15} color="currentColor" strokeWidth={1.7} />
          </button>
        </Tooltip>
      ) : null}
      {onAddFollowUp ? (
        <Tooltip title="Add follow up">
          <button
            type="button"
            aria-label={`Add follow up for ${row.name}`}
            onClick={() => onAddFollowUp(row)}
            className={iconButtonClass}
          >
            <HugeiconsIcon
              icon={CalendarAdd01Icon}
              size={15}
              color="currentColor"
              strokeWidth={1.7}
            />
          </button>
        </Tooltip>
      ) : null}
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
        <Tooltip title="More actions">
          <button
            type="button"
            aria-label={`Actions for ${row.name}`}
            className={iconButtonClass}
          >
            <HugeiconsIcon icon={MoreVerticalIcon} size={15} color="currentColor" strokeWidth={1.7} />
          </button>
        </Tooltip>
      </Dropdown>
    </div>
  )
}
