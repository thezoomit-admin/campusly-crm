import { useState } from 'react'
import { toast } from 'react-toastify'
import { Globe02Icon } from '@hugeicons/core-free-icons'
import { getApiError } from '@/lib/api'
import { FormInput, FormSelect, FormTextArea } from '@/components/common/Forms'
import { Button } from '@/components/ui'
import { useListCampaignOptionsQuery } from '@/modules/campaigns/api/campaignsApi'
import {
  useCorrectLeadCampaignMutation,
  useCorrectLeadSourceMutation,
  useListAttributionChangesQuery,
} from '../../api/leadsApi'
import { useLeadMasterOptions } from '../../hooks/useLeadMasterOptions'
import type { LeadRecord } from '../../types'
import { optionLabel } from '../../utils/leadDetails'
import LeadInfoField from './LeadInfoField'
import LeadSectionCard from './LeadSectionCard'

const GRID = 'grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3'

function labelFor(options: Array<{ value: string; label: string }>, code?: string | null, fallback?: string | null) {
  return optionLabel(options, code) || fallback || '—'
}

export default function LeadMarketingPanel({
  lead,
  canChangeSource,
  canChangeCampaign,
}: {
  lead: LeadRecord
  canChangeSource: boolean
  canChangeCampaign: boolean
}) {
  const options = useLeadMasterOptions()
  const { data: history } = useListAttributionChangesQuery(lead.id)
  const [sourceOpen, setSourceOpen] = useState(false)
  const [campaignOpen, setCampaignOpen] = useState(false)
  const [sourceCode, setSourceCode] = useState(lead.sourceCode || '')
  const [channelCode, setChannelCode] = useState(lead.channelCode || '')
  const [referralBy, setReferralBy] = useState(lead.referralBy || '')
  const [reason, setReason] = useState('')
  const [campaignId, setCampaignId] = useState(lead.campaignId || '')
  const [campaignReason, setCampaignReason] = useState('')
  const [correctSource, { isLoading: savingSource }] = useCorrectLeadSourceMutation()
  const [correctCampaign, { isLoading: savingCampaign }] = useCorrectLeadCampaignMutation()

  const sourceId = options.sourceItems.find((item) => item.code === sourceCode)?.id
  const channelOptions = options.channelItems
    .filter((item) => item.code && item.parentId === sourceId)
    .map((item) => ({ value: item.code as string, label: item.name }))
  const { data: campaigns } = useListCampaignOptionsQuery(
    { sourceCode: sourceCode || lead.sourceCode || undefined },
    { skip: !(sourceCode || lead.sourceCode) },
  )

  const utm = [lead.utmSource, lead.utmMedium, lead.utmCampaign, lead.utmContent, lead.utmTerm].filter(Boolean)

  async function saveSource() {
    try {
      const result = await correctSource({
        id: lead.id,
        body: {
          sourceCode,
          channelCode: channelCode || undefined,
          referralBy: referralBy || undefined,
          reason: reason.trim(),
        },
      }).unwrap()
      toast.success(result.message || 'Lead source updated.')
      setSourceOpen(false)
      setReason('')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to process the request. Please try again.'))
    }
  }

  async function saveCampaign() {
    try {
      const result = await correctCampaign({
        id: lead.id,
        body: { campaignId, reason: campaignReason.trim() },
      }).unwrap()
      toast.success(result.message || 'Lead campaign updated.')
      setCampaignOpen(false)
      setCampaignReason('')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to process the request. Please try again.'))
    }
  }

  return (
    <LeadSectionCard title="Marketing Information">
      <div className={GRID}>
        <LeadInfoField icon={Globe02Icon} label="Lead Source" value={lead.source || labelFor(options.source, lead.sourceCode)} />
        <LeadInfoField icon={Globe02Icon} label="Channel" value={labelFor(options.channel, lead.channelCode)} />
        <LeadInfoField icon={Globe02Icon} label="Campaign" value={lead.campaign} />
        <LeadInfoField icon={Globe02Icon} label="Latest Source" value={lead.latestSource || lead.source} />
        <LeadInfoField icon={Globe02Icon} label="Latest Channel" value={labelFor(options.channel, lead.latestChannelCode)} />
        <LeadInfoField icon={Globe02Icon} label="Last Touch Campaign" value={lead.latestCampaign || lead.campaign} />
        <LeadInfoField icon={Globe02Icon} label="UTM Source" value={lead.utmSource} />
        <LeadInfoField icon={Globe02Icon} label="UTM Medium" value={lead.utmMedium} />
        <LeadInfoField icon={Globe02Icon} label="UTM Campaign" value={lead.utmCampaign} />
        <LeadInfoField icon={Globe02Icon} label="UTM Content" value={lead.utmContent} />
        <LeadInfoField icon={Globe02Icon} label="UTM Term" value={lead.utmTerm} />
        <LeadInfoField icon={Globe02Icon} label="External Lead ID" value={lead.externalLeadId} />
        <LeadInfoField icon={Globe02Icon} label="Referral By" value={lead.referralBy} />
        <LeadInfoField icon={Globe02Icon} label="Source Details" value={lead.sourceDetails} />
      </div>
      {utm.length === 0 ? null : (
        <p className="m-0 mt-4 text-[0.8rem] text-text-muted">First-touch UTM is preserved and is not edited from the lead form.</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {canChangeSource ? (
          <Button type="button" variant="secondary" onClick={() => setSourceOpen((open) => !open)}>
            Correct source
          </Button>
        ) : null}
        {canChangeCampaign ? (
          <Button type="button" variant="secondary" onClick={() => setCampaignOpen((open) => !open)}>
            Correct campaign
          </Button>
        ) : null}
      </div>
      {sourceOpen ? (
        <div className="mt-4 grid gap-3 rounded-xl border border-border p-3">
          <FormSelect
            showSearch
            optionFilterProp="label"
            placeholder="New source"
            value={sourceCode || undefined}
            options={options.source}
            onChange={(value) => {
              setSourceCode(String(value || ''))
              setChannelCode('')
            }}
          />
          <FormSelect
            showSearch
            optionFilterProp="label"
            placeholder="Channel"
            value={channelCode || undefined}
            options={channelOptions}
            onChange={(value) => setChannelCode(String(value || ''))}
          />
          {sourceCode === 'REFERRAL' ? (
            <FormInput value={referralBy} placeholder="Referral by" onChange={(event) => setReferralBy(event.target.value)} />
          ) : null}
          <FormTextArea value={reason} rows={2} placeholder="Reason for the correction" onChange={(event) => setReason(event.target.value)} />
          <Button type="button" disabled={savingSource || !reason.trim() || !sourceCode} onClick={saveSource}>
            Save source correction
          </Button>
        </div>
      ) : null}
      {campaignOpen ? (
        <div className="mt-4 grid gap-3 rounded-xl border border-border p-3">
          <FormSelect
            showSearch
            optionFilterProp="label"
            placeholder="Active campaign"
            value={campaignId || undefined}
            options={(campaigns?.items || []).map((item) => ({ value: item.value, label: item.name || item.label }))}
            onChange={(value) => setCampaignId(String(value || ''))}
          />
          <FormTextArea
            value={campaignReason}
            rows={2}
            placeholder="Reason for the correction"
            onChange={(event) => setCampaignReason(event.target.value)}
          />
          <Button type="button" disabled={savingCampaign || !campaignReason.trim() || !campaignId} onClick={saveCampaign}>
            Save campaign correction
          </Button>
        </div>
      ) : null}
      {history?.items.length ? (
        <div className="mt-4 grid gap-2">
          <p className="m-0 text-[0.82rem] font-semibold text-text-strong">Correction history</p>
          {history.items.map((item) => (
            <p key={item.id} className="m-0 text-[0.8rem] text-text-muted">
              {item.kind === 'SOURCE' ? 'Source' : 'Campaign'}: {item.previousValue || '—'} → {item.nextValue || '—'}
              {item.changedBy ? ` · ${item.changedBy.name}` : ''} · {item.reason}
            </p>
          ))}
        </div>
      ) : null}
    </LeadSectionCard>
  )
}
