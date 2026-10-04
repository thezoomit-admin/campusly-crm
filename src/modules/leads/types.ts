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
  nextFollowUpAt?: string | null
  updated: string
  createdAt?: string
}

export type LeadPoolRow = {
  id: string
  code: string
  name: string
  phone: string
  country: string
  source: string
  assignedTeam?: { id: string; name: string } | null
  createdAt: string
  waitingTime: string
}

export type MyLeadRow = {
  id: string
  code: string
  name: string
  phone: string
  country: string
  status: string
  score: number
  priority: string
  nextFollowUpAt: string | null
  lastActivity: string
  lastActivityAt: string | null
  assignedAt: string
}

export type MyLeadsSummary = {
  totalAssigned: number
  highPriority: number
  pendingFollowUps: number
  todayFollowUps: number
  overdueFollowUps: number
}

export type LeadAssignee = {
  id: string
  name: string
  role: { key: string; name: string } | null
  team: { id: string; name: string } | null
}

export type LeadHandoverNote = {
  studentRequirement?: string | null
  preferredCountryCode?: string | null
  preferredCountry?: string | null
  preferredIntakeCode?: string | null
  preferredIntake?: string | null
  academicBackground?: string | null
  conversationSummary?: string | null
  importantConcern?: string | null
  snapshot?: {
    profileCompletion?: number
    leadScore?: number
    priority?: string | null
    qualificationResultCode?: string | null
  } | null
}

export type LeadAssignmentKind = 'POOL_ASSIGN' | 'REASSIGN' | 'HANDOVER' | 'REOPEN'

export type LeadAssignmentHistoryItem = {
  id: string
  fromOwner: { id: string; name: string } | null
  toOwner: { id: string; name: string } | null
  kind?: LeadAssignmentKind
  reason: string | null
  handoverNote?: LeadHandoverNote | null
  assignedBy: { id: string; name: string } | null
  createdAt: string
}

export type LeadDocumentItem = {
  id: string
  fileName: string
  mimeType: string
  fileSize: number
  createdAt: string
  uploadedBy: { id: string; name: string } | null
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

export type LeadStatusOption = {
  code: string
  name: string
  behaviorKey: string | null
  remarksRequired: boolean
  lostReasonRequired: boolean
  closeReasonRequired?: boolean
  reasonCategory?: 'LEAD_LOST_REASON' | 'LEAD_CLOSE_REASON' | null
  requiresOverride: boolean
  processGated: boolean
}

export type LeadStatusChange = {
  canUpdate: boolean
  canClose?: boolean
  canReopen?: boolean
  locked: boolean
  lockedReason: string | null
  canOverride: boolean
  current: { code: string; name: string; behaviorKey: string | null; sortOrder: number } | null
  options: LeadStatusOption[]
  closeOptions?: LeadStatusOption[]
}

export type LeadStatusHistoryItem = {
  id: string
  previousStatus: string | null
  previousStatusCode: string | null
  newStatus: string
  newStatusCode: string
  remarks: string | null
  lostReasonCode: string | null
  lostReason: string | null
  closeReasonCode?: string | null
  closeReason?: string | null
  isOverride: boolean
  overrideReason: string | null
  updatedBy: { id: string; name: string } | null
  createdAt: string
}

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
  channelCode?: string | null
  sourceLocked: boolean
  latestSource?: string | null
  latestSourceCode?: string | null
  latestChannelCode?: string | null
  campaign: string | null
  campaignId?: string | null
  latestCampaign?: string | null
  latestCampaignId?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmContent?: string | null
  utmTerm?: string | null
  landingPageUrl?: string | null
  externalLeadId?: string | null
  sourceDetails?: string | null
  referralBy?: string | null
  referralDetails?: string | null
  firstTouchAt?: string | null
  lastEnquiryAt?: string | null
  remarks: string | null
  notes: string | null
  status: string
  statusCode: string | null
  lostReasonCode: string | null
  closeReasonCode?: string | null
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
    priority?: string | null
    purpose?: string | null
    nextAction?: string | null
    reminder?: string | null
    outcome?: string | null
  } | null
  statusChange?: LeadStatusChange
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
  channelCode: string
  campaign: string
  campaignId: string
  referralBy: string
  referralDetails: string
  sourceDetails: string
  externalLeadId: string
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
  channelCode: '',
  campaign: '',
  campaignId: '',
  referralBy: '',
  referralDetails: '',
  sourceDetails: '',
  externalLeadId: '',
  remarks: '',
  notes: '',
}

export type LeadFormValues = {
  name: string
  phone: string
  country: string
  source: string
}
