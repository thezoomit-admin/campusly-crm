import { EMPTY_LEAD_FORM, type LeadFormState, type LeadRecord } from '../types'

function yesNo(value: boolean | null | undefined) {
  if (value === true) return 'true'
  if (value === false) return 'false'
  return ''
}

function text(value: string | number | null | undefined) {
  if (value === null || value === undefined) return ''
  return String(value)
}

/** Split a stored phone into dial code + national digits for the flag input. */
function splitStoredPhone(phone: string | null | undefined, countryCode?: string | null) {
  const digits = (phone || '').replace(/\D/g, '')
  const dial = (countryCode || '').replace(/\D/g, '')
  if (dial && digits.startsWith(dial) && digits.length > dial.length) {
    return { countryCode: dial, national: digits.slice(dial.length) }
  }
  if (digits.startsWith('880') && digits.length > 3) {
    return { countryCode: '880', national: digits.slice(3) }
  }
  return { countryCode: dial || '880', national: digits }
}

export function recordToForm(lead: LeadRecord): LeadFormState {
  const phoneCountryCode = lead.phoneCountryCode || '880'
  const phoneParts = splitStoredPhone(lead.phone, phoneCountryCode)
  const whatsappSameAsPhone = Boolean(lead.whatsappSameAsPhone)
  const whatsappCountryCode = lead.whatsappCountryCode || phoneCountryCode || '880'
  const whatsappParts = splitStoredPhone(lead.whatsapp, whatsappCountryCode)

  return {
    ...EMPTY_LEAD_FORM,
    name: lead.name || '',
    phone: phoneParts.national || lead.phone || '',
    phoneCountryCode: phoneParts.countryCode || phoneCountryCode,
    whatsapp: whatsappSameAsPhone ? phoneParts.national || lead.phone || '' : whatsappParts.national,
    whatsappCountryCode: whatsappSameAsPhone
      ? phoneParts.countryCode || phoneCountryCode
      : whatsappParts.countryCode || whatsappCountryCode,
    whatsappSameAsPhone,
    email: lead.email || '',
    dateOfBirth: lead.dateOfBirth || '',
    currentLocation: lead.currentLocation || '',
    preferredCountryCode: lead.preferredCountryCode || '',
    preferredDegreeCode: lead.preferredDegreeCode || '',
    preferredCourse: lead.preferredCourse || '',
    preferredIntakeCode: lead.preferredIntakeCode || '',
    studyPurposeCode: lead.studyPurposeCode || '',
    studyPurposeOther: lead.studyPurposeOther || '',
    highestQualificationCode: lead.highestQualificationCode || '',
    institutionName: lead.institutionName || '',
    passingYear: text(lead.passingYear),
    resultCgpa: lead.resultCgpa || '',
    studyGapYears: text(lead.studyGapYears),
    englishTestCode: lead.englishTestCode || '',
    testStatusCode: lead.testStatusCode || '',
    overallScore: text(lead.overallScore),
    testDate: lead.testDate || '',
    listening: text(lead.listening),
    reading: text(lead.reading),
    writing: text(lead.writing),
    speaking: text(lead.speaking),
    estimatedBudgetCode: lead.estimatedBudgetCode || '',
    fundingSourceCode: lead.fundingSourceCode || '',
    financialReadinessCode: lead.financialReadinessCode || '',
    previouslyAppliedAbroad: yesNo(lead.previouslyAppliedAbroad),
    previousVisaApplication: yesNo(lead.previousVisaApplication),
    previousVisaRefusal: yesNo(lead.previousVisaRefusal),
    prevVisaCountry: lead.prevVisaCountry || '',
    prevVisaType: lead.prevVisaType || '',
    prevVisaYear: text(lead.prevVisaYear),
    prevVisaResult: lead.prevVisaResult || '',
    refusalCountry: lead.refusalCountry || '',
    refusalYear: text(lead.refusalYear),
    refusalReason: lead.refusalReason || '',
    decisionTimelineCode: lead.decisionTimelineCode || '',
    decisionMakerCode: lead.decisionMakerCode || '',
    applicationReadinessCode: lead.applicationReadinessCode || '',
    studyIntentCode: lead.studyIntentCode || '',
    preferredContactMethodCode: lead.preferredContactMethodCode || '',
    preferredContactTimeCode: lead.preferredContactTimeCode || '',
    specificContactTime: lead.specificContactTime || '',
    sourceCode: lead.sourceCode || '',
    channelCode: lead.channelCode || '',
    campaign: lead.campaign || '',
    campaignId: lead.campaignId || '',
    referralBy: lead.referralBy || '',
    referralDetails: lead.referralDetails || '',
    sourceDetails: lead.sourceDetails || '',
    externalLeadId: lead.externalLeadId || '',
    remarks: lead.remarks || '',
    notes: lead.notes || '',
  }
}

function emptyToNull(value: string) {
  const textValue = value.trim()
  return textValue ? textValue : null
}

function toBool(value: string) {
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

export function formToPayload(form: LeadFormState, extra?: Record<string, unknown>) {
  return {
    name: form.name.trim(),
    phone: form.phone.trim(),
    phoneCountryCode: emptyToNull(form.phoneCountryCode),
    whatsapp: form.whatsappSameAsPhone ? form.phone.trim() : emptyToNull(form.whatsapp),
    whatsappCountryCode: form.whatsappSameAsPhone
      ? emptyToNull(form.phoneCountryCode)
      : emptyToNull(form.whatsappCountryCode),
    whatsappSameAsPhone: form.whatsappSameAsPhone,
    email: emptyToNull(form.email.toLowerCase()),
    dateOfBirth: emptyToNull(form.dateOfBirth),
    currentLocation: emptyToNull(form.currentLocation),
    preferredCountryCode: emptyToNull(form.preferredCountryCode),
    preferredDegreeCode: emptyToNull(form.preferredDegreeCode),
    preferredCourse: emptyToNull(form.preferredCourse),
    preferredIntakeCode: emptyToNull(form.preferredIntakeCode),
    studyPurposeCode: emptyToNull(form.studyPurposeCode),
    studyPurposeOther: emptyToNull(form.studyPurposeOther),
    highestQualificationCode: emptyToNull(form.highestQualificationCode),
    institutionName: emptyToNull(form.institutionName),
    passingYear: emptyToNull(form.passingYear),
    resultCgpa: emptyToNull(form.resultCgpa),
    studyGapYears: emptyToNull(form.studyGapYears),
    englishTestCode: emptyToNull(form.englishTestCode),
    testStatusCode: emptyToNull(form.testStatusCode),
    overallScore: emptyToNull(form.overallScore),
    testDate: emptyToNull(form.testDate),
    listening: emptyToNull(form.listening),
    reading: emptyToNull(form.reading),
    writing: emptyToNull(form.writing),
    speaking: emptyToNull(form.speaking),
    estimatedBudgetCode: emptyToNull(form.estimatedBudgetCode),
    fundingSourceCode: emptyToNull(form.fundingSourceCode),
    financialReadinessCode: emptyToNull(form.financialReadinessCode),
    previouslyAppliedAbroad: toBool(form.previouslyAppliedAbroad),
    previousVisaApplication: toBool(form.previousVisaApplication),
    previousVisaRefusal: toBool(form.previousVisaRefusal),
    prevVisaCountry: emptyToNull(form.prevVisaCountry),
    prevVisaType: emptyToNull(form.prevVisaType),
    prevVisaYear: emptyToNull(form.prevVisaYear),
    prevVisaResult: emptyToNull(form.prevVisaResult),
    refusalCountry: emptyToNull(form.refusalCountry),
    refusalYear: emptyToNull(form.refusalYear),
    refusalReason: emptyToNull(form.refusalReason),
    decisionTimelineCode: emptyToNull(form.decisionTimelineCode),
    decisionMakerCode: emptyToNull(form.decisionMakerCode),
    applicationReadinessCode: emptyToNull(form.applicationReadinessCode),
    studyIntentCode: emptyToNull(form.studyIntentCode),
    preferredContactMethodCode: emptyToNull(form.preferredContactMethodCode),
    preferredContactTimeCode: emptyToNull(form.preferredContactTimeCode),
    specificContactTime: emptyToNull(form.specificContactTime),
    sourceCode: emptyToNull(form.sourceCode),
    channelCode: emptyToNull(form.channelCode),
    campaign: emptyToNull(form.campaign),
    campaignId: emptyToNull(form.campaignId),
    referralBy: emptyToNull(form.referralBy),
    referralDetails: emptyToNull(form.referralDetails),
    sourceDetails: emptyToNull(form.sourceDetails),
    externalLeadId: emptyToNull(form.externalLeadId),
    remarks: emptyToNull(form.remarks),
    notes: emptyToNull(form.notes),
    ...extra,
  }
}

export function validateLeadForm(form: LeadFormState, options?: { channelRequired?: boolean }) {
  const errors: Record<string, string> = {}
  if (form.name.trim().length < 2 || form.name.trim().length > 100) {
    errors.name = 'Full Name is required.'
  }
  const phoneDigits = form.phone.replace(/\D/g, '')
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    errors.phone = 'Please enter a valid phone number.'
  }
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address.'
  }
  if (!form.preferredCountryCode) errors.preferredCountryCode = 'Please select a preferred country.'
  if (!form.sourceCode) errors.sourceCode = 'Lead source is required.'
  if (options?.channelRequired && !form.channelCode) errors.channelCode = 'Please select a channel.'
  if (form.sourceCode === 'REFERRAL' && form.referralBy.trim().length < 2) {
    errors.referralBy = 'Referral by is required.'
  }
  if (form.sourceDetails.length > 500) errors.sourceDetails = 'Source details must be 500 characters or less.'
  if (form.referralDetails.length > 500) errors.referralDetails = 'Referral details must be 500 characters or less.'
  if (form.studyPurposeCode === 'OTHER' && !form.studyPurposeOther.trim()) {
    errors.studyPurposeOther = 'Please specify the study purpose.'
  }
  if (form.remarks.length > 1000) errors.remarks = 'Remarks must be 1000 characters or less.'
  return errors
}
