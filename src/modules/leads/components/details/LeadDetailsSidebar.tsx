import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle02Icon,
  Note01Icon,
} from '@hugeicons/core-free-icons'
import type { ActivityFeedItem } from '@/types'
import {
  activityTitle,
  formatDisplayDateTime,
} from '../../utils/leadDetails'

export default function LeadDetailsSidebar({
  activities,
  canChangeStatus,
  onViewActivities,
  onAddNote,
  onChangeStatus,
}: {
  activities: ActivityFeedItem[]
  canChangeStatus: boolean
  onViewActivities: () => void
  onAddNote: () => void
  onChangeStatus: () => void
}) {
  const recent = activities.slice(0, 5)

  return (
    <aside className="grid content-start gap-4">
      <section className="rounded-2xl border border-[#e7eef5] bg-surface p-5 shadow-[0_10px_28px_rgba(22,50,79,0.035)] dark:border-border">
        <h3 className="mt-0 mb-4 text-[0.98rem] font-semibold text-[#1b3a57] dark:text-text-strong">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <QuickAction icon={Note01Icon} label="Add Note" onClick={onAddNote} />
          {canChangeStatus ? (
            <QuickAction icon={CheckmarkCircle02Icon} label="Change Status" onClick={onChangeStatus} />
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[#e7eef5] bg-surface p-5 shadow-[0_10px_28px_rgba(22,50,79,0.035)] dark:border-border">
        <header className="mb-4 flex items-center justify-between gap-3">
          <h3 className="m-0 text-[0.98rem] font-semibold text-[#1b3a57] dark:text-text-strong">Recent Activity</h3>
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
    </aside>
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
      className="flex min-h-[42px] cursor-pointer items-center justify-start gap-2 rounded-xl border border-primary bg-primary px-2.5 py-2 text-[0.8rem] font-medium text-on-primary hover:brightness-95"
      onClick={onClick}
    >
      <HugeiconsIcon icon={icon} size={15} color="currentColor" strokeWidth={1.7} />
      {label}
    </button>
  )
}
