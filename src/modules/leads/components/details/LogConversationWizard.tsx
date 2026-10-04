import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Video01Icon,
} from '@hugeicons/core-free-icons'
import { PrimaryButton } from '@/components/ui'
import { FormDatePicker, FormTextArea } from '@/components/common/Forms'
import { AntModal } from '@/components/common/Modals'
import { useListMasterDataOptionsQuery } from '@/redux/features/masterData/masterDataApi'
import type { LeadRecord } from '../../types'
import { formatDisplayDate } from '../../utils/leadDetails'

export type LogConversationOpenStatus = 'discussed' | 'no_response' | 'nothing' | null

export type LogConversationAddon = 'meeting' | 'followup' | 'nothing' | null

export type LogConversationSubmitPayload = {
  openStatus: LogConversationOpenStatus
  followUpId: string | null
  channel: string
  activityType: string
  outcome: string
  followUpOutcome: string
  notes: string
  buyerRequirements: string
  addon: Exclude<LogConversationAddon, null>
  nextDueAt?: string
  nextAction?: string
  nextFollowUpType?: string
}

type StepId = 1 | 2 | 3 | 4 | 5

type ConversationChannelOption = {
  id: string
  code: string
  label: string
  description: string
  iconClass: string
  activityType: string
  sortOrder: number
}

const FALLBACK_CHANNEL_OPTIONS: ConversationChannelOption[] = [
  { id: 'NONE', code: 'NONE', label: 'No channel', description: 'No communication channel', iconClass: 'fa-solid fa-ban', activityType: 'OTHER', sortOrder: 1 },
  { id: 'CALL', code: 'CALL', label: 'Call', description: 'Phone call', iconClass: 'fa-solid fa-phone', activityType: 'CALL', sortOrder: 2 },
  { id: 'WHATSAPP', code: 'WHATSAPP', label: 'WhatsApp', description: 'WhatsApp message', iconClass: 'fa-brands fa-whatsapp', activityType: 'WHATSAPP', sortOrder: 3 },
  { id: 'EMAIL', code: 'EMAIL', label: 'Email', description: 'Email conversation', iconClass: 'fa-solid fa-envelope', activityType: 'EMAIL', sortOrder: 4 },
  { id: 'SMS', code: 'SMS', label: 'SMS', description: 'SMS / text message', iconClass: 'fa-solid fa-comment-sms', activityType: 'SMS', sortOrder: 5 },
  { id: 'IN_PERSON', code: 'IN_PERSON', label: 'In-person', description: 'In-person meeting', iconClass: 'fa-solid fa-user', activityType: 'MEETING', sortOrder: 6 },
  { id: 'MEETING', code: 'MEETING', label: 'Meeting', description: 'Scheduled meeting', iconClass: 'fa-solid fa-comments', activityType: 'MEETING', sortOrder: 7 },
  { id: 'NOTE', code: 'NOTE', label: 'Note', description: 'Internal note', iconClass: 'fa-solid fa-clipboard', activityType: 'OTHER', sortOrder: 8 },
  { id: 'OTHER', code: 'OTHER', label: 'Other', description: 'Other channel', iconClass: 'fa-solid fa-ellipsis', activityType: 'OTHER', sortOrder: 9 },
]

const ADDON_OPTIONS: Array<{
  id: Exclude<LogConversationAddon, null>
  title: string
  description: string
  icon: IconSvgElement
}> = [
  {
    id: 'meeting',
    title: 'Schedule a meeting',
    description: 'Book or update a meeting with this lead',
    icon: Video01Icon,
  },
  {
    id: 'followup',
    title: 'Set a Next Follow-up',
    description: 'Plan the next follow-up date and agenda',
    icon: Calendar03Icon,
  },
  {
    id: 'nothing',
    title: 'Just save the note',
    description: 'Save this activity without scheduling more',
    icon: CheckmarkCircle02Icon,
  },
]

function followUpTypeFromChannel(channelCode: string) {
  switch (channelCode) {
    case 'CALL':
      return 'Call'
    case 'WHATSAPP':
      return 'WhatsApp'
    case 'EMAIL':
      return 'Email'
    case 'SMS':
      return 'SMS'
    case 'IN_PERSON':
    case 'MEETING':
      return 'Meeting'
    default:
      return 'Other'
  }
}

function openStatusLabel(status: LogConversationOpenStatus) {
  if (status === 'discussed') return 'Discussed'
  if (status === 'no_response') return 'No response'
  if (status === 'nothing') return 'Skipped'
  return ''
}

function openStatusDetail(status: LogConversationOpenStatus) {
  if (status === 'discussed') return 'Discussed'
  if (status === 'no_response') return 'No response'
  if (status === 'nothing') return 'Skipped — continued with nothing'
  return ''
}

function addonLabel(addon: LogConversationAddon) {
  if (addon === 'meeting') return 'Meeting'
  if (addon === 'followup') return 'Follow-up'
  if (addon === 'nothing') return 'Nothing'
  return ''
}

function addonDetail(addon: LogConversationAddon) {
  if (addon === 'meeting') return 'Schedule a meeting'
  if (addon === 'followup') return 'Set a Next Follow-up'
  if (addon === 'nothing') return 'Just save the note'
  return ''
}

function truncate(text: string, max = 28) {
  const value = text.trim()
  if (value.length <= max) return value
  return `${value.slice(0, max - 1)}…`
}

function defaultOutcome(channelCode: string, openStatus: LogConversationOpenStatus) {
  if (openStatus === 'no_response') {
    return channelCode === 'CALL' ? 'No Answer' : 'Other'
  }
  if (openStatus === 'discussed') {
    return channelCode === 'CALL' ? 'Connected' : 'Completed'
  }
  return channelCode === 'CALL' ? 'Connected' : 'Completed'
}

function followUpOutcome(openStatus: LogConversationOpenStatus) {
  if (openStatus === 'no_response') return 'No Answer'
  if (openStatus === 'discussed') return 'Connected'
  return 'Other'
}

function extraText(extras: Record<string, unknown> | null | undefined, key: string) {
  const value = extras?.[key]
  return typeof value === 'string' ? value : ''
}

export default function LogConversationWizard({
  open,
  saving,
  lead,
  onClose,
  onSubmit,
}: {
  open: boolean
  saving: boolean
  lead: LeadRecord | null
  onClose: () => void
  onSubmit: (payload: LogConversationSubmitPayload) => Promise<void>
}) {
  const [step, setStep] = useState<StepId>(1)
  const [openStatus, setOpenStatus] = useState<LogConversationOpenStatus>(null)
  const [channel, setChannel] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [buyerOpen, setBuyerOpen] = useState(false)
  const [buyerRequirements, setBuyerRequirements] = useState('')
  const [addon, setAddon] = useState<LogConversationAddon>(null)
  const [nextDueAt, setNextDueAt] = useState('')
  const [nextAction, setNextAction] = useState('')

  const { data: channelData, isFetching: channelsLoading } = useListMasterDataOptionsQuery(
    { category: 'CONVERSATION_CHANNEL' },
    { skip: !open },
  )

  const channelOptions = useMemo(() => {
    const items = channelData?.items || []
    if (items.length === 0) return FALLBACK_CHANNEL_OPTIONS
    return items
      .map((item) => {
        const code = (item.code || item.name).trim().toUpperCase().replace(/\s+/g, '_')
        const iconClass = extraText(item.extras, 'icon') || 'fa-solid fa-ellipsis'
        const activityType = (extraText(item.extras, 'activityType') || code || 'OTHER').toUpperCase()
        return {
          id: item.id,
          code,
          label: item.name,
          description: item.description || '',
          iconClass,
          activityType,
          sortOrder: item.sortOrder ?? 0,
        } satisfies ConversationChannelOption
      })
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
  }, [channelData?.items])

  const nextFollowUp = lead?.nextFollowUp || null
  const hasOpenFollowUp = Boolean(nextFollowUp?.id)

  useEffect(() => {
    if (!open) return
    setStep(1)
    setOpenStatus(null)
    setChannel(null)
    setNote('')
    setBuyerOpen(false)
    setBuyerRequirements('')
    setAddon(null)
    setNextDueAt('')
    setNextAction('')
  }, [open, lead?.id])

  const selectedChannel = channelOptions.find((item) => item.code === channel) || null

  const stepMeta = useMemo(
    () => [
      {
        id: 1 as const,
        label: 'Open',
        hint: openStatusLabel(openStatus),
      },
      {
        id: 2 as const,
        label: 'Channel',
        hint: selectedChannel?.label || '',
      },
      {
        id: 3 as const,
        label: 'Note',
        hint: note.trim() ? truncate(note) : '',
      },
      {
        id: 4 as const,
        label: 'Add-ons · opt',
        hint: addonLabel(addon),
        pills: true,
      },
      {
        id: 5 as const,
        label: 'Save',
        hint: step >= 5 ? 'Review' : '',
      },
    ],
    [openStatus, selectedChannel?.label, note, addon, step],
  )

  function canContinue() {
    if (step === 1) return Boolean(openStatus)
    if (step === 2) return Boolean(channel)
    if (step === 3) return note.trim().length > 0
    if (step === 4) {
      if (!addon) return false
      if (addon === 'meeting' || addon === 'followup') {
        return Boolean(nextDueAt) && nextAction.trim().length > 0
      }
      return true
    }
    return true
  }

  function goNext() {
    if (!canContinue()) return
    setStep((current) => Math.min(5, current + 1) as StepId)
  }

  function goBack() {
    setStep((current) => Math.max(1, current - 1) as StepId)
  }

  async function handleSave() {
    if (!lead || !addon || !openStatus || !channel || !selectedChannel) return
    const composedNotes = [note.trim(), buyerRequirements.trim() ? `Buyer requirements: ${buyerRequirements.trim()}` : '']
      .filter(Boolean)
      .join('\n\n')

    await onSubmit({
      openStatus,
      followUpId: openStatus !== 'nothing' && nextFollowUp?.id ? nextFollowUp.id : null,
      channel,
      activityType: selectedChannel.activityType,
      outcome: defaultOutcome(channel, openStatus),
      followUpOutcome: followUpOutcome(openStatus),
      notes: composedNotes,
      buyerRequirements: buyerRequirements.trim(),
      addon,
      nextDueAt: addon === 'meeting' || addon === 'followup' ? nextDueAt : undefined,
      nextAction: addon === 'meeting' || addon === 'followup' ? nextAction.trim() : undefined,
      nextFollowUpType: addon === 'meeting' ? 'Meeting' : addon === 'followup' ? followUpTypeFromChannel(channel) : undefined,
    })
  }

  const leadName = lead?.name || 'Lead'
  const needsSchedule = addon === 'meeting' || addon === 'followup'

  return (
    <AntModal
      open={open}
      onClose={onClose}
      title={`Log conversation — ${leadName}`}
      width={720}
      styles={{ body: { paddingTop: 12 } }}
    >
      <div className="grid gap-5">
        <nav
          aria-label="Conversation steps"
          className="rounded-2xl border border-[#e8eef5] bg-[#f7fafc] px-3 py-3.5 dark:border-border dark:bg-[color-mix(in_srgb,var(--color-surface)_88%,#0f172a)]"
        >
          <ol className="m-0 grid list-none grid-cols-5 items-start gap-1 p-0">
            {stepMeta.map((item, index) => {
              const done = step > item.id
              const active = step === item.id
              const connectorDone = step > item.id
              return (
                <li key={item.id} className="relative flex flex-col items-center text-center">
                  {index < stepMeta.length - 1 ? (
                    <span
                      className={`pointer-events-none absolute top-[15px] left-[calc(50%+14px)] h-px w-[calc(100%-8px)] ${
                        connectorDone ? 'bg-primary' : 'bg-[#d7e0ea] dark:bg-border'
                      }`}
                    />
                  ) : null}
                  <span
                    className={`relative z-[1] flex size-8 items-center justify-center rounded-full text-[0.82rem] font-semibold ${
                      done
                        ? 'bg-primary text-on-primary'
                        : active
                          ? 'bg-primary text-on-primary ring-4 ring-[color-mix(in_srgb,var(--color-primary)_22%,transparent)]'
                          : 'border border-[#d5dee8] bg-surface text-[#8b97a8] dark:border-border'
                    }`}
                  >
                    {done ? (
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color="currentColor" strokeWidth={2.2} />
                    ) : (
                      item.id
                    )}
                  </span>
                  <span
                    className={`mt-2 text-[0.78rem] font-semibold ${
                      done || active ? 'text-primary' : 'text-[#8b97a8]'
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.pills ? (
                    <div className="mt-1 flex flex-wrap justify-center gap-1">
                      {(['Meeting', 'Follow-up', 'Nothing'] as const).map((pill) => {
                        const selected =
                          (pill === 'Meeting' && addon === 'meeting') ||
                          (pill === 'Follow-up' && addon === 'followup') ||
                          (pill === 'Nothing' && addon === 'nothing')
                        const showSelected = step > 4 && selected
                        return (
                          <span
                            key={pill}
                            className={`rounded-full px-1.5 py-0.5 text-[0.62rem] ${
                              showSelected
                                ? 'bg-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] font-semibold text-primary'
                                : 'bg-[#eef3f8] text-[#8b97a8] dark:bg-border-subtle'
                            }`}
                          >
                            {pill}
                          </span>
                        )
                      })}
                    </div>
                  ) : item.hint ? (
                    <span
                      className={`mt-0.5 max-w-[7.5rem] truncate text-[0.7rem] ${
                        done || active ? 'text-primary' : 'text-[#a0aab8]'
                      }`}
                    >
                      {item.hint}
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ol>
        </nav>

        <div className="min-h-[280px]">
          {step === 1 ? (
            <section className="grid gap-3">
              <div>
                <h3 className="m-0 text-[1.15rem] font-semibold text-[#17324f] dark:text-text-strong">Open work</h3>
                <p className="mt-1 mb-0 text-[0.86rem] text-[#7a8796]">
                  Select one item, set status, then Continue — or Continue with nothing.
                </p>
              </div>

              <div className="rounded-2xl border border-[#e7eef5] bg-surface p-3.5 dark:border-border">
                {hasOpenFollowUp && nextFollowUp ? (
                  <div className="mb-3 border-b border-[#eef3f8] pb-3 dark:border-border-subtle">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[0.84rem] font-semibold text-primary">
                        Next Follow-up · {formatDisplayDate(nextFollowUp.dueAt) || 'No date'}
                      </span>
                      <span className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] px-2 py-0.5 text-[0.68rem] font-semibold text-primary">
                        {nextFollowUp.status || 'Upcoming'}
                      </span>
                    </div>
                    <p className="mt-1.5 mb-0 text-[0.78rem] text-[#7a8796]">
                      Agenda: {nextFollowUp.nextAction || nextFollowUp.notes || 'No'} · Contact: {leadName}
                    </p>
                  </div>
                ) : (
                  <p className="mb-3 text-[0.84rem] text-[#8b97a8]">No open follow-up linked to this lead.</p>
                )}

                <div className="grid gap-2">
                  <OpenStatusRow
                    label="Discussed"
                    selected={openStatus === 'discussed'}
                    onClick={() => setOpenStatus(openStatus === 'discussed' ? null : 'discussed')}
                  />
                  <OpenStatusRow
                    label="No response"
                    selected={openStatus === 'no_response'}
                    onClick={() => setOpenStatus(openStatus === 'no_response' ? null : 'no_response')}
                  />
                  <OpenStatusRow
                    label="Continue with nothing"
                    description="Skip linking — click again to unselect"
                    selected={openStatus === 'nothing'}
                    onClick={() => setOpenStatus(openStatus === 'nothing' ? null : 'nothing')}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="grid gap-3">
              <div>
                <h3 className="m-0 text-[1.15rem] font-semibold text-[#17324f] dark:text-text-strong">
                  How did you connect?
                </h3>
                <p className="mt-1 mb-0 text-[0.86rem] text-[#7a8796]">
                  Pick a note type, or No channel if none applies.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[0.8rem] font-medium text-[#5b6b7c]">Note type</span>
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-on-primary">
                  <HugeiconsIcon icon={ArrowRight01Icon} size={12} color="currentColor" strokeWidth={2} />
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {channelsLoading && channelOptions.length === 0 ? (
                  <p className="col-span-3 m-0 text-[0.84rem] text-[#8b97a8]">Loading channels…</p>
                ) : (
                  channelOptions.map((option) => {
                    const selected = channel === option.code
                    return (
                      <button
                        key={option.id}
                        type="button"
                        title={option.description || option.label}
                        onClick={() => setChannel(channel === option.code ? null : option.code)}
                        className={`relative flex min-h-[88px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 transition ${
                          selected
                            ? 'border-primary bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-primary'
                            : 'border-[#e6eef6] bg-surface text-[#3d5166] hover:border-primary/30 dark:border-border dark:text-text'
                        }`}
                      >
                        {selected ? (
                          <span className="absolute top-2 right-2 inline-flex size-5 items-center justify-center rounded-full bg-primary text-on-primary">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} color="currentColor" strokeWidth={2.2} />
                          </span>
                        ) : null}
                        <i className={`${option.iconClass} text-[1.25rem]`} aria-hidden />
                        <span className="text-[0.82rem] font-medium">{option.label}</span>
                      </button>
                    )
                  })
                )}
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="grid gap-3">
              <div>
                <h3 className="m-0 text-[1.15rem] font-semibold text-[#17324f] dark:text-text-strong">
                  Note · {selectedChannel?.label || 'Channel'}
                </h3>
                <p className="mt-1 mb-0 text-[0.86rem] text-[#7a8796]">Short note is enough.</p>
              </div>
              <FormTextArea
                rows={5}
                value={note}
                placeholder="What happened?"
                className="!rounded-xl !border-primary/50 focus:!border-primary"
                onChange={(event) => setNote(event.target.value)}
              />
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-left text-[0.84rem] text-[#7a8796] hover:text-primary"
                onClick={() => setBuyerOpen((value) => !value)}
              >
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={14}
                  color="currentColor"
                  strokeWidth={1.8}
                  className={buyerOpen ? 'rotate-90 transition' : 'transition'}
                />
                Capture buyer requirements (optional)
              </button>
              {buyerOpen ? (
                <FormTextArea
                  rows={3}
                  value={buyerRequirements}
                  placeholder="Budget, preferred country, intake, concerns…"
                  onChange={(event) => setBuyerRequirements(event.target.value)}
                />
              ) : null}
            </section>
          ) : null}

          {step === 4 ? (
            <section className="grid gap-3">
              <div>
                <h3 className="m-0 text-[1.15rem] font-semibold text-[#17324f] dark:text-text-strong">What&apos;s next?</h3>
                <p className="mt-1 mb-0 text-[0.86rem] text-[#7a8796]">Pick one, then continue.</p>
              </div>
              <div className="grid gap-2.5">
                {ADDON_OPTIONS.map((option) => {
                  const selected = addon === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setAddon(addon === option.id ? null : option.id)
                        if (addon === option.id || option.id === 'nothing') {
                          setNextDueAt('')
                          setNextAction('')
                        }
                      }}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-3.5 text-left transition ${
                        selected
                          ? 'border-primary bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]'
                          : 'border-[#e6eef6] bg-surface hover:border-primary/30 dark:border-border'
                      }`}
                    >
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#e6eef6] bg-surface text-[#5b6b7c] dark:border-border">
                        <HugeiconsIcon icon={option.icon} size={18} color="currentColor" strokeWidth={1.7} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.92rem] font-semibold text-[#17324f] dark:text-text-strong">
                          {option.title}
                        </span>
                        <span className="mt-0.5 block text-[0.78rem] text-[#7a8796]">{option.description}</span>
                      </span>
                      <span
                        className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full border ${
                          selected ? 'border-primary bg-primary text-on-primary' : 'border-[#c9d4e0] bg-surface'
                        }`}
                      >
                        {selected ? (
                          <span className="size-2 rounded-full bg-on-primary" />
                        ) : null}
                      </span>
                    </button>
                  )
                })}
              </div>

              {needsSchedule ? (
                <div className="grid gap-3 rounded-2xl border border-[#e7eef5] bg-[#f8fbf9] p-3.5 dark:border-border dark:bg-[color-mix(in_srgb,var(--color-surface)_90%,#0f172a)]">
                  <label className="grid gap-1.5 text-sm">
                    <span>{addon === 'meeting' ? 'Meeting date & time' : 'Follow-up date & time'}</span>
                    <FormDatePicker
                      showTime
                      className="w-full"
                      format="DD MMM YYYY hh:mm A"
                      value={nextDueAt ? dayjs(nextDueAt) : null}
                      onChange={(value) => setNextDueAt(value ? value.toISOString() : '')}
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm">
                    <span>{addon === 'meeting' ? 'Meeting agenda' : 'Next action / agenda'}</span>
                    <FormTextArea
                      rows={2}
                      value={nextAction}
                      placeholder={addon === 'meeting' ? 'e.g. University shortlist discussion' : 'e.g. Send brochure'}
                      onChange={(event) => setNextAction(event.target.value)}
                    />
                  </label>
                </div>
              ) : null}
            </section>
          ) : null}

          {step === 5 ? (
            <section className="grid gap-3">
              <div>
                <h3 className="m-0 text-[1.15rem] font-semibold text-[#17324f] dark:text-text-strong">Ready to save?</h3>
                <p className="mt-1 mb-0 text-[0.86rem] text-[#7a8796]">Same journey will appear in Activity history.</p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-[#dcefe3] dark:border-border">
                <div className="flex items-center justify-between gap-3 bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-4 py-3">
                  <div>
                    <p className="m-0 text-[0.72rem] font-semibold tracking-[0.04em] text-primary">ACTIVITY FLOW</p>
                    <p className="m-0 mt-0.5 text-[0.75rem] text-[#5b6b7c]">4 steps · first → last</p>
                  </div>
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary text-[0.8rem] font-semibold text-on-primary">
                    4
                  </span>
                </div>
                <ol className="m-0 grid list-none gap-0 p-0">
                  {[
                    { title: 'OPEN WORK', detail: openStatusDetail(openStatus) },
                    { title: 'CHANNEL', detail: selectedChannel?.label || channel || '—' },
                    { title: 'NOTE', detail: note.trim() || '—' },
                    { title: "WHAT'S NEXT", detail: addonDetail(addon) },
                  ].map((item, index) => (
                    <li
                      key={item.title}
                      className="flex items-start gap-3 border-t border-[#eef5f0] px-4 py-3.5 dark:border-border-subtle"
                    >
                      <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[0.72rem] font-semibold text-on-primary">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="m-0 text-[0.72rem] font-semibold tracking-[0.04em] text-primary">{item.title}</p>
                        <p className="m-0 mt-0.5 whitespace-pre-wrap break-words text-[0.9rem] text-[#17324f] dark:text-text-strong">
                          {item.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          ) : null}
        </div>

        <div className={`flex items-center gap-3 ${step === 1 ? 'justify-end' : 'justify-between'}`}>
          {step > 1 ? (
            <PrimaryButton
              type="button"
              variant="outline"
              onClick={goBack}
              icon={<HugeiconsIcon icon={ArrowLeft01Icon} size={14} color="currentColor" strokeWidth={1.8} />}
              label="Back"
            />
          ) : (
            <span />
          )}
          {step < 5 ? (
            <PrimaryButton type="button" disabled={!canContinue()} onClick={goNext} label="Continue" />
          ) : (
            <PrimaryButton
              type="button"
              loading={saving}
              disabled={!canContinue() || saving}
              onClick={() => void handleSave()}
              label="Save activity"
            />
          )}
        </div>
      </div>
    </AntModal>
  )
}

function OpenStatusRow({
  label,
  description,
  selected,
  onClick,
}: {
  label: string
  description?: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
        selected
          ? 'border-primary bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]'
          : 'border-[#e6eef6] bg-surface hover:border-primary/30 dark:border-border'
      }`}
    >
      <span
        className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full border ${
          selected ? 'border-primary bg-primary text-on-primary' : 'border-[#c9d4e0] bg-surface'
        }`}
      >
        {selected ? <span className="size-2 rounded-full bg-on-primary" /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-[0.9rem] font-medium text-[#17324f] dark:text-text-strong">{label}</span>
        {description ? <span className="mt-0.5 block text-[0.75rem] text-[#7a8796]">{description}</span> : null}
      </span>
    </button>
  )
}
