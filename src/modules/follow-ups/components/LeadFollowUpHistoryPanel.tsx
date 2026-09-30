import { PrimaryButton } from '@/components/ui'
import type { FollowUpRecord } from '../types'
import { followUpStatusClass } from '../utils/followUpStatus'
import { formatDisplayDateTime } from '@/modules/leads/utils/leadDetails'
import LeadSectionCard from '@/modules/leads/components/details/LeadSectionCard'

const OPEN = new Set(['Pending', 'Due Soon', 'Overdue'])

export default function LeadFollowUpHistoryPanel({
  items,
  loading,
  canCreate,
  canEdit,
  onCreate,
  onComplete,
  onReschedule,
  onCancel,
}: {
  items: FollowUpRecord[]
  loading?: boolean
  canCreate: boolean
  canEdit: boolean
  onCreate: () => void
  onComplete: (item: FollowUpRecord) => void
  onReschedule: (item: FollowUpRecord) => void
  onCancel: (item: FollowUpRecord) => void
}) {
  return (
    <LeadSectionCard
      title="Follow-up History"
      extra={
        canCreate ? (
          <PrimaryButton
            type="button"
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border-0 bg-transparent px-1.5 py-1 text-[0.82rem] font-medium text-primary hover:bg-hover-bg"
            onClick={onCreate} label="+ Create Follow-up" />
        ) : null
      }
    >
      {loading ? (
        <p className="m-0 text-[0.88rem] text-[#8b97a8]">Loading follow-ups…</p>
      ) : items.length === 0 ? (
        <p className="m-0 text-[0.88rem] text-[#8b97a8]">No follow-ups recorded for this lead yet.</p>
      ) : (
        <ul className="m-0 grid list-none gap-0 p-0">
          {items.map((item) => {
            const isOpen = OPEN.has(item.status)
            return (
              <li
                key={item.id}
                className="grid gap-2 border-b border-[#eef3f8] py-3 last:border-b-0 dark:border-border-subtle"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="m-0 text-[0.9rem] font-semibold text-[#17324f] dark:text-text-strong">
                      {item.type}
                      {item.purpose ? ` — ${item.purpose}` : ''}
                    </p>
                    <p className="mt-1 mb-0 text-[0.78rem] text-[#8b97a8]">
                      {formatDisplayDateTime(item.dueAt) || item.due}
                      {item.priority ? ` · ${item.priority}` : ''}
                      {item.ownerName ? ` · ${item.ownerName}` : ''}
                    </p>
                  </div>
                  <span className={followUpStatusClass(item.status)}>{item.status}</span>
                </div>
                {item.nextAction ? (
                  <p className="m-0 text-[0.82rem] text-[#5b6b7c]">
                    Next Action: {item.nextAction}
                  </p>
                ) : null}
                {item.outcome ? (
                  <p className="m-0 text-[0.82rem] text-[#5b6b7c]">Outcome: {item.outcome}</p>
                ) : null}
                {item.notes ? <p className="m-0 text-[0.82rem] text-[#5b6b7c]">{item.notes}</p> : null}
                {item.source === 'System' && item.sourceReason ? (
                  <p className="m-0 text-[0.75rem] text-[#8b97a8]">
                    Created By: System — Reason: {item.sourceReason}
                  </p>
                ) : null}
                {isOpen && canEdit ? (
                  <div className="flex flex-wrap gap-2">
                    <PrimaryButton type="button" size="sm" onClick={() = label="onComplete(item)}> Complete" />
                    <PrimaryButton type="button" size="sm" variant="outline" onClick={() = label="onReschedule(item)}> Reschedule" />
                    <PrimaryButton type="button" size="sm" variant="outline" onClick={() = label="onCancel(item)}> Cancel" />
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </LeadSectionCard>
  )
}
