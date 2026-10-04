import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, CheckmarkCircle02Icon, Clock01Icon } from '@hugeicons/core-free-icons'
import type { LeadRecord } from '../../types'
import {
  LEAD_JOURNEY_STAGES,
  followUpCountdownParts,
  journeyStageIndex,
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

export default function LeadJourneyBar({ lead }: { lead: LeadRecord }) {
  const currentIndex = journeyStageIndex(lead.statusCode, lead.status)
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!lead.nextFollowUp?.dueAt) return
    const id = window.setInterval(() => setTick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [lead.nextFollowUp?.dueAt])

  const countdown = followUpCountdownParts(lead.nextFollowUp?.dueAt)

  return (
    <section className="grid gap-3 rounded-2xl border border-[#e7eef5] bg-surface p-4 shadow-[0_10px_28px_rgba(22,50,79,0.035)] xl:grid-cols-[minmax(0,1fr)_300px] dark:border-border">
      <div className="min-w-0">
        <h3 className="mt-0 mb-4 text-[0.92rem] font-semibold text-[#1b3a57] dark:text-text-strong">Lead Journey</h3>
        <ol className="m-0 flex list-none items-start gap-0 overflow-x-auto pb-1 pl-0">
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
                <span
                  className={`relative z-[1] grid size-7 place-items-center rounded-full text-[0.72rem] font-bold ${
                    done
                      ? 'bg-primary text-on-primary'
                      : current
                        ? 'bg-primary text-on-primary ring-4 ring-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]'
                        : 'border-2 border-[#d5dee8] bg-surface text-[#9aa6b2] dark:border-border'
                  }`}
                >
                  {done ? (
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color="currentColor" strokeWidth={2} />
                  ) : (
                    index + 1
                  )}
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

      <div className="flex flex-col justify-center rounded-xl border border-[#d8f0e3] bg-[#f3fbf7] px-3 py-2.5 dark:border-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] dark:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]">
        <p className="m-0 flex items-center gap-1.5 text-[0.82rem] font-semibold text-[#1b3a57] dark:text-text-strong">
          <span className="grid size-6 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-primary">
            <HugeiconsIcon icon={Clock01Icon} size={13} color="currentColor" strokeWidth={1.8} />
          </span>
          Next Follow Up
        </p>

        {countdown ? (
          <>
            <div className="mt-2 flex items-start justify-center gap-1 text-center sm:gap-1.5">
              <CountdownUnit value={pad2(countdown.days)} label="Days" />
              <CountdownSep />
              <CountdownUnit value={pad2(countdown.hours)} label="Hours" />
              <CountdownSep />
              <CountdownUnit value={pad2(countdown.mins)} label="Mins" />
              <CountdownSep />
              <CountdownUnit value={pad2(countdown.secs)} label="Secs" />
            </div>
            {countdown.overdue ? (
              <p className="mt-1 mb-0 text-center text-[0.68rem] font-medium text-[#e11d48]">Overdue</p>
            ) : null}
            <p className="mt-2 mb-0 flex w-full items-center justify-center gap-1.5 text-[0.84rem] font-semibold text-[#3d5166] dark:text-text">
              <HugeiconsIcon icon={Calendar03Icon} size={16} color="var(--color-primary)" strokeWidth={1.7} />
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

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-[36px]">
      <p className="m-0 text-[1.2rem] font-bold tabular-nums leading-none tracking-tight text-[#1b3a57] dark:text-text-strong">
        {value}
      </p>
      <p className="m-0 mt-0.5 text-[0.62rem] font-medium text-primary">{label}</p>
    </div>
  )
}
