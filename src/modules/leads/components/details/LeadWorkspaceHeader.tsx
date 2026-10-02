import { Link } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Analytics01Icon,
  ArrowLeft01Icon,
  Call02Icon,
  CheckmarkCircle02Icon,
  Flag01Icon,
  Home01Icon,
  Location01Icon,
  Mail01Icon,
  PencilEdit02Icon,
} from '@hugeicons/core-free-icons'
import { PrimaryButton } from '@/components/ui'
import type { LeadRecord } from '../../types'
import { leadInitials, priorityBadgeClass, stageBadgeClass } from '../../utils/leadDetails'

export default function LeadWorkspaceHeader({
  lead,
  canEdit,
  canAddActivity,
  canChangeStatus,
  canClose,
  canReopen,
  canHandover,
  onEdit,
  onAddActivity,
  onChangeStatus,
  onCloseLead,
  onReopenLead,
  onHandover,
}: {
  lead: LeadRecord
  canEdit: boolean
  canAddActivity: boolean
  canChangeStatus: boolean
  canClose?: boolean
  canReopen?: boolean
  canHandover?: boolean
  onEdit: () => void
  onAddActivity: () => void
  onChangeStatus: () => void
  onCloseLead?: () => void
  onReopenLead?: () => void
  onHandover?: () => void
}) {
  return (
    <section className="rounded-2xl border border-[#e7eef5] bg-surface px-4 py-4 shadow-[0_10px_28px_rgba(22,50,79,0.035)] md:px-5 dark:border-border">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Link
            to="/leads"
            className="mt-1 grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-[#7d8b9a] no-underline hover:bg-hover-bg hover:text-text"
            aria-label="Back to leads"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color="currentColor" strokeWidth={1.8} />
          </Link>

          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#e7f8ef] text-[1.05rem] font-bold tracking-wide text-primary ring-4 ring-[#f3fbf6] dark:bg-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] dark:ring-transparent">
            {leadInitials(lead.name)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="m-0 text-[1.35rem] font-semibold tracking-tight text-[#17324f] dark:text-text-strong">
                {lead.name}
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.72rem] font-semibold ${stageBadgeClass(lead.status)}`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {lead.status}
              </span>
            </div>
            <p className="mt-0.5 mb-2 text-[0.82rem] text-[#8b97a8]">Lead ID: {lead.code}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.82rem] text-[#5b6b7c]">
              {lead.phone ? (
                <span className="inline-flex items-center gap-1.5">
                  <HugeiconsIcon icon={Call02Icon} size={14} color="currentColor" strokeWidth={1.7} />
                  {lead.phone}
                </span>
              ) : null}
              {lead.email ? (
                <span className="inline-flex items-center gap-1.5">
                  <HugeiconsIcon icon={Mail01Icon} size={14} color="currentColor" strokeWidth={1.7} />
                  {lead.email}
                </span>
              ) : null}
              {lead.currentLocation || lead.country ? (
                <span className="inline-flex items-center gap-1.5">
                  <HugeiconsIcon icon={Location01Icon} size={14} color="currentColor" strokeWidth={1.7} />
                  {lead.currentLocation || lead.country}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-stretch gap-4 sm:gap-6 xl:pl-2">
          <HeaderStat
            icon={Home01Icon}
            label="Owner"
            value={lead.owner?.name || 'Unassigned'}
          />
          <HeaderStat icon={Analytics01Icon} label="Score" value={String(lead.leadScore ?? 0)} />
          <div className="min-w-[88px]">
            <p className="mb-1 flex items-center gap-1.5 text-[0.75rem] text-[#8b97a8]">
              <HugeiconsIcon icon={Flag01Icon} size={14} color="currentColor" strokeWidth={1.7} />
              Priority
            </p>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[0.75rem] font-semibold ${priorityBadgeClass(lead.priority)}`}
            >
              {lead.priority || 'None'}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 xl:flex-col xl:items-end">
          {canHandover ? (
            <PrimaryButton type="button" size="sm" onClick={onHandover} label="Hand over" />
          ) : null}
          {canReopen ? (
            <PrimaryButton type="button" size="sm" onClick={onReopenLead} label="Reopen Lead" />
          ) : null}
          {canChangeStatus ? (
            <PrimaryButton
              type="button"
              size="sm"
              variant={canReopen ? 'outline' : 'primary'}
              icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />}
              onClick={onChangeStatus} label="Change Status" />
          ) : null}
          {canClose ? (
            <PrimaryButton type="button" size="sm" variant="outline" onClick={onCloseLead} label="Close Lead" />
          ) : null}
          {canEdit ? (
            <PrimaryButton
              type="button"
              size="sm"
              variant={canChangeStatus || canReopen || canClose ? 'outline' : 'primary'}
              icon={<HugeiconsIcon icon={PencilEdit02Icon} size={15} />}
              onClick={onEdit} label="Edit" />
          ) : null}
          {canAddActivity ? (
            <PrimaryButton
              type="button"
              variant="outline"
              size="sm"
              icon={<HugeiconsIcon icon={Add01Icon} size={15} />}
              onClick={onAddActivity} label="Add Activity" />
          ) : null}
        </div>
      </div>
    </section>
  )
}

function HeaderStat({
  icon,
  label,
  value,
}: {
  icon: typeof Home01Icon
  label: string
  value: string
}) {
  return (
    <div className="min-w-[88px] border-r border-[#edf2f7] pr-4 last:border-r-0 last:pr-0 dark:border-border-subtle">
      <p className="mb-1 flex items-center gap-1.5 text-[0.75rem] text-[#8b97a8]">
        <HugeiconsIcon icon={icon} size={14} color="currentColor" strokeWidth={1.7} />
        {label}
      </p>
      <p className="m-0 text-[0.92rem] font-semibold text-[#17324f] dark:text-text-strong">{value}</p>
    </div>
  )
}
