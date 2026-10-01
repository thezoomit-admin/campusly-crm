import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { PrimaryButton } from '@/components/ui'
import { FormDatePicker, FormSelect, FormSwitch, FormTextArea } from '@/components/common/Forms'
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
  const [createNext, setCreateNext] = useState(true)
  const [nextDueAt, setNextDueAt] = useState('')
  const [nextType, setNextType] = useState('Call')
  const [nextPriority, setNextPriority] = useState('Medium')
  const [nextReminder, setNextReminder] = useState('30 Minutes Before')

  useEffect(() => {
    if (!open || !followUp) return
    setOutcome('Interested')
    setNotes('')
    setNextAction(followUp.nextAction || '')
    setCreateNext(true)
    setNextDueAt('')
    setNextType(followUp.type || 'Call')
    setNextPriority(followUp.priority || 'Medium')
    setNextReminder(followUp.reminder || '30 Minutes Before')
  }, [open, followUp])

  async function handleSubmit() {
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
    <AntModal open={open} onClose={onClose} title="Complete Follow-up" width={680}>
      <div className="grid gap-3">
        {followUp ? (
          <p className="m-0 rounded-lg bg-[#f7fafc] px-3 py-2 text-sm text-[#3d5166] dark:bg-hover-bg dark:text-text">
            {followUp.type} · {followUp.due} · {followUp.contact}
          </p>
        ) : null}
        <label className="grid gap-1.5 text-sm">
          <span>Outcome</span>
          <FormSelect
            showSearch
            optionFilterProp="label"
            value={outcome}
            options={FOLLOW_UP_OUTCOMES.map((value) => ({ value, label: value }))}
            onChange={(value) => setOutcome(asSelectString(value) || 'Interested')}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>Notes</span>
          <FormTextArea
            autoSize={{ minRows: 2, maxRows: 6 }}
            maxLength={1000}
            showCount
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span>Next Action</span>
          <FormTextArea
            autoSize={{ minRows: 2, maxRows: 5 }}
            maxLength={500}
            showCount
            value={nextAction}
            placeholder="e.g. Send University List"
            onChange={(event) => setNextAction(event.target.value)}
          />
        </label>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#e7eef5] px-3 py-2.5 dark:border-border">
          <span className="text-sm text-[#17324f] dark:text-text">Create Next Follow-up</span>
          <FormSwitch checked={createNext} onChange={setCreateNext} />
        </div>
        {createNext ? (
          <>
            <label className="grid gap-1.5 text-sm">
              <span>Next Follow-up Date & Time</span>
              <FormDatePicker
                showTime
                className="w-full"
                format="DD MMM YYYY hh:mm A"
                value={nextDueAt ? dayjs(nextDueAt) : null}
                onChange={(value) => setNextDueAt(value ? value.toISOString() : '')}
              />
            </label>
            <div className="grid gap-3 min-[481px]:grid-cols-3">
              <label className="grid gap-1.5 text-sm">
                <span>Type</span>
                <FormSelect
                  value={nextType}
                  options={FOLLOW_UP_TYPES.map((value) => ({ value, label: value }))}
                  onChange={(value) => setNextType(asSelectString(value) || 'Call')}
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span>Priority</span>
                <FormSelect
                  value={nextPriority}
                  options={FOLLOW_UP_PRIORITIES.map((value) => ({ value, label: value }))}
                  onChange={(value) => setNextPriority(asSelectString(value) || 'Medium')}
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span>Reminder</span>
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
    <AntModal open={open} onClose={onClose} title="Cancel Follow-up" width={480}>
      <div className="grid gap-3">
        {followUp ? (
          <p className="m-0 rounded-lg bg-[#f7fafc] px-3 py-2 text-sm text-[#3d5166] dark:bg-hover-bg dark:text-text">
            {followUp.type} · {followUp.due} · {followUp.contact}
          </p>
        ) : null}
        <label className="grid gap-1.5 text-sm">
          <span>Reason</span>
          <FormTextArea
            autoSize={{ minRows: 2, maxRows: 5 }}
            maxLength={1000}
            value={reason}
            placeholder="Why is this follow-up no longer needed?"
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <PrimaryButton type="button" variant="outline" onClick={onClose} label="Keep Follow-up" />
          <PrimaryButton type="button" loading={saving} onClick={() => void onSubmit(reason.trim())} label="Cancel Follow-up" />
        </div>
      </div>
    </AntModal>
  )
}
