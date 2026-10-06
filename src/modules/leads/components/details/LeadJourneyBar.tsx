import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, CheckmarkCircle02Icon, Clock01Icon } from '@hugeicons/core-free-icons'
import type { LeadRecord } from '../../types'
import {
  LEAD_JOURNEY_STAGES,
  followUpCountdownParts,
  journeyStageIndex,
  type FollowUpCountdownUrgency,
} from '../../utils/leadDetails'

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function formatFollowUpStamp(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${day} • ${time}`
}

const COUNTDOWN_TONES: Record<
  FollowUpCountdownUrgency,
  {
    card: string
    iconWrap: string
    iconColor: string
    unitLabel: string
    calendarColor: string
    status: string
  }
> = {
  safe: {
    card: 'border-[#d8f0e3] bg-[#f3fbf7] dark:border-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] dark:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]',
    iconWrap: 'bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-primary',
    iconColor: 'currentColor',
    unitLabel: 'text-primary',
    calendarColor: 'var(--color-primary)',
    status: '',
  },
  soon: {
    card: 'border-[#fed7aa] bg-[#fff7ed] dark:border-[color-mix(in_srgb,#f97316_35%,transparent)] dark:bg-[color-mix(in_srgb,#f97316_12%,transparent)]',
    iconWrap: 'bg-[color-mix(in_srgb,#f97316_16%,transparent)] text-[#ea580c]',
    iconColor: 'currentColor',
    unitLabel: 'text-[#ea580c]',
    calendarColor: '#ea580c',
    status: 'text-[#c2410c]',
  },
  overdue: {
    card: 'border-[#fecdd3] bg-[#fff1f2] dark:border-[color-mix(in_srgb,#e11d48_35%,transparent)] dark:bg-[color-mix(in_srgb,#e11d48_12%,transparent)]',
    iconWrap: 'bg-[color-mix(in_srgb,#e11d48_14%,transparent)] text-[#e11d48]',
    iconColor: 'currentColor',
    unitLabel: 'text-[#e11d48]',
    calendarColor: '#e11d48',
    status: 'text-[#e11d48]',
  },
}

export default function LeadJourneyBar({ lead }: { lead: LeadRecord }) {
  const currentIndex = journeyStageIndex(lead.statusCode, lead.status)
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!lead.nextFollowUp?.dueAt) return
    const id = window.setInterval(() => setTick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [lead.nextFollowUp?.dueAt])

  const countdown = followUpCountdownParts(lead.nextFollowUp?.dueAt)
  const tone = COUNTDOWN_TONES[countdown?.urgency ?? 'safe']

  return (
    <section className="grid gap-3 rounded-2xl border border-[#e7eef5] bg-surface p-4 shadow-[0_10px_28px_rgba(22,50,79,0.035)] xl:grid-cols-[minmax(0,1fr)_300px] dark:border-border">
      <div className="min-w-0">
        <h3 className="mt-0 mb-2 text-[0.92rem] font-semibold text-[#1b3a57] dark:text-text-strong">Lead Journey</h3>
        <ol className="m-0 flex list-none items-start gap-0 overflow-x-auto pt-4 pb-1 pl-0">
          {LEAD_JOURNEY_STAGES.map((stage, index) => {
            const done = currentIndex > index
            const current = currentIndex === index
            return (
              <li key={stage.code} className="relative flex min-w-[72px] flex-1 flex-col items-center gap-1.5 px-1">
                {index < LEAD_JOURNEY_STAGES.length - 1 ? (
                  <span
                    className={`absolute top-[13px] left-[calc(50%+14px)] right-[calc(-50%+14px)] h-0.5 ${
                      done ? 'bg-primary' : 'bg-[#e6eef6] dark:bg-border-subtle'
                    }`}
                  />
                ) : null}
                <span className="relative z-[1] grid size-7 place-items-center">
                  {current ? (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-[-5px] rounded-full bg-[color-mix(in_srgb,var(--color-primary)_32%,transparent)] animate-[journey-current-pulse_1.5s_ease-in-out_infinite]"
                    />
                  ) : null}
                  <span
                    className={`relative grid size-7 place-items-center rounded-full text-[0.72rem] font-bold ${
                      done
                        ? 'bg-primary text-on-primary'
                        : current
                          ? 'bg-primary text-on-primary'
                          : 'border-2 border-[#d5dee8] bg-surface text-[#9aa6b2] dark:border-border'
                    }`}
                  >
                    {done ? (
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color="currentColor" strokeWidth={2} />
                    ) : (
                      index + 1
                    )}
                  </span>
                </span>
                <span
                  className={`max-w-[88px] text-center text-[0.68rem] leading-tight ${
                    current
                      ? 'font-semibold text-primary'
                      : done
                        ? 'font-medium text-[#3d5166] dark:text-text'
                        : 'text-[#9aa6b2]'
                  }`}
                >
                  {stage.label}
                  {current ? (
                    <span className="mt-0.5 block text-[0.6rem] font-medium text-primary">Current</span>
                  ) : null}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      <div className={`flex flex-col justify-center rounded-xl border px-3 py-2.5 transition-colors duration-300 ${tone.card}`}>
        <p className="m-0 flex items-center gap-1.5 text-[0.82rem] font-semibold text-[#1b3a57] dark:text-text-strong">
          <span className={`grid size-6 place-items-center rounded-full ${tone.iconWrap}`}>
            <HugeiconsIcon icon={Clock01Icon} size={13} color={tone.iconColor} strokeWidth={1.8} />
          </span>
          Next Follow Up
        </p>

        {countdown ? (
          <>
            <div className="mt-2 flex items-start justify-center gap-1 text-center sm:gap-1.5">
              <CountdownUnit value={pad2(countdown.days)} label="Days" labelClass={tone.unitLabel} />
              <CountdownSep />
              <CountdownUnit value={pad2(countdown.hours)} label="Hours" labelClass={tone.unitLabel} />
              <CountdownSep />
              <CountdownUnit value={pad2(countdown.mins)} label="Mins" labelClass={tone.unitLabel} />
              <CountdownSep />
              <CountdownUnit value={pad2(countdown.secs)} label="Secs" labelClass={tone.unitLabel} />
            </div>
            {countdown.urgency === 'overdue' ? (
              <p className={`mt-1 mb-0 text-center text-[0.68rem] font-medium ${tone.status}`}>Overdue</p>
            ) : countdown.urgency === 'soon' ? (
              <p className={`mt-1 mb-0 text-center text-[0.68rem] font-medium ${tone.status}`}>Due soon</p>
            ) : null}
            <p className="mt-2 mb-0 flex w-full items-center justify-center gap-1.5 text-[0.84rem] font-semibold text-[#3d5166] dark:text-text">
              <HugeiconsIcon icon={Calendar03Icon} size={16} color={tone.calendarColor} strokeWidth={1.7} />
              <span className="min-w-0 truncate">{formatFollowUpStamp(lead.nextFollowUp?.dueAt)}</span>
            </p>
          </>
        ) : (
          <p className="mt-2 mb-0 text-center text-[0.8rem] text-[#8b97a8]">No follow-up scheduled</p>
        )}
      </div>
    </section>
  )
}

function CountdownSep() {
  return (
    <span className="pt-0.5 text-[1.05rem] font-bold leading-none text-[#1b3a57] dark:text-text-strong" aria-hidden>
      :
    </span>
  )
}

function CountdownUnit({
  value,
  label,
  labelClass = 'text-primary',
}: {
  value: string
  label: string
  labelClass?: string
}) {
  return (
    <div className="min-w-[36px]">
      <p className="m-0 text-[1.2rem] font-bold tabular-nums leading-none tracking-tight text-[#1b3a57] dark:text-text-strong">
        {value}
      </p>
      <p className={`m-0 mt-0.5 text-[0.62rem] font-medium ${labelClass}`}>{label}</p>
    </div>
  )
}
