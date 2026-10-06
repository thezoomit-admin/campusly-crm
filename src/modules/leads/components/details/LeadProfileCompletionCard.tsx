import type { LeadCompletion, LeadRecord } from '../../types'

const SECTION_LABELS: Array<{ key: keyof LeadCompletion; label: string }> = [
  { key: 'personal', label: 'Personal Information' },
  { key: 'study', label: 'Study Preference' },
  { key: 'academic', label: 'Academic Information' },
  { key: 'english', label: 'English Score' },
  { key: 'financial', label: 'Financial Information' },
  { key: 'visa', label: 'Visa History' },
  { key: 'intent', label: 'Lead Intent' },
]

export default function LeadProfileCompletionCard({ lead }: { lead: LeadRecord }) {
  const percent = Math.max(0, Math.min(100, lead.profileCompletion ?? 0))
  const sections = lead.completion || {
    personal: false,
    study: false,
    academic: false,
    english: false,
    financial: false,
    visa: false,
    intent: false,
  }

  return (
    <section className="rounded-2xl border border-[#e7eef5] bg-surface p-5 shadow-[0_10px_28px_rgba(22,50,79,0.035)] dark:border-border">
      <header className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h3 className="m-0 text-[0.98rem] font-semibold text-[#1b3a57] dark:text-text-strong">
            Profile Completion
          </h3>
          <p className="m-0 mt-1 text-[0.75rem] text-[#8b97a8]">Separate from Lead Score</p>
        </div>
        <span className="text-[1.1rem] font-bold tabular-nums text-primary">{percent}%</span>
      </header>

      <div
        className="mb-4 h-2.5 overflow-hidden rounded-full bg-[#e8eef5] dark:bg-hover-bg"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completion"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="m-0 grid list-none gap-2 p-0">
        {SECTION_LABELS.map((section) => {
          const done = Boolean(sections[section.key])
          return (
            <li
              key={section.key}
              className="flex items-center gap-2 text-[0.84rem] text-[#17324f] dark:text-text-strong"
            >
              <span
                className={`grid size-4 shrink-0 place-items-center rounded-full text-[0.65rem] font-bold ${
                  done
                    ? 'bg-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] text-primary'
                    : 'bg-[#eef2f7] text-[#9aa8b8] dark:bg-hover-bg'
                }`}
                aria-hidden
              >
                {done ? '✓' : '✗'}
              </span>
              <span className={done ? '' : 'text-[#8b97a8]'}>{section.label}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
