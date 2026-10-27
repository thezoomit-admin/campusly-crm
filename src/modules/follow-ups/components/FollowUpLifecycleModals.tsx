import { useEffect, useState, type ReactNode } from 'react'
import dayjs from 'dayjs'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserIcon } from '@hugeicons/core-free-icons'
import { PrimaryButton } from '@/components/ui'
import { FormDatePicker, FormSelect, FormSwitch, FormTextArea, InputError } from '@/components/common/Forms'
import { AntModal } from '@/components/common/Modals'
import {
  FOLLOW_UP_OUTCOMES,
  FOLLOW_UP_PRIORITIES,
  FOLLOW_UP_REMINDERS,
  FOLLOW_UP_TYPES,
  type CompleteFollowUpValues,
  type FollowUpRecord,
  type RescheduleFollowUpValues,
} from '../types'
import { formatDisplayDateTime } from '@/modules/leads/utils/leadDetails'

function asSelectString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function RequiredMark() {
  return <span className="text-[#ef4444]"> *</span>
}

function FieldLabel({
  children,
  required,
}: {
  children: ReactNode
  required?: boolean
}) {
  return (
    <span className="text-[0.84rem] font-semibold text-[#17324f] dark:text-text-strong">
      {children}
      {required ? <RequiredMark /> : null}
    </span>
  )
}

function ContextBanner({ followUp }: { followUp: FollowUpRecord }) {
  const name = followUp.lead?.name || followUp.contactName || followUp.contact
  const code = followUp.lead?.code
  const due = followUp.due || formatDisplayDateTime(followUp.dueAt)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-[#eef8f3] px-3.5 py-2.5 text-[0.84rem] dark:bg-emerald-950/35">
      <span className="inline-flex items-center gap-1.5 font-semibold text-[#17324f] dark:text-text-strong">
        <HugeiconsIcon icon={UserIcon} size={16} color="#129a62" strokeWidth={1.8} />
        Lead: {name}
      </span>
      {code ? (
        <>
          <span className="text-[#c5d5c9]">|</span>
          <span className="text-[#5b6b7c] dark:text-text">
            Lead ID:{' '}
            <span className="font-semibold text-[#17324f] dark:text-text-strong">{code}</span>
          </span>
        </>
      ) : null}
      <span className="text-[#c5d5c9]">|</span>
      <span className="text-[#5b6b7c] dark:text-text">
        Type:{' '}
        <span className="font-semibold text-[#17324f] dark:text-text-strong">{followUp.type}</span>
      </span>
      {due ? (
        <>
          <span className="text-[#c5d5c9]">|</span>
          <span className="text-[#5b6b7c] dark:text-text">
            Scheduled:{' '}
            <span className="font-semibold text-[#17324f] dark:text-text-strong">{due}</span>
          </span>
        </>
      ) : null}
    </div>
  )
}

export function CompleteFollowUpModal({
  open,
  saving,
  followUp,
  onClose,
  onSubmit,
}: {
  open: boolean
  saving: boolean
  followUp: FollowUpRecord | null
  onClose: () => void
  onSubmit: (values: CompleteFollowUpValues) => Promise<void>
}) {
  const [outcome, setOutcome] = useState('Interested')
  const [notes, setNotes] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [createNext, setCreateNext] = useState(false)
  const [nextDueAt, setNextDueAt] = useState('')
  const [nextType, setNextType] = useState('Call')
  const [nextPriority, setNextPriority] = useState('Medium')
  const [nextReminder, setNextReminder] = useState('30 Minutes Before')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const isMeeting = followUp?.type === 'Meeting'

  useEffect(() => {
    if (!open || !followUp) return
    setOutcome('Interested')
    setNotes('')
    setNextAction(followUp.nextAction || '')
    setCreateNext(false)
    setNextDueAt('')
    setNextType(followUp.type || 'Call')
    setNextPriority(followUp.priority || 'Medium')
    setNextReminder(followUp.reminder || '30 Minutes Before')
    setErrors({})
  }, [open, followUp])

  function clearError(key: string) {
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  async function handleSubmit() {
    const next: Record<string, string> = {}
    if (!outcome.trim()) next.outcome = 'Outcome is required.'
    if (!nextAction.trim()) next.nextAction = 'Next action is required.'
    if (createNext && !nextDueAt) {
      next.nextDueAt = isMeeting
        ? 'Next meeting date and time is required.'
        : 'Next follow-up date and time is required.'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

    await onSubmit({
      outcome,
      notes: notes.trim() || undefined,
      nextAction: nextAction.trim(),
      createNextFollowUp: createNext,
      nextDueAt: createNext ? nextDueAt : undefined,
      nextType,
      nextPriority,
      nextReminder,
    })
  }

  return (
    <AntModal open={open} onClose={onClose} title={isMeeting ? 'Complete Meeting' : 'Complete Follow-up'} width={680}>
      <div className="grid gap-3">
        {followUp ? <ContextBanner followUp={followUp} /> : null}
        <label className="grid gap-1.5 text-sm">
          <FieldLabel required>Outcome</FieldLabel>
          <FormSelect
            showSearch
            optionFilterProp="label"
            value={outcome}
            options={FOLLOW_UP_OUTCOMES.map((value) => ({ value, label: value }))}
            onChange={(value) => {
              setOutcome(asSelectString(value) || 'Interested')
              clearError('outcome')
            }}
          />
          {errors.outcome ? <InputError>{errors.outcome}</InputError> : null}
        </label>
        <label className="grid gap-1.5 text-sm">
          <FieldLabel>Notes</FieldLabel>
          <FormTextArea
            autoSize={{ minRows: 2, maxRows: 6 }}
            maxLength={500}
            showCount
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <FieldLabel required>Next Action</FieldLabel>
          <FormTextArea
            autoSize={{ minRows: 2, maxRows: 5 }}
            maxLength={500}
            showCount
            value={nextAction}
            placeholder="e.g. Send University List"
            onChange={(event) => {
              setNextAction(event.target.value)
              clearError('nextAction')
            }}
          />
          {errors.nextAction ? <InputError>{errors.nextAction}</InputError> : null}
        </label>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-[#e7eef5] px-3 py-2.5 dark:border-border">
          <span className="text-sm text-[#17324f] dark:text-text">Create Next Follow-up</span>
          <FormSwitch checked={createNext} onChange={setCreateNext} />
        </div>
        {createNext ? (
          <>
            <label className="grid gap-1.5 text-sm">
              <FieldLabel required>{isMeeting ? 'Next Meeting Date & Time' : 'Next Follow-up Date & Time'}</FieldLabel>
              <FormDatePicker
                showTime
                className="w-full"
                format="DD MMM YYYY hh:mm A"
                value={nextDueAt ? dayjs(nextDueAt) : null}
                onChange={(value) => {
                  setNextDueAt(value ? value.toISOString() : '')
                  clearError('nextDueAt')
                }}
              />
              {errors.nextDueAt ? <InputError>{errors.nextDueAt}</InputError> : null}
            </label>
            <div className="grid gap-3 min-[481px]:grid-cols-3">
              <label className="grid gap-1.5 text-sm">
                <FieldLabel required>Type</FieldLabel>
                <FormSelect
                  value={nextType}
                  options={FOLLOW_UP_TYPES.map((value) => ({ value, label: value }))}
                  onChange={(value) => setNextType(asSelectString(value) || 'Call')}
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <FieldLabel>Priority</FieldLabel>
                <FormSelect
                  value={nextPriority}
                  options={FOLLOW_UP_PRIORITIES.map((value) => ({ value, label: value }))}
                  onChange={(value) => setNextPriority(asSelectString(value) || 'Medium')}
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <FieldLabel>Reminder</FieldLabel>
                <FormSelect
                  value={nextReminder}
                  options={FOLLOW_UP_REMINDERS.map((value) => ({ value, label: value }))}
                  onChange={(value) => setNextReminder(asSelectString(value) || 'No Reminder')}
                />
              </label>
            </div>
          </>
        ) : null}
        <div className="mt-2 flex justify-end gap-2">
          <PrimaryButton type="button" variant="outline" onClick={onClose} label="Cancel" />
          <PrimaryButton type="button" loading={saving} onClick={() => void handleSubmit()} label={createNext ? 'Complete & Schedule' : 'Complete'} />
        </div>
      </div>
    </AntModal>
  )
}

export function RescheduleFollowUpModal({
  open,
  saving,
  followUp,
  onClose,
  onSubmit,
}: {
  open: boolean
  saving: boolean
  followUp: FollowUpRecord | null
  onClose: () => void
  onSubmit: (values: RescheduleFollowUpValues) => Promise<void>
}) {
  const [dueAt, setDueAt] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open) return
    setDueAt('')
    setReason('')
  }, [open])

  return (
    <AntModal open={open} onClose={onClose} title="Reschedule Follow-up" width={480}>
      <div className="grid gap-3">
        {followUp ? (
          <p className="m-0 rounded-lg bg-[#f7fafc] px-3 py-2 text-sm text-[#3d5166] dark:bg-hover-bg dark:text-text">
            Current: {followUp.due || formatDisplayDateTime(followUp.dueAt)}
          </p>
        ) : null}
        <label className="grid gap-1.5 text-sm">
          <span>New Date & Time</span>
          <FormDatePicker
            showTime
            className="w-full"
            format="DD MMM YYYY hh:mm A"
            value={dueAt ? dayjs(dueAt) : null}
            onChange={(value) => setDueAt(value ? value.toISOString() : '')}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>Reason</span>
          <FormTextArea
            autoSize={{ minRows: 2, maxRows: 5 }}
            maxLength={1000}
            value={reason}
            placeholder="Why is this being rescheduled?"
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <PrimaryButton type="button" variant="outline" onClick={onClose} label="Cancel" />
          <PrimaryButton
            type="button"
            loading={saving}
            onClick={() => void onSubmit({ dueAt, reason: reason.trim() })} label="Reschedule" />
        </div>
      </div>
    </AntModal>
  )
}

export function CancelFollowUpModal({
  open,
  saving,
  followUp,
  onClose,
  onSubmit,
}: {
  open: boolean
  saving: boolean
  followUp: FollowUpRecord | null
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open) return
    setReason('')
  }, [open])

  return (
    <AntModal
      open={open}
      onClose={onClose}
      title={followUp?.type === 'Meeting' ? 'Cancel Meeting' : 'Cancel Follow-up'}
      width={480}
      styles={{ body: { paddingTop: 8 } }}
    >
      <div className="grid gap-3">
        {followUp ? <ContextBanner followUp={followUp} /> : null}
        <label className="grid gap-1.5 text-sm">
          <FieldLabel required>Reason</FieldLabel>
          <FormTextArea
            autoSize={{ minRows: 2, maxRows: 5 }}
            maxLength={1000}
            value={reason}
            placeholder={
              followUp?.type === 'Meeting'
                ? 'Why is this meeting being cancelled?'
                : 'Why is this follow-up no longer needed?'
            }
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <PrimaryButton
            type="button"
            variant="outline"
            onClick={onClose}
            label={followUp?.type === 'Meeting' ? 'Keep Meeting' : 'Keep Follow-up'}
          />
          <PrimaryButton
            type="button"
            loading={saving}
            onClick={() => void onSubmit(reason.trim())}
            label={followUp?.type === 'Meeting' ? 'Cancel Meeting' : 'Cancel Follow-up'}
          />
        </div>
      </div>
    </AntModal>
  )
}
