import { useListLeadCampaignTouchesQuery } from '../api/metaLeadsApi'
import { formatMetaDate } from '../types'
import LeadSectionCard from '@/modules/leads/components/details/LeadSectionCard'

export default function LeadMetaCampaignHistory({ leadId }: { leadId: string }) {
  const { data, isFetching } = useListLeadCampaignTouchesQuery(leadId)
  const items = data?.items || []
  if (!isFetching && items.length === 0) return null

  return (
    <LeadSectionCard title="Campaign history">
      {isFetching && items.length === 0 ? (
        <p className="m-0 text-[0.85rem] text-text-muted">Loading campaign history…</p>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border px-3 py-2">
              <p className="m-0 text-[0.92rem] font-medium text-text-strong">
                {item.campaignName || 'Campaign information not available'}
              </p>
              <p className="m-0 mt-1 text-[0.8rem] text-text-muted">
                {[item.platform ? item.platformLabel : null, item.sourceCode, item.channelCode, item.formType ? item.formLabel : null, formatMetaDate(item.receivedAt)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <p className="m-0 mt-1 text-[0.8rem] text-text">
                Ad set: {item.adSetName || '—'} · Advertisement: {item.adName || '—'}
              </p>
            </div>
          ))}
        </div>
      )}
    </LeadSectionCard>
  )
}
