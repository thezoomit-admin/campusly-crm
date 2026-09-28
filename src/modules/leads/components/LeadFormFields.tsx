import {
  adminFormSpan,
  createFormFields,
  fieldError,
  fieldHint,
  fieldLabelClass,
  formField,
  formFieldInvalid,
} from '../../../styles/admin'
import type { ReactNode } from 'react'
import { DatePicker, Switch } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { FormInput, FormSelect, FormTextArea } from '@/components/common/Forms'
import type { LeadFormState } from '../types'
import { useLeadMasterOptions } from '../hooks/useLeadMasterOptions'

type FieldErrors = Record<string, string>

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return <span className={fieldLabelClass(required)}>{children}</span>
}

export function Field({
  id,
  label,
  required,
  span,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  required?: boolean
  span?: boolean
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className={`${formField}${error ? ` ${formFieldInvalid}` : ''}${span ? ` ${adminFormSpan}` : ''}`}>
      <label htmlFor={id}>
        <FieldLabel required={required}>{label}</FieldLabel>
      </label>
      {children}
      {hint && !error ? <span className={fieldHint}>{hint}</span> : null}
      {error ? (
        <span id={`${id}-error`} className={fieldError} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}

export function FormSection({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section id={id} className="rounded-2xl border border-border bg-surface p-4" aria-labelledby={`${id}-title`}>
      <header className="border-b border-[color-mix(in_srgb,var(--color-text-muted)_22%,transparent)] pb-3">
        <h3 id={`${id}-title`} className="m-0 text-[1.05rem]">
          {title}
        </h3>
        {description ? <p className="mt-1.5 mb-0 text-text-muted">{description}</p> : null}
      </header>
      <div className={`mt-4 ${createFormFields}`}>{children}</div>
    </section>
  )
}

function asSelectString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function toDayjs(value: string) {
  return value ? dayjs(value) : null
}

function toDateString(value: Dayjs | null) {
  return value ? value.format('YYYY-MM-DD') : ''
}

const YES_NO = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: currentYear - 1984 }, (_, index) => {
  const year = String(currentYear - index)
  return { value: year, label: year }
})

type LeadFormFieldsProps = {
  form: LeadFormState
  errors: FieldErrors
  sourceLocked?: boolean
  assignedTeamName?: string | null
  onChange: (key: keyof LeadFormState, value: string | boolean) => void
}

export default function LeadFormFields({
  form,
  errors,
  sourceLocked,
  assignedTeamName,
  onChange,
}: LeadFormFieldsProps) {
  const options = useLeadMasterOptions()
  const showEnglishDetail = form.testStatusCode === 'TAKEN'
  const showPurposeOther = form.studyPurposeCode === 'OTHER'
  const showVisaApp = form.previousVisaApplication === 'true'
  const showRefusal = form.previousVisaRefusal === 'true'
  const showSpecificTime = form.preferredContactTimeCode === 'SPECIFIC'

  return (
    <div className="grid gap-4">
      <FormSection id="personal" title="Personal Information">
        <Field id="name" label="Full Name" required error={errors.name}>
          <FormInput
            id="name"
            autoFocus
            value={form.name}
            autoComplete="name"
            placeholder="Student full name"
            onChange={(event) => onChange('name', event.target.value)}
          />
        </Field>
        <Field id="phone" label="Phone Number" required error={errors.phone}>
          <FormInput
            id="phone"
            value={form.phone}
            placeholder="017XXXXXXXX"
            onChange={(event) => onChange('phone', event.target.value)}
          />
        </Field>
        <Field id="whatsappSameAsPhone" label="WhatsApp same as phone">
          <div className="flex h-10 items-center">
            <Switch
              checked={form.whatsappSameAsPhone}
              onChange={(checked) => onChange('whatsappSameAsPhone', checked)}
            />
          </div>
        </Field>
        <Field id="whatsapp" label="WhatsApp Number" error={errors.whatsapp}>
          <FormInput
            id="whatsapp"
            value={form.whatsappSameAsPhone ? form.phone : form.whatsapp}
            disabled={form.whatsappSameAsPhone}
            placeholder="WhatsApp number"
            onChange={(event) => onChange('whatsapp', event.target.value)}
          />
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          <FormInput
            id="email"
            value={form.email}
            placeholder="name@email.com"
            onChange={(event) => onChange('email', event.target.value.toLowerCase())}
          />
        </Field>
        <Field id="dateOfBirth" label="Date of Birth" error={errors.dateOfBirth}>
          <DatePicker
            id="dateOfBirth"
            allowClear
            value={toDayjs(form.dateOfBirth)}
            disabledDate={(current) => current.isAfter(dayjs(), 'day')}
            onChange={(value) => onChange('dateOfBirth', toDateString(value))}
          />
        </Field>
        <Field id="currentLocation" label="Current Location">
          <FormInput
            id="currentLocation"
            value={form.currentLocation}
            placeholder="City, country"
            onChange={(event) => onChange('currentLocation', event.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection id="study" title="Study Preference">
        <Field id="preferredCountryCode" label="Preferred Country" required error={errors.preferredCountryCode}>
          <FormSelect
            id="preferredCountryCode"
            showSearch
            optionFilterProp="label"
            placeholder="Select country"
            value={form.preferredCountryCode || undefined}
            options={options.country}
            onChange={(value) => onChange('preferredCountryCode', asSelectString(value))}
          />
        </Field>
        <Field id="preferredDegreeCode" label="Preferred Degree/Level">
          <FormSelect
            id="preferredDegreeCode"
            showSearch
            optionFilterProp="label"
            placeholder="Select level"
            value={form.preferredDegreeCode || undefined}
            options={options.degree}
            onChange={(value) => onChange('preferredDegreeCode', asSelectString(value))}
          />
        </Field>
        <Field id="preferredCourse" label="Preferred Course/Subject">
          <FormInput
            id="preferredCourse"
            value={form.preferredCourse}
            placeholder="e.g. Computer Science"
            onChange={(event) => onChange('preferredCourse', event.target.value)}
          />
        </Field>
        <Field id="preferredIntakeCode" label="Preferred Intake" error={errors.preferredIntakeCode}>
          <FormSelect
            id="preferredIntakeCode"
            showSearch
            optionFilterProp="label"
            placeholder="Select intake"
            value={form.preferredIntakeCode || undefined}
            options={options.intake}
            onChange={(value) => onChange('preferredIntakeCode', asSelectString(value))}
          />
        </Field>
        <Field id="studyPurposeCode" label="Study Purpose">
          <FormSelect
            id="studyPurposeCode"
            showSearch
            optionFilterProp="label"
            placeholder="Select purpose"
            value={form.studyPurposeCode || undefined}
            options={options.purpose}
            onChange={(value) => onChange('studyPurposeCode', asSelectString(value))}
          />
        </Field>
        {showPurposeOther ? (
          <Field id="studyPurposeOther" label="Please Specify" error={errors.studyPurposeOther}>
            <FormInput
              id="studyPurposeOther"
              value={form.studyPurposeOther}
              onChange={(event) => onChange('studyPurposeOther', event.target.value)}
            />
          </Field>
        ) : null}
        {assignedTeamName ? (
          <Field id="assignedTeam" label="Assigned Country Team">
            <FormInput id="assignedTeam" value={assignedTeamName} disabled readOnly />
          </Field>
        ) : null}
      </FormSection>

      <FormSection id="academic" title="Academic Information">
        <Field id="highestQualificationCode" label="Highest Qualification">
          <FormSelect
            id="highestQualificationCode"
            showSearch
            optionFilterProp="label"
            placeholder="Select qualification"
            value={form.highestQualificationCode || undefined}
            options={options.education}
            onChange={(value) => onChange('highestQualificationCode', asSelectString(value))}
          />
        </Field>
        <Field id="institutionName" label="Institution Name">
          <FormInput
            id="institutionName"
            value={form.institutionName}
            placeholder="College or university"
            onChange={(event) => onChange('institutionName', event.target.value)}
          />
        </Field>
        <Field id="passingYear" label="Passing Year">
          <FormSelect
            id="passingYear"
            showSearch
            placeholder="Select year"
            value={form.passingYear || undefined}
            options={YEARS}
            onChange={(value) => onChange('passingYear', asSelectString(value))}
          />
        </Field>
        <Field id="resultCgpa" label="Result / CGPA">
          <FormInput
            id="resultCgpa"
            value={form.resultCgpa}
            placeholder="e.g. 3.50"
            onChange={(event) => onChange('resultCgpa', event.target.value)}
          />
        </Field>
        <Field id="studyGapYears" label="Study Gap (years)" error={errors.studyGapYears}>
          <FormInput
            id="studyGapYears"
            value={form.studyGapYears}
            placeholder="0"
            onChange={(event) => onChange('studyGapYears', event.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection id="english" title="English Proficiency">
        <Field id="englishTestCode" label="English Test">
          <FormSelect
            id="englishTestCode"
            showSearch
            optionFilterProp="label"
            placeholder="Select test"
            value={form.englishTestCode || undefined}
            options={options.englishTest}
            onChange={(value) => onChange('englishTestCode', asSelectString(value))}
          />
        </Field>
        <Field id="testStatusCode" label="Test Status">
          <FormSelect
            id="testStatusCode"
            placeholder="Select status"
            value={form.testStatusCode || undefined}
            options={options.testStatus}
            onChange={(value) => onChange('testStatusCode', asSelectString(value))}
          />
        </Field>
        {showEnglishDetail ? (
          <>
            <Field id="overallScore" label="Overall Score" error={errors.overallScore}>
              <FormInput
                id="overallScore"
                value={form.overallScore}
                placeholder="e.g. 6.5"
                onChange={(event) => onChange('overallScore', event.target.value)}
              />
            </Field>
            <Field id="testDate" label="Test Date">
              <DatePicker
                id="testDate"
                allowClear
                value={toDayjs(form.testDate)}
                onChange={(value) => onChange('testDate', toDateString(value))}
              />
            </Field>
          </>
        ) : null}
      </FormSection>

      <FormSection id="financial" title="Financial Information">
        <Field id="estimatedBudgetCode" label="Estimated Budget" error={errors.estimatedBudgetCode}>
          <FormSelect
            id="estimatedBudgetCode"
            showSearch
            optionFilterProp="label"
            placeholder="Select budget"
            value={form.estimatedBudgetCode || undefined}
            options={options.budget}
            onChange={(value) => onChange('estimatedBudgetCode', asSelectString(value))}
          />
        </Field>
        <Field id="fundingSourceCode" label="Funding Source">
          <FormSelect
            id="fundingSourceCode"
            placeholder="Select source"
            value={form.fundingSourceCode || undefined}
            options={options.funding}
            onChange={(value) => onChange('fundingSourceCode', asSelectString(value))}
          />
        </Field>
        <Field id="financialReadinessCode" label="Financial Readiness">
          <FormSelect
            id="financialReadinessCode"
            placeholder="Select readiness"
            value={form.financialReadinessCode || undefined}
            options={options.financial}
            onChange={(value) => onChange('financialReadinessCode', asSelectString(value))}
          />
        </Field>
      </FormSection>

      <FormSection id="visa" title="Visa & Application History">
        <Field id="previouslyAppliedAbroad" label="Previously Applied Abroad?">
          <FormSelect
            id="previouslyAppliedAbroad"
            placeholder="Select"
            value={form.previouslyAppliedAbroad || undefined}
            options={YES_NO}
            onChange={(value) => onChange('previouslyAppliedAbroad', asSelectString(value))}
          />
        </Field>
        <Field id="previousVisaApplication" label="Previous Visa Application?">
          <FormSelect
            id="previousVisaApplication"
            placeholder="Select"
            value={form.previousVisaApplication || undefined}
            options={YES_NO}
            onChange={(value) => onChange('previousVisaApplication', asSelectString(value))}
          />
        </Field>
        <Field id="previousVisaRefusal" label="Previous Visa Refusal?">
          <FormSelect
            id="previousVisaRefusal"
            placeholder="Select"
            value={form.previousVisaRefusal || undefined}
            options={YES_NO}
            onChange={(value) => onChange('previousVisaRefusal', asSelectString(value))}
          />
        </Field>
        {showVisaApp ? (
          <>
            <Field id="prevVisaCountry" label="Previous Country">
              <FormInput
                id="prevVisaCountry"
                value={form.prevVisaCountry}
                onChange={(event) => onChange('prevVisaCountry', event.target.value)}
              />
            </Field>
            <Field id="prevVisaType" label="Visa Type">
              <FormInput
                id="prevVisaType"
                value={form.prevVisaType}
                onChange={(event) => onChange('prevVisaType', event.target.value)}
              />
            </Field>
            <Field id="prevVisaYear" label="Application Year">
              <FormSelect
                id="prevVisaYear"
                showSearch
                placeholder="Year"
                value={form.prevVisaYear || undefined}
                options={YEARS}
                onChange={(value) => onChange('prevVisaYear', asSelectString(value))}
              />
            </Field>
            <Field id="prevVisaResult" label="Application Result">
              <FormInput
                id="prevVisaResult"
                value={form.prevVisaResult}
                onChange={(event) => onChange('prevVisaResult', event.target.value)}
              />
            </Field>
          </>
        ) : null}
        {showRefusal ? (
          <>
            <Field id="refusalCountry" label="Refusal Country">
              <FormInput
                id="refusalCountry"
                value={form.refusalCountry}
                onChange={(event) => onChange('refusalCountry', event.target.value)}
              />
            </Field>
            <Field id="refusalYear" label="Refusal Year">
              <FormSelect
                id="refusalYear"
                showSearch
                placeholder="Year"
                value={form.refusalYear || undefined}
                options={YEARS}
                onChange={(value) => onChange('refusalYear', asSelectString(value))}
              />
            </Field>
            <Field id="refusalReason" label="Refusal Reason">
              <FormInput
                id="refusalReason"
                value={form.refusalReason}
                onChange={(event) => onChange('refusalReason', event.target.value)}
              />
            </Field>
          </>
        ) : null}
      </FormSection>

      <FormSection id="intent" title="Lead Intent">
        <Field id="decisionTimelineCode" label="Decision Timeline">
          <FormSelect
            id="decisionTimelineCode"
            placeholder="Select timeline"
            value={form.decisionTimelineCode || undefined}
            options={options.timeline}
            onChange={(value) => onChange('decisionTimelineCode', asSelectString(value))}
          />
        </Field>
        <Field id="decisionMakerCode" label="Decision Maker">
          <FormSelect
            id="decisionMakerCode"
            placeholder="Select decision maker"
            value={form.decisionMakerCode || undefined}
            options={options.decisionMaker}
            onChange={(value) => onChange('decisionMakerCode', asSelectString(value))}
          />
        </Field>
        <Field id="applicationReadinessCode" label="Application Readiness">
          <FormSelect
            id="applicationReadinessCode"
            placeholder="Select readiness"
            value={form.applicationReadinessCode || undefined}
            options={options.appReady}
            onChange={(value) => onChange('applicationReadinessCode', asSelectString(value))}
          />
        </Field>
        <Field id="studyIntentCode" label="Study Intent">
          <FormSelect
            id="studyIntentCode"
            placeholder="Select intent"
            value={form.studyIntentCode || undefined}
            options={options.studyIntent}
            onChange={(value) => onChange('studyIntentCode', asSelectString(value))}
          />
        </Field>
      </FormSection>

      <FormSection id="communication" title="Communication Preference">
        <Field id="preferredContactMethodCode" label="Preferred Contact Method">
          <FormSelect
            id="preferredContactMethodCode"
            placeholder="Select method"
            value={form.preferredContactMethodCode || undefined}
            options={options.contactMethod}
            onChange={(value) => onChange('preferredContactMethodCode', asSelectString(value))}
          />
        </Field>
        <Field id="preferredContactTimeCode" label="Preferred Contact Time">
          <FormSelect
            id="preferredContactTimeCode"
            placeholder="Select time"
            value={form.preferredContactTimeCode || undefined}
            options={options.contactTime}
            onChange={(value) => onChange('preferredContactTimeCode', asSelectString(value))}
          />
        </Field>
        {showSpecificTime ? (
          <Field id="specificContactTime" label="Specific Time">
            <FormInput
              id="specificContactTime"
              value={form.specificContactTime}
              placeholder="e.g. 7:00 PM"
              onChange={(event) => onChange('specificContactTime', event.target.value)}
            />
          </Field>
        ) : null}
      </FormSection>

      <FormSection id="lead-info" title="Lead Information">
        <Field id="sourceCode" label="Lead Source" required error={errors.sourceCode}>
          <FormSelect
            id="sourceCode"
            showSearch
            optionFilterProp="label"
            placeholder="Select source"
            disabled={sourceLocked}
            value={form.sourceCode || undefined}
            options={options.source}
            onChange={(value) => onChange('sourceCode', asSelectString(value))}
          />
        </Field>
        <Field id="campaign" label="Campaign">
          <FormInput
            id="campaign"
            value={form.campaign}
            disabled={sourceLocked}
            placeholder="Optional campaign / UTM"
            onChange={(event) => onChange('campaign', event.target.value)}
          />
        </Field>
        <Field id="remarks" label="Remarks" span error={errors.remarks}>
          <FormTextArea
            id="remarks"
            value={form.remarks}
            rows={3}
            placeholder="Initial notes"
            onChange={(event) => onChange('remarks', event.target.value)}
          />
        </Field>
      </FormSection>
    </div>
  )
}
