import { Link } from 'react-router-dom'
import { PrimaryButton } from '@/components/ui'
import type { LeadApplicationSummary, LeadStudentSummary } from '../../types'

export default function LeadApplicationsCard({
  applications = [],
  student = null,
  canCreate,
  onCreate,
}: {
  applications?: LeadApplicationSummary[]
  student?: LeadStudentSummary | null
  canCreate?: boolean
  onCreate?: () => void
}) {
  return (
    <section className="rounded-2xl border border-[#e7eef5] bg-surface p-5 shadow-[0_10px_28px_rgba(22,50,79,0.035)] dark:border-border">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className="m-0 text-[0.98rem] font-semibold text-[#1b3a57] dark:text-text-strong">
          Applications
        </h3>
        {canCreate ? (
          <PrimaryButton
            type="button"
            size="sm"
            variant="primary"
            onClick={onCreate}
            label={applications.length ? 'Add Application' : 'Create Application'}
          />
        ) : null}
      </header>

      {student ? (
        <p className="m-0 mb-3 text-[0.82rem] text-text-muted">
          Student{' '}
          <span className="font-semibold text-text-strong">{student.studentCode}</span>
          {' · '}
          {student.status}
        </p>
      ) : null}

      {applications.length === 0 ? (
        <p className="m-0 text-[0.84rem] text-[#8b97a8]">
          No university applications yet. Create one to start document collection and
          admission processing.
        </p>
      ) : (
        <ul className="m-0 grid list-none gap-2.5 p-0">
          {applications.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[#e7eef5] px-3 py-2.5 dark:border-border"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    to={`/applications/${item.id}`}
                    className="text-[0.88rem] font-semibold text-primary hover:underline"
                  >
                    {item.code}
                  </Link>
                  <p className="m-0 truncate text-[0.8rem] text-text-strong">
                    {item.university || 'University TBD'}
                  </p>
                  <p className="m-0 text-[0.75rem] text-text-muted">
                    {[item.program, item.intake].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[#eef6ff] px-2 py-0.5 text-[0.7rem] font-medium text-[#1d4f91] dark:bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] dark:text-primary">
                  {item.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
