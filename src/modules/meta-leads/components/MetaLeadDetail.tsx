import { Link } from 'react-router-dom'
import { Drawer } from 'antd'
import type { MetaLead } from '../types'
import { formatMetaDate } from '../types'

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid gap-0.5">
      <p className="m-0 text-[0.75rem] text-text-muted">{label}</p>
      <p className="m-0 text-[0.92rem] text-text-strong">{value || '—'}</p>
    </div>
  )
}

export default function MetaLeadDetail({
  lead,
  onClose,
}: {
  lead: MetaLead | null
  onClose: () => void
}) {
  return (
    <Drawer title="Meta lead" open={Boolean(lead)} onClose={onClose} width={440}>
      {lead ? (
        <div className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="Full name" value={lead.fullName} />
            <Row label="Phone" value={lead.phone} />
            <Row label="Email" value={lead.email} />
            <Row label="WhatsApp" value={lead.whatsapp} />
            <Row label="Current education" value={lead.currentEducation} />
            <Row label="Preferred country" value={lead.preferredCountryCode} />
            <Row label="Preferred intake" value={lead.preferredIntake} />
            <Row label="Form" value={lead.formLabel} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="Platform" value={lead.platformLabel} />
            <Row label="Date received" value={formatMetaDate(lead.receivedAt)} />
            <Row label="Campaign" value={lead.campaignName} />
            <Row label="Campaign ID" value={lead.metaCampaignId || lead.campaign?.code} />
            <Row label="Ad set" value={lead.adSetName} />
            <Row label="Advertisement" value={lead.adName} />
          </div>
          <div className="grid gap-3">
            <Row label="Result" value={lead.message || lead.processingError} />
            <Row label="Lead" value={lead.lead ? `${lead.lead.code} · ${lead.lead.name}` : null} />
            <Row label="Source" value={lead.lead?.source} />
            <Row label="Latest source" value={lead.lead?.latestSource} />
            <Row label="Assigned to" value={lead.lead?.ownerName || (lead.pooled ? 'Lead Pool' : null)} />
            <Row label="Status" value={lead.lead?.status} />
          </div>
          {lead.leadId ? (
            <Link to={`/leads/${lead.leadId}`} className="text-[0.9rem] font-medium text-primary">
              Open lead
            </Link>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  )
}
