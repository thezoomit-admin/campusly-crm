import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { TimePicker } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Calendar03Icon,
  Call02Icon,
  File01Icon,
  Flag01Icon,
  Mail01Icon,
  Message01Icon,
  Notification01Icon,
  Target01Icon,
  UserIcon,
  Video01Icon,
  WhatsappIcon,
} from '@hugeicons/core-free-icons'
import { PrimaryButton } from '@/components/ui'
import {
  FormDatePicker,
  FormInput,
  FormSelect,
  FormTextArea,
  InputError,
} from '@/components/common/Forms'
import { AntModal } from '@/components/common/Modals'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { useListLeadAssigneesQuery, useListLeadsQuery } from '@/modules/leads/api/leadsApi'
import { stageBadgeClass } from '@/modules/leads/utils/leadDetails'
import {
  FOLLOW_UP_PRIORITIES,
  FOLLOW_UP_PURPOSES,
  FOLLOW_UP_REMINDERS,
  FOLLOW_UP_TYPES,
  type FollowUpFormValues,
} from '../types'

export type FollowUpLeadContext = {
  name: string
  code?: string | null
  status?: string | null
  ownerId?: string | null
  ownerName?: string | null
}

type FollowUpFormModalProps = {
  open: boolean
  saving?: boolean
  onClose: () => void
  onSubmit: (values: FollowUpFormValues) => Promise<void> | void
  fixedLeadId?: string
  fixedLeadLabel?: string
  lead?: FollowUpLeadContext | null
  title?: string
  initialValues?: Partial<FollowUpFormValues> | null
}

const ACTIVITY_ICONS: Record<string, IconSvgElement> = {
  Call: Call02Icon,
  WhatsApp: WhatsappIcon,
  Email: Mail01Icon,
  SMS: Message01Icon,
  Meeting: Video01Icon,
}

function asSelectString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function RequiredMark() {
  return <span className="text-[#ef4444]"> *</span>
}

function FieldLabel({
  children,
  required,
  extra,
}: {
  children: ReactNode
  required?: boolean
  extra?: ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1 text-[0.84rem] font-semibold text-[#17324f] dark:text-text-strong">
      <span>
        {children}
        {required ? <RequiredMark /> : null}
      </span>
      {extra}
    </span>
  )
}

function fieldIcon(icon: IconSvgElement) {
  return <HugeiconsIcon icon={icon} size={16} color="#8b97a8" strokeWidth={1.8} />
}

function statusBadgeClass(status: string) {
  if (status.trim().toLowerCase() === 'interested') {
    return 'bg-[#d9f5e5] text-[#128a56] dark:bg-emerald-600/20 dark:text-[#86efac]'
  }
  return stageBadgeClass(status)
}

export default function FollowUpFormModal({
  open,
  saving,
  onClose,
  onSubmit,
  fixedLeadId,
  fixedLeadLabel,
  lead,
  title = 'Schedule Follow-up',
  initialValues = null,
}: FollowUpFormModalProps) {
  const { user } = useAuth()
  const [leadSearch, setLeadSearch] = useState('')
  const [leadId, setLeadId] = useState('')
  const [pickedLead, setPickedLead] = useState<FollowUpLeadContext | null>(null)
  const [activityType, setActivityType] = useState('Call')
  const [assigneeId, setAssigneeId] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpTime, setFollowUpTime] = useState<Dayjs | null>(null)
  const [reminder, setReminder] = useState('30 Minutes Before')
  const [purpose, setPurpose] = useState('Initial Contact')
  const [purposeOther, setPurposeOther] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [nextAction, setNextAction] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const assigneeKeyRef = useRef('')

  const debouncedLeadSearch = useDebounce(leadSearch, 300)
  const { data: leadsData, isFetching: leadsLoading } = useListLeadsQuery(
    { search: debouncedLeadSearch, limit: 20 },
    { skip: !open || Boolean(fixedLeadId) },
  )
  const { data: assigneesData, isFetching: assigneesLoading } = useListLeadAssigneesQuery(
    undefined,
    { skip: !open },
  )

  const contextLead = fixedLeadId ? lead : pickedLead
  const bannerName = contextLead?.name || (fixedLeadId ? fixedLeadLabel : '') || ''
  const bannerCode = contextLead?.code || ''
  const bannerStatus = contextLead?.status || ''

  useEffect(() => {
    if (!open) return
    const due = initialValues?.dueAt ? dayjs(initialValues.dueAt) : null
    const validDue = due?.isValid() ? due : null
    setLeadSearch('')
    setLeadId(fixedLeadId || initialValues?.leadId || '')
    setPickedLead(null)
    setActivityType(initialValues?.type || 'Call')
    setAssigneeId(initialValues?.ownerId || '')
    setFollowUpDate(validDue ? validDue.format('YYYY-MM-DD') : '')
    setFollowUpTime(validDue)
    setReminder(initialValues?.reminder || '30 Minutes Before')
    setPurpose(initialValues?.purpose || 'Initial Contact')
    setPurposeOther(initialValues?.purposeOther || '')
    setPriority(initialValues?.priority || 'Medium')
    setNextAction(initialValues?.nextAction || '')
    setNotes(initialValues?.notes || '')
    setErrors({})
  }, [open, fixedLeadId, initialValues])

  const assignees = assigneesData?.items || []

  useEffect(() => {
    if (!open) {
      assigneeKeyRef.current = ''
      return
    }
    const preferredId = initialValues?.ownerId || ''
    const key = `${fixedLeadId || ''}|${leadId}|${preferredId}|${contextLead?.ownerId || ''}|${contextLead?.ownerName || ''}`
    if (assigneeKeyRef.current === key) return
    const items = assigneesData?.items || []
    if (items.length === 0 && !preferredId && !contextLead?.ownerId && !user?.id) return
    const ownerId = contextLead?.ownerId || ''
    const ownerName = (contextLead?.ownerName || '').trim().toLowerCase()
    const preferred = preferredId ? items.find((item) => item.id === preferredId) : undefined
    const byId = ownerId ? items.find((item) => item.id === ownerId) : undefined
    const byName = ownerName
      ? items.find((item) => item.name.trim().toLowerCase() === ownerName)
      : undefined
    const you = user?.id ? items.find((item) => item.id === user.id) : undefined
    const next =
      preferred?.id ||
      preferredId ||
      byId?.id ||
      byName?.id ||
      you?.id ||
      items[0]?.id ||
      ownerId ||
      user?.id ||
      ''
    if (!next) return
    assigneeKeyRef.current = key
    setAssigneeId(next)
  }, [
    open,
    fixedLeadId,
    leadId,
    contextLead?.ownerId,
    contextLead?.ownerName,
    assigneesData?.items,
    user?.id,
    initialValues?.ownerId,
  ])

  const assigneeOptions = useMemo(() => {
    const options = assignees.map((item) => ({
      value: item.id,
      label: item.id === user?.id ? `${item.name} (You)` : item.name,
    }))
    const ownerId = contextLead?.ownerId || ''
    if (ownerId && !options.some((item) => item.value === ownerId)) {
      const name = contextLead?.ownerName || 'Lead owner'
      options.unshift({
        value: ownerId,
        label: ownerId === user?.id ? `${name} (You)` : name,
      })
    }
    if (user?.id && !options.some((item) => item.value === user.id)) {
      options.unshift({ value: user.id, label: `${user.fullName} (You)` })
    }
    return options
  }, [assignees, contextLead?.ownerId, contextLead?.ownerName, user?.fullName, user?.id])

  const leadOptions = (leadsData?.items || []).map((item) => ({
    value: item.id,
    label: `${item.code || item.id} — ${item.name}`,
  }))

  function clearError(key: string) {
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!fixedLeadId && !leadId) next.leadId = 'Lead is required.'
    if (!activityType) next.activityType = 'Activity type is required.'
    if (!assigneeId) next.assigneeId = 'Assigned to is required.'
    if (!followUpDate) next.followUpDate = 'Follow-up date is required.'
    if (!followUpTime) next.followUpTime = 'Follow-up time is required.'
    if (followUpDate && followUpTime) {
      const due = dayjs(`${followUpDate}T${followUpTime.format('HH:mm')}:00`)
      if (!due.isValid() || due.isBefore(dayjs())) {
        next.followUpDate = "You can't select a past date and time."
      }
    }
    if (!purpose) next.purpose = 'Purpose is required.'
    if (purpose === 'Other' && !purposeOther.trim()) {
      next.purposeOther = 'Please provide a reason.'
    }
    if (!nextAction.trim()) next.nextAction = 'Please enter the next action.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit() {
    if (!validate() || !followUpTime) return
    const due = dayjs(`${followUpDate}T${followUpTime.format('HH:mm')}:00`)
    await onSubmit({
      leadId: fixedLeadId || leadId,
      type: activityType,
      dueAt: due.toISOString(),
      priority,
      purpose,
      purposeOther: purpose === 'Other' ? purposeOther.trim() : undefined,
      notes: notes.trim() || undefined,
      nextAction: nextAction.trim(),
      reminder,
      ownerId: assigneeId,
    })
  }

  return (
    <AntModal
      open={open}
      onClose={onClose}
      width={760}
      styles={{
        header: {
          padding: '16px 20px 14px',
          borderBottom: '1px solid #eef3f8',
        },
        body: { padding: 0 },
      }}
      title={
        <span className="flex items-center gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e7f6ee] text-[#129a62] dark:bg-emerald-950/50">
            <HugeiconsIcon
              icon={Calendar03Icon}
              size={20}
              color="currentColor"
              strokeWidth={1.8}
            />
          </span>
          <span className="grid gap-0.5">
            <span className="text-[1.02rem] font-semibold leading-tight text-[#17324f] dark:text-text-strong">
              {title}
            </span>
            <span className="text-[0.8rem] font-normal leading-tight text-[#8b97a8]">
              Plan your next contact with this lead
            </span>
          </span>
        </span>
      }
    >
      <div className="grid max-h-[calc(100vh-180px)] gap-3.5 overflow-y-auto px-5 py-4">
        {bannerName ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-[#eef8f3] px-3.5 py-2.5 text-[0.84rem] dark:bg-emerald-950/35">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#17324f] dark:text-text-strong">
              <HugeiconsIcon icon={UserIcon} size={16} color="#129a62" strokeWidth={1.8} />
              Lead: {bannerName}
            </span>
            {bannerCode ? (
              <>
                <span className="text-[#c5d5c9]">|</span>
                <span className="text-[#5b6b7c] dark:text-text">
                  Lead ID:{' '}
                  <span className="font-semibold text-[#17324f] dark:text-text-strong">
                    {bannerCode}
                  </span>
                </span>
              </>
            ) : null}
            {bannerStatus ? (
              <>
                <span className="text-[#c5d5c9]">|</span>
                <span className="inline-flex items-center gap-2 text-[#5b6b7c] dark:text-text">
                  Current Status:
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[0.75rem] font-semibold ${statusBadgeClass(bannerStatus)}`}
                  >
                    {bannerStatus}
                  </span>
                </span>
              </>
            ) : null}
          </div>
        ) : null}

        {fixedLeadId ? null : (
          <label className="grid gap-1">
            <FieldLabel required>Lead</FieldLabel>
            <FormSelect
              showSearch
              filterOption={false}
              allowClear={false}
              placeholder={leadsLoading ? 'Loading leads…' : 'Search lead by name or code'}
              value={leadId || undefined}
              options={leadOptions}
              onSearch={setLeadSearch}
              notFoundContent={leadsLoading ? 'Loading…' : 'No leads found'}
              onChange={(value) => {
                const nextId = asSelectString(value)
                setLeadId(nextId)
                const row = (leadsData?.items || []).find((item) => item.id === nextId)
                setPickedLead(
                  row
                    ? {
                        name: row.name,
                        code: row.code,
                        status: row.status,
                        ownerName: row.owner,
                      }
                    : null,
                )
                clearError('leadId')
              }}
            />
            {errors.leadId ? <InputError>{errors.leadId}</InputError> : null}
          </label>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <FieldLabel required>Activity Type</FieldLabel>
            <FormSelect
              showSearch
              optionFilterProp="label"
              allowClear={false}
              prefix={fieldIcon(ACTIVITY_ICONS[activityType] || Call02Icon)}
              value={activityType || undefined}
              options={FOLLOW_UP_TYPES.map((value) => ({ value, label: value }))}
              onChange={(value) => {
                setActivityType(asSelectString(value) || 'Call')
                clearError('activityType')
              }}
            />
            {errors.activityType ? <InputError>{errors.activityType}</InputError> : null}
          </label>

          <label className="grid gap-1">
            <FieldLabel required>Assigned To</FieldLabel>
            <FormSelect
              showSearch
              optionFilterProp="label"
              allowClear={false}
              prefix={fieldIcon(UserIcon)}
              placeholder={assigneesLoading ? 'Loading assignees…' : 'Select assignee'}
              value={assigneeId || undefined}
              options={assigneeOptions}
              onChange={(value) => {
                setAssigneeId(asSelectString(value))
                clearError('assigneeId')
              }}
            />
            {errors.assigneeId ? <InputError>{errors.assigneeId}</InputError> : null}
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1">
            <FieldLabel required>Follow-up Date</FieldLabel>
            <FormDatePicker
              className="w-full"
              format="ddd, MMM D, YYYY"
              placeholder="Select date"
              value={followUpDate ? dayjs(followUpDate) : null}
              disabledDate={(current) =>
                Boolean(current && current < dayjs().startOf('day'))
              }
              onChange={(value) => {
                setFollowUpDate(value ? value.format('YYYY-MM-DD') : '')
                clearError('followUpDate')
              }}
            />
            {errors.followUpDate ? <InputError>{errors.followUpDate}</InputError> : null}
          </label>

          <label className="grid gap-1">
            <FieldLabel required>Follow-up Time</FieldLabel>
            <TimePicker
              className="w-full"
              size="large"
              format="hh:mm A"
              use12Hours
              needConfirm={false}
              placeholder="Select time"
              value={followUpTime}
              disabledTime={() => {
                if (!followUpDate || !dayjs(followUpDate).isSame(dayjs(), 'day')) return {}
                const now = dayjs()
                return {
                  disabledHours: () => Array.from({ length: now.hour() }, (_, hour) => hour),
                  disabledMinutes: (selectedHour) =>
                    selectedHour === now.hour()
                      ? Array.from({ length: now.minute() }, (_, minute) => minute)
                      : [],
                }
              }}
              onChange={(value) => {
                setFollowUpTime(value)
                clearError('followUpDate')
                clearError('followUpTime')
              }}
            />
            {errors.followUpTime ? <InputError>{errors.followUpTime}</InputError> : null}
          </label>

          <label className="grid gap-1">
            <FieldLabel extra={fieldIcon(Notification01Icon)}>Reminder</FieldLabel>
            <FormSelect
              allowClear={false}
              prefix={fieldIcon(Notification01Icon)}
              value={reminder}
              options={FOLLOW_UP_REMINDERS.map((value) => ({ value, label: value }))}
              onChange={(value) => setReminder(asSelectString(value) || 'No Reminder')}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <FieldLabel required>Purpose</FieldLabel>
            <FormSelect
              showSearch
              optionFilterProp="label"
              allowClear={false}
              prefix={fieldIcon(Target01Icon)}
              value={purpose || undefined}
              options={FOLLOW_UP_PURPOSES.map((value) => ({ value, label: value }))}
              onChange={(value) => {
                const next = asSelectString(value)
                setPurpose(next)
                if (next !== 'Other') setPurposeOther('')
                clearError('purpose')
              }}
            />
            {errors.purpose ? <InputError>{errors.purpose}</InputError> : null}
          </label>

          <label className="grid gap-1">
            <FieldLabel>Priority</FieldLabel>
            <FormSelect
              allowClear={false}
              prefix={fieldIcon(Flag01Icon)}
              value={priority}
              options={FOLLOW_UP_PRIORITIES.map((value) => ({ value, label: value }))}
              onChange={(value) => setPriority(asSelectString(value) || 'Medium')}
            />
          </label>
        </div>

        {purpose === 'Other' ? (
          <label className="grid gap-1">
            <FieldLabel required>Purpose description</FieldLabel>
            <FormInput
              value={purposeOther}
              maxLength={500}
              placeholder="Describe the purpose"
              onChange={(event) => {
                setPurposeOther(event.target.value)
                clearError('purposeOther')
              }}
            />
            {errors.purposeOther ? <InputError>{errors.purposeOther}</InputError> : null}
          </label>
        ) : null}

        <label className="grid gap-1">
          <FieldLabel required>Next Action</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute top-3 left-3 z-1 text-[#8b97a8]">
              {fieldIcon(File01Icon)}
            </span>
            <FormTextArea
              value={nextAction}
              maxLength={500}
              autoSize={{ minRows: 2, maxRows: 4 }}
              className="rounded-[10px]! pl-9!"
              placeholder="What needs to happen next?"
              onChange={(event) => {
                setNextAction(event.target.value)
                clearError('nextAction')
              }}
            />
          </div>
          <span className="flex items-start justify-between gap-3">
            {errors.nextAction ? <InputError>{errors.nextAction}</InputError> : <span />}
            <span className="shrink-0 text-[0.75rem] text-[#8b97a8]">{nextAction.length}/500</span>
          </span>
        </label>

        <label className="grid gap-1">
          <span className="text-[0.84rem] font-semibold text-[#17324f] dark:text-text-strong">
            Notes <span className="font-normal text-[#8b97a8]">(Optional)</span>
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute top-3 left-3 z-1 text-[#8b97a8]">
              {fieldIcon(File01Icon)}
            </span>
            <FormTextArea
              value={notes}
              maxLength={1000}
              autoSize={{ minRows: 2, maxRows: 5 }}
              className="rounded-[10px]! pl-9!"
              placeholder="Add any additional notes or context..."
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
          <span className="text-right text-[0.75rem] text-[#8b97a8]">{notes.length}/1000</span>
        </label>
      </div>

      <div className="flex justify-end gap-2 border-t border-[#eef3f8] px-5 py-3.5 dark:border-border-subtle">
        <PrimaryButton type="button" variant="outline" size="md" onClick={onClose} label="Cancel" />
        <PrimaryButton
          type="button"
          size="md"
          loading={Boolean(saving)}
          onClick={() => void handleSubmit()}
          icon={
            <HugeiconsIcon
              icon={Calendar03Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.8}
            />
          }
          label="Save Follow-up"
        />
      </div>
    </AntModal>
  )
}
