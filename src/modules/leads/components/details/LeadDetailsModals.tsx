import { useEffect, useState } from 'react'
import { Modal } from 'antd'
import dayjs from 'dayjs'
import { PrimaryButton } from '@/components/ui'
import { FormDatePicker, FormInput, FormSelect, FormSwitch, FormTextArea, InputError } from '@/components/common/Forms'
import { AntModal } from '@/components/common/Modals'
import { useListLeadAssigneesQuery } from '../../api/leadsApi'
import type { MasterOption } from '../../hooks/useLeadMasterOptions'
import type { LeadRecord, LeadStatusOption } from '../../types'
import {
  ACTIVITY_TYPE_OPTIONS,
  outcomesForActivityType,
} from '@/modules/activities/activityConstants'

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
          <PrimaryButton type="button" loading={saving} onClick={() = label="void handleSubmit()}> Save follow-up" />
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
          <PrimaryButton type="button" loading={saving} onClick={() = label={<>void handleSubmit()}>
            {createNext ? 'Complete & Schedule Next Follow-up' : 'Save activity'}</>} />
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
        <PrimaryButton type="button" loading={saving} onClick={() = label="void onSubmit()}> Save qualification" />
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
          <PrimaryButton type="button" loading={saving} disabled={!ownerId} onClick={() = label={<>void handleSubmit()}>
            {currentOwnerName ? 'Reassign Lead' : 'Assign Lead'}</>} />
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

export function ChangeStatusModal({
  open,
  saving,
  currentStatus,
  options,
  lostReasons,
  errors,
  onClose,
  onSubmit,
}: {
  open: boolean
  saving: boolean
  currentStatus: string
  options: LeadStatusOption[]
  lostReasons: MasterOption[]
  errors: Record<string, string>
  onClose: () => void
  onSubmit: (body: {
    statusCode: string
    remarks: string
    lostReasonCode: string
    override: boolean
    overrideReason: string
  }) => Promise<void>
}) {
  const [statusCode, setStatusCode] = useState('')
  const [remarks, setRemarks] = useState('')
  const [lostReasonCode, setLostReasonCode] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [confirming, setConfirming] = useState(false)

  const selected = options.find((item) => item.code === statusCode)
  const lostReasonRequired = Boolean(selected?.lostReasonRequired)
  const needsOverride = Boolean(selected?.requiresOverride)
  const dirty = Boolean(statusCode || remarks || lostReasonCode || overrideReason)

  useEffect(() => {
    if (!open) {
      setStatusCode('')
      setRemarks('')
      setLostReasonCode('')
      setOverrideReason('')
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
      content: 'You have unsaved status changes. Close without updating?',
      okText: 'Discard',
      cancelText: 'Keep editing',
      onOk: onClose,
      afterClose: () => setConfirming(false),
    })
  }

  return (
    <AntModal open={open} onClose={requestClose} title="Change Lead Status" width={520} mask={{ closable: !confirming }}>
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
          <span>Select New Status</span>
          <FormSelect
            showSearch
            optionFilterProp="label"
            placeholder="Select a status"
            value={statusCode || undefined}
            options={options.map((item) => ({ value: item.code, label: item.name }))}
            onChange={(value) => {
              const next = asSelectString(value)
              setStatusCode(next)
              const option = options.find((item) => item.code === next)
              if (!option?.lostReasonRequired) setLostReasonCode('')
              if (!option?.requiresOverride) setOverrideReason('')
            }}
          />
          {errors.statusCode ? <InputError>{errors.statusCode}</InputError> : null}
        </label>
        {lostReasonRequired ? (
          <label className="grid gap-1.5 text-sm">
            <span>Lost Reason</span>
            <FormSelect
              showSearch
              optionFilterProp="label"
              placeholder="Select a lost reason"
              value={lostReasonCode || undefined}
              options={lostReasons}
              onChange={(value) => setLostReasonCode(asSelectString(value))}
            />
            {errors.lostReasonCode ? <InputError>{errors.lostReasonCode}</InputError> : null}
          </label>
        ) : null}
        <label className="grid gap-1.5 text-sm">
          <span>Reason / Remarks</span>
          <FormTextArea
            autoSize={{ minRows: 3, maxRows: 8 }}
            maxLength={1000}
            showCount
            value={remarks}
            placeholder="Optional remarks"
            onChange={(event) => setRemarks(event.target.value)}
          />
          {errors.remarks ? <InputError>{errors.remarks}</InputError> : null}
        </label>
        {needsOverride ? (
          <label className="grid gap-1.5 text-sm">
            <span>Override Reason *</span>
            <FormTextArea
              autoSize={{ minRows: 2, maxRows: 6 }}
              maxLength={1000}
              value={overrideReason}
              placeholder="This jump skips required stages. Record why."
              onChange={(event) => setOverrideReason(event.target.value)}
            />
            {errors.overrideReason ? <InputError>{errors.overrideReason}</InputError> : null}
          </label>
        ) : null}
        <div className="mt-2 flex justify-end gap-2">
          <PrimaryButton type="button" variant="outline" onClick={requestClose} label="Cancel" />
          <PrimaryButton
            type="button"
            loading={saving}
            onClick={() = label={<>void onSubmit({
                statusCode,
                remarks,
                lostReasonCode,
                override: needsOverride,
                overrideReason,
              })
            }
          >
            Update Status</>} />
        </div>
      </div>
    </AntModal>
  )
}

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
            onClick={() = label={<>void onSubmit({ statusCode, reasonCode, remarks })}
          >
            Confirm</>} />
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
            onClick={() = label={<>void onSubmit({ reopenReason, followUpDate, ownerId })}
          >
            Reopen</>} />
        </div>
      </div>
    </AntModal>
  )
}
