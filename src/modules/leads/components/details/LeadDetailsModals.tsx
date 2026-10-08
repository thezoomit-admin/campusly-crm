import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
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
import { optionLabel, priorityBadgeClass } from '../../utils/leadDetails'
import {
  computeLeadScorePreview,
  QUALIFICATION_FIELD_META,
  resultLabel,
  suggestQualificationResult,
  validateQualificationForm,
  type QualificationFormValues,
} from '../../utils/leadQualification'
import {
  ACTIVITY_TYPE_OPTIONS,
  outcomesForActivityType,
} from '@/modules/activities/activityConstants'

const LEAD_DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png'
const LEAD_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024

function asSelectString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function isImageMime(mimeType: string) {
  return mimeType.startsWith('image/')
}

function isPdfMime(mimeType: string, fileName = '') {
  return mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')
}

export type UploadLeadDocumentForm = {
  categoryCode: string
  typeCode: string
  name: string
  file: File
  documentDate?: string
  expiryDate?: string
  remarks?: string
  duplicateAction?: 'replace' | 'new_version'
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
  categories,
  types,
  defaultTypeCode,
  onClose,
  onSubmit,
}: {
  open: boolean
  saving: boolean
  categories: Array<{ value: string; label: string; id?: string }>
  types: Array<{ value: string; label: string; parentId?: string | null; parentCode?: string | null }>
  defaultTypeCode?: string
  onClose: () => void
  onSubmit: (body: UploadLeadDocumentForm) => Promise<void>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [categoryCode, setCategoryCode] = useState('')
  const [typeCode, setTypeCode] = useState('')
  const [name, setName] = useState('')
  const [documentDate, setDocumentDate] = useState<dayjs.Dayjs | null>(null)
  const [expiryDate, setExpiryDate] = useState<dayjs.Dayjs | null>(null)
  const [remarks, setRemarks] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const categoryIdByCode = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of categories) {
      if (item.id) map.set(item.value, item.id)
    }
    return map
  }, [categories])

  const filteredTypes = useMemo(() => {
    if (!categoryCode) return types
    const parentId = categoryIdByCode.get(categoryCode)
    return types.filter((item) => {
      if (item.parentCode) return item.parentCode === categoryCode
      if (parentId && item.parentId) return item.parentId === parentId
      return true
    })
  }, [types, categoryCode, categoryIdByCode])

  useEffect(() => {
    if (!open) {
      setCategoryCode('')
      setTypeCode('')
      setName('')
      setDocumentDate(null)
      setExpiryDate(null)
      setRemarks('')
      setFile(null)
      setError('')
      setFieldErrors({})
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (defaultTypeCode) {
      const match = types.find((item) => item.value === defaultTypeCode)
      if (match) {
        setTypeCode(match.value)
        setName(match.label)
        if (match.parentCode) setCategoryCode(match.parentCode)
      }
    }
  }, [open, defaultTypeCode, types])

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] || null
    setError('')
    if (!selected) {
      setFile(null)
      return
    }
    if (selected.size > LEAD_DOCUMENT_MAX_BYTES) {
      setFile(null)
      setError('File size exceeds the allowed limit.')
      event.target.value = ''
      return
    }
    setFile(selected)
  }

  async function handleSubmit(duplicateAction?: 'replace' | 'new_version') {
    const nextErrors: Record<string, string> = {}
    if (!categoryCode) nextErrors.categoryCode = 'Document category is required.'
    if (!typeCode) nextErrors.typeCode = 'Document category is required.'
    if (!name.trim() || name.trim().length < 2) nextErrors.name = 'Document name must be 2–150 characters.'
    if (!file) nextErrors.file = 'Please select a document to upload.'
    if (documentDate && expiryDate && expiryDate.isBefore(documentDate, 'day')) {
      nextErrors.expiryDate = 'Expiry date cannot be before document date.'
    }
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      setError(Object.values(nextErrors)[0] || '')
      return
    }
    setError('')
    setFieldErrors({})
    await onSubmit({
      categoryCode,
      typeCode,
      name: name.trim(),
      file: file!,
      documentDate: documentDate ? documentDate.format('YYYY-MM-DD') : undefined,
      expiryDate: expiryDate ? expiryDate.format('YYYY-MM-DD') : undefined,
      remarks: remarks.trim() || undefined,
      duplicateAction,
    })
  }

  return (
    <AntModal open={open} onClose={onClose} title="Upload Document" width={520}>
      <div className="grid gap-3">
        <label className="grid gap-1.5 text-sm">
          <span>Document Category</span>
          <FormSelect
            showSearch
            optionFilterProp="label"
            value={categoryCode || undefined}
            placeholder="Select category"
            options={categories.map((item) => ({ value: item.value, label: item.label }))}
            onChange={(value) => {
              setCategoryCode(asSelectString(value))
              setTypeCode('')
              setName('')
              if (error) setError('')
            }}
          />
          {fieldErrors.categoryCode ? <InputError>{fieldErrors.categoryCode}</InputError> : null}
        </label>

        <label className="grid gap-1.5 text-sm">
          <span>Document Type</span>
          <FormSelect
            showSearch
            optionFilterProp="label"
            value={typeCode || undefined}
            placeholder="Select document"
            options={filteredTypes.map((item) => ({ value: item.value, label: item.label }))}
            onChange={(value) => {
              const code = asSelectString(value)
              setTypeCode(code)
              const match = filteredTypes.find((item) => item.value === code)
              if (match) setName(match.label)
              if (error) setError('')
            }}
          />
          {fieldErrors.typeCode ? <InputError>{fieldErrors.typeCode}</InputError> : null}
        </label>

        <label className="grid gap-1.5 text-sm">
          <span>Document Name</span>
          <FormInput
            value={name}
            placeholder="e.g. Passport"
            onChange={(event) => {
              setName(event.target.value)
              if (error) setError('')
            }}
          />
          {fieldErrors.name ? <InputError>{fieldErrors.name}</InputError> : null}
        </label>

        <div className="grid gap-1.5 text-sm">
          <span>File</span>
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
                {file ? file.name : 'Choose File'}
              </strong>
              <span className="mt-0.5 block text-[0.78rem] text-[#8b97a8]">
                {file ? `${(file.size / 1024).toFixed(1)} KB · PDF / JPG / PNG` : 'PDF, JPG, JPEG, PNG up to 10 MB'}
              </span>
            </span>
          </button>
          {fieldErrors.file ? <InputError>{fieldErrors.file}</InputError> : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            <span>Document Date</span>
            <FormDatePicker value={documentDate} onChange={(value) => setDocumentDate(value)} className="w-full" />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span>Expiry Date</span>
            <FormDatePicker value={expiryDate} onChange={(value) => setExpiryDate(value)} className="w-full" />
            {fieldErrors.expiryDate ? <InputError>{fieldErrors.expiryDate}</InputError> : null}
          </label>
        </div>

        <label className="grid gap-1.5 text-sm">
          <span>Remarks</span>
          <FormTextArea
            value={remarks}
            maxLength={500}
            rows={3}
            placeholder="Optional notes"
            onChange={(event) => setRemarks(event.target.value)}
          />
        </label>

        {error ? <InputError>{error}</InputError> : null}

        <div className="mt-2 flex justify-end gap-2">
          <PrimaryButton type="button" variant="outline" onClick={onClose} disabled={saving} label="Cancel" />
          <PrimaryButton type="button" loading={saving} onClick={() => void handleSubmit()} label="Upload" />
        </div>
      </div>
    </AntModal>
  )
}

export function DuplicateDocumentModal({
  open,
  documentName,
  saving,
  onClose,
  onReplace,
  onNewVersion,
}: {
  open: boolean
  documentName: string
  saving: boolean
  onClose: () => void
  onReplace: () => void
  onNewVersion: () => void
}) {
  return (
    <AntModal open={open} onClose={onClose} title="Document already exists" width={480}>
      <p className="m-0 text-[0.92rem] text-text-muted">
        {documentName || 'This'} document already exists.
      </p>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <PrimaryButton type="button" variant="outline" onClick={onClose} disabled={saving} label="Cancel" />
        <PrimaryButton type="button" variant="outline" loading={saving} onClick={onNewVersion} label="Upload as New Version" />
        <PrimaryButton type="button" loading={saving} onClick={onReplace} label="Replace Existing" />
      </div>
    </AntModal>
  )
}

export function VerifyLeadDocumentModal({
  open,
  document,
  saving,
  onClose,
  onVerify,
  onReject,
}: {
  open: boolean
  document: { name: string; fileName: string; uploadedBy?: { name: string } | null; createdAt?: string } | null
  saving: boolean
  onClose: () => void
  onVerify: (remarks: string) => Promise<void>
  onReject: (reason: string) => Promise<void>
}) {
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'idle' | 'reject'>('idle')

  useEffect(() => {
    if (!open) {
      setRemarks('')
      setError('')
      setMode('idle')
    }
  }, [open])

  return (
    <AntModal open={open} onClose={onClose} title="Document Verification" width={520}>
      <div className="grid gap-3 text-sm">
        <div className="rounded-xl border border-border bg-[color-mix(in_srgb,var(--color-page-bg)_55%,var(--color-surface))] px-3.5 py-3">
          <p className="m-0 font-semibold text-text-strong">{document?.name || document?.fileName}</p>
          <p className="m-0 mt-1 text-[0.8rem] text-text-muted">
            Uploaded By: {document?.uploadedBy?.name || '—'}
            {document?.createdAt ? ` · Uploaded Date: ${dayjs(document.createdAt).format('DD MMM YYYY')}` : ''}
          </p>
          <p className="m-0 mt-1 text-[0.8rem] text-text-muted">Status: Pending</p>
        </div>

        <label className="grid gap-1.5">
          <span>{mode === 'reject' ? 'Reason' : 'Remarks'}</span>
          <FormTextArea
            value={remarks}
            rows={3}
            maxLength={500}
            placeholder={mode === 'reject' ? 'Reason for rejection' : 'Optional verification remarks'}
            onChange={(event) => {
              setRemarks(event.target.value)
              if (error) setError('')
            }}
          />
        </label>
        {error ? <InputError>{error}</InputError> : null}

        <div className="mt-1 flex flex-wrap justify-end gap-2">
          <PrimaryButton type="button" variant="outline" onClick={onClose} disabled={saving} label="Cancel" />
          {mode === 'reject' ? (
            <PrimaryButton
              type="button"
              variant="danger"
              loading={saving}
              label="Reject Document"
              onClick={() => {
                if (!remarks.trim()) {
                  setError('Please provide a reason for rejection.')
                  return
                }
                void onReject(remarks.trim())
              }}
            />
          ) : (
            <>
              <PrimaryButton type="button" variant="outline" disabled={saving} label="Reject" onClick={() => setMode('reject')} />
              <PrimaryButton
                type="button"
                loading={saving}
                label="Verify"
                onClick={() => void onVerify(remarks.trim())}
              />
            </>
          )}
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
  values: QualificationFormValues
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
  onChange: (key: keyof QualificationFormValues, value: string) => void
  onSubmit: () => Promise<void>
}) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [resultTouched, setResultTouched] = useState(false)
  const [baseline, setBaseline] = useState<QualificationFormValues | null>(null)
  const lastAutoResult = useRef('')

  const optionMap = useMemo(
    () => ({
      fit: options.fit,
      readiness: options.financial,
      studyIntent: options.studyIntent,
      appReady: options.appReady,
      timeline: options.timeline,
      result: options.result,
      unqualified: options.unqualified,
    }),
    [options],
  )

  const preview = useMemo(() => computeLeadScorePreview(values), [values])
  const suggested = useMemo(() => suggestQualificationResult(values, preview), [values, preview])
  const showApplySuggestion = Boolean(suggested) && suggested !== values.qualificationResultCode
  const isDirty = Boolean(
    baseline &&
      (Object.keys(values) as Array<keyof QualificationFormValues>).some(
        (key) => (values[key] ?? '').trim() !== (baseline[key] ?? '').trim(),
      ),
  )

  useEffect(() => {
    if (!open) {
      setErrors({})
      setResultTouched(false)
      lastAutoResult.current = ''
      setBaseline(null)
      return
    }
    setBaseline((current) => current ?? { ...values })
  }, [open, values])

  useEffect(() => {
    if (!open || resultTouched || !suggested) return
    const current = values.qualificationResultCode
    const stillAuto = !current || current === lastAutoResult.current
    if (!stillAuto || current === suggested) {
      if (current === suggested) lastAutoResult.current = suggested
      return
    }
    lastAutoResult.current = suggested
    onChange('qualificationResultCode', suggested)
    if (suggested !== 'UNQUALIFIED') {
      onChange('unqualifiedReasonCode', '')
      onChange('unqualifiedRemarks', '')
    }
  }, [open, resultTouched, suggested, values.qualificationResultCode, onChange])

  function setField(key: keyof QualificationFormValues, value: string) {
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
    onChange(key, value)
  }

  async function handleSubmit() {
    const nextErrors = validateQualificationForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    await onSubmit()
  }

  return (
    <AntModal open={open} onClose={onClose} title="Lead Qualification" width={760}>
      <div className="grid gap-4">
        <p className="m-0 text-sm text-text-muted">
          These ratings set the qualification result. Lead Score on the header is counted from the student
          profile: personal, study, academic, English, finance, visa, intent, contact, and source. Filling those
          fields raises the score, including when priority was overridden by hand.
        </p>

        <div className="grid gap-3 rounded-xl border border-border bg-[color-mix(in_srgb,var(--color-page-bg)_65%,var(--color-surface))] px-3 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="grid gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">Qualification</span>
            <span className="text-sm text-text-strong">
              Suggested from academic fit, finance, English, country, intent, timeline, and readiness.
            </span>
          </div>
          {suggested ? (
            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              <span className="text-xs text-text-muted">Suggested result</span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {resultLabel(suggested)}
                </span>
                {showApplySuggestion ? (
                  <button
                    type="button"
                    className="cursor-pointer border-0 bg-transparent p-0 text-xs font-medium text-primary underline-offset-2 hover:underline"
                    onClick={() => {
                      setResultTouched(false)
                      lastAutoResult.current = suggested
                      setField('qualificationResultCode', suggested)
                      if (suggested !== 'UNQUALIFIED') {
                        setField('unqualifiedReasonCode', '')
                        setField('unqualifiedRemarks', '')
                      }
                    }}
                  >
                    Apply
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="m-0 text-xs text-text-muted sm:text-right">Fill criteria to see a suggested result.</p>
          )}
        </div>

        <div className="grid gap-3 min-[721px]:grid-cols-2">
          {QUALIFICATION_FIELD_META.map((field) => {
            const required = field.requiredForQualified && values.qualificationResultCode === 'QUALIFIED'
            return (
              <label key={field.key} className="grid gap-1 text-sm">
                <span className="font-medium text-text-strong">
                  {field.label}
                  {required ? <span className="text-[#e11d48]"> *</span> : null}
                </span>
                <span className="text-xs text-text-muted">{field.hint}</span>
                <FormSelect
                  allowClear
                  placeholder={`Select ${field.label.toLowerCase()}`}
                  value={values[field.key] || undefined}
                  options={optionMap[field.optionsKey]}
                  status={errors[field.key] ? 'error' : undefined}
                  onChange={(value) => setField(field.key, asSelectString(value))}
                />
                {errors[field.key] ? <InputError>{errors[field.key]}</InputError> : null}
              </label>
            )
          })}

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-text-strong">
              Qualification Result <span className="text-[#e11d48]">*</span>
            </span>
            <span className="text-xs text-text-muted">Final verdict: pursue, nurture, or disqualify.</span>
            <FormSelect
              allowClear
              placeholder="Select qualification result"
              value={values.qualificationResultCode || undefined}
              options={options.result}
              status={errors.qualificationResultCode ? 'error' : undefined}
              onChange={(value) => {
                setResultTouched(true)
                const next = asSelectString(value)
                setField('qualificationResultCode', next)
                if (next !== 'UNQUALIFIED') {
                  setField('unqualifiedReasonCode', '')
                  setField('unqualifiedRemarks', '')
                }
              }}
            />
            {errors.qualificationResultCode ? <InputError>{errors.qualificationResultCode}</InputError> : null}
          </label>

          {values.qualificationResultCode === 'UNQUALIFIED' ? (
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-text-strong">
                Unqualified Reason <span className="text-[#e11d48]">*</span>
              </span>
              <span className="text-xs text-text-muted">Why this lead should not be pursued now.</span>
              <FormSelect
                allowClear
                placeholder="Select reason"
                value={values.unqualifiedReasonCode || undefined}
                options={options.unqualified}
                status={errors.unqualifiedReasonCode ? 'error' : undefined}
                onChange={(value) => {
                  const next = asSelectString(value)
                  setField('unqualifiedReasonCode', next)
                  if (next !== 'OTHER') setField('unqualifiedRemarks', '')
                }}
              />
              {errors.unqualifiedReasonCode ? <InputError>{errors.unqualifiedReasonCode}</InputError> : null}
            </label>
          ) : null}

          {values.unqualifiedReasonCode === 'OTHER' ? (
            <label className="grid gap-1 text-sm min-[721px]:col-span-2">
              <span className="font-medium text-text-strong">
                Remarks <span className="text-[#e11d48]">*</span>
              </span>
              <FormTextArea
                rows={3}
                value={values.unqualifiedRemarks}
                placeholder="Add details for the Other reason"
                status={errors.unqualifiedRemarks ? 'error' : undefined}
                onChange={(event) => setField('unqualifiedRemarks', event.target.value)}
              />
              {errors.unqualifiedRemarks ? <InputError>{errors.unqualifiedRemarks}</InputError> : null}
            </label>
          ) : null}
        </div>

        {values.qualificationResultCode === 'QUALIFIED' ? (
          <p className="m-0 rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] px-3 py-2 text-xs text-text-muted">
            Marking Qualified requires core fit fields. After saving, you can update pipeline status to Qualified
            separately.
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <PrimaryButton type="button" variant="outline" onClick={onClose} label="Cancel" />
          <PrimaryButton
            type="button"
            loading={saving}
            disabled={!isDirty || saving}
            onClick={() => void handleSubmit()}
            label="Save qualification"
          />
        </div>
      </div>
    </AntModal>
  )
}

export function OverridePriorityModal({
  open,
  saving,
  currentPriority,
  currentPriorityCode,
  priorityOptions,
  onClose,
  onSubmit,
}: {
  open: boolean
  saving: boolean
  currentPriority?: string | null
  currentPriorityCode?: string | null
  priorityOptions: MasterOption[]
  onClose: () => void
  onSubmit: (priorityCode: string, reason: string) => Promise<void>
}) {
  const [priorityCode, setPriorityCode] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setPriorityCode(currentPriorityCode || '')
    setReason('')
    setErrors({})
  }, [open, currentPriorityCode])

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {}
    if (!priorityCode) nextErrors.priorityCode = 'Please select a valid priority.'
    if (!reason.trim()) nextErrors.reason = 'Please provide a reason.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    await onSubmit(priorityCode, reason.trim())
  }

  return (
    <AntModal open={open} onClose={onClose} title="Override Lead Priority" width={520}>
      <div className="grid gap-4">
        <p className="m-0 text-sm text-text-muted">
          System priority follows Lead Score. A manual override keeps the chosen priority while the score continues to follow profile data. A reason is required and audited.
        </p>
        {currentPriority ? (
          <p className="m-0 text-sm text-text-muted">
            Current priority:{' '}
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityBadgeClass(currentPriority)}`}>
              {currentPriority}
            </span>
            {currentPriorityCode ? (
              <span className="ml-1 text-xs">(system / last value)</span>
            ) : null}
          </p>
        ) : null}
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-text-strong">
            New Priority <span className="text-[#e11d48]">*</span>
          </span>
          <FormSelect
            placeholder="Select priority"
            value={priorityCode || undefined}
            options={priorityOptions}
            status={errors.priorityCode ? 'error' : undefined}
            onChange={(value) => {
              setPriorityCode(asSelectString(value))
              setErrors((current) => ({ ...current, priorityCode: '' }))
            }}
          />
          {errors.priorityCode ? <InputError>{errors.priorityCode}</InputError> : null}
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-text-strong">
            Override Reason <span className="text-[#e11d48]">*</span>
          </span>
          <FormTextArea
            rows={3}
            maxLength={400}
            value={reason}
            placeholder="Why are you changing the system priority?"
            status={errors.reason ? 'error' : undefined}
            onChange={(event) => {
              setReason(event.target.value)
              setErrors((current) => ({ ...current, reason: '' }))
            }}
          />
          {errors.reason ? <InputError>{errors.reason}</InputError> : null}
        </label>
        <div className="flex justify-end gap-2">
          <PrimaryButton type="button" variant="outline" onClick={onClose} label="Cancel" />
          <PrimaryButton type="button" loading={saving} onClick={() => void handleSubmit()} label="Save priority" />
        </div>
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
