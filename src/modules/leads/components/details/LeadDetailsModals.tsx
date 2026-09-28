import { useState } from 'react'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import { Button } from '@/components/ui'
import { FormInput, FormSelect, FormTextArea } from '@/components/common/Forms'
import { AntModal } from '@/components/common/Modals'
import type { MasterOption } from '../../hooks/useLeadMasterOptions'
import type { LeadRecord } from '../../types'

function asSelectString(value: unknown) {
  return typeof value === 'string' ? value : ''
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
          <DatePicker
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
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" loading={saving} onClick={() => void handleSubmit()}>
            Save follow-up
          </Button>
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
}: {
  open: boolean
  saving: boolean
  onClose: () => void
  onSubmit: (body: { type: string; notes: string; outcome: string }) => Promise<void>
}) {
  const [type, setType] = useState('CALL')
  const [notes, setNotes] = useState('')
  const [outcome, setOutcome] = useState('')

  async function handleSubmit() {
    await onSubmit({ type, notes, outcome })
    setType('CALL')
    setNotes('')
    setOutcome('')
  }

  return (
    <AntModal open={open} onClose={onClose} title="Add Activity" width={480}>
      <div className="grid gap-3">
        <label className="grid gap-1.5 text-sm">
          <span>Activity type</span>
          <FormSelect
            value={type}
            options={[
              { value: 'CALL', label: 'Call' },
              { value: 'MESSAGE', label: 'WhatsApp / Message' },
              { value: 'EMAIL', label: 'Email' },
              { value: 'MEETING', label: 'Meeting' },
              { value: 'NOTE', label: 'Note' },
            ]}
            onChange={(value) => setType(asSelectString(value) || 'CALL')}
          />
        </label>
        <FormInput value={outcome} placeholder="Outcome (optional)" onChange={(event) => setOutcome(event.target.value)} />
        <FormTextArea rows={3} value={notes} placeholder="What happened?" onChange={(event) => setNotes(event.target.value)} />
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" loading={saving} onClick={() => void handleSubmit()}>
            Save activity
          </Button>
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
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" loading={saving} onClick={() => void onSubmit()}>
          Save qualification
        </Button>
      </div>
    </AntModal>
  )
}

export function ChangeOwnerModal({
  open,
  lead,
  onClose,
}: {
  open: boolean
  lead: LeadRecord | null
  onClose: () => void
}) {
  return (
    <AntModal open={open} onClose={onClose} title="Change Owner" width={440}>
      <p className="mt-0 text-sm leading-relaxed text-text-muted">
        Ownership is assigned automatically from the lead&apos;s preferred country and team rules.
        {lead?.owner?.name ? ` Current owner is ${lead.owner.name}.` : ' This lead is currently unassigned.'}
      </p>
      <div className="mt-4 flex justify-end">
        <Button type="button" onClick={onClose}>
          Got it
        </Button>
      </div>
    </AntModal>
  )
}
