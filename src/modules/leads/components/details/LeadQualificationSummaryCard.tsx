import { PrimaryButton } from '@/components/ui'
import type { MasterOption } from '../../hooks/useLeadMasterOptions'
import type { LeadRecord } from '../../types'
import { optionLabel } from '../../utils/leadDetails'
import { QUALIFICATION_FIELD_META, resultLabel } from '../../utils/leadQualification'

function resolveResultLabel(code: string | null | undefined, options: MasterOption[]) {
  if (!code) return '—'
  return optionLabel(options, code) || resultLabel(code) || code
}

export default function LeadQualificationSummaryCard({
  lead,
  options,
  canQualify,
  onUpdateQualification,
}: {
  lead: LeadRecord
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
  onUpdateQualification?: () => void
}) {
  const optionMap = {
    fit: options.fit,
    readiness: options.financial,
    studyIntent: options.studyIntent,
    appReady: options.appReady,
    timeline: options.timeline,
    result: options.result,
    unqualified: options.unqualified,
  }

  const values: Record<string, string | null | undefined> = {
    academicFitCode: lead.academicFitCode,
    financialReadinessCode: lead.financialReadinessCode,
    englishReadinessCode: lead.englishReadinessCode,
    countryIntakeFitCode: lead.countryIntakeFitCode,
    studyIntentQualCode: lead.studyIntentQualCode || lead.studyIntentCode,
    applicationReadinessCode: lead.applicationReadinessCode,
    decisionTimelineCode: lead.decisionTimelineCode,
  }

  const result = resolveResultLabel(lead.qualificationResultCode, options.result)
  const unqualifiedReason =
    lead.qualificationResultCode === 'UNQUALIFIED'
      ? optionLabel(options.unqualified, lead.unqualifiedReasonCode) || lead.unqualifiedRemarks || ''
      : ''

  return (
    <section className="grid gap-4 rounded-2xl border border-[#e7eef5] bg-surface p-5 shadow-[0_10px_28px_rgba(22,50,79,0.035)] dark:border-border">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="m-0 text-[0.98rem] font-semibold text-[#1b3a57] dark:text-text-strong">
            Lead Qualification
          </h3>
          <p className="m-0 mt-1 text-[0.75rem] text-[#8b97a8]">Summary · Academic Fit to Result</p>
        </div>
        {canQualify && onUpdateQualification ? (
          <PrimaryButton
            type="button"
            size="sm"
            variant="outline"
            className="!border-primary !text-primary hover:!border-primary-hover hover:!text-primary-hover hover:!bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface))]"
            onClick={onUpdateQualification}
            label="Update"
          />
        ) : null}
      </header>

      <ul className="m-0 grid list-none gap-2.5 p-0">
        {QUALIFICATION_FIELD_META.map((field) => {
          const code = values[field.key]
          const opts = optionMap[field.optionsKey] || []
          return (
            <li
              key={field.key}
              className="flex items-start justify-between gap-3 border-b border-[#eef3f8] pb-2 last:border-0 last:pb-0 dark:border-border-subtle"
            >
              <span className="text-[0.82rem] text-[#8b97a8]">{field.label}</span>
              <span className="text-right text-[0.84rem] font-medium text-[#17324f] dark:text-text-strong">
                {optionLabel(opts, code) || '—'}
              </span>
            </li>
          )
        })}
        <li className="flex items-start justify-between gap-3 pt-1">
          <span className="text-[0.82rem] font-semibold text-[#8b97a8]">Qualification Result</span>
          <span className="text-right text-[0.84rem] font-semibold text-[#17324f] dark:text-text-strong">
            {result}
          </span>
        </li>
        {unqualifiedReason ? (
          <li className="rounded-lg bg-[#fff6e8] px-3 py-2 text-[0.8rem] text-[#b54708] dark:bg-hover-bg">
            Reason: {unqualifiedReason}
            {lead.unqualifiedRemarks && lead.unqualifiedReasonCode === 'OTHER'
              ? ''
              : lead.unqualifiedRemarks && lead.unqualifiedReasonCode
                ? ` — ${lead.unqualifiedRemarks}`
                : ''}
          </li>
        ) : null}
      </ul>
    </section>
  )
}
