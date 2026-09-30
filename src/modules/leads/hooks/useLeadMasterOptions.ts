import { useListMasterDataOptionsQuery } from '@/redux/features/masterData/masterDataApi'

const INTEGRATION_SOURCES = new Set(['WEBSITE', 'META', 'WHATSAPP', 'EMAIL', 'FACEBOOK_LEAD_ADS', 'INSTAGRAM_LEAD_ADS'])

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

function useCategory(category: string) {
  const { data, isFetching } = useListMasterDataOptionsQuery({ category })
  const items = data?.items || []
  const options: MasterOption[] = items
    .filter((item) => item.code)
    .map((item) => ({ value: item.code as string, label: item.name }))
  if (category === 'COUNTRY') {
    options.sort((a, b) => a.label.localeCompare(b.label))
  }
  return { options, items, isFetching }
}

export { INTEGRATION_SOURCES }

export function useLeadMasterOptions() {
  const country = useCategory('COUNTRY')
  const degree = useCategory('STUDY_LEVEL')
  const intake = useCategory('INTAKE')
  const purpose = useCategory('STUDY_PURPOSE')
  const education = useCategory('EDUCATION_LEVEL')
  const englishTest = useCategory('ENGLISH_TEST_TYPE')
  const testStatus = useCategory('TEST_STATUS')
  const budget = useCategory('BUDGET_RANGE')
  const funding = useCategory('FUNDING_SOURCE')
  const financial = useCategory('FINANCIAL_READINESS')
  const timeline = useCategory('DECISION_TIMELINE')
  const decisionMaker = useCategory('DECISION_MAKER')
  const appReady = useCategory('APPLICATION_READINESS')
  const studyIntent = useCategory('STUDY_INTENT')
  const contactMethod = useCategory('CONTACT_METHOD')
  const contactTime = useCategory('CONTACT_TIME')
  const source = useCategory('LEAD_SOURCE')
  const channel = useCategory('LEAD_CHANNEL')
  const fit = useCategory('QUALIFICATION_FIT')
  const result = useCategory('QUALIFICATION_RESULT')
  const unqualified = useCategory('UNQUALIFIED_REASON')
  const priority = useCategory('LEAD_PRIORITY')
  const lostReason = useCategory('LEAD_LOST_REASON')
  const closeReason = useCategory('LEAD_CLOSE_REASON')

  return {
    country: country.options,
    degree: degree.options,
    intake: intake.options,
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
