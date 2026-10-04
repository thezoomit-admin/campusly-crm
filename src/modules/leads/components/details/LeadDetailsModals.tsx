import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Modal, Spin } from 'antd'
import dayjs from 'dayjs'
import { HugeiconsIcon } from '@hugeicons/react'
import { CloudUploadIcon } from '@hugeicons/core-free-icons'
import { PrimaryButton } from '@/components/ui'
import { FormDatePicker, FormInput, FormSelect, FormSwitch, FormTextArea, InputError } from '@/components/common/Forms'
import { AntModal } from '@/components/common/Modals'
import { useListLeadAssigneesQuery } from '../../api/leadsApi'
import type { MasterOption } from '../../hooks/useLeadMasterOptions'
import type { LeadRecord, LeadStatusOption } from '../../types'
import { optionLabel } from '../../utils/leadDetails'
import {
  ACTIVITY_TYPE_OPTIONS,
  outcomesForActivityType,
} from '@/modules/activities/activityConstants'

const LEAD_DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx'
const LEAD_DOCUMENT_MAX_BYTES = 5 * 1024 * 1024

function asSelectString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function isImageMime(mimeType: string) {
  return mimeType.startsWith('image/')
}

function isPdfMime(mimeType: string, fileName = '') {
  return mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')
}

export function ViewLeadDocumentModal({
  open,
  fileName,
  mimeType,
  url,
  loading,
  onClose,
}: {
  open: boolean
  fileName: string
  mimeType: string
  url: string
  loading?: boolean
  onClose: () => void
}) {
  return (
    <AntModal open={open} onClose={onClose} title={fileName || 'Document preview'} width={860}>
      <div className="overflow-hidden rounded-xl border border-border bg-[color-mix(in_srgb,var(--color-page-bg)_70%,var(--color-surface))] [&_img]:mx-auto [&_img]:max-h-[65vh] [&_img]:max-w-full [&_img]:object-contain [&_iframe]:h-[65vh] [&_iframe]:w-full [&_iframe]:border-0">
        {loading || !url ? (
          <div className="grid min-h-[240px] place-items-center p-8">
            <Spin />
          </div>
        ) : isImageMime(mimeType) ? (
          <img src={url} alt={fileName} />
        ) : isPdfMime(mimeType, fileName) ? (
          <iframe title={fileName} src={url} />
        ) : (
          <div className="grid min-h-[240px] place-items-center gap-3 p-8 text-center">
            <p className="m-0 text-[0.9rem] text-text-muted">Preview is not available for this file type.</p>
            <a
              href={url}
              download={fileName}
              className="text-[0.9rem] font-medium text-primary no-underline hover:underline"
            >
              Download {fileName}
            </a>
          </div>
        )}
      </div>
    </AntModal>
  )
}

export function AddLeadDocumentModal({
  open,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean
  saving: boolean
  onClose: () => void
  onSubmit: (body: { fileName: string; file: File }) => Promise<void>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setFileName('')
      setFile(null)
      setError('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [open])

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] || null
    setError('')
    if (!selected) {
      setFile(null)
      return
    }
    if (selected.size > LEAD_DOCUMENT_MAX_BYTES) {
      setFile(null)
      setError('Document must be 5 MB or smaller.')
      event.target.value = ''
      return
    }
    setFile(selected)
    setFileName((current) => current.trim() || selected.name.replace(/\.[^.]+$/, '') || selected.name)
  }

  async function handleSubmit() {
    const trimmed = fileName.trim()
    if (!trimmed) {
      setError('File name is required.')
      return
    }
    if (!file) {
      setError('Please select a file to upload.')
      return
    }
    setError('')
    await onSubmit({ fileName: trimmed, file })
  }

  return (
    <AntModal open={open} onClose={onClose} title="Add document" width={480}>
      <div className="grid gap-3">
        <label className="grid gap-1.5 text-sm">
          <span>File name</span>
          <FormInput
            value={fileName}
            placeholder="e.g. Passport, Academic certificate"
            onChange={(event) => {
              setFileName(event.target.value)
              if (error) setError('')
            }}
          />
        </label>

        <div className="grid gap-1.5 text-sm">
          <span>Upload file</span>
          <input
            ref={fileInputRef}
            type="file"
            accept={LEAD_DOCUMENT_ACCEPT}
            className="sr-only"
            onChange={onFileChange}
          />
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#d0dae6] bg-[#f8fafc] px-4 py-3.5 text-left transition-colors hover:border-primary hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-surface))] dark:border-border dark:bg-transparent"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] text-primary">
              <HugeiconsIcon icon={CloudUploadIcon} size={20} color="currentColor" strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-[0.9rem] font-semibold text-[#17324f] dark:text-text-strong">
                {file ? file.name : 'Choose a file'}
              </strong>
              <span className="mt-0.5 block text-[0.78rem] text-[#8b97a8]">
                {file ? `${(file.size / 1024).toFixed(1)} KB · PDF, Word, or image` : 'PDF, Word, or image up to 5 MB'}
              </span>
            </span>
          </button>
        </div>

        {error ? <InputError>{error}</InputError> : null}

        <div className="mt-2 flex justify-end gap-2">
          <PrimaryButton type="button" variant="outline" onClick={onClose} disabled={saving} label="Cancel" />
          <PrimaryButton type="button" loading={saving} onClick={() => void handleSubmit()} label="Upload" />
        </div>
      </div>
    </AntModal>
  )
}

export function FollowUpModal({
  open,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean
  saving: boolean
  onClose: () => void
  onSubmit: (body: { type: string; dueAt: string; notes: string }) => Promise<void>
}) {
  const [type, setType] = useState('Call')
  const [dueAt, setDueAt] = useState('')
  const [notes, setNotes] = useState('')

  async function handleSubmit() {
    await onSubmit({ type, dueAt, notes })
    setType('Call')
    setDueAt('')
    setNotes('')
  }

  return (
    <AntModal open={open} onClose={onClose} title="Schedule Follow-up" width={480}>
      <div className="grid gap-3">
        <label className="grid gap-1.5 text-sm">
          <span>Follow-up type</span>
          <FormSelect
            value={type}
            options={[
              { value: 'Call', label: 'Call' },
              { value: 'WhatsApp', label: 'WhatsApp' },
              { value: 'Email', label: 'Email' },
              { value: 'Meeting', label: 'Meeting' },
            ]}
            onChange={(value) => setType(asSelectString(value) || 'Call')}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>Due date</span>
          <FormDatePicker
            showTime
            className="w-full"
            value={dueAt ? dayjs(dueAt) : null}
            onChange={(value) => setDueAt(value ? value.toISOString() : '')}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>Notes</span>
          <FormTextArea rows={3} value={notes} placeholder="Add context for this follow-up" onChange={(event) => setNotes(event.target.value)} />
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <PrimaryButton type="button" variant="outline" onClick={onClose} label="Cancel" />
          <PrimaryButton type="button" loading={saving} onClick={() => void handleSubmit()} label="Save follow-up" />
        </div>
      </div>
    </AntModal>
  )
}

export function AddActivityModal({
  open,
  saving,
  onClose,
  onSubmit,
  defaultType = 'CALL',
  title,
}: {
  open: boolean
  saving: boolean
  onClose: () => void
  onSubmit: (body: {
    type: string
    notes: string
    outcome: string
    durationMin?: number | null
    nextAction: string
    createNextFollowUp: boolean
    nextDueAt?: string
    nextFollowUpType?: string
    nextFollowUpPriority?: string
  }) => Promise<void>
  defaultType?: string
  title?: string
}) {
  const [type, setType] = useState(defaultType)
  const [notes, setNotes] = useState('')
  const [outcome, setOutcome] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [createNext, setCreateNext] = useState(false)
  const [nextDueAt, setNextDueAt] = useState('')
  const [nextFollowUpPriority, setNextFollowUpPriority] = useState('Medium')

  useEffect(() => {
    if (!open) return
    setType(defaultType)
    setNotes('')
    setOutcome(defaultType === 'CALL' ? 'Connected' : defaultType === 'COUNSELLING' ? 'Completed' : 'Completed')
    setDurationMin('')
    setNextAction('')
    setCreateNext(false)
    setNextDueAt('')
    setNextFollowUpPriority('Medium')
  }, [open, defaultType])

  const outcomeOptions = outcomesForActivityType(type).map((value) => ({ value, label: value }))
  const modalTitle =
    title ||
    (type === 'CALL'
      ? 'Log Call'
      : type === 'COUNSELLING'
        ? 'Log Counselling'
        : type === 'WHATSAPP'
          ? 'Log WhatsApp'
          : type === 'EMAIL'
            ? 'Log Email'
            : 'Log Activity')

  async function handleSubmit() {
    await onSubmit({
      type,
      notes,
      outcome,
      durationMin: type === 'CALL' || type === 'MEETING' || type === 'COUNSELLING' ? Number(durationMin) || null : null,
      nextAction: nextAction.trim(),
      createNextFollowUp: createNext,
      nextDueAt: createNext ? nextDueAt : undefined,
      nextFollowUpType:
        type === 'CALL'
          ? 'Call'
          : type === 'WHATSAPP'
            ? 'WhatsApp'
            : type === 'EMAIL'
              ? 'Email'
              : type === 'COUNSELLING'
                ? 'Counselling'
                : 'Call',
      nextFollowUpPriority,
    })
  }

  return (
    <AntModal open={open} onClose={onClose} title={modalTitle} width={560}>
      <div className="grid gap-3">
        <label className="grid gap-1.5 text-sm">
          <span>Activity type</span>
          <FormSelect
            showSearch
            optionFilterProp="label"
            value={type}
            options={[...ACTIVITY_TYPE_OPTIONS]}
            onChange={(value) => {
              const next = asSelectString(value) || 'CALL'
              setType(next)
              setOutcome(outcomesForActivityType(next)[0] || 'Completed')
            }}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>Outcome</span>
          <FormSelect
            showSearch
            optionFilterProp="label"
            value={outcome || undefined}
            options={outcomeOptions}
            onChange={(value) => setOutcome(asSelectString(value))}
          />
        </label>
        {type === 'CALL' || type === 'MEETING' || type === 'COUNSELLING' ? (
          <label className="grid gap-1.5 text-sm">
            <span>Duration (minutes)</span>
            <FormInput
              value={durationMin}
              placeholder="e.g. 12"
              onChange={(event) => setDurationMin(event.target.value)}
            />
          </label>
        ) : null}
        <label className="grid gap-1.5 text-sm">
          <span>Notes{(type === 'CALL' && outcome === 'Other') || !outcome ? '' : ''}</span>
          <FormTextArea
            rows={3}
            value={notes}
            placeholder={type === 'CALL' && outcome === 'Other' ? 'Notes are required when outcome is Other' : 'What happened?'}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>Next Action</span>
          <FormTextArea
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={500}
            value={nextAction}
            placeholder="e.g. Send University List"
            onChange={(event) => setNextAction(event.target.value)}
          />
        </label>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#e7eef5] px-3 py-2.5 dark:border-border">
          <span className="text-sm text-[#17324f] dark:text-text">Schedule Next Follow-up</span>
          <FormSwitch checked={createNext} onChange={setCreateNext} />
        </div>
        {createNext ? (
          <div className="grid gap-3 min-[481px]:grid-cols-2">
            <label className="grid gap-1.5 text-sm min-[481px]:col-span-2">
              <span>Next Follow-up Date & Time</span>
              <FormDatePicker
                showTime
                className="w-full"
                format="DD MMM YYYY hh:mm A"
                value={nextDueAt ? dayjs(nextDueAt) : null}
                onChange={(value) => setNextDueAt(value ? value.toISOString() : '')}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span>Priority</span>
              <FormSelect
                value={nextFollowUpPriority}
                options={[
                  { value: 'High', label: 'High' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'Low', label: 'Low' },
                ]}
                onChange={(value) => setNextFollowUpPriority(asSelectString(value) || 'Medium')}
              />
            </label>
          </div>
        ) : null}
        <div className="mt-2 flex justify-end gap-2">
          <PrimaryButton type="button" variant="outline" onClick={onClose} label="Cancel" />
          <PrimaryButton type="button" loading={saving} onClick={() => void handleSubmit()} label={createNext ? 'Complete & Schedule Next Follow-up' : 'Save activity'} />
        </div>
      </div>
    </AntModal>
  )
}

export function QualifyLeadModal({
  open,
  saving,
  values,
  options,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean
  saving: boolean
  values: {
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
  options: {
    fit: MasterOption[]
    financial: MasterOption[]
    studyIntent: MasterOption[]
    appReady: MasterOption[]
    timeline: MasterOption[]
    result: MasterOption[]
    unqualified: MasterOption[]
  }
  onClose: () => void
  onChange: (key: string, value: string) => void
  onSubmit: () => Promise<void>
}) {
  return (
    <AntModal open={open} onClose={onClose} title="Lead Qualification" width={720}>
      <div className="grid gap-3 min-[721px]:grid-cols-2">
        <FormSelect placeholder="Academic Fit" value={values.academicFitCode || undefined} options={options.fit} onChange={(value) => onChange('academicFitCode', asSelectString(value))} />
        <FormSelect placeholder="Financial Readiness" value={values.financialReadinessCode || undefined} options={options.financial} onChange={(value) => onChange('financialReadinessCode', asSelectString(value))} />
        <FormSelect placeholder="English Readiness" value={values.englishReadinessCode || undefined} options={options.financial} onChange={(value) => onChange('englishReadinessCode', asSelectString(value))} />
        <FormSelect placeholder="Country/Intake Fit" value={values.countryIntakeFitCode || undefined} options={options.fit} onChange={(value) => onChange('countryIntakeFitCode', asSelectString(value))} />
        <FormSelect placeholder="Study Intent" value={values.studyIntentQualCode || undefined} options={options.studyIntent} onChange={(value) => onChange('studyIntentQualCode', asSelectString(value))} />
        <FormSelect placeholder="Application Readiness" value={values.applicationReadinessCode || undefined} options={options.appReady} onChange={(value) => onChange('applicationReadinessCode', asSelectString(value))} />
        <FormSelect placeholder="Decision Timeline" value={values.decisionTimelineCode || undefined} options={options.timeline} onChange={(value) => onChange('decisionTimelineCode', asSelectString(value))} />
        <FormSelect placeholder="Qualification Result" value={values.qualificationResultCode || undefined} options={options.result} onChange={(value) => onChange('qualificationResultCode', asSelectString(value))} />
        {values.qualificationResultCode === 'UNQUALIFIED' ? (
          <FormSelect placeholder="Unqualified Reason" value={values.unqualifiedReasonCode || undefined} options={options.unqualified} onChange={(value) => onChange('unqualifiedReasonCode', asSelectString(value))} />
        ) : null}
        {values.unqualifiedReasonCode === 'OTHER' ? (
          <div className="min-[721px]:col-span-2">
            <FormTextArea value={values.unqualifiedRemarks} placeholder="Remarks" onChange={(event) => onChange('unqualifiedRemarks', event.target.value)} />
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <PrimaryButton type="button" variant="outline" onClick={onClose} label="Cancel" />
        <PrimaryButton type="button" loading={saving} onClick={() => void onSubmit()} label="Save qualification" />
      </div>
    </AntModal>
  )
}

export function AssignLeadModal({
  open,
  leadName,
  currentOwnerName,
  assignedTeamId,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean
  leadName?: string | null
  currentOwnerName?: string | null
  assignedTeamId?: string | null
  saving: boolean
  onClose: () => void
  onSubmit: (ownerId: string, reason: string) => Promise<void>
}) {
  const [ownerId, setOwnerId] = useState('')
  const [reason, setReason] = useState('')
  const { data, isFetching } = useListLeadAssigneesQuery(
    { teamId: assignedTeamId || undefined },
    { skip: !open },
  )
  const options = (data?.items || []).map((user) => ({
    value: user.id,
    label: [user.name, user.role?.name, user.team?.name].filter(Boolean).join(' · '),
  }))

  useEffect(() => {
    if (open) {
      setOwnerId('')
      setReason('')
    }
  }, [open])

  async function handleSubmit() {
    if (!ownerId) return
    await onSubmit(ownerId, reason.trim())
  }

  const title = currentOwnerName ? 'Reassign Lead' : 'Assign Lead'

  return (
    <AntModal open={open} onClose={onClose} title={title} width={480}>
      <div className="grid gap-3">
        {leadName ? (
          <p className="m-0 text-sm text-text-muted">
            {currentOwnerName
              ? `Reassign ${leadName} from ${currentOwnerName} to another Call Executive.`
              : `Assign ${leadName} to a Call Executive.`}
          </p>
        ) : null}
        <label className="grid gap-1.5 text-sm">
          <span>Assign to</span>
          <FormSelect
            showSearch
            optionFilterProp="label"
            placeholder={isFetching ? 'Loading users...' : 'Select a Call Executive'}
            value={ownerId || undefined}
            options={options}
            onChange={(value) => setOwnerId(asSelectString(value))}
          />
          {!isFetching && options.length === 0 ? (
            <span className="text-xs text-text-muted">No eligible Call Executives are available to receive this lead.</span>
          ) : null}
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>Reason (optional)</span>
          <FormTextArea
            rows={3}
            value={reason}
            placeholder="Why is this lead being assigned?"
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <PrimaryButton type="button" variant="outline" onClick={onClose} label="Cancel" />
          <PrimaryButton type="button" loading={saving} disabled={!ownerId} onClick={() => void handleSubmit()} label={currentOwnerName ? 'Reassign Lead' : 'Assign Lead'} />
        </div>
      </div>
    </AntModal>
  )
}

export function HandoverLeadModal({
  open,
  lead,
  countryOptions,
  intakeOptions,
  resultOptions,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean
  lead: LeadRecord | null
  countryOptions: MasterOption[]
  intakeOptions: MasterOption[]
  resultOptions: MasterOption[]
  saving: boolean
  onClose: () => void
  onSubmit: (body: {
    counsellorId: string
    note: {
      studentRequirement?: string
      preferredCountryCode?: string
      preferredIntakeCode?: string
      academicBackground?: string
      conversationSummary?: string
      importantConcern?: string
    }
  }) => Promise<void>
}) {
  const [counsellorId, setCounsellorId] = useState('')
  const [studentRequirement, setStudentRequirement] = useState('')
  const [preferredCountryCode, setPreferredCountryCode] = useState('')
  const [preferredIntakeCode, setPreferredIntakeCode] = useState('')
  const [academicBackground, setAcademicBackground] = useState('')
  const [conversationSummary, setConversationSummary] = useState('')
  const [importantConcern, setImportantConcern] = useState('')
  const { data, isFetching } = useListLeadAssigneesQuery({ role: 'counsellor' }, { skip: !open })
  const options = (data?.items || []).map((user) => ({
    value: user.id,
    label: [user.name, user.role?.name, user.team?.name].filter(Boolean).join(' · '),
  }))

  useEffect(() => {
    if (!open || !lead) return
    setCounsellorId('')
    setStudentRequirement(lead.preferredCourse || '')
    setPreferredCountryCode(lead.preferredCountryCode || '')
    setPreferredIntakeCode(lead.preferredIntakeCode || '')
    setAcademicBackground(
      [lead.institutionName, lead.resultCgpa ? `CGPA ${lead.resultCgpa}` : '', lead.passingYear ? String(lead.passingYear) : '']
        .filter(Boolean)
        .join(', '),
    )
    setConversationSummary('')
    setImportantConcern('')
  }, [open, lead])

  async function handleSubmit() {
    if (!counsellorId) return
    await onSubmit({
      counsellorId,
      note: {
        studentRequirement: studentRequirement.trim() || undefined,
        preferredCountryCode: preferredCountryCode || undefined,
        preferredIntakeCode: preferredIntakeCode || undefined,
        academicBackground: academicBackground.trim() || undefined,
        conversationSummary: conversationSummary.trim() || undefined,
        importantConcern: importantConcern.trim() || undefined,
      },
    })
  }

  return (
    <AntModal open={open} onClose={onClose} title="Hand over to Counsellor" width={560}>
      <div className="grid gap-3">
        <p className="m-0 text-sm text-text-muted">
          {lead ? `Hand ${lead.name} from the Call Center to a Counsellor. Qualification data stays as it is.` : 'Select a Counsellor.'}
        </p>
        {lead ? (
          <dl className="m-0 grid grid-cols-2 gap-2 rounded-xl bg-[#f8fafc] px-3 py-2 text-sm dark:bg-hover-bg">
            <div>
              <dt className="text-xs text-text-muted">Profile completion</dt>
              <dd className="m-0 font-medium">{lead.profileCompletion ?? 0}%</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Lead score</dt>
              <dd className="m-0 font-medium">{lead.leadScore ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Priority</dt>
              <dd className="m-0 font-medium">{lead.priority || 'None'}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Qualification</dt>
              <dd className="m-0 font-medium">{optionLabel(resultOptions, lead.qualificationResultCode) || '—'}</dd>
            </div>
          </dl>
        ) : null}
        <label className="grid gap-1.5 text-sm">
          <span>Counsellor</span>
          <FormSelect
            showSearch
            optionFilterProp="label"
            placeholder={isFetching ? 'Loading counsellors...' : 'Select a Counsellor'}
            value={counsellorId || undefined}
            options={options}
            onChange={(value) => setCounsellorId(asSelectString(value))}
          />
          {!isFetching && options.length === 0 ? (
            <span className="text-xs text-text-muted">No counsellors are available for this handover.</span>
          ) : null}
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>Student requirement</span>
          <FormTextArea rows={2} value={studentRequirement} placeholder="What the student is looking for" onChange={(event) => setStudentRequirement(event.target.value)} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            <span>Preferred country</span>
            <FormSelect
              showSearch
              optionFilterProp="label"
              allowClear
              placeholder="Preferred country"
              value={preferredCountryCode || undefined}
              options={countryOptions}
              onChange={(value) => setPreferredCountryCode(asSelectString(value))}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span>Preferred intake</span>
            <FormSelect
              showSearch
              optionFilterProp="label"
              allowClear
              placeholder="Preferred intake"
              value={preferredIntakeCode || undefined}
              options={intakeOptions}
              onChange={(value) => setPreferredIntakeCode(asSelectString(value))}
            />
          </label>
        </div>
        <label className="grid gap-1.5 text-sm">
          <span>Academic background</span>
          <FormTextArea rows={2} value={academicBackground} placeholder="Degree, institution, result" onChange={(event) => setAcademicBackground(event.target.value)} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>Initial conversation summary</span>
          <FormTextArea rows={2} value={conversationSummary} placeholder="What was discussed" onChange={(event) => setConversationSummary(event.target.value)} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>Important concern</span>
          <FormTextArea rows={2} value={importantConcern} placeholder="Anything the counsellor should know first" onChange={(event) => setImportantConcern(event.target.value)} />
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <PrimaryButton type="button" variant="outline" onClick={onClose} label="Cancel" />
          <PrimaryButton type="button" loading={saving} disabled={!counsellorId} onClick={() => void handleSubmit()} label="Hand over" />
        </div>
      </div>
    </AntModal>
  )
}

export function ChangeOwnerModal({
  open,
  lead,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean
  lead: LeadRecord | null
  saving?: boolean
  onClose: () => void
  onSubmit?: (ownerId: string, reason: string) => Promise<void>
}) {
  return (
    <AssignLeadModal
      open={open}
      leadName={lead?.name}
      currentOwnerName={lead?.owner?.name}
      assignedTeamId={lead?.assignedTeam?.id}
      saving={Boolean(saving)}
      onClose={onClose}
      onSubmit={onSubmit || (async () => undefined)}
    />
  )
}

export { default as ChangeStatusModal } from './ChangeStatusModal'
export type {
  ChangeStatusSubmitPayload,
  ChangeStatusMeetingPayload,
  ChangeStatusEmailPayload,
} from './ChangeStatusModal'

export function CloseLeadModal({
  open,
  saving,
  currentStatus,
  options,
  lostReasons,
  closeReasons,
  errors,
  onClose,
  onSubmit,
}: {
  open: boolean
  saving: boolean
  currentStatus: string
  options: LeadStatusOption[]
  lostReasons: MasterOption[]
  closeReasons: MasterOption[]
  errors: Record<string, string>
  onClose: () => void
  onSubmit: (body: { statusCode: string; reasonCode: string; remarks: string }) => Promise<void>
}) {
  const [statusCode, setStatusCode] = useState('')
  const [reasonCode, setReasonCode] = useState('')
  const [remarks, setRemarks] = useState('')
  const [confirming, setConfirming] = useState(false)

  const selected = options.find((item) => item.code === statusCode)
  const reasonOptions =
    selected?.reasonCategory === 'LEAD_LOST_REASON'
      ? lostReasons
      : selected?.reasonCategory === 'LEAD_CLOSE_REASON'
        ? closeReasons
        : []
  const remarksRequired = reasonCode.toUpperCase() === 'OTHER'
  const dirty = Boolean(statusCode || reasonCode || remarks)

  useEffect(() => {
    if (!open) {
      setStatusCode('')
      setReasonCode('')
      setRemarks('')
      setConfirming(false)
    }
  }, [open])

  function requestClose() {
    if (!dirty) {
      onClose()
      return
    }
    setConfirming(true)
    Modal.confirm({
      title: 'Discard unsaved changes?',
      content: 'You have unsaved close details. Close without confirming?',
      okText: 'Discard',
      cancelText: 'Keep editing',
      onOk: onClose,
      afterClose: () => setConfirming(false),
    })
  }

  const title =
    selected?.behaviorKey === 'lost'
      ? 'Mark Lead as Lost'
      : selected
        ? `Close Lead as ${selected.name}`
        : 'Close Lead'

  return (
    <AntModal open={open} onClose={requestClose} title={title} width={520} mask={{ closable: !confirming }}>
      <div className="grid gap-3">
        <label className="grid gap-1.5 text-sm">
          <span>Current Status</span>
          <input
            readOnly
            value={currentStatus}
            className="h-10 rounded-lg border border-[#dbe4ee] bg-[#f7fafc] px-3 text-sm text-[#17324f] dark:border-border dark:bg-hover-bg dark:text-text"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>New Status *</span>
          <FormSelect
            showSearch
            optionFilterProp="label"
            placeholder="Lost / Closed / Duplicate / Invalid"
            value={statusCode || undefined}
            options={options.map((item) => ({ value: item.code, label: item.name }))}
            onChange={(value) => {
              setStatusCode(asSelectString(value))
              setReasonCode('')
            }}
          />
          {errors.statusCode ? <InputError>{errors.statusCode}</InputError> : null}
        </label>
        {selected ? (
          <label className="grid gap-1.5 text-sm">
            <span>{selected.behaviorKey === 'lost' ? 'Lost Reason *' : 'Reason *'}</span>
            <FormSelect
              showSearch
              optionFilterProp="label"
              placeholder="Select a reason"
              value={reasonCode || undefined}
              options={reasonOptions}
              onChange={(value) => setReasonCode(asSelectString(value))}
            />
            {errors.reasonCode ? <InputError>{errors.reasonCode}</InputError> : null}
          </label>
        ) : null}
        <label className="grid gap-1.5 text-sm">
          <span>
            Remarks
            {remarksRequired ? ' *' : ''}
          </span>
          <FormTextArea
            autoSize={{ minRows: 3, maxRows: 8 }}
            maxLength={1000}
            showCount
            value={remarks}
            placeholder={remarksRequired ? 'Required when reason is Other' : 'Optional remarks'}
            onChange={(event) => setRemarks(event.target.value)}
          />
          {errors.remarks ? <InputError>{errors.remarks}</InputError> : null}
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <PrimaryButton type="button" variant="outline" onClick={requestClose} label="Cancel" />
          <PrimaryButton
            type="button"
            loading={saving}
            onClick={() => void onSubmit({ statusCode, reasonCode, remarks })} label="Confirm" />
        </div>
      </div>
    </AntModal>
  )
}

export function ReopenLeadModal({
  open,
  saving,
  leadName,
  currentOwnerId,
  assignedTeamId,
  errors,
  onClose,
  onSubmit,
}: {
  open: boolean
  saving: boolean
  leadName?: string | null
  currentOwnerId?: string | null
  assignedTeamId?: string | null
  errors: Record<string, string>
  onClose: () => void
  onSubmit: (body: { reopenReason: string; followUpDate: string; ownerId: string }) => Promise<void>
}) {
  const [reopenReason, setReopenReason] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [confirming, setConfirming] = useState(false)
  const { data, isFetching } = useListLeadAssigneesQuery(
    { teamId: assignedTeamId || undefined },
    { skip: !open },
  )
  const assigneeOptions = (data?.items || []).map((user) => ({
    value: user.id,
    label: [user.name, user.role?.name, user.team?.name].filter(Boolean).join(' · '),
  }))

  const dirty = Boolean(reopenReason || followUpDate || (ownerId && ownerId !== (currentOwnerId || '')))

  useEffect(() => {
    if (open) {
      setReopenReason('')
      setFollowUpDate('')
      setOwnerId(currentOwnerId || '')
      setConfirming(false)
    }
  }, [open, currentOwnerId])

  function requestClose() {
    if (!dirty) {
      onClose()
      return
    }
    setConfirming(true)
    Modal.confirm({
      title: 'Discard unsaved changes?',
      content: 'You have unsaved reopen details. Close without reopening?',
      okText: 'Discard',
      cancelText: 'Keep editing',
      onOk: onClose,
      afterClose: () => setConfirming(false),
    })
  }

  return (
    <AntModal open={open} onClose={requestClose} title="Reopen Lead" width={520} mask={{ closable: !confirming }}>
      <div className="grid gap-3">
        {leadName ? (
          <p className="m-0 text-sm text-text-muted">
            Reopen <strong>{leadName}</strong> into the active lifecycle with a new follow-up and assignment.
          </p>
        ) : null}
        <label className="grid gap-1.5 text-sm">
          <span>Reopen Reason *</span>
          <FormTextArea
            autoSize={{ minRows: 3, maxRows: 8 }}
            maxLength={1000}
            showCount
            value={reopenReason}
            placeholder="Why is this lead being reopened?"
            onChange={(event) => setReopenReason(event.target.value)}
          />
          {errors.reopenReason ? <InputError>{errors.reopenReason}</InputError> : null}
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>New Follow-up Date *</span>
          <FormDatePicker
            showTime
            className="w-full"
            format="DD MMM YYYY hh:mm A"
            value={followUpDate ? dayjs(followUpDate) : null}
            onChange={(value) => setFollowUpDate(value ? value.toISOString() : '')}
          />
          {errors.followUpDate ? <InputError>{errors.followUpDate}</InputError> : null}
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>Assigned Employee *</span>
          <FormSelect
            showSearch
            optionFilterProp="label"
            placeholder={isFetching ? 'Loading users...' : 'Select an employee'}
            value={ownerId || undefined}
            options={assigneeOptions}
            onChange={(value) => setOwnerId(asSelectString(value))}
          />
          {errors.ownerId ? <InputError>{errors.ownerId}</InputError> : null}
          {!isFetching && assigneeOptions.length === 0 ? (
            <span className="text-xs text-text-muted">No eligible employees are available for assignment.</span>
          ) : null}
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <PrimaryButton type="button" variant="outline" onClick={requestClose} label="Cancel" />
          <PrimaryButton
            type="button"
            loading={saving}
            onClick={() => void onSubmit({ reopenReason, followUpDate, ownerId })} label="Reopen" />
        </div>
      </div>
    </AntModal>
  )
}
