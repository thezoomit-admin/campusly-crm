import { HugeiconsIcon } from '@hugeicons/react'
import { File01Icon } from '@hugeicons/core-free-icons'
import { FormTextArea } from '@/components/common/Forms'
import { Button } from '@/components/ui'
import type { ActivityFeedItem } from '@/types'
import { activityTitle, formatDisplayDateTime } from '../../utils/leadDetails'
import LeadSectionCard from './LeadSectionCard'

export function LeadDocumentsPanel() {
  return (
    <LeadSectionCard title="Documents">
      <div className="grid justify-items-center gap-2 rounded-xl border border-dashed border-[#dbe4ee] bg-[#f8fafc] px-4 py-10 text-center dark:border-border dark:bg-transparent">
        <span className="grid size-12 place-items-center rounded-full bg-[#eef3f8] text-[#8b97a8]">
          <HugeiconsIcon icon={File01Icon} size={22} color="currentColor" strokeWidth={1.6} />
        </span>
        <p className="m-0 text-[0.95rem] font-semibold text-[#17324f] dark:text-text-strong">No documents uploaded</p>
        <p className="m-0 max-w-md text-[0.84rem] text-[#8b97a8]">
          Passport, academic certificates, and language test reports will appear here once they are attached to this lead.
        </p>
      </div>
    </LeadSectionCard>
  )
}

export function LeadActivitiesPanel({
  activities,
  onAdd,
  canAdd,
}: {
  activities: ActivityFeedItem[]
  onAdd: () => void
  canAdd: boolean
}) {
  return (
    <LeadSectionCard
      title="Activities"
      extra={
        canAdd ? (
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border-0 bg-transparent px-1.5 py-1 text-[0.82rem] font-medium text-primary hover:bg-hover-bg"
            onClick={onAdd}
          >
            Add
          </button>
        ) : null
      }
    >
      {activities.length === 0 ? (
        <p className="m-0 text-[0.88rem] text-[#8b97a8]">No activities recorded for this lead yet.</p>
      ) : (
        <ol className="m-0 grid list-none gap-0 p-0">
          {activities.map((item, index) => (
            <li key={item.id} className="relative flex gap-3 border-b border-[#eef3f8] py-3 last:border-b-0 dark:border-border-subtle">
              <span className="mt-1 size-3.5 shrink-0 rounded-full border-[3px] border-[#e7f8ef] bg-primary" />
              {index < activities.length - 1 ? (
                <span className="absolute top-7 bottom-[-6px] left-[6px] w-px bg-[#e6eef6] dark:bg-border-subtle" />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="m-0 text-[0.9rem] font-semibold text-[#17324f] dark:text-text-strong">
                    {activityTitle(item.action, item.details)}
                  </p>
                  <time className="text-[0.75rem] text-[#8b97a8]">{formatDisplayDateTime(item.occurredAt)}</time>
                </div>
                {item.details ? <p className="mt-1 mb-0 text-[0.82rem] text-[#5b6b7c]">{item.details}</p> : null}
                <p className="mt-1 mb-0 text-[0.75rem] text-[#8b97a8]">{item.user?.fullName ? `by ${item.user.fullName}` : 'System'}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </LeadSectionCard>
  )
}

export function LeadNotesPanel({
  value,
  canEdit,
  saving,
  onChange,
  onSave,
}: {
  value: string
  canEdit: boolean
  saving: boolean
  onChange: (value: string) => void
  onSave: () => void
}) {
  return (
    <LeadSectionCard title="Notes">
      <FormTextArea
        rows={8}
        value={value}
        placeholder="Add your notes here..."
        disabled={!canEdit}
        className="!rounded-xl !bg-[#f7fafc] dark:!bg-input-bg"
        onChange={(event) => onChange(event.target.value)}
      />
      {canEdit ? (
        <div className="mt-3 flex justify-end">
          <Button type="button" loading={saving} onClick={onSave}>
            Save notes
          </Button>
        </div>
      ) : null}
    </LeadSectionCard>
  )
}
