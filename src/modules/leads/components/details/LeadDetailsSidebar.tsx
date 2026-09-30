import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Globe02Icon,
  MailSend01Icon,
  Note01Icon,
  Notification01Icon,
  UserIcon,
  UserSwitchIcon,
} from '@hugeicons/core-free-icons'
import type { ActivityFeedItem } from '@/types'
import type { LeadAssignmentHistoryItem, LeadRecord, LeadStatusHistoryItem } from '../../types'
import {
  activityTitle,
  completionRows,
  formatDisplayDateTime,
  formatFollowUpDue,
  stageBadgeClass,
} from '../../utils/leadDetails'

export default function LeadDetailsSidebar({
  lead,
  activities,
  statusHistory,
  assignmentHistory,
  canFollowUp,
  canEditFollowUp,
  canChangeStatus,
  canClose,
  canReopen,
  canChangeOwner,
  onViewCompletion,
  onViewActivities,
  onSetReminder,
  onAddNote,
  onScheduleFollowUp,
  onSendEmail,
  onChangeOwner,
  onChangeStatus,
  onCloseLead,
  onReopenLead,
  onCompleteNextFollowUp,
}: {
  lead: LeadRecord
  activities: ActivityFeedItem[]
  statusHistory: LeadStatusHistoryItem[]
  assignmentHistory: LeadAssignmentHistoryItem[]
  canFollowUp: boolean
  canEditFollowUp?: boolean
  canChangeStatus: boolean
  canClose?: boolean
  canReopen?: boolean
  canChangeOwner: boolean
  onViewCompletion: () => void
  onViewActivities: () => void
  onSetReminder: () => void
  onAddNote: () => void
  onScheduleFollowUp: () => void
  onSendEmail: () => void
  onChangeOwner: () => void
  onChangeStatus: () => void
  onCloseLead?: () => void
  onReopenLead?: () => void
  onCompleteNextFollowUp?: () => void
}) {
  const rows = completionRows(lead)
  const percent = lead.profileCompletion ?? 0
  const recent = activities.slice(0, 4)

  return (
    <aside className="grid content-start gap-4">
      <section className="rounded-2xl border border-[#e7eef5] bg-surface p-5 shadow-[0_10px_28px_rgba(22,50,79,0.035)] dark:border-border">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <CompletionRing percent={percent} />
            <h3 className="m-0 text-[0.98rem] font-semibold text-[#1b3a57] dark:text-text-strong">Profile Completion</h3>
          </div>
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 text-[0.78rem] font-medium text-primary hover:underline"
            onClick={onViewCompletion}
          >
            View Details →
          </button>
        </header>
        <ul className="m-0 grid list-none gap-2.5 p-0">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-3 text-[0.84rem]">
              <span className="inline-flex items-center gap-2 text-[#3d5166] dark:text-text">
                {row.done ? (
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color="var(--color-primary)" strokeWidth={1.8} />
                ) : (
                  <span className="grid size-4 place-items-center rounded-full border border-[#d5dee8]" />
                )}
                {row.label}
              </span>
              <span className="text-[#8b97a8]">
                {row.filled}/{row.total}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[#e7eef5] bg-surface p-5 shadow-[0_10px_28px_rgba(22,50,79,0.035)] dark:border-border">
        <h3 className="mt-0 mb-4 flex items-center gap-2 text-[0.98rem] font-semibold text-[#1b3a57] dark:text-text-strong">
          <span className="grid size-8 place-items-center rounded-lg bg-[#eef3f8] text-[#6d7d8f] dark:bg-hover-bg">
            <HugeiconsIcon icon={UserIcon} size={16} color="currentColor" strokeWidth={1.7} />
          </span>
          Lead Summary
        </h3>
        <dl className="m-0 grid gap-3.5">
          <SummaryRow
            icon={Clock01Icon}
            label="Next Follow-up"
            value={lead.nextFollowUp?.dueAt ? formatFollowUpDue(lead.nextFollowUp.dueAt) : 'Not scheduled'}
            action={
              <span className="inline-flex flex-wrap items-center gap-2">
                {canEditFollowUp && lead.nextFollowUp ? (
                  <button
                    type="button"
                    className="cursor-pointer border-0 bg-transparent p-0 text-[0.75rem] font-medium text-primary hover:underline"
                    onClick={onCompleteNextFollowUp}
                  >
                    Complete
                  </button>
                ) : null}
                {canFollowUp ? (
                  <button
                    type="button"
                    className="cursor-pointer border-0 bg-transparent p-0 text-[0.75rem] font-medium text-primary hover:underline"
                    onClick={onSetReminder}
                  >
                    {lead.nextFollowUp ? 'Schedule' : 'Set Reminder'}
                  </button>
                ) : null}
              </span>
            }
          />
          {lead.nextFollowUp?.nextAction ? (
            <SummaryRow icon={Notification01Icon} label="Next Action" value={lead.nextFollowUp.nextAction} />
          ) : null}
          <SummaryRow icon={Globe02Icon} label="Lead Source" value={lead.source || '—'} />
          <SummaryRow icon={Calendar03Icon} label="Created On" value={formatDisplayDateTime(lead.createdAt) || '—'} />
          <SummaryRow icon={UserIcon} label="Assigned Counsellor" value={lead.owner?.name || 'Unassigned'} />
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 text-[#8b97a8]">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} color="currentColor" strokeWidth={1.7} />
              </span>
              <div>
                <p className="m-0 text-[0.75rem] text-[#8b97a8]">Current Stage</p>
                <span
                  className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.72rem] font-semibold ${stageBadgeClass(lead.status)}`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {lead.status}
                </span>
                {lead.statusChange?.lockedReason ? (
                  <p className="m-0 mt-1.5 text-[0.75rem] leading-snug text-[#8b97a8]">{lead.statusChange.lockedReason}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {canReopen ? (
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent p-0 text-[0.75rem] font-medium text-primary hover:underline"
                  onClick={onReopenLead}
                >
                  Reopen
                </button>
              ) : null}
              {canChangeStatus ? (
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent p-0 text-[0.75rem] font-medium text-primary hover:underline"
                  onClick={onChangeStatus}
                >
                  Change
                </button>
              ) : null}
              {canClose ? (
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent p-0 text-[0.75rem] font-medium text-primary hover:underline"
                  onClick={onCloseLead}
                >
                  Close
                </button>
              ) : null}
            </div>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-[#e7eef5] bg-surface p-5 shadow-[0_10px_28px_rgba(22,50,79,0.035)] dark:border-border">
        <h3 className="mt-0 mb-4 text-[0.98rem] font-semibold text-[#1b3a57] dark:text-text-strong">Status History</h3>
        {statusHistory.length === 0 ? (
          <p className="m-0 text-[0.84rem] text-[#8b97a8]">No status changes recorded yet.</p>
        ) : (
          <ol className="m-0 grid list-none gap-3 p-0">
            {statusHistory.slice(0, 8).map((item) => (
              <li key={item.id} className="border-b border-[#eef3f8] pb-3 last:border-0 last:pb-0 dark:border-border-subtle">
                <p className="m-0 text-[0.86rem] font-medium text-[#17324f] dark:text-text-strong">
                  {item.previousStatus || '—'} → {item.newStatus}
                </p>
                <p className="m-0 mt-0.5 text-[0.75rem] text-[#8b97a8]">
                  {formatDisplayDateTime(item.createdAt)}
                  {item.updatedBy?.name ? ` · ${item.updatedBy.name}` : ''}
                </p>
                {item.lostReason ? <p className="m-0 mt-0.5 text-[0.75rem] text-[#8b97a8]">Lost reason: {item.lostReason}</p> : null}
                {item.closeReason ? <p className="m-0 mt-0.5 text-[0.75rem] text-[#8b97a8]">Close reason: {item.closeReason}</p> : null}
                {item.remarks ? <p className="m-0 mt-0.5 text-[0.78rem] text-[#5b6b7c]">{item.remarks}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-2xl border border-[#e7eef5] bg-surface p-5 shadow-[0_10px_28px_rgba(22,50,79,0.035)] dark:border-border">
        <h3 className="mt-0 mb-4 text-[0.98rem] font-semibold text-[#1b3a57] dark:text-text-strong">Assignment History</h3>
        {assignmentHistory.length === 0 ? (
          <p className="m-0 text-[0.84rem] text-[#8b97a8]">No assignment records yet.</p>
        ) : (
          <ol className="m-0 grid list-none gap-3 p-0">
            {assignmentHistory.slice(0, 8).map((item) => (
              <li key={item.id} className="border-b border-[#eef3f8] pb-3 last:border-0 last:pb-0 dark:border-border-subtle">
                <p className="m-0 text-[0.86rem] font-medium text-[#17324f] dark:text-text-strong">
                  {item.fromOwner?.name || 'Unassigned'} → {item.toOwner?.name || 'Lead Pool'}
                </p>
                <p className="m-0 mt-0.5 text-[0.75rem] text-[#8b97a8]">
                  {formatDisplayDateTime(item.createdAt)}
                  {item.assignedBy?.name ? ` · ${item.assignedBy.name}` : ''}
                </p>
                {item.reason ? <p className="m-0 mt-0.5 text-[0.78rem] text-[#5b6b7c]">{item.reason}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-2xl border border-[#e7eef5] bg-surface p-5 shadow-[0_10px_28px_rgba(22,50,79,0.035)] dark:border-border">
        <header className="mb-4 flex items-center justify-between gap-3">
          <h3 className="m-0 text-[0.98rem] font-semibold text-[#1b3a57] dark:text-text-strong">Recent Activities</h3>
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 text-[0.78rem] font-medium text-primary hover:underline"
            onClick={onViewActivities}
          >
            View All
          </button>
        </header>
        {recent.length === 0 ? (
          <p className="m-0 text-[0.84rem] text-[#8b97a8]">No activities recorded yet.</p>
        ) : (
          <ol className="m-0 grid list-none gap-4 p-0">
            {recent.map((item, index) => (
              <li key={item.id} className="relative pl-6">
                {index < recent.length - 1 ? (
                  <span className="absolute top-4 bottom-[-16px] left-[7px] w-px bg-[#e6eef6] dark:bg-border-subtle" />
                ) : null}
                <span className="absolute top-1.5 left-0 size-3.5 rounded-full border-[3px] border-[#e7f8ef] bg-primary dark:border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)]" />
                <p className="m-0 text-[0.88rem] font-semibold text-[#17324f] dark:text-text-strong">
                  {activityTitle(item.action, item.details)}
                </p>
                <p className="m-0 mt-0.5 text-[0.75rem] text-[#8b97a8]">
                  {formatDisplayDateTime(item.occurredAt)}
                  {item.user?.fullName ? ` by ${item.user.fullName}` : ''}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-2xl border border-[#e7eef5] bg-surface p-5 shadow-[0_10px_28px_rgba(22,50,79,0.035)] dark:border-border">
        <h3 className="mt-0 mb-4 text-[0.98rem] font-semibold text-[#1b3a57] dark:text-text-strong">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <QuickAction icon={Note01Icon} label="Add Note" onClick={onAddNote} />
          <QuickAction icon={Notification01Icon} label="Schedule Follow-up" onClick={onScheduleFollowUp} />
          <QuickAction icon={MailSend01Icon} label="Send Email" onClick={onSendEmail} />
          {canChangeOwner ? (
            <QuickAction
              icon={UserSwitchIcon}
              label={lead.owner?.id ? 'Change Owner' : 'Assign Lead'}
              onClick={onChangeOwner}
            />
          ) : null}
          {canClose ? <QuickAction icon={CheckmarkCircle02Icon} label="Close Lead" onClick={onCloseLead || (() => undefined)} /> : null}
          {canReopen ? <QuickAction icon={CheckmarkCircle02Icon} label="Reopen Lead" onClick={onReopenLead || (() => undefined)} /> : null}
        </div>
      </section>
    </aside>
  )
}

function CompletionRing({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent))
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <svg width="48" height="48" viewBox="0 0 44 44" className="shrink-0">
      <circle cx="22" cy="22" r={radius} fill="none" stroke="#e6eef6" strokeWidth="4" />
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 22 22)"
      />
      <text
        x="22"
        y="23"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--color-primary)"
        style={{ fontSize: '9px', fontWeight: 700 }}
      >
        {clamped}%
      </text>
    </svg>
  )
}

function SummaryRow({
  icon,
  label,
  value,
  action,
}: {
  icon: typeof Clock01Icon
  label: string
  value: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-[#8b97a8]">
          <HugeiconsIcon icon={icon} size={15} color="currentColor" strokeWidth={1.7} />
        </span>
        <div>
          <p className="m-0 text-[0.75rem] text-[#8b97a8]">{label}</p>
          <p className="m-0 mt-0.5 text-[0.86rem] font-medium text-[#17324f] dark:text-text-strong">{value}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: typeof Note01Icon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e6eef6] bg-surface px-2.5 py-2 text-[0.8rem] font-medium text-[#3d5166] hover:border-primary/30 hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)] dark:border-border dark:text-text"
      onClick={onClick}
    >
      <HugeiconsIcon icon={icon} size={15} color="currentColor" strokeWidth={1.7} />
      {label}
    </button>
  )
}
