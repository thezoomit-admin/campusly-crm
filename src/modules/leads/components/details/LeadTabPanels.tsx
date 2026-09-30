import { HugeiconsIcon } from '@hugeicons/react'
import { File01Icon } from '@hugeicons/core-free-icons'
import { FormTextArea } from '@/components/common/Forms'
import { PrimaryButton } from '@/components/ui'
import { statusClass } from '@/lib/statusClass'
import type { ActivityFeedItem } from '@/types'
import type { CommunicationEvent } from '@/modules/communications/types'
import { CHANNEL_LABELS, STATUS_LABELS } from '@/modules/communications/types'
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

export function LeadCommunicationsPanel({
  items,
  loading,
}: {
  items: CommunicationEvent[]
  loading?: boolean
}) {
  return (
    <LeadSectionCard title="Communication History">
      {loading ? (
        <p className="m-0 text-[0.88rem] text-[#8b97a8]">Loading communications…</p>
      ) : items.length === 0 ? (
        <p className="m-0 text-[0.88rem] text-[#8b97a8]">
          No channel communications yet. Website, WhatsApp, Email, and Meta enquiries for this lead will appear here.
        </p>
      ) : (
        <ol className="m-0 grid list-none gap-0 p-0">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="relative flex gap-3 border-b border-[#eef3f8] py-3 last:border-b-0 dark:border-border-subtle"
            >
              <span className="mt-1 size-3.5 shrink-0 rounded-full border-[3px] border-[#e7f8ef] bg-primary" />
              {index < items.length - 1 ? (
                <span className="absolute top-7 bottom-[-6px] left-[6px] w-px bg-[#e6eef6] dark:bg-border-subtle" />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="m-0 text-[0.9rem] font-semibold text-[#17324f] dark:text-text-strong">
                    {CHANNEL_LABELS[item.channel] || item.channel}
                    {item.formName ? ` · ${item.formName}` : ''}
                  </p>
                  <time className="text-[0.75rem] text-[#8b97a8]">{formatDisplayDateTime(item.eventAt)}</time>
                </div>
                {item.subject ? (
                  <p className="mt-1 mb-0 text-[0.82rem] font-medium text-[#5b6b7c]">{item.subject}</p>
                ) : null}
                {item.message ? <p className="mt-1 mb-0 text-[0.82rem] text-[#5b6b7c]">{item.message}</p> : null}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={statusClass(STATUS_LABELS[item.processingStatus])}>
                    {STATUS_LABELS[item.processingStatus]}
                  </span>
                  {item.campaignName || item.campaign?.name ? (
                    <span className="text-[0.75rem] text-[#8b97a8]">
                      Campaign: {item.campaign?.name || item.campaignName}
                    </span>
                  ) : null}
                  <span className="text-[0.75rem] text-[#8b97a8] capitalize">{item.direction}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
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
          <PrimaryButton
            type="button"
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border-0 bg-transparent px-1.5 py-1 text-[0.82rem] font-medium text-primary hover:bg-hover-bg"
            onClick={onAdd}
          >
            Add
          </PrimaryButton>
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
          <PrimaryButton type="button" loading={saving} onClick={onSave}>
            Save notes
          </PrimaryButton>
        </div>
      ) : null}
    </LeadSectionCard>
  )
}
