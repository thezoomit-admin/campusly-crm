import { HugeiconsIcon } from '@hugeicons/react'
import { PencilEdit02Icon } from '@hugeicons/core-free-icons'
import { PrimaryButton } from '@/components/ui'
import type { MasterOption } from '../../hooks/useLeadMasterOptions'
import type { LeadRecord } from '../../types'
import { optionLabel } from '../../utils/leadDetails'
import {
  computeLeadScorePreview,
  QUALIFICATION_FIELD_META,
  resultLabel,
  type QualificationFormValues,
} from '../../utils/leadQualification'

const FIELD_SCORE_META: Record<
  string,
  { breakdownKey: keyof ReturnType<typeof computeLeadScorePreview>['breakdown']; max: number }
> = {
  academicFitCode: { breakdownKey: 'academic', max: 15 },
  financialReadinessCode: { breakdownKey: 'financial', max: 15 },
  englishReadinessCode: { breakdownKey: 'english', max: 15 },
  countryIntakeFitCode: { breakdownKey: 'countryFit', max: 10 },
  studyIntentQualCode: { breakdownKey: 'intent', max: 15 },
  applicationReadinessCode: { breakdownKey: 'readiness', max: 10 },
  decisionTimelineCode: { breakdownKey: 'timeline', max: 10 },
}

function resolveResultLabel(code: string | null | undefined, options: MasterOption[]) {
  if (!code) return '—'
  return optionLabel(options, code) || resultLabel(code) || code
}

function barTone(percent: number) {
  if (percent >= 75) {
    return {
      track: 'bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]',
      fill: 'bg-primary',
      text: 'text-primary',
      badge: 'bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-primary',
    }
  }
  if (percent >= 45) {
    return {
      track: 'bg-[#fff4e5]',
      fill: 'bg-[#f59e0b]',
      text: 'text-[#d97706]',
      badge: 'bg-[#fff4e5] text-[#d97706]',
    }
  }
  return {
    track: 'bg-[#ffe8ee]',
    fill: 'bg-[#f43f5e]',
    text: 'text-[#e11d48]',
    badge: 'bg-[#ffe8ee] text-[#e11d48]',
  }
}

function resultTone(code: string | null | undefined) {
  if (code === 'QUALIFIED') {
    return 'bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-primary ring-1 ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]'
  }
  if (code === 'POTENTIAL') {
    return 'bg-[#fff4e5] text-[#d97706] ring-1 ring-[#fcd34d]/60'
  }
  if (code === 'UNQUALIFIED') {
    return 'bg-[#ffe8ee] text-[#e11d48] ring-1 ring-[#fda4af]/70'
  }
  return 'bg-hover-bg text-text-muted ring-1 ring-border'
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

  const values: Partial<QualificationFormValues> = {
    academicFitCode: lead.academicFitCode || '',
    financialReadinessCode: lead.financialReadinessCode || '',
    englishReadinessCode: lead.englishReadinessCode || '',
    countryIntakeFitCode: lead.countryIntakeFitCode || '',
    studyIntentQualCode: lead.studyIntentQualCode || lead.studyIntentCode || '',
    applicationReadinessCode: lead.applicationReadinessCode || '',
    decisionTimelineCode: lead.decisionTimelineCode || '',
    qualificationResultCode: lead.qualificationResultCode || '',
  }

  const preview = computeLeadScorePreview(values)

  const result = resolveResultLabel(lead.qualificationResultCode, options.result)
  const unqualifiedReason =
    lead.qualificationResultCode === 'UNQUALIFIED'
      ? optionLabel(options.unqualified, lead.unqualifiedReasonCode) || lead.unqualifiedRemarks || ''
      : ''

  return (
    <section className="grid gap-4 rounded-2xl border border-[#e7eef5] bg-surface p-5 shadow-[0_10px_28px_rgba(22,50,79,0.035)] dark:border-border">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="m-0 text-[0.98rem] font-semibold text-[#1b3a57] dark:text-text-strong">
            Lead Qualification
          </h3>
          <p className="m-0 mt-1 text-[0.75rem] text-[#8b97a8]">
            Counsellor ratings. Lead Score follows the student profile.
          </p>
        </div>
        {canQualify && onUpdateQualification ? (
          <PrimaryButton
            type="button"
            size="sm"
            variant="primary"
            className="shrink-0"
            icon={<HugeiconsIcon icon={PencilEdit02Icon} size={14} color="currentColor" strokeWidth={1.8} />}
            onClick={onUpdateQualification}
            label="Edit"
          />
        ) : null}
      </header>

      <ul className="m-0 grid list-none gap-3.5 p-0">
        {QUALIFICATION_FIELD_META.map((field) => {
          const code = values[field.key]
          const opts = optionMap[field.optionsKey] || []
          const label = optionLabel(opts, code) || '—'
          const meta = FIELD_SCORE_META[field.key]
          const points = meta ? preview.breakdown[meta.breakdownKey] : 0
          const percent = meta && code ? Math.round((points / meta.max) * 100) : 0
          const tone = code ? barTone(percent) : barTone(0)

          return (
            <li key={field.key} className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[0.8rem] text-[#8b97a8]">{field.label}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={`text-[0.72rem] font-semibold tabular-nums ${code ? tone.text : 'text-text-faint'}`}>
                    {code ? `${percent}%` : '—'}
                  </span>
                  <span
                    className={[
                      'max-w-[9.5rem] truncate rounded-full px-2 py-0.5 text-[0.68rem] font-semibold',
                      code ? tone.badge : 'bg-hover-bg text-text-faint',
                    ].join(' ')}
                    title={label}
                  >
                    {label}
                  </span>
                </span>
              </div>
              <div className={`h-1.5 overflow-hidden rounded-full ${tone.track}`}>
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ease-out ${code ? tone.fill : 'bg-[#d6dee8]'}`}
                  style={{ width: `${code ? percent : 0}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f6f9fc] px-3.5 py-3 dark:bg-hover-bg">
        <span className="text-[0.8rem] font-medium text-text-muted">Qualification Result</span>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[0.75rem] font-semibold ${resultTone(lead.qualificationResultCode)}`}
        >
          {result}
        </span>
      </div>

      {unqualifiedReason ? (
        <div className="rounded-lg bg-[#fff6e8] px-3 py-2 text-[0.8rem] text-[#b54708] dark:bg-hover-bg">
          Reason: {unqualifiedReason}
          {lead.unqualifiedRemarks && lead.unqualifiedReasonCode === 'OTHER'
            ? ''
            : lead.unqualifiedRemarks && lead.unqualifiedReasonCode
              ? ` — ${lead.unqualifiedRemarks}`
              : ''}
        </div>
      ) : null}
    </section>
  )
}
