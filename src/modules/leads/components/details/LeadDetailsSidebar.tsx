import type { ActivityFeedItem } from '@/types'
import LeadMetaCampaignHistory from '@/modules/meta-leads/components/LeadMetaCampaignHistory'
import type { MasterOption } from '../../hooks/useLeadMasterOptions'
import type { LeadRecord } from '../../types'
import { activityTitle, formatDisplayDateTime } from '../../utils/leadDetails'
import LeadProfileCompletionCard from './LeadProfileCompletionCard'
import LeadQualificationSummaryCard from './LeadQualificationSummaryCard'

export default function LeadDetailsSidebar({
  lead,
  activities,
  options,
  canQualify,
  onViewActivities,
  onUpdateQualification,
}: {
  lead: LeadRecord
  activities: ActivityFeedItem[]
  options: {
    fit: MasterOption[]
    financial: MasterOption[]
    studyIntent: MasterOption[]
    appReady: MasterOption[]
    timeline: MasterOption[]
    result: MasterOption[]
    unqualified: MasterOption[]
  }
  canQualify: boolean
  onViewActivities: () => void
  onUpdateQualification?: () => void
}) {
  const recent = activities.slice(0, 5)

  return (
    <aside className="grid content-start gap-4">
      <LeadProfileCompletionCard lead={lead} />

      <LeadQualificationSummaryCard
        lead={lead}
        options={options}
        canQualify={canQualify}
        onUpdateQualification={onUpdateQualification}
      />

      <LeadMetaCampaignHistory leadId={lead.id} />

      <section className="rounded-2xl border border-[#e7eef5] bg-surface p-5 shadow-[0_10px_28px_rgba(22,50,79,0.035)] dark:border-border">
        <header className="mb-4 flex items-center justify-between gap-3">
          <h3 className="m-0 text-[0.98rem] font-semibold text-[#1b3a57] dark:text-text-strong">
            Recent Activity
          </h3>
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent p-0 text-[0.78rem] font-medium text-primary hover:underline"
            onClick={onViewActivities}
          >
            View Timeline
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
                  {activityTitle(item.action, item.details, item.outcome)}
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
