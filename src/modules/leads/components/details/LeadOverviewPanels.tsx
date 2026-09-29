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
import type { MasterOption } from '../../hooks/useLeadMasterOptions'
import type { LeadRecord } from '../../types'
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

export default function LeadOverviewPanels({
  lead,
  options,
}: {
  lead: LeadRecord
  options: ReturnType<typeof import('../../hooks/useLeadMasterOptions').useLeadMasterOptions>
}) {
  const visaSummary =
    yesNoLabel(lead.previousVisaApplication) ||
    yesNoLabel(lead.previouslyAppliedAbroad) ||
    (lead.previousVisaRefusal ? 'Previous refusal' : '')
  const languageSummary = [optionLabel(options.englishTest, lead.englishTestCode), optionLabel(options.testStatus, lead.testStatusCode)]
    .filter(Boolean)
    .join(' · ')
  const notes = (lead.notes || lead.remarks || '').trim()

  return (
    <div className="grid gap-4">
      <LeadSectionCard title="Lead Information">
        <div className={GRID}>
          <LeadInfoField icon={UserIcon} label="Full Name" value={lead.name} />
          <LeadInfoField icon={Call02Icon} label="Phone Number" value={lead.phone} />
          <LeadInfoField
            icon={WhatsappIcon}
            label="WhatsApp Number"
            value={lead.whatsappSameAsPhone ? 'Same as phone' : lead.whatsapp}
          />
          <LeadInfoField icon={Mail01Icon} label="Email" value={lead.email} />
          <LeadInfoField icon={Calendar03Icon} label="Date of Birth" value={formatDob(lead.dateOfBirth)} />
          <LeadInfoField icon={Location01Icon} label="Current Location" value={lead.currentLocation} />
          <LeadInfoField icon={Globe02Icon} label="Lead Source" value={lead.source || optionLabel(options.source, lead.sourceCode)} />
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

      <LeadSectionCard title="Academic Information">
        <div className={GRID}>
          <LeadInfoField
            icon={Mortarboard01Icon}
            label="Highest Qualification"
            value={optionLabel(options.education, lead.highestQualificationCode)}
          />
          <LeadInfoField icon={Building03Icon} label="University / Institution" value={lead.institutionName} />
          <LeadInfoField icon={Calendar03Icon} label="Graduation Year" value={lead.passingYear} />
          <LeadInfoField icon={BookOpen01Icon} label="Field of Study" value={lead.preferredCourse} />
          <LeadInfoField icon={StarIcon} label="GPA / Grade" value={lead.resultCgpa} />
        </div>
      </LeadSectionCard>

      <LeadSectionCard title="Study & Visa Information">
        <div className={GRID}>
          <LeadInfoField icon={Flag01Icon} label="Preferred Country" value={optionLabel(options.country, lead.preferredCountryCode)} />
          <LeadInfoField icon={BookOpen01Icon} label="Preferred Program" value={lead.preferredCourse} />
          <LeadInfoField icon={Calendar03Icon} label="Intake" value={optionLabel(options.intake, lead.preferredIntakeCode)} />
          <LeadInfoField icon={Mortarboard01Icon} label="Intended Study Level" value={optionLabel(options.degree, lead.preferredDegreeCode)} />
          <LeadInfoField icon={Globe02Icon} label="Visa History" value={visaSummary} />
          <LeadInfoField icon={BookOpen01Icon} label="Language & Test" value={languageSummary} />
        </div>
      </LeadSectionCard>

      <LeadSectionCard title="Notes">
        {notes ? (
          <p className="m-0 whitespace-pre-wrap text-[0.92rem] text-[#17324f] dark:text-text-strong">{notes}</p>
        ) : (
          <p className="m-0 text-[0.88rem] text-[#9aa6b2] dark:text-text-faint">No notes yet.</p>
        )}
      </LeadSectionCard>
    </div>
  )
}

export function LeadAcademicPanel({
  lead,
  options,
}: {
  lead: LeadRecord
  options: { education: MasterOption[]; englishTest: MasterOption[]; testStatus: MasterOption[]; budget: MasterOption[]; funding: MasterOption[]; financial: MasterOption[] }
}) {
  return (
    <div className="grid gap-4">
      <LeadSectionCard title="Academic Information">
        <div className={GRID}>
          <LeadInfoField icon={Mortarboard01Icon} label="Highest Qualification" value={optionLabel(options.education, lead.highestQualificationCode)} />
          <LeadInfoField icon={Building03Icon} label="University / Institution" value={lead.institutionName} />
          <LeadInfoField icon={Calendar03Icon} label="Graduation Year" value={lead.passingYear} />
          <LeadInfoField icon={BookOpen01Icon} label="Field of Study" value={lead.preferredCourse} />
          <LeadInfoField icon={StarIcon} label="GPA / Grade" value={lead.resultCgpa} />
        </div>
      </LeadSectionCard>
      <LeadSectionCard title="Language & Test">
        <div className={GRID}>
          <LeadInfoField icon={BookOpen01Icon} label="English Test" value={optionLabel(options.englishTest, lead.englishTestCode)} />
          <LeadInfoField icon={CheckmarkCircle02Icon} label="Test Status" value={optionLabel(options.testStatus, lead.testStatusCode)} />
          <LeadInfoField icon={StarIcon} label="Overall Score" value={lead.overallScore} />
        </div>
      </LeadSectionCard>
      <LeadSectionCard title="Financial Information">
        <div className={GRID}>
          <LeadInfoField icon={StarIcon} label="Estimated Budget" value={optionLabel(options.budget, lead.estimatedBudgetCode)} />
          <LeadInfoField icon={Globe02Icon} label="Funding Source" value={optionLabel(options.funding, lead.fundingSourceCode)} />
          <LeadInfoField icon={CheckmarkCircle02Icon} label="Financial Readiness" value={optionLabel(options.financial, lead.financialReadinessCode)} />
        </div>
      </LeadSectionCard>
    </div>
  )
}

export function LeadStudyVisaPanel({
  lead,
  options,
}: {
  lead: LeadRecord
  options: { country: MasterOption[]; degree: MasterOption[]; intake: MasterOption[]; englishTest: MasterOption[] }
}) {
  const visaSummary =
    yesNoLabel(lead.previousVisaApplication) || yesNoLabel(lead.previouslyAppliedAbroad) || (lead.previousVisaRefusal ? 'Previous refusal' : '')
  const languageSummary = [optionLabel(options.englishTest, lead.englishTestCode)].filter(Boolean).join(' · ')

  return (
    <LeadSectionCard title="Study & Visa Information">
      <div className={GRID}>
        <LeadInfoField icon={Flag01Icon} label="Preferred Country" value={optionLabel(options.country, lead.preferredCountryCode)} />
        <LeadInfoField icon={BookOpen01Icon} label="Preferred Program" value={lead.preferredCourse} />
        <LeadInfoField icon={Calendar03Icon} label="Intake" value={optionLabel(options.intake, lead.preferredIntakeCode)} />
        <LeadInfoField icon={Mortarboard01Icon} label="Intended Study Level" value={optionLabel(options.degree, lead.preferredDegreeCode)} />
        <LeadInfoField icon={Globe02Icon} label="Visa History" value={visaSummary} />
        <LeadInfoField icon={BookOpen01Icon} label="Language & Test" value={languageSummary} />
        <LeadInfoField icon={Globe02Icon} label="Previous Visa Refusal" value={yesNoLabel(lead.previousVisaRefusal)} />
      </div>
    </LeadSectionCard>
  )
}
