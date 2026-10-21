import { Link } from 'react-router-dom'
import { Drawer } from 'antd'
import type { ReactNode } from 'react'
import { PlatformBadge, ResultText } from '../metaLeadUi'
import { formatMetaDate, type MetaLead } from '../types'

function Field({ label, value }: { label: string; value: ReactNode }) {
  const empty = value == null || value === ''
  return (
    <div className="grid min-w-0 gap-0.5">
      <p className="m-0 text-[0.72rem] font-medium tracking-wide text-text-muted uppercase">{label}</p>
      <div className="m-0 text-[0.92rem] break-words text-text-strong [overflow-wrap:anywhere]">{empty ? '—' : value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h4 className="m-0 flex items-center gap-2 text-[0.82rem] font-semibold text-text-strong">
        <span className="h-3.5 w-[3px] rounded-full bg-primary" />
        {title}
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
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
    <Drawer
      title={lead?.fullName || 'Meta lead'}
      open={Boolean(lead)}
      onClose={onClose}
      width={460}
      destroyOnHidden
    >
      {lead ? (
        <div className="grid gap-6">
          <div className="rounded-xl border border-border-subtle bg-[#f8fafc] px-3 py-2.5 dark:bg-[#161d24]">
            <ResultText lead={lead} />
          </div>

          <Section title="Student">
            <Field label="Full name" value={lead.fullName} />
            <Field label="Phone" value={lead.phone} />
            <Field label="Email" value={lead.email} />
            <Field label="WhatsApp" value={lead.whatsapp} />
            <Field label="Current education" value={lead.currentEducation} />
            <Field label="Preferred country" value={lead.preferredCountryCode} />
            <Field label="Preferred intake" value={lead.preferredIntake} />
            <Field label="Form" value={lead.formLabel} />
          </Section>

          <Section title="Campaign">
            <Field label="Platform" value={<PlatformBadge platform={lead.platform} label={lead.platformLabel} />} />
            <Field label="Date received" value={formatMetaDate(lead.receivedAt)} />
            <Field label="Campaign" value={lead.campaignName} />
            <Field label="Campaign ID" value={lead.metaCampaignId || lead.campaign?.code} />
            <Field label="Ad set" value={lead.adSetName} />
            <Field label="Advertisement" value={lead.adName} />
          </Section>

          <Section title="CRM">
            <Field label="Lead" value={lead.lead ? `${lead.lead.code} · ${lead.lead.name}` : null} />
            <Field label="Source" value={lead.lead?.source} />
            <Field label="Latest source" value={lead.lead?.latestSource} />
            <Field label="Assigned to" value={lead.lead?.ownerName || (lead.pooled ? 'Lead Pool' : null)} />
            <Field label="Status" value={lead.lead?.status} />
          </Section>

          {lead.leadId ? (
            <Link
              to={`/leads/${lead.leadId}`}
              className="inline-flex w-fit items-center rounded-[10px] bg-primary px-3 py-2 text-[0.88rem] font-semibold text-on-primary no-underline hover:bg-primary-hover"
            >
              Open lead
            </Link>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  )
}
