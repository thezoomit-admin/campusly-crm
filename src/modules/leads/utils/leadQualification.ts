/** Mirrors API `computeLeadScore` for live preview in the Qualify modal. */

export type QualificationFormValues = {
  academicFitCode: string
  financialReadinessCode: string
  englishReadinessCode: string
  countryIntakeFitCode: string
  studyIntentQualCode: string
  applicationReadinessCode: string
  decisionTimelineCode: string
  qualificationResultCode: string
  unqualifiedReasonCode: string
  unqualifiedRemarks: string
}

export type LeadScorePreview = {
  score: number
  priorityCode: 'HIGH' | 'MEDIUM' | 'LOW'
  priority: 'High' | 'Medium' | 'Low'
  breakdown: {
    academic: number
    financial: number
    english: number
    countryFit: number
    intent: number
    timeline: number
    readiness: number
  }
}

function fitPoints(code: string | null | undefined, map: Record<string, number>) {
  return code ? map[code] ?? 0 : 0
}

export function computeLeadScorePreview(values: Partial<QualificationFormValues>): LeadScorePreview {
  const academic = fitPoints(values.academicFitCode, { STRONG: 15, GOOD: 11, AVERAGE: 7, WEAK: 3 })
  const financial = fitPoints(values.financialReadinessCode, {
    READY: 15,
    PARTIAL: 9,
    NOT_READY: 3,
    UNKNOWN: 5,
  })
  const english = fitPoints(values.englishReadinessCode, {
    READY: 15,
    PARTIAL: 9,
    NOT_READY: 3,
    UNKNOWN: 5,
  })
  const countryFit = fitPoints(values.countryIntakeFitCode, { STRONG: 10, GOOD: 8, AVERAGE: 5, WEAK: 2 })
  const intent = fitPoints(values.studyIntentQualCode, {
    HIGH: 15,
    MEDIUM: 9,
    LOW: 4,
    STRONG: 15,
    GOOD: 11,
  })
  const timeline = fitPoints(values.decisionTimelineCode, {
    IMMEDIATE: 10,
    '1_3_MONTHS': 8,
    '3_6_MONTHS': 5,
    '6_PLUS_MONTHS': 3,
    EXPLORING: 2,
  })
  const readiness = fitPoints(values.applicationReadinessCode, {
    READY_NOW: 10,
    PLANNING: 6,
    EXPLORING: 3,
  })
  const raw = academic + financial + english + countryFit + intent + timeline + readiness
  const score = Math.max(0, Math.min(100, Math.round((raw / 90) * 100)))
  const priorityCode = score >= 75 ? 'HIGH' : score >= 45 ? 'MEDIUM' : 'LOW'
  const priority = priorityCode === 'HIGH' ? 'High' : priorityCode === 'MEDIUM' ? 'Medium' : 'Low'
  return {
    score,
    priorityCode,
    priority,
    breakdown: { academic, financial, english, countryFit, intent, timeline, readiness },
  }
}

/** Suggest a qualification result from score + hard blockers. */
export function suggestQualificationResult(
  values: Partial<QualificationFormValues>,
  preview?: LeadScorePreview,
): 'QUALIFIED' | 'POTENTIAL' | 'UNQUALIFIED' | '' {
  const filledCount = [
    values.academicFitCode,
    values.financialReadinessCode,
    values.englishReadinessCode,
    values.countryIntakeFitCode,
    values.studyIntentQualCode,
    values.applicationReadinessCode,
    values.decisionTimelineCode,
  ].filter(Boolean).length

  if (filledCount === 0) return ''

  const hardBlock =
    values.academicFitCode === 'WEAK' ||
    values.financialReadinessCode === 'NOT_READY' ||
    values.englishReadinessCode === 'NOT_READY' ||
    values.studyIntentQualCode === 'LOW'

  const { score } = preview || computeLeadScorePreview(values)

  if (hardBlock && score < 45) return 'UNQUALIFIED'
  if (score >= 75) return 'QUALIFIED'
  if (score >= 45) return 'POTENTIAL'
  if (hardBlock) return 'UNQUALIFIED'
  return 'POTENTIAL'
}

export const QUALIFICATION_FIELD_META: Array<{
  key: keyof QualificationFormValues
  label: string
  hint: string
  optionsKey: 'fit' | 'readiness' | 'studyIntent' | 'appReady' | 'timeline' | 'result' | 'unqualified'
  requiredForQualified?: boolean
}> = [
  {
    key: 'academicFitCode',
    label: 'Academic Fit',
    hint: 'Does their education background match target programs?',
    optionsKey: 'fit',
    requiredForQualified: true,
  },
  {
    key: 'financialReadinessCode',
    label: 'Financial Readiness',
    hint: 'Can they fund tuition and living costs?',
    optionsKey: 'readiness',
    requiredForQualified: true,
  },
  {
    key: 'englishReadinessCode',
    label: 'English Readiness',
    hint: 'Are they ready for IELTS/TOEFL or equivalent?',
    optionsKey: 'readiness',
    requiredForQualified: true,
  },
  {
    key: 'countryIntakeFitCode',
    label: 'Country / Intake Fit',
    hint: 'Is the preferred country and intake realistic?',
    optionsKey: 'fit',
  },
  {
    key: 'studyIntentQualCode',
    label: 'Study Intent',
    hint: 'How serious are they about studying abroad?',
    optionsKey: 'studyIntent',
    requiredForQualified: true,
  },
  {
    key: 'applicationReadinessCode',
    label: 'Application Readiness',
    hint: 'How prepared are documents and next steps?',
    optionsKey: 'appReady',
  },
  {
    key: 'decisionTimelineCode',
    label: 'Decision Timeline',
    hint: 'When do they plan to decide and apply?',
    optionsKey: 'timeline',
  },
]

export function validateQualificationForm(values: QualificationFormValues): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!values.qualificationResultCode) {
    errors.qualificationResultCode = 'Select a qualification result.'
  }

  if (values.qualificationResultCode === 'QUALIFIED') {
    for (const field of QUALIFICATION_FIELD_META) {
      if (field.requiredForQualified && !values[field.key]?.trim()) {
        errors[field.key] = `${field.label} is required when marking Qualified.`
      }
    }
  }

  if (values.qualificationResultCode === 'UNQUALIFIED') {
    if (!values.unqualifiedReasonCode) {
      errors.unqualifiedReasonCode = 'Please provide a reason.'
    }
    if (values.unqualifiedReasonCode === 'OTHER' && !values.unqualifiedRemarks.trim()) {
      errors.unqualifiedRemarks = 'Please add remarks for Other.'
    }
  }

  return errors
}

export function resultLabel(code: string) {
  if (code === 'QUALIFIED') return 'Qualified'
  if (code === 'POTENTIAL') return 'Potential'
  if (code === 'UNQUALIFIED') return 'Unqualified'
  return code
}
