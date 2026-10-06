import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { Modal, TimePicker } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowDataTransferHorizontalIcon,
  Clock01Icon,
  CloudUploadIcon,
  Mail01Icon,
} from '@hugeicons/core-free-icons'
import { PrimaryButton } from '@/components/ui'
import {
  FormDatePicker,
  FormInput,
  FormSelect,
  FormSwitch,
  FormTextArea,
  InputError,
} from '@/components/common/Forms'
import { AntModal } from '@/components/common/Modals'
import { useListMasterDataOptionsQuery } from '@/redux/features/masterData/masterDataApi'
import type { ActivityFeedItem } from '@/types'
import type { MasterOption } from '../../hooks/useLeadMasterOptions'
import type { LeadStatusOption } from '../../types'
import { activityTitle, formatDisplayDateTime } from '../../utils/leadDetails'

const LEAD_DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx'
const LEAD_DOCUMENT_MAX_BYTES = 5 * 1024 * 1024

const FALLBACK_CHANNELS = [
  { value: 'CALL', label: 'Call' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
  { value: 'IN_PERSON', label: 'In-person' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'NOTE', label: 'Note' },
  { value: 'OTHER', label: 'Other' },
]

const MEETING_TYPE_OPTIONS = [
  { value: 'Counselling', label: 'Counselling' },
  { value: 'University Discussion', label: 'University Discussion' },
  { value: 'Document Collection', label: 'Document Collection' },
  { value: 'Site Survey', label: 'Site Survey' },
  { value: 'Payment Discussion', label: 'Payment Discussion' },
  { value: 'Other', label: 'Other' },
]

const MEETING_MODE_OPTIONS = [
  { value: 'Offline', label: 'Offline' },
  { value: 'Online', label: 'Online' },
  { value: 'Hybrid', label: 'Hybrid' },
]

export type ChangeStatusMeetingPayload = {
  title: string
  type: string
  mode: string
  date: string
  startTime: string
  endTime: string
  location: string
  agenda: string
}

export type ChangeStatusSubmitPayload = {
  statusCode: string
  remarks: string
  lostReasonCode: string
  override: boolean
  overrideReason: string
  channels: string[]
  nextFollowUpAt: string
  scheduleMeeting: boolean
  meeting: ChangeStatusMeetingPayload | null
  attachment: File | null
}

export type ChangeStatusEmailPayload = {
  subject: string
  body: string
}

type TabKey = 'status' | 'email'

function asSelectString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function asSelectStrings(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
  return []
}

function extraText(extras: Record<string, unknown> | null | undefined, key: string) {
  const value = extras?.[key]
  return typeof value === 'string' ? value : ''
}

function RequiredMark() {
  return <span className="text-[#ef4444]"> *</span>
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="text-[0.84rem] font-semibold text-[#17324f] dark:text-text-strong">
      {children}
      {required ? <RequiredMark /> : null}
    </span>
  )
}

function ActivityHistorySidebar({
  activities,
  onViewHistory,
}: {
  activities: ActivityFeedItem[]
  onViewHistory?: () => void
}) {
  const recent = activities.slice(0, 12)

  return (
    <aside className="flex min-h-0 flex-col border-t border-[#e8eef5] lg:border-t-0 lg:border-l dark:border-border">
      <div className="flex items-center justify-between gap-2 border-b border-[#eef3f8] px-4 py-3 dark:border-border-subtle">
        <div className="flex items-center gap-2 text-[0.9rem] font-semibold text-[#17324f] dark:text-text-strong">
          <HugeiconsIcon icon={Clock01Icon} size={16} color="currentColor" strokeWidth={1.7} />
          Activity History
        </div>
        {onViewHistory ? (
          <button
            type="button"
            onClick={onViewHistory}
            className="cursor-pointer border-0 bg-transparent p-0 text-[0.78rem] font-semibold text-primary hover:underline"
          >
            View full history
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {recent.length === 0 ? (
          <p className="m-0 px-1 py-2 text-[0.84rem] text-[#8b97a8]">No activities recorded for this lead yet.</p>
        ) : (
          <ol className="m-0 grid list-none gap-0 p-0">
            {recent.map((item, index) => (
              <li
                key={item.id}
                className="relative flex gap-3 border-b border-[#eef3f8] py-2.5 last:border-b-0 dark:border-border-subtle"
              >
                <span className="relative z-[1] mt-1 size-3.5 shrink-0 rounded-full border-[3px] border-[#e7f8ef] bg-primary dark:border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)]" />
                {index < recent.length - 1 ? (
                  <span className="absolute top-6 bottom-[-2px] left-[6px] w-px bg-[#e6eef6] dark:bg-border-subtle" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="m-0 break-words text-[0.86rem] font-semibold text-[#17324f] [overflow-wrap:anywhere] dark:text-text-strong">
                    {activityTitle(item.action, item.details, item.outcome)}
                  </p>
                  {item.details ? (
                    <p className="mt-0.5 mb-0 line-clamp-2 break-words text-[0.78rem] text-[#5b6b7c] [overflow-wrap:anywhere]">
                      {item.details}
                    </p>
                  ) : null}
                  <p className="mt-0.5 mb-0 text-[0.72rem] text-[#8b97a8]">
                    {formatDisplayDateTime(item.occurredAt)}
                    {item.user?.fullName ? ` · ${item.user.fullName}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </aside>
  )
}

export default function ChangeStatusModal({
  open,
  saving,
  emailSending = false,
  leadName,
  leadEmail,
  activities = [],
  options,
  lostReasons,
  errors,
  onClose,
  onSubmit,
  onSendEmail,
  onViewHistory,
}: {
  open: boolean
  saving: boolean
  emailSending?: boolean
  leadName: string
  leadEmail?: string | null
  activities?: ActivityFeedItem[]
  options: LeadStatusOption[]
  lostReasons: MasterOption[]
  errors: Record<string, string>
  onClose: () => void
  onSubmit: (body: ChangeStatusSubmitPayload) => Promise<void>
  onSendEmail?: (body: ChangeStatusEmailPayload) => Promise<void>
  onViewHistory?: () => void
}) {
  const [tab, setTab] = useState<TabKey>('status')
  const [statusCode, setStatusCode] = useState('')
  const [channels, setChannels] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [lostReasonCode, setLostReasonCode] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [nextFollowUpAt, setNextFollowUpAt] = useState('')
  const [scheduleMeeting, setScheduleMeeting] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingType, setMeetingType] = useState('')
  const [meetingMode, setMeetingMode] = useState('Offline')
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingStart, setMeetingStart] = useState<Dayjs | null>(null)
  const [meetingEnd, setMeetingEnd] = useState<Dayjs | null>(null)
  const [meetingLocation, setMeetingLocation] = useState('')
  const [meetingAgenda, setMeetingAgenda] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [confirming, setConfirming] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: channelData } = useListMasterDataOptionsQuery(
    { category: 'CONVERSATION_CHANNEL' },
    { skip: !open },
  )

  const channelOptions = useMemo(() => {
    const items = channelData?.items || []
    if (items.length === 0) return FALLBACK_CHANNELS
    return items
      .map((item) => {
        const code = (item.code || item.name).trim().toUpperCase().replace(/\s+/g, '_')
        if (code === 'NONE') return null
        return { value: code, label: item.name || extraText(item.extras, 'label') || code }
      })
      .filter((item): item is { value: string; label: string } => Boolean(item))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [channelData?.items])

  const selected = options.find((item) => item.code === statusCode)
  const lostReasonRequired = Boolean(selected?.lostReasonRequired)
  const needsOverride = Boolean(selected?.requiresOverride)
  const hasEmail = Boolean(leadEmail?.trim())
  const displayName = leadName || 'Lead'

  const dirty = Boolean(
    statusCode ||
      channels.length ||
      note ||
      lostReasonCode ||
      overrideReason ||
      nextFollowUpAt ||
      scheduleMeeting ||
      meetingTitle ||
      meetingType ||
      meetingDate ||
      meetingStart ||
      meetingEnd ||
      meetingLocation ||
      meetingAgenda ||
      attachment ||
      emailSubject ||
      emailBody,
  )

  useEffect(() => {
    if (!open) {
      setTab('status')
      setStatusCode('')
      setChannels([])
      setNote('')
      setLostReasonCode('')
      setOverrideReason('')
      setNextFollowUpAt('')
      setScheduleMeeting(false)
      setMeetingTitle('')
      setMeetingType('')
      setMeetingMode('Offline')
      setMeetingDate('')
      setMeetingStart(null)
      setMeetingEnd(null)
      setMeetingLocation('')
      setMeetingAgenda('')
      setAttachment(null)
      setLocalErrors({})
      setEmailSubject('')
      setEmailBody('')
      setConfirming(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
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

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] || null
    setLocalErrors((current) => ({ ...current, attachment: '' }))
    if (!selectedFile) {
      setAttachment(null)
      return
    }
    if (selectedFile.size > LEAD_DOCUMENT_MAX_BYTES) {
      setAttachment(null)
      setLocalErrors((current) => ({ ...current, attachment: 'Attachment must be 5 MB or smaller.' }))
      event.target.value = ''
      return
    }
    setAttachment(selectedFile)
  }

  function validateStatusForm() {
    const next: Record<string, string> = {}
    if (!statusCode) next.statusCode = 'Please select the next status.'
    if (channels.length === 0) next.channels = 'Please select at least one channel.'
    if (!note.trim()) next.note = 'Please add a note.'
    if (!nextFollowUpAt) next.nextFollowUpAt = 'Please choose a next follow-up date.'
    if (lostReasonRequired && !lostReasonCode) next.lostReasonCode = 'Please select a lost reason.'
    if (needsOverride && !overrideReason.trim()) next.overrideReason = 'Override reason is required.'

    if (scheduleMeeting) {
      if (!meetingTitle.trim()) next.meetingTitle = 'Meeting title is required.'
      if (!meetingType) next.meetingType = 'Meeting type is required.'
      if (!meetingMode) next.meetingMode = 'Mode is required.'
      if (!meetingDate) next.meetingDate = 'Meeting date is required.'
      if (!meetingStart) next.meetingStart = 'Start time is required.'
      if (!meetingLocation.trim()) next.meetingLocation = 'Location is required.'
    }

    setLocalErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSave() {
    if (!validateStatusForm()) return

    const meeting: ChangeStatusMeetingPayload | null = scheduleMeeting
      ? {
          title: meetingTitle.trim(),
          type: meetingType,
          mode: meetingMode,
          date: meetingDate,
          startTime: meetingStart ? meetingStart.format('HH:mm') : '',
          endTime: meetingEnd ? meetingEnd.format('HH:mm') : '',
          location: meetingLocation.trim(),
          agenda: meetingAgenda.trim(),
        }
      : null

    await onSubmit({
      statusCode,
      remarks: note.trim(),
      lostReasonCode,
      override: needsOverride,
      overrideReason: overrideReason.trim(),
      channels,
      nextFollowUpAt,
      scheduleMeeting,
      meeting,
      attachment,
    })
  }

  async function handleSendEmail() {
    if (!hasEmail || !onSendEmail) return
    const next: Record<string, string> = {}
    if (!emailSubject.trim()) next.emailSubject = 'Subject is required.'
    if (!emailBody.trim()) next.emailBody = 'Message is required.'
    setLocalErrors(next)
    if (Object.keys(next).length > 0) return
    await onSendEmail({ subject: emailSubject.trim(), body: emailBody.trim() })
  }

  const mergedErrors = { ...localErrors, ...errors }

  return (
    <AntModal
      open={open}
      onClose={requestClose}
      title={`Change Status — ${displayName}`}
      width={980}
      mask={{ closable: !confirming }}
      styles={{
        body: { padding: 0 },
        header: { padding: '16px 20px 0', borderBottom: '1px solid #eef3f8' },
      }}
    >
      <div className="grid max-h-[min(82vh,760px)] grid-rows-[auto_minmax(0,1fr)_auto]">
        <div className="flex gap-5 border-b border-[#eef3f8] px-5 dark:border-border-subtle">
          {(
            [
              { key: 'status' as const, label: 'Change Status', icon: ArrowDataTransferHorizontalIcon },
              { key: 'email' as const, label: 'Send Email', icon: Mail01Icon },
            ] as const
          ).map((item) => {
            const active = tab === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`inline-flex cursor-pointer items-center gap-2 border-0 border-b-2 bg-transparent px-0.5 py-3 text-[0.88rem] font-semibold transition ${
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-[#8b97a8] hover:text-[#5b6b7c]'
                }`}
              >
                <HugeiconsIcon icon={item.icon} size={16} color="currentColor" strokeWidth={1.8} />
                {item.label}
              </button>
            )
          })}
        </div>

        <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-h-0 overflow-y-auto px-5 py-3">
            {tab === 'status' ? (
              <div className="grid gap-2.5">
                <label className="grid gap-1">
                  <FieldLabel required>Status</FieldLabel>
                  <FormSelect
                    showSearch
                    optionFilterProp="label"
                    placeholder="Select next status"
                    value={statusCode || undefined}
                    options={options.map((item) => ({ value: item.code, label: item.name }))}
                    onChange={(value) => {
                      const next = asSelectString(value)
                      setStatusCode(next)
                      const option = options.find((item) => item.code === next)
                      if (!option?.lostReasonRequired) setLostReasonCode('')
                      if (!option?.requiresOverride) setOverrideReason('')
                      setLocalErrors((current) => ({ ...current, statusCode: '' }))
                    }}
                  />
                  {mergedErrors.statusCode ? <InputError>{mergedErrors.statusCode}</InputError> : null}
                </label>

                <label className="grid gap-1">
                  <FieldLabel required>Channel</FieldLabel>
                  <FormSelect
                    mode="multiple"
                    maxTagCount="responsive"
                    showSearch
                    optionFilterProp="label"
                    placeholder="Select channel"
                    value={channels}
                    options={channelOptions}
                    onChange={(value) => {
                      setChannels(asSelectStrings(value))
                      setLocalErrors((current) => ({ ...current, channels: '' }))
                    }}
                  />
                  {mergedErrors.channels ? <InputError>{mergedErrors.channels}</InputError> : null}
                </label>

                <label className="grid gap-1">
                  <FieldLabel required>Note</FieldLabel>
                  <FormTextArea
                    autoSize={{ minRows: 2, maxRows: 5 }}
                    maxLength={1000}
                    value={note}
                    placeholder="Why is the status changing?"
                    onChange={(event) => {
                      setNote(event.target.value)
                      setLocalErrors((current) => ({ ...current, note: '' }))
                    }}
                  />
                  {mergedErrors.note || mergedErrors.remarks ? (
                    <InputError>{mergedErrors.note || mergedErrors.remarks}</InputError>
                  ) : null}
                </label>

                {lostReasonRequired ? (
                  <label className="grid gap-1">
                    <FieldLabel required>Lost Reason</FieldLabel>
                    <FormSelect
                      showSearch
                      optionFilterProp="label"
                      placeholder="Select a lost reason"
                      value={lostReasonCode || undefined}
                      options={lostReasons}
                      onChange={(value) => {
                        setLostReasonCode(asSelectString(value))
                        setLocalErrors((current) => ({ ...current, lostReasonCode: '' }))
                      }}
                    />
                    {mergedErrors.lostReasonCode ? <InputError>{mergedErrors.lostReasonCode}</InputError> : null}
                  </label>
                ) : null}

                {needsOverride ? (
                  <label className="grid gap-1">
                    <FieldLabel required>Override Reason</FieldLabel>
                    <FormTextArea
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      maxLength={1000}
                      value={overrideReason}
                      placeholder="This jump skips required stages. Record why."
                      onChange={(event) => {
                        setOverrideReason(event.target.value)
                        setLocalErrors((current) => ({ ...current, overrideReason: '' }))
                      }}
                    />
                    {mergedErrors.overrideReason ? <InputError>{mergedErrors.overrideReason}</InputError> : null}
                  </label>
                ) : null}

                <label className="grid gap-1">
                  <FieldLabel required>Next Follow-up</FieldLabel>
                  <FormDatePicker
                    className="w-full"
                    format="DD MMM YYYY"
                    placeholder="Select date"
                    value={nextFollowUpAt ? dayjs(nextFollowUpAt) : null}
                    onChange={(value) => {
                      setNextFollowUpAt(value ? value.startOf('day').toISOString() : '')
                      setLocalErrors((current) => ({ ...current, nextFollowUpAt: '' }))
                    }}
                  />
                  <span className="text-[0.72rem] text-[#8b97a8]">When should the Next Follow-up happen?</span>
                  {mergedErrors.nextFollowUpAt ? <InputError>{mergedErrors.nextFollowUpAt}</InputError> : null}
                </label>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[0.84rem] font-semibold text-[#17324f] dark:text-text-strong">
                      Schedule a meeting
                    </span>
                    <FormSwitch checked={scheduleMeeting} onChange={setScheduleMeeting} />
                  </div>

                  {scheduleMeeting ? (
                    <div className="grid gap-2.5 rounded-xl border border-[#e7eef5] bg-[#fbfcfd] p-3 dark:border-border dark:bg-hover-bg">
                      <label className="grid gap-1">
                        <FieldLabel required>Meeting Title</FieldLabel>
                        <FormInput
                          value={meetingTitle}
                          placeholder="e.g. Site survey discussion"
                          onChange={(event) => {
                            setMeetingTitle(event.target.value)
                            setLocalErrors((current) => ({ ...current, meetingTitle: '' }))
                          }}
                        />
                        {mergedErrors.meetingTitle ? <InputError>{mergedErrors.meetingTitle}</InputError> : null}
                      </label>

                      <label className="grid gap-1">
                        <FieldLabel required>Meeting Type</FieldLabel>
                        <FormSelect
                          showSearch
                          optionFilterProp="label"
                          placeholder="Select type"
                          value={meetingType || undefined}
                          options={MEETING_TYPE_OPTIONS}
                          onChange={(value) => {
                            setMeetingType(asSelectString(value))
                            setLocalErrors((current) => ({ ...current, meetingType: '' }))
                          }}
                        />
                        {mergedErrors.meetingType ? <InputError>{mergedErrors.meetingType}</InputError> : null}
                      </label>

                      <label className="grid gap-1">
                        <FieldLabel required>Mode</FieldLabel>
                        <FormSelect
                          placeholder="Select mode"
                          value={meetingMode || undefined}
                          options={MEETING_MODE_OPTIONS}
                          onChange={(value) => {
                            setMeetingMode(asSelectString(value) || 'Offline')
                            setLocalErrors((current) => ({ ...current, meetingMode: '' }))
                          }}
                        />
                        {mergedErrors.meetingMode ? <InputError>{mergedErrors.meetingMode}</InputError> : null}
                      </label>

                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <label className="grid gap-1">
                          <FieldLabel required>Date</FieldLabel>
                          <FormDatePicker
                            className="w-full"
                            format="DD MMM YYYY"
                            placeholder="Select date"
                            value={meetingDate ? dayjs(meetingDate) : null}
                            onChange={(value) => {
                              setMeetingDate(value ? value.format('YYYY-MM-DD') : '')
                              setLocalErrors((current) => ({ ...current, meetingDate: '' }))
                            }}
                          />
                          {mergedErrors.meetingDate ? <InputError>{mergedErrors.meetingDate}</InputError> : null}
                        </label>
                        <label className="grid gap-1">
                          <FieldLabel required>Start Time</FieldLabel>
                          <TimePicker
                            className="w-full"
                            size="large"
                            format="hh:mm A"
                            placeholder="Select time"
                            value={meetingStart}
                            onChange={(value) => {
                              setMeetingStart(value)
                              setLocalErrors((current) => ({ ...current, meetingStart: '' }))
                            }}
                          />
                          {mergedErrors.meetingStart ? <InputError>{mergedErrors.meetingStart}</InputError> : null}
                        </label>
                      </div>

                      <label className="grid gap-1">
                        <span className="text-[0.84rem] font-semibold text-[#17324f] dark:text-text-strong">
                          End Time <span className="font-normal text-[#8b97a8]">(optional)</span>
                        </span>
                        <TimePicker
                          className="w-full"
                          size="large"
                          format="hh:mm A"
                          placeholder="Select time"
                          value={meetingEnd}
                          onChange={(value) => setMeetingEnd(value)}
                        />
                      </label>

                      <label className="grid gap-1">
                        <FieldLabel required>Location</FieldLabel>
                        <FormInput
                          value={meetingLocation}
                          placeholder="Address or venue"
                          onChange={(event) => {
                            setMeetingLocation(event.target.value)
                            setLocalErrors((current) => ({ ...current, meetingLocation: '' }))
                          }}
                        />
                        {mergedErrors.meetingLocation ? <InputError>{mergedErrors.meetingLocation}</InputError> : null}
                      </label>

                      <label className="grid gap-1">
                        <span className="text-[0.84rem] font-semibold text-[#17324f] dark:text-text-strong">
                          Agenda
                        </span>
                        <FormTextArea
                          autoSize={{ minRows: 2, maxRows: 5 }}
                          value={meetingAgenda}
                          placeholder="Topics to cover..."
                          onChange={(event) => setMeetingAgenda(event.target.value)}
                        />
                      </label>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-1">
                  <span className="text-[0.84rem] font-semibold text-[#17324f] dark:text-text-strong">
                    Attachment <span className="font-normal text-[#8b97a8]">(optional)</span>
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={LEAD_DOCUMENT_ACCEPT}
                    className="hidden"
                    onChange={onFileChange}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <PrimaryButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      icon={<HugeiconsIcon icon={CloudUploadIcon} size={14} color="currentColor" strokeWidth={1.8} />}
                      label="Upload"
                    />
                    {attachment ? (
                      <span className="truncate text-[0.78rem] text-[#5b6b7c]">{attachment.name}</span>
                    ) : null}
                  </div>
                  {mergedErrors.attachment ? <InputError>{mergedErrors.attachment}</InputError> : null}
                </div>
              </div>
            ) : (
              <div className="grid gap-2.5">
                {!hasEmail ? (
                  <div className="flex items-start gap-3 rounded-xl border border-[#f5d9a8] bg-[#fff8e8] px-4 py-3">
                    <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f59e0b] text-white">
                      <HugeiconsIcon icon={Alert02Icon} size={15} color="currentColor" strokeWidth={2} />
                    </span>
                    <div>
                      <p className="m-0 text-[0.95rem] font-semibold text-[#7a4a12]">No email on file</p>
                      <p className="mt-1 mb-0 text-[0.84rem] text-[#8a5a22]">
                        {displayName} has no email address, so an email can&apos;t be sent.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2.5">
                    <label className="grid gap-1">
                      <FieldLabel>To</FieldLabel>
                      <FormInput value={leadEmail || ''} readOnly />
                    </label>
                    <label className="grid gap-1">
                      <FieldLabel required>Subject</FieldLabel>
                      <FormInput
                        value={emailSubject}
                        placeholder="Email subject"
                        onChange={(event) => {
                          setEmailSubject(event.target.value)
                          setLocalErrors((current) => ({ ...current, emailSubject: '' }))
                        }}
                      />
                      {mergedErrors.emailSubject ? <InputError>{mergedErrors.emailSubject}</InputError> : null}
                    </label>
                    <label className="grid gap-1">
                      <FieldLabel required>Message</FieldLabel>
                      <FormTextArea
                        autoSize={{ minRows: 6, maxRows: 12 }}
                        value={emailBody}
                        placeholder="Write your email..."
                        onChange={(event) => {
                          setEmailBody(event.target.value)
                          setLocalErrors((current) => ({ ...current, emailBody: '' }))
                        }}
                      />
                      {mergedErrors.emailBody ? <InputError>{mergedErrors.emailBody}</InputError> : null}
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          <ActivityHistorySidebar activities={activities} onViewHistory={onViewHistory} />
        </div>

        <div className="flex justify-end gap-2 border-t border-[#eef3f8] px-5 py-3.5 dark:border-border-subtle">
          <PrimaryButton type="button" variant="outline" onClick={requestClose} label="Cancel" />
          {tab === 'status' ? (
            <PrimaryButton type="button" loading={saving} onClick={() => void handleSave()} label="Save" />
          ) : (
            <PrimaryButton
              type="button"
              loading={emailSending}
              disabled={!hasEmail || !onSendEmail}
              onClick={() => void handleSendEmail()}
              label="Send Email"
            />
          )}
        </div>
      </div>
    </AntModal>
  )
}
