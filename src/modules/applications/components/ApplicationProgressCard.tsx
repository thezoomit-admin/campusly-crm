import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import {
  APPLICATION_PROGRESS_STEPS,
  applicationProgressIndex,
  progressBadgeLabel,
} from '../utils/applicationProgress'

function formatStepDate(iso?: string | null) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ApplicationProgressCard({
  status,
  statusHistory,
  createdAt,
  submittedAt,
}: {
  status: string
  statusHistory: Array<{ newStatus: string; createdAt: string }>
  createdAt: string
  submittedAt?: string | null
}) {
  const currentIndex = applicationProgressIndex(status)
  const dateByStatus = new Map<string, string>()
  for (const item of [...statusHistory].reverse()) {
    if (!dateByStatus.has(item.newStatus)) {
      dateByStatus.set(item.newStatus, item.createdAt)
    }
  }
  if (!dateByStatus.has('Draft')) dateByStatus.set('Draft', createdAt)
  if (submittedAt) dateByStatus.set('Submitted', submittedAt)

  const badge = progressBadgeLabel(status)

  return (
    <section className="rounded-2xl border border-[#e7eef5] bg-surface p-5 shadow-[0_8px_24px_rgba(22,50,79,0.04)] dark:border-border">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 text-base font-semibold text-[#1b3a57] dark:text-text-strong">
          Application Progress
        </h2>
        <span
          className={`rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ${
            badge === 'In Progress'
              ? 'bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-primary'
              : badge === 'Completed'
                ? 'bg-[#e7f8ef] text-[#16a34a]'
                : 'bg-[#ffe8ee] text-[#e11d48]'
          }`}
        >
          {badge}
        </span>
      </header>

      <div className="overflow-x-auto pb-1">
        <ol className="m-0 flex min-w-180 list-none items-start gap-0 p-0">
          {APPLICATION_PROGRESS_STEPS.map((step, index) => {
            const done = currentIndex > index
            const current = currentIndex === index
            const stamp = formatStepDate(dateByStatus.get(step.key))
            return (
              <li key={step.key} className="relative flex flex-1 flex-col items-center px-1">
                {index < APPLICATION_PROGRESS_STEPS.length - 1 ? (
                  <span
                    className={`absolute top-3.5 left-1/2 h-0.5 w-full ${
                      done || current
                        ? 'bg-primary'
                        : 'bg-[#e5ebf2] dark:bg-border'
                    }`}
                    aria-hidden
                  />
                ) : null}
                <span
                  className={`relative z-1 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    done
                      ? 'border-primary bg-primary text-white'
                      : current
                        ? 'border-primary bg-surface text-primary shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-primary)_18%,transparent)]'
                        : 'border-card-border bg-surface text-[#9aa8b8]'
                  }`}
                >
                  {done ? (
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="currentColor" />
                  ) : (
                    index + 1
                  )}
                </span>
                <p
                  className={`m-0 mt-2 text-center text-[0.78rem] font-semibold ${
                    current || done ? 'text-text-strong' : 'text-text-muted'
                  }`}
                >
                  {step.label}
                </p>
                <p className="m-0 mt-0.5 text-center text-[0.7rem] text-text-muted">
                  {stamp || (current ? 'Current' : '—')}
                </p>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
