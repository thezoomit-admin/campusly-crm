export type LeadRow = {
  id: string
  code?: string
  name: string
  phone: string
  email?: string
  subtitle?: string
  country: string
  source: string
  owner: string
  status: string
  priority?: string
  score?: string
  updated: string
  createdAt?: string
}

export type LeadListSummaryStat = {
  key: string
  label: string
  count: number
  change: number
}

export type LeadListSummary = {
  total: number
  change: number
  statuses: LeadListSummaryStat[]
}

export type LeadOwner = { id: string | null; name: string } | null
export type LeadTeam = { id: string; name: string } | null

export type LeadCompletion = {
  personal: boolean
  study: boolean
  academic: boolean
  english: boolean
  financial: boolean
  visa: boolean
  intent: boolean
}

export type LeadRecord = {
  id: string
  code: string
  name: string
  phone: string | null
  phoneCountryCode: string | null
  whatsapp: string | null
  whatsappSameAsPhone: boolean
  email: string | null
  dateOfBirth: string | null
  currentLocation: string | null
  country: string | null
  preferredCountryCode: string | null
  preferredDegreeCode: string | null
  preferredCourse: string | null
  preferredIntakeCode: string | null
  studyPurposeCode: string | null
  studyPurposeOther: string | null
  highestQualificationCode: string | null
  institutionName: string | null
  passingYear: number | null
  resultCgpa: string | null
  studyGapYears: number | null
  englishTestCode: string | null
  testStatusCode: string | null
  overallScore: number | null
  testDate: string | null
  listening: number | null
  reading: number | null
  writing: number | null
  speaking: number | null
  estimatedBudgetCode: string | null
  fundingSourceCode: string | null
  financialReadinessCode: string | null
  previouslyAppliedAbroad: boolean | null
  previousVisaApplication: boolean | null
  previousVisaRefusal: boolean | null
  prevVisaCountry: string | null
  prevVisaType: string | null
  prevVisaYear: number | null
  prevVisaResult: string | null
  refusalCountry: string | null
  refusalYear: number | null
  refusalReason: string | null
  decisionTimelineCode: string | null
  decisionMakerCode: string | null
  applicationReadinessCode: string | null
  studyIntentCode: string | null
  preferredContactMethodCode: string | null
  preferredContactTimeCode: string | null
  specificContactTime: string | null
  source: string | null
  sourceCode: string | null
  sourceLocked: boolean
  campaign: string | null
  remarks: string | null
  notes: string | null
  status: string
  statusCode: string | null
  academicFitCode: string | null
  englishReadinessCode: string | null
  countryIntakeFitCode: string | null
  studyIntentQualCode: string | null
  qualificationResultCode: string | null
  unqualifiedReasonCode: string | null
  unqualifiedRemarks: string | null
  profileCompletion: number
  completion: LeadCompletion
  leadScore: number
  priority: string | null
  priorityCode: string | null
  priorityManual: boolean
  owner: LeadOwner
  assignedTeam: LeadTeam
  createdBy: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
  nextFollowUp: {
    id: string
    type: string
    dueAt: string | null
    status: string
    notes: string | null
  } | null
}

export type LeadFormState = {
  name: string
  phone: string
  phoneCountryCode: string
  whatsapp: string
  whatsappSameAsPhone: boolean
  email: string
  dateOfBirth: string
  currentLocation: string
  preferredCountryCode: string
  preferredDegreeCode: string
  preferredCourse: string
  preferredIntakeCode: string
  studyPurposeCode: string
  studyPurposeOther: string
  highestQualificationCode: string
  institutionName: string
  passingYear: string
  resultCgpa: string
  studyGapYears: string
  englishTestCode: string
  testStatusCode: string
  overallScore: string
  testDate: string
  estimatedBudgetCode: string
  fundingSourceCode: string
  financialReadinessCode: string
  previouslyAppliedAbroad: string
  previousVisaApplication: string
  previousVisaRefusal: string
  prevVisaCountry: string
  prevVisaType: string
  prevVisaYear: string
  prevVisaResult: string
  refusalCountry: string
  refusalYear: string
  refusalReason: string
  decisionTimelineCode: string
  decisionMakerCode: string
  applicationReadinessCode: string
  studyIntentCode: string
  preferredContactMethodCode: string
  preferredContactTimeCode: string
  specificContactTime: string
  sourceCode: string
  campaign: string
  remarks: string
  notes: string
}

export type DuplicateLead = {
  id: string
  code: string
  name: string
  status: string
}

export const EMPTY_LEAD_FORM: LeadFormState = {
  name: '',
  phone: '',
  phoneCountryCode: '880',
  whatsapp: '',
  whatsappSameAsPhone: false,
  email: '',
  dateOfBirth: '',
  currentLocation: '',
  preferredCountryCode: '',
  preferredDegreeCode: '',
  preferredCourse: '',
  preferredIntakeCode: '',
  studyPurposeCode: '',
  studyPurposeOther: '',
  highestQualificationCode: '',
  institutionName: '',
  passingYear: '',
  resultCgpa: '',
  studyGapYears: '',
  englishTestCode: '',
  testStatusCode: '',
  overallScore: '',
  testDate: '',
  estimatedBudgetCode: '',
  fundingSourceCode: '',
  financialReadinessCode: '',
  previouslyAppliedAbroad: '',
  previousVisaApplication: '',
  previousVisaRefusal: '',
  prevVisaCountry: '',
  prevVisaType: '',
  prevVisaYear: '',
  prevVisaResult: '',
  refusalCountry: '',
  refusalYear: '',
  refusalReason: '',
  decisionTimelineCode: '',
  decisionMakerCode: '',
  applicationReadinessCode: '',
  studyIntentCode: '',
  preferredContactMethodCode: '',
  preferredContactTimeCode: '',
  specificContactTime: '',
  sourceCode: '',
  campaign: '',
  remarks: '',
  notes: '',
}

export type LeadFormValues = {
  name: string
  phone: string
  country: string
  source: string
}
