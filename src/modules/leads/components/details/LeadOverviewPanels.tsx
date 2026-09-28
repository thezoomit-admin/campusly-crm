import { DatePicker, Switch } from 'antd'
import dayjs from 'dayjs'
import {
  BookOpen01Icon,
  Building03Icon,
  Calendar03Icon,
  Call02Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Flag01Icon,
  Globe02Icon,
  Location01Icon,
  Mail01Icon,
  Mortarboard01Icon,
  StarIcon,
  UserIcon,
  WhatsappIcon,
} from '@hugeicons/core-free-icons'
import { FormInput, FormSelect, FormTextArea } from '@/components/common/Forms'
import type { MasterOption } from '../../hooks/useLeadMasterOptions'
import type { LeadFormState, LeadRecord } from '../../types'
import {
  formatDisplayDateTime,
  formatDob,
  optionLabel,
  stageBadgeClass,
  yesNoLabel,
} from '../../utils/leadDetails'
import LeadInfoField from './LeadInfoField'
import LeadSectionCard from './LeadSectionCard'

const GRID = 'grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3'
const YES_NO = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
]

function asSelectString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export default function LeadOverviewPanels({
  lead,
  form,
  errors,
  options,
  canEdit,
  editing,
  saving,
  onEdit,
  onCancel,
  onSave,
  onChange,
  onWhatsAppToggle,
  notesDraft,
  onNotesDraftChange,
  onNotesSave,
  notesSaving,
}: {
  lead: LeadRecord
  form: LeadFormState
  errors: Record<string, string>
  options: ReturnType<typeof import('../../hooks/useLeadMasterOptions').useLeadMasterOptions>
  canEdit: boolean
  editing: 'lead' | 'academic' | 'study' | 'notes' | 'all' | null
  saving: boolean
  onEdit: (section: 'lead' | 'academic' | 'study') => void
  onCancel: () => void
  onSave: () => void
  onChange: (key: keyof LeadFormState, value: string | boolean) => void
  onWhatsAppToggle: (checked: boolean) => void
  notesDraft: string
  onNotesDraftChange: (value: string) => void
  onNotesSave: () => void
  notesSaving: boolean
}) {
  const leadEditing = editing === 'lead' || editing === 'all'
  const academicEditing = editing === 'academic' || editing === 'all'
  const studyEditing = editing === 'study' || editing === 'all'
  const visaSummary =
    yesNoLabel(lead.previousVisaApplication) ||
    yesNoLabel(lead.previouslyAppliedAbroad) ||
    (lead.previousVisaRefusal ? 'Previous refusal' : '')
  const languageSummary = [optionLabel(options.englishTest, lead.englishTestCode), optionLabel(options.testStatus, lead.testStatusCode)]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="grid gap-4">
      <LeadSectionCard
        title="Lead Information"
        canEdit={canEdit}
        editing={leadEditing}
        saving={saving}
        onEdit={() => onEdit('lead')}
        onCancel={onCancel}
        onSave={onSave}
      >
        <div className={GRID}>
          <LeadInfoField icon={UserIcon} label="Full Name" value={lead.name} editing={leadEditing} empty="Full name">
            <FormInput value={form.name} status={errors.name ? 'error' : undefined} onChange={(event) => onChange('name', event.target.value)} />
          </LeadInfoField>
          <LeadInfoField icon={Call02Icon} label="Phone Number" value={lead.phone} editing={leadEditing} empty="Phone number">
            <FormInput value={form.phone} status={errors.phone ? 'error' : undefined} onChange={(event) => onChange('phone', event.target.value)} />
          </LeadInfoField>
          <LeadInfoField
            icon={WhatsappIcon}
            label="WhatsApp Number"
            value={lead.whatsappSameAsPhone ? 'Same as phone' : lead.whatsapp}
            empty="WhatsApp number"
            editing={leadEditing}
            extra={
              <Switch
                size="small"
                checked={leadEditing ? form.whatsappSameAsPhone : lead.whatsappSameAsPhone}
                onChange={(checked) => {
                  if (leadEditing) onChange('whatsappSameAsPhone', checked)
                  else void onWhatsAppToggle(checked)
                }}
              />
            }
          >
            <FormInput
              value={form.whatsappSameAsPhone ? form.phone : form.whatsapp}
              disabled={form.whatsappSameAsPhone}
              onChange={(event) => onChange('whatsapp', event.target.value)}
            />
          </LeadInfoField>
          <LeadInfoField icon={Mail01Icon} label="Email" value={lead.email} editing={leadEditing} empty="Email address">
            <FormInput value={form.email} status={errors.email ? 'error' : undefined} onChange={(event) => onChange('email', event.target.value.toLowerCase())} />
          </LeadInfoField>
          <LeadInfoField icon={Calendar03Icon} label="Date of Birth" value={formatDob(lead.dateOfBirth)} empty="dd/mm/yyyy" editing={leadEditing}>
            <DatePicker
              allowClear
              className="w-full"
              value={form.dateOfBirth ? dayjs(form.dateOfBirth) : null}
              disabledDate={(current) => current.isAfter(dayjs(), 'day')}
              onChange={(value) => onChange('dateOfBirth', value ? value.format('YYYY-MM-DD') : '')}
            />
          </LeadInfoField>
          <LeadInfoField icon={Location01Icon} label="Current Location" value={lead.currentLocation} empty="City, Country" editing={leadEditing}>
            <FormInput value={form.currentLocation} placeholder="City, Country" onChange={(event) => onChange('currentLocation', event.target.value)} />
          </LeadInfoField>
          <LeadInfoField
            icon={Globe02Icon}
            label="Lead Source"
            value={lead.source || optionLabel(options.source, lead.sourceCode)}
            empty="Select source"
            editing={leadEditing}
          >
            <FormSelect
              showSearch
              optionFilterProp="label"
              disabled={lead.sourceLocked}
              placeholder="Select source"
              value={form.sourceCode || undefined}
              options={options.source}
              onChange={(value) => onChange('sourceCode', asSelectString(value))}
            />
          </LeadInfoField>
          <LeadInfoField icon={Clock01Icon} label="Created On" value={formatDisplayDateTime(lead.createdAt)} />
          <LeadInfoField icon={UserIcon} label="Assigned Counsellor" value={lead.owner?.name} empty="Unassigned" />
          <LeadInfoField
            icon={CheckmarkCircle02Icon}
            label="Current Stage"
            valueNode={
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.72rem] font-semibold ${stageBadgeClass(lead.status)}`}>
                <span className="size-1.5 rounded-full bg-current" />
                {lead.status}
              </span>
            }
          />
        </div>
      </LeadSectionCard>

      <LeadSectionCard
        title="Academic Information"
        canEdit={canEdit}
        editing={academicEditing}
        saving={saving}
        onEdit={() => onEdit('academic')}
        onCancel={onCancel}
        onSave={onSave}
      >
        <div className={GRID}>
          <LeadInfoField
            icon={Mortarboard01Icon}
            label="Highest Qualification"
            value={optionLabel(options.education, lead.highestQualificationCode)}
            empty="Select qualification"
            editing={academicEditing}
          >
            <FormSelect
              showSearch
              optionFilterProp="label"
              placeholder="Select qualification"
              value={form.highestQualificationCode || undefined}
              options={options.education}
              onChange={(value) => onChange('highestQualificationCode', asSelectString(value))}
            />
          </LeadInfoField>
          <LeadInfoField
            icon={Building03Icon}
            label="University / Institution"
            value={lead.institutionName}
            empty="Not specified"
            editing={academicEditing}
          >
            <FormInput value={form.institutionName} placeholder="College or university" onChange={(event) => onChange('institutionName', event.target.value)} />
          </LeadInfoField>
          <LeadInfoField icon={Calendar03Icon} label="Graduation Year" value={lead.passingYear} empty="Select year" editing={academicEditing}>
            <FormSelect
              showSearch
              placeholder="Select year"
              value={form.passingYear || undefined}
              options={yearOptions()}
              onChange={(value) => onChange('passingYear', asSelectString(value))}
            />
          </LeadInfoField>
          <LeadInfoField icon={BookOpen01Icon} label="Field of Study" value={lead.preferredCourse} empty="Not specified" editing={academicEditing}>
            <FormInput value={form.preferredCourse} placeholder="e.g. Computer Science" onChange={(event) => onChange('preferredCourse', event.target.value)} />
          </LeadInfoField>
          <LeadInfoField icon={StarIcon} label="GPA / Grade" value={lead.resultCgpa} empty="e.g. 3.5 or A" editing={academicEditing}>
            <FormInput value={form.resultCgpa} placeholder="e.g. 3.5 or A" onChange={(event) => onChange('resultCgpa', event.target.value)} />
          </LeadInfoField>
        </div>
      </LeadSectionCard>

      <LeadSectionCard
        title="Study & Visa Information"
        canEdit={canEdit}
        editing={studyEditing}
        saving={saving}
        onEdit={() => onEdit('study')}
        onCancel={onCancel}
        onSave={onSave}
      >
        <div className={GRID}>
          <LeadInfoField
            icon={Flag01Icon}
            label="Preferred Country"
            value={optionLabel(options.country, lead.preferredCountryCode)}
            empty="Select country"
            editing={studyEditing}
          >
            <FormSelect
              showSearch
              optionFilterProp="label"
              placeholder="Select country"
              value={form.preferredCountryCode || undefined}
              options={options.country}
              onChange={(value) => onChange('preferredCountryCode', asSelectString(value))}
            />
          </LeadInfoField>
          <LeadInfoField icon={BookOpen01Icon} label="Preferred Program" value={lead.preferredCourse} empty="Select program" editing={studyEditing}>
            <FormInput value={form.preferredCourse} placeholder="Select program" onChange={(event) => onChange('preferredCourse', event.target.value)} />
          </LeadInfoField>
          <LeadInfoField
            icon={Calendar03Icon}
            label="Intake"
            value={optionLabel(options.intake, lead.preferredIntakeCode)}
            empty="Select intake"
            editing={studyEditing}
          >
            <FormSelect
              showSearch
              optionFilterProp="label"
              placeholder="Select intake"
              value={form.preferredIntakeCode || undefined}
              options={options.intake}
              onChange={(value) => onChange('preferredIntakeCode', asSelectString(value))}
            />
          </LeadInfoField>
          <LeadInfoField
            icon={Mortarboard01Icon}
            label="Intended Study Level"
            value={optionLabel(options.degree, lead.preferredDegreeCode)}
            empty="Select level"
            editing={studyEditing}
          >
            <FormSelect
              showSearch
              optionFilterProp="label"
              placeholder="Select level"
              value={form.preferredDegreeCode || undefined}
              options={options.degree}
              onChange={(value) => onChange('preferredDegreeCode', asSelectString(value))}
            />
          </LeadInfoField>
          <LeadInfoField icon={Globe02Icon} label="Visa History" value={visaSummary} empty="Select visa history" editing={studyEditing}>
            <FormSelect
              placeholder="Previous visa application?"
              value={form.previousVisaApplication || undefined}
              options={YES_NO}
              onChange={(value) => onChange('previousVisaApplication', asSelectString(value))}
            />
          </LeadInfoField>
          <LeadInfoField icon={BookOpen01Icon} label="Language & Test" value={languageSummary} empty="Select test" editing={studyEditing}>
            <FormSelect
              placeholder="Select test"
              value={form.englishTestCode || undefined}
              options={options.englishTest}
              onChange={(value) => onChange('englishTestCode', asSelectString(value))}
            />
          </LeadInfoField>
        </div>
      </LeadSectionCard>

      <LeadSectionCard title="Notes">
        <div className="relative">
          <FormTextArea
            rows={3}
            value={notesDraft}
            placeholder="Add your notes here..."
            className="!rounded-xl !bg-[#f7fafc] pr-12 dark:!bg-input-bg"
            onChange={(event) => onNotesDraftChange(event.target.value)}
          />
          {canEdit ? (
            <button
              type="button"
              className="absolute right-3 bottom-3 grid size-8 cursor-pointer place-items-center rounded-full border-0 bg-primary text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
              disabled={notesSaving}
              aria-label="Save note"
              onClick={onNotesSave}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2 11 13" />
                <path d="m22 2-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          ) : null}
        </div>
      </LeadSectionCard>
    </div>
  )
}

export function LeadAcademicPanel({
  lead,
  form,
  options,
  canEdit,
  editing,
  saving,
  onEdit,
  onCancel,
  onSave,
  onChange,
}: {
  lead: LeadRecord
  form: LeadFormState
  options: { education: MasterOption[]; englishTest: MasterOption[]; testStatus: MasterOption[]; budget: MasterOption[]; funding: MasterOption[]; financial: MasterOption[] }
  canEdit: boolean
  editing: boolean
  saving: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onChange: (key: keyof LeadFormState, value: string | boolean) => void
}) {
  return (
    <div className="grid gap-4">
      <LeadSectionCard title="Academic Information" canEdit={canEdit} editing={editing} saving={saving} onEdit={onEdit} onCancel={onCancel} onSave={onSave}>
        <div className={GRID}>
          <LeadInfoField icon={Mortarboard01Icon} label="Highest Qualification" value={optionLabel(options.education, lead.highestQualificationCode)} empty="Select qualification" editing={editing}>
            <FormSelect showSearch optionFilterProp="label" value={form.highestQualificationCode || undefined} options={options.education} onChange={(value) => onChange('highestQualificationCode', asSelectString(value))} />
          </LeadInfoField>
          <LeadInfoField icon={Building03Icon} label="University / Institution" value={lead.institutionName} empty="Not specified" editing={editing}>
            <FormInput value={form.institutionName} onChange={(event) => onChange('institutionName', event.target.value)} />
          </LeadInfoField>
          <LeadInfoField icon={Calendar03Icon} label="Graduation Year" value={lead.passingYear} empty="Select year" editing={editing}>
            <FormSelect showSearch value={form.passingYear || undefined} options={yearOptions()} onChange={(value) => onChange('passingYear', asSelectString(value))} />
          </LeadInfoField>
          <LeadInfoField icon={BookOpen01Icon} label="Field of Study" value={lead.preferredCourse} empty="Not specified" editing={editing}>
            <FormInput value={form.preferredCourse} onChange={(event) => onChange('preferredCourse', event.target.value)} />
          </LeadInfoField>
          <LeadInfoField icon={StarIcon} label="GPA / Grade" value={lead.resultCgpa} empty="e.g. 3.5 or A" editing={editing}>
            <FormInput value={form.resultCgpa} onChange={(event) => onChange('resultCgpa', event.target.value)} />
          </LeadInfoField>
        </div>
      </LeadSectionCard>
      <LeadSectionCard title="Language & Test" canEdit={canEdit} editing={editing} saving={saving} onEdit={onEdit} onCancel={onCancel} onSave={onSave}>
        <div className={GRID}>
          <LeadInfoField icon={BookOpen01Icon} label="English Test" value={optionLabel(options.englishTest, lead.englishTestCode)} empty="Select test" editing={editing}>
            <FormSelect value={form.englishTestCode || undefined} options={options.englishTest} onChange={(value) => onChange('englishTestCode', asSelectString(value))} />
          </LeadInfoField>
          <LeadInfoField icon={CheckmarkCircle02Icon} label="Test Status" value={optionLabel(options.testStatus, lead.testStatusCode)} empty="Select status" editing={editing}>
            <FormSelect value={form.testStatusCode || undefined} options={options.testStatus} onChange={(value) => onChange('testStatusCode', asSelectString(value))} />
          </LeadInfoField>
          <LeadInfoField icon={StarIcon} label="Overall Score" value={lead.overallScore} empty="e.g. 6.5" editing={editing}>
            <FormInput value={form.overallScore} onChange={(event) => onChange('overallScore', event.target.value)} />
          </LeadInfoField>
        </div>
      </LeadSectionCard>
      <LeadSectionCard title="Financial Information" canEdit={canEdit} editing={editing} saving={saving} onEdit={onEdit} onCancel={onCancel} onSave={onSave}>
        <div className={GRID}>
          <LeadInfoField icon={StarIcon} label="Estimated Budget" value={optionLabel(options.budget, lead.estimatedBudgetCode)} empty="Select budget" editing={editing}>
            <FormSelect value={form.estimatedBudgetCode || undefined} options={options.budget} onChange={(value) => onChange('estimatedBudgetCode', asSelectString(value))} />
          </LeadInfoField>
          <LeadInfoField icon={Globe02Icon} label="Funding Source" value={optionLabel(options.funding, lead.fundingSourceCode)} empty="Select source" editing={editing}>
            <FormSelect value={form.fundingSourceCode || undefined} options={options.funding} onChange={(value) => onChange('fundingSourceCode', asSelectString(value))} />
          </LeadInfoField>
          <LeadInfoField icon={CheckmarkCircle02Icon} label="Financial Readiness" value={optionLabel(options.financial, lead.financialReadinessCode)} empty="Select readiness" editing={editing}>
            <FormSelect value={form.financialReadinessCode || undefined} options={options.financial} onChange={(value) => onChange('financialReadinessCode', asSelectString(value))} />
          </LeadInfoField>
        </div>
      </LeadSectionCard>
    </div>
  )
}

export function LeadStudyVisaPanel({
  lead,
  form,
  options,
  canEdit,
  editing,
  saving,
  onEdit,
  onCancel,
  onSave,
  onChange,
}: {
  lead: LeadRecord
  form: LeadFormState
  options: { country: MasterOption[]; degree: MasterOption[]; intake: MasterOption[]; englishTest: MasterOption[] }
  canEdit: boolean
  editing: boolean
  saving: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onChange: (key: keyof LeadFormState, value: string | boolean) => void
}) {
  const visaSummary =
    yesNoLabel(lead.previousVisaApplication) || yesNoLabel(lead.previouslyAppliedAbroad) || (lead.previousVisaRefusal ? 'Previous refusal' : '')
  const languageSummary = [optionLabel(options.englishTest, lead.englishTestCode)].filter(Boolean).join(' · ')

  return (
    <LeadSectionCard title="Study & Visa Information" canEdit={canEdit} editing={editing} saving={saving} onEdit={onEdit} onCancel={onCancel} onSave={onSave}>
      <div className={GRID}>
        <LeadInfoField icon={Flag01Icon} label="Preferred Country" value={optionLabel(options.country, lead.preferredCountryCode)} empty="Select country" editing={editing}>
          <FormSelect showSearch optionFilterProp="label" value={form.preferredCountryCode || undefined} options={options.country} onChange={(value) => onChange('preferredCountryCode', asSelectString(value))} />
        </LeadInfoField>
        <LeadInfoField icon={BookOpen01Icon} label="Preferred Program" value={lead.preferredCourse} empty="Select program" editing={editing}>
          <FormInput value={form.preferredCourse} onChange={(event) => onChange('preferredCourse', event.target.value)} />
        </LeadInfoField>
        <LeadInfoField icon={Calendar03Icon} label="Intake" value={optionLabel(options.intake, lead.preferredIntakeCode)} empty="Select intake" editing={editing}>
          <FormSelect showSearch optionFilterProp="label" value={form.preferredIntakeCode || undefined} options={options.intake} onChange={(value) => onChange('preferredIntakeCode', asSelectString(value))} />
        </LeadInfoField>
        <LeadInfoField icon={Mortarboard01Icon} label="Intended Study Level" value={optionLabel(options.degree, lead.preferredDegreeCode)} empty="Select level" editing={editing}>
          <FormSelect showSearch optionFilterProp="label" value={form.preferredDegreeCode || undefined} options={options.degree} onChange={(value) => onChange('preferredDegreeCode', asSelectString(value))} />
        </LeadInfoField>
        <LeadInfoField icon={Globe02Icon} label="Visa History" value={visaSummary} empty="Select visa history" editing={editing}>
          <FormSelect value={form.previousVisaApplication || undefined} options={YES_NO} onChange={(value) => onChange('previousVisaApplication', asSelectString(value))} />
        </LeadInfoField>
        <LeadInfoField icon={BookOpen01Icon} label="Language & Test" value={languageSummary} empty="Select test" editing={editing}>
          <FormSelect value={form.englishTestCode || undefined} options={options.englishTest} onChange={(value) => onChange('englishTestCode', asSelectString(value))} />
        </LeadInfoField>
        <LeadInfoField icon={Globe02Icon} label="Previous Visa Refusal" value={yesNoLabel(lead.previousVisaRefusal)} empty="Select" editing={editing}>
          <FormSelect value={form.previousVisaRefusal || undefined} options={YES_NO} onChange={(value) => onChange('previousVisaRefusal', asSelectString(value))} />
        </LeadInfoField>
      </div>
    </LeadSectionCard>
  )
}

function yearOptions() {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: currentYear - 1984 }, (_, index) => {
    const year = String(currentYear - index)
    return { value: year, label: year }
  })
}
