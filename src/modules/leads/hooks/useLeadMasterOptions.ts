import dayjs from 'dayjs'
import { useListMasterDataOptionsQuery } from '@/redux/features/masterData/masterDataApi'

/** System lead-ad sources only — not selectable on the manual lead form. */
const INTEGRATION_SOURCES = new Set(['FACEBOOK_LEAD_ADS', 'INSTAGRAM_LEAD_ADS'])

const CATEGORIES = [
  'COUNTRY',
  'STUDY_LEVEL',
  'INTAKE',
  'STUDY_PURPOSE',
  'EDUCATION_LEVEL',
  'ENGLISH_TEST_TYPE',
  'TEST_STATUS',
  'BUDGET_RANGE',
  'FUNDING_SOURCE',
  'FINANCIAL_READINESS',
  'DECISION_TIMELINE',
  'DECISION_MAKER',
  'APPLICATION_READINESS',
  'STUDY_INTENT',
  'CONTACT_METHOD',
  'CONTACT_TIME',
  'LEAD_SOURCE',
  'LEAD_CHANNEL',
  'QUALIFICATION_FIT',
  'QUALIFICATION_RESULT',
  'UNQUALIFIED_REASON',
  'LEAD_PRIORITY',
  'LEAD_LOST_REASON',
  'LEAD_CLOSE_REASON',
] as const

export type MasterOption = { value: string; label: string }

function isFutureIntake(extras?: Record<string, unknown> | null) {
  const start = extras?.startDate
  if (typeof start !== 'string' || !start.trim()) return true
  return !dayjs(start).isBefore(dayjs(), 'day')
}

function useCategory(
  category: string,
  options?: { futureIntakeOnly?: boolean; skip?: boolean },
) {
  const { data, isFetching } = useListMasterDataOptionsQuery(
    { category },
    { skip: options?.skip },
  )
  const items = data?.items || []
  const filtered =
    category === 'INTAKE' && options?.futureIntakeOnly
      ? items.filter((item) => isFutureIntake(item.extras))
      : items
  const mapped: MasterOption[] = filtered
    .filter((item) => item.code)
    .map((item) => ({ value: item.code as string, label: item.name }))
  if (category === 'COUNTRY') {
    mapped.sort((a, b) => a.label.localeCompare(b.label))
  }
  return { options: mapped, items, isFetching }
}

export { INTEGRATION_SOURCES }

export function useLeadMasterOptions(options?: { skip?: boolean }) {
  const skip = Boolean(options?.skip)
  const country = useCategory('COUNTRY', { skip })
  const degree = useCategory('STUDY_LEVEL', { skip })
  const intake = useCategory('INTAKE', { futureIntakeOnly: true, skip })
  const purpose = useCategory('STUDY_PURPOSE', { skip })
  const education = useCategory('EDUCATION_LEVEL', { skip })
  const englishTest = useCategory('ENGLISH_TEST_TYPE', { skip })
  const testStatus = useCategory('TEST_STATUS', { skip })
  const budget = useCategory('BUDGET_RANGE', { skip })
  const funding = useCategory('FUNDING_SOURCE', { skip })
  const financial = useCategory('FINANCIAL_READINESS', { skip })
  const timeline = useCategory('DECISION_TIMELINE', { skip })
  const decisionMaker = useCategory('DECISION_MAKER', { skip })
  const appReady = useCategory('APPLICATION_READINESS', { skip })
  const studyIntent = useCategory('STUDY_INTENT', { skip })
  const contactMethod = useCategory('CONTACT_METHOD', { skip })
  const contactTime = useCategory('CONTACT_TIME', { skip })
  const source = useCategory('LEAD_SOURCE', { skip })
  const channel = useCategory('LEAD_CHANNEL', { skip })
  const fit = useCategory('QUALIFICATION_FIT', { skip })
  const result = useCategory('QUALIFICATION_RESULT', { skip })
  const unqualified = useCategory('UNQUALIFIED_REASON', { skip })
  const priority = useCategory('LEAD_PRIORITY', { skip })
  const lostReason = useCategory('LEAD_LOST_REASON', { skip })
  const closeReason = useCategory('LEAD_CLOSE_REASON', { skip })

  return {
    country: country.options,
    degree: degree.options,
    intake: intake.options,
    intakeItems: intake.items,
    purpose: purpose.options,
    education: education.options,
    englishTest: englishTest.options,
    testStatus: testStatus.options,
    budget: budget.options,
    funding: funding.options,
    financial: financial.options,
    timeline: timeline.options,
    decisionMaker: decisionMaker.options,
    appReady: appReady.options,
    studyIntent: studyIntent.options,
    contactMethod: contactMethod.options,
    contactTime: contactTime.options,
    source: source.options,
    channel: channel.options,
    sourceItems: source.items,
    channelItems: channel.items,
    fit: fit.options,
    result: result.options,
    unqualified: unqualified.options,
    priority: priority.options,
    lostReason: lostReason.options,
    closeReason: closeReason.options,
  }
}

export { CATEGORIES }
