import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Breadcrumb, Skeleton, Table } from 'antd'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Building03Icon,
  Call02Icon,
  File01Icon,
  Globe02Icon,
  Mail01Icon,
  SentIcon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import { PageMeta } from '@/components/common/Meta'
import { PrimaryButton } from '@/components/ui'
import { applicationStatusClass } from '@/modules/applications/utils/applicationStatus'
import { useGetStudentQuery } from '../api/studentsApi'
import type { StudentPrimaryTab } from '../types'
import { studentStatusClass } from '../utils/studentStatus'

const TABS: Array<{ key: StudentPrimaryTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'applications', label: 'Applications' },
  { key: 'documents', label: 'Shared Documents' },
  { key: 'communications', label: 'Communications' },
]

function parseTab(value: string | null): StudentPrimaryTab {
  if (value && TABS.some((tab) => tab.key === value)) return value as StudentPrimaryTab
  return 'overview'
}

function initials(name?: string | null) {
  if (!name?.trim()) return 'ST'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function cardClass() {
  return 'rounded-2xl border border-[#e7eef5] bg-surface p-5 shadow-[0_8px_24px_rgba(22,50,79,0.04)] dark:border-border'
}

function MetaCell({
  label,
  value,
  icon,
}: {
  label: string
  value?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="min-w-0">
      <p className="m-0 text-[0.72rem] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="m-0 mt-1 flex items-center gap-1.5 truncate text-sm font-semibold text-text-strong">
        {icon}
        <span className="truncate">{value || '—'}</span>
      </p>
    </div>
  )
}

function DetailRow({
  label,
  value,
  extra,
}: {
  label: string
  value?: ReactNode
  extra?: ReactNode
}) {
  return (
    <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-2 border-b border-[#eef3f8] py-2.5 last:border-0 dark:border-border">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="m-0 flex flex-wrap items-center gap-2 text-sm font-medium text-text-strong">
        {value || '—'}
        {extra}
      </dd>
    </div>
  )
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string
  value: ReactNode
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-[#eef3f8] bg-input-bg px-3.5 py-3 dark:border-border dark:bg-[color-mix(in_srgb,var(--color-surface)_88%,#0f172a)]">
      <p className="m-0 text-[0.7rem] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="m-0 mt-1 text-lg font-semibold text-[#1b3a57] dark:text-text-strong">
        {value}
      </p>
      {hint ? <p className="m-0 mt-0.5 text-xs text-text-muted">{hint}</p> : null}
    </div>
  )
}

export default function StudentDetailsPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = parseTab(searchParams.get('tab'))
  const { data, isFetching, isError } = useGetStudentQuery(id, { skip: !id })
  const student = data?.student
  const [docPage, setDocPage] = useState(1)

  const setTab = (next: StudentPrimaryTab) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      if (next === 'overview') params.delete('tab')
      else params.set('tab', next)
      return params
    })
  }

  const phone = student?.phone || student?.lead?.phone || null
  const email = student?.email || student?.lead?.email || null
  const destination =
    student?.destination || student?.lead?.country || student?.lead?.preferredCountryCode || null
  const program = student?.program || student?.lead?.preferredCourse || null

  const applicationColumns = useMemo(
    () => [
      {
        title: 'Code',
        dataIndex: 'code',
        key: 'code',
        render: (value: string, row: { id: string }) => (
          <Link to={`/applications/${row.id}`} className="font-semibold text-primary hover:underline">
            {value}
          </Link>
        ),
      },
      { title: 'University', dataIndex: 'university', key: 'university' },
      { title: 'Program', dataIndex: 'program', key: 'program' },
      { title: 'Intake', dataIndex: 'intake', key: 'intake' },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (value: string) => <span className={applicationStatusClass(value)}>{value}</span>,
      },
      { title: 'Submitted', dataIndex: 'submitted', key: 'submitted' },
    ],
    [],
  )

  if (isError) {
    return (
      <div className="grid gap-3">
        <p className="m-0 text-danger">Student not found or access denied.</p>
        <PrimaryButton
          type="button"
          variant="outline"
          label="Back to students"
          onClick={() => navigate('/students')}
        />
      </div>
    )
  }

  return (
    <div className="grid min-w-0 gap-4">
      <PageMeta
        title={student ? `${student.studentCode} · Student` : 'Student'}
        description="Student profile, shared documents, and university applications."
      />
      <Breadcrumb
        items={[
          { title: <Link to="/students">Students</Link> },
          {
            title: (
              <span className="font-medium text-primary">
                {student?.studentCode || 'Details'}
              </span>
            ),
          },
        ]}
      />

      {isFetching && !student ? <Skeleton active paragraph={{ rows: 10 }} /> : null}

      {student ? (
        <>
          <section className={cardClass()}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-sm font-bold text-primary">
                  {initials(student.name)}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="m-0 text-xl font-semibold text-[#1b3a57] dark:text-text-strong">
                      {student.name}
                    </h1>
                    <span className={studentStatusClass(student.status)}>{student.status}</span>
                  </div>
                  <p className="m-0 mt-1 text-sm text-text-muted">
                    <span className="font-medium text-text-strong">{student.studentCode}</span>
                    {student.lead ? (
                      <>
                        {' · Lead '}
                        <Link
                          to={`/leads/${student.lead.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {student.lead.code}
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {phone ? (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#dbe4ee] text-text-strong transition-colors hover:border-primary hover:text-primary dark:border-border"
                    aria-label="Call student"
                    title="Call"
                  >
                    <HugeiconsIcon icon={Call02Icon} size={16} color="currentColor" />
                  </a>
                ) : null}
                {email ? (
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#dbe4ee] text-text-strong transition-colors hover:border-primary hover:text-primary dark:border-border"
                    aria-label="Email student"
                    title="Email"
                  >
                    <HugeiconsIcon icon={Mail01Icon} size={16} color="currentColor" />
                  </a>
                ) : null}
                {student.lead ? (
                  <PrimaryButton
                    type="button"
                    size="sm"
                    variant="outline"
                    icon={<HugeiconsIcon icon={UserIcon} size={15} />}
                    label="Open Lead CRM"
                    onClick={() => navigate(`/leads/${student.lead!.id}`)}
                  />
                ) : null}
                <PrimaryButton
                  type="button"
                  size="sm"
                  variant="primary"
                  icon={<HugeiconsIcon icon={SentIcon} size={15} />}
                  label="Applications"
                  onClick={() => setTab('applications')}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-3 border-t border-[#eef3f8] pt-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-border">
              <MetaCell
                label="Phone"
                value={
                  phone ? (
                    <a href={`tel:${phone}`} className="text-text-strong hover:text-primary">
                      {phone}
                    </a>
                  ) : null
                }
                icon={<HugeiconsIcon icon={Call02Icon} size={14} color="var(--color-primary)" />}
              />
              <MetaCell
                label="Email"
                value={
                  email ? (
                    <a href={`mailto:${email}`} className="text-text-strong hover:text-primary">
                      {email}
                    </a>
                  ) : null
                }
                icon={<HugeiconsIcon icon={Mail01Icon} size={14} color="var(--color-primary)" />}
              />
              <MetaCell
                label="Destination"
                value={destination}
                icon={<HugeiconsIcon icon={Globe02Icon} size={14} color="var(--color-primary)" />}
              />
              <MetaCell
                label="Counsellor"
                value={
                  student.counsellorName ? (
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] text-[0.6rem] font-bold text-primary">
                        {initials(student.counsellorName)}
                      </span>
                      <span className="truncate">{student.counsellorName}</span>
                    </span>
                  ) : null
                }
                icon={<HugeiconsIcon icon={UserIcon} size={14} color="var(--color-primary)" />}
              />
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label="Applications"
                value={student.applicationsCount}
                hint="University pipelines"
              />
              <StatTile
                label="Shared docs"
                value={student.sharedDocuments.length}
                hint="Reusable files"
              />
              <StatTile
                label="Program focus"
                value={<span className="truncate text-base">{program || '—'}</span>}
              />
              <StatTile
                label="Last updated"
                value={<span className="text-base">{student.updatedAt.slice(0, 10)}</span>}
                hint={student.enrolledAt ? `Enrolled ${student.enrolledAt}` : 'Not enrolled yet'}
              />
            </div>
          </section>

          <div className="flex min-w-0 gap-1 overflow-x-auto border-b border-[#e7eef5] dark:border-border">
            {TABS.map((item) => {
              const active = tab === item.key
              const badge =
                item.key === 'applications'
                  ? student.applicationsCount
                  : item.key === 'documents'
                    ? student.sharedDocuments.length
                    : undefined
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  className={`relative inline-flex shrink-0 cursor-pointer items-center gap-1.5 border-0 bg-transparent px-3.5 py-2.5 text-[0.9rem] transition-colors ${
                    active
                      ? 'font-semibold text-primary'
                      : 'font-medium text-text-muted hover:text-text-strong'
                  }`}
                  onClick={() => setTab(item.key)}
                >
                  {item.label}
                  {typeof badge === 'number' && badge > 0 ? (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[0.68rem] font-bold ${
                        active
                          ? 'bg-primary text-white'
                          : 'bg-border-subtle text-text-muted dark:bg-border'
                      }`}
                    >
                      {badge}
                    </span>
                  ) : null}
                  {active ? (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
                  ) : null}
                </button>
              )
            })}
          </div>

          {tab === 'overview' ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                <section className={cardClass()}>
                  <header className="mb-1 flex items-center justify-between gap-2">
                    <h2 className="m-0 text-base font-semibold">Profile</h2>
                    {student.lead ? (
                      <button
                        type="button"
                        className="cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-primary hover:underline"
                        onClick={() => navigate(`/leads/${student.lead!.id}`)}
                      >
                        Edit in Lead
                      </button>
                    ) : null}
                  </header>
                  <dl className="m-0">
                    <DetailRow label="Full name" value={student.name} />
                    <DetailRow label="Student ID" value={student.studentCode} />
                    <DetailRow
                      label="Phone"
                      value={
                        phone ? (
                          <a href={`tel:${phone}`} className="text-primary hover:underline">
                            {phone}
                          </a>
                        ) : null
                      }
                    />
                    <DetailRow
                      label="Email"
                      value={
                        email ? (
                          <a href={`mailto:${email}`} className="text-primary hover:underline">
                            {email}
                          </a>
                        ) : null
                      }
                    />
                    <DetailRow label="Destination" value={destination} />
                    <DetailRow label="Preferred course" value={program} />
                    <DetailRow
                      label="Status"
                      value={<span className={studentStatusClass(student.status)}>{student.status}</span>}
                    />
                    <DetailRow label="Enrolled" value={student.enrolledAt || 'Not enrolled'} />
                  </dl>
                </section>

                <section className={cardClass()}>
                  <header className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="m-0 text-base font-semibold">Recent applications</h2>
                    {student.applicationsCount > 0 ? (
                      <button
                        type="button"
                        className="cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-primary hover:underline"
                        onClick={() => setTab('applications')}
                      >
                        View all
                      </button>
                    ) : null}
                  </header>
                  {student.applications.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#d7e2ec] px-4 py-6 text-center dark:border-border">
                      <p className="m-0 text-sm text-text-muted">
                        No university applications yet.
                      </p>
                      {student.lead ? (
                        <PrimaryButton
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          label="Open lead to create"
                          onClick={() => navigate(`/leads/${student.lead!.id}`)}
                        />
                      ) : null}
                    </div>
                  ) : (
                    <ul className="m-0 grid list-none gap-2 p-0">
                      {student.applications.slice(0, 5).map((app) => (
                        <li key={app.id}>
                          <Link
                            to={`/applications/${app.id}`}
                            className="flex items-start justify-between gap-3 rounded-xl border border-[#eef3f8] px-3 py-2.5 text-inherit no-underline transition-colors hover:border-primary/40 hover:bg-[color-mix(in_srgb,var(--color-primary)_4%,transparent)] dark:border-border"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-primary">{app.code}</span>
                                <span className={applicationStatusClass(app.status)}>
                                  {app.status}
                                </span>
                              </div>
                              <p className="m-0 mt-1 flex items-center gap-1.5 truncate text-sm font-medium text-text-strong">
                                <HugeiconsIcon
                                  icon={Building03Icon}
                                  size={14}
                                  color="var(--color-primary)"
                                />
                                <span className="truncate">{app.university}</span>
                              </p>
                              <p className="m-0 mt-0.5 truncate text-xs text-text-muted">
                                {[app.program, app.intake].filter(Boolean).join(' · ') || '—'}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {student.lead && student.applications.length > 0 ? (
                    <p className="mb-0 mt-4 text-sm text-text-muted">
                      Add another university application from{' '}
                      <Link
                        to={`/leads/${student.lead.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        Lead {student.lead.code}
                      </Link>
                      .
                    </p>
                  ) : null}
                </section>
              </div>

              <aside className="grid min-w-0 content-start gap-4">
                <section className={cardClass()}>
                  <h2 className="mt-0 mb-3 text-base font-semibold">Quick facts</h2>
                  <dl className="m-0">
                    <DetailRow label="Created" value={student.createdAt.slice(0, 10)} />
                    <DetailRow label="Updated" value={student.updatedAt.slice(0, 10)} />
                    <DetailRow
                      label="Apps"
                      value={`${student.applicationsCount} total`}
                    />
                    <DetailRow
                      label="Docs"
                      value={`${student.sharedDocuments.length} shared`}
                    />
                  </dl>
                </section>

                {student.lead ? (
                  <section className={cardClass()}>
                    <h2 className="mt-0 mb-2 text-base font-semibold">Linked lead</h2>
                    <p className="m-0 text-sm text-text-muted">
                      CRM workspace for counselling, attachments and communications.
                    </p>
                    <div className="mt-3 rounded-xl border border-[#eef3f8] px-3 py-2.5 dark:border-border">
                      <Link
                        to={`/leads/${student.lead.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {student.lead.code}
                      </Link>
                      <p className="m-0 mt-0.5 text-sm text-text-strong">{student.lead.name}</p>
                      <p className="m-0 mt-1 text-xs text-text-muted">
                        Status: {student.lead.status}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <PrimaryButton
                        type="button"
                        size="sm"
                        variant="outline"
                        label="Attachments"
                        onClick={() =>
                          navigate(`/leads/${student.lead!.id}?tab=attachments`)
                        }
                      />
                      <PrimaryButton
                        type="button"
                        size="sm"
                        variant="outline"
                        label="Comms"
                        onClick={() =>
                          navigate(`/leads/${student.lead!.id}?tab=more&more=communications`)
                        }
                      />
                    </div>
                  </section>
                ) : null}

                <section className={cardClass()}>
                  <header className="mb-2 flex items-center justify-between gap-2">
                    <h2 className="m-0 text-base font-semibold">Documents</h2>
                    <button
                      type="button"
                      className="cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-primary hover:underline"
                      onClick={() => setTab('documents')}
                    >
                      Manage
                    </button>
                  </header>
                  {student.sharedDocuments.length === 0 ? (
                    <p className="m-0 text-sm text-text-muted">
                      No shared documents yet. Upload from the lead attachments tab.
                    </p>
                  ) : (
                    <ul className="m-0 grid list-none gap-2 p-0">
                      {student.sharedDocuments.slice(0, 4).map((doc) => (
                        <li
                          key={doc.id}
                          className="flex items-center gap-2 rounded-xl border border-[#eef3f8] px-3 py-2 dark:border-border"
                        >
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-primary">
                            <HugeiconsIcon icon={File01Icon} size={16} color="currentColor" />
                          </span>
                          <div className="min-w-0">
                            <p className="m-0 truncate text-sm font-medium">{doc.name}</p>
                            <p className="m-0 truncate text-xs text-text-muted">
                              {doc.typeCode} · {doc.status}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </aside>
            </div>
          ) : null}

          {tab === 'applications' ? (
            <section className={cardClass()}>
              <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="m-0 text-base font-semibold">All applications</h2>
                  <p className="m-0 mt-1 text-sm text-text-muted">
                    {student.applicationsCount} university pipeline
                    {student.applicationsCount === 1 ? '' : 's'} for this student.
                  </p>
                </div>
                {student.lead ? (
                  <PrimaryButton
                    type="button"
                    size="sm"
                    variant="outline"
                    label="Add from lead"
                    onClick={() => navigate(`/leads/${student.lead!.id}`)}
                  />
                ) : null}
              </header>
              <Table
                rowKey="id"
                dataSource={student.applications}
                columns={applicationColumns}
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: 'No applications yet.' }}
                onRow={(row) => ({
                  onClick: () => navigate(`/applications/${row.id}`),
                  className: 'cursor-pointer',
                })}
              />
            </section>
          ) : null}

          {tab === 'documents' ? (
            <section className={cardClass()}>
              <header className="mb-1 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="m-0 text-base font-semibold">Shared student documents</h2>
                  <p className="mt-1 mb-0 text-sm text-text-muted">
                    Passport, academic certificates and other reusable files. Attach copies into each
                    university application; approval stays application-specific.
                  </p>
                </div>
                {student.lead ? (
                  <PrimaryButton
                    type="button"
                    size="sm"
                    variant="outline"
                    label="Upload on lead"
                    onClick={() => navigate(`/leads/${student.lead!.id}?tab=attachments`)}
                  />
                ) : null}
              </header>
              {student.sharedDocuments.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-[#d7e2ec] px-4 py-8 text-center dark:border-border">
                  <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-primary">
                    <HugeiconsIcon icon={File01Icon} size={22} color="currentColor" />
                  </span>
                  <p className="mb-0 mt-3 text-sm text-text-muted">
                    No shared documents yet.
                    {student.lead ? (
                      <>
                        {' '}
                        Upload from{' '}
                        <Link
                          to={`/leads/${student.lead.id}?tab=attachments`}
                          className="font-medium text-primary hover:underline"
                        >
                          Lead attachments
                        </Link>
                        .
                      </>
                    ) : null}
                  </p>
                </div>
              ) : (
                <div className="mt-4">
                  <Table
                    rowKey="id"
                    dataSource={student.sharedDocuments}
                    pagination={{
                      current: docPage,
                      pageSize: 10,
                      onChange: setDocPage,
                      total: student.sharedDocuments.length,
                    }}
                    columns={[
                      {
                        title: 'Name',
                        dataIndex: 'name',
                        key: 'name',
                        render: (value: string) => (
                          <span className="inline-flex items-center gap-2 font-medium">
                            <HugeiconsIcon
                              icon={File01Icon}
                              size={15}
                              color="var(--color-primary)"
                            />
                            {value}
                          </span>
                        ),
                      },
                      { title: 'Category', dataIndex: 'categoryCode', key: 'categoryCode' },
                      { title: 'Type', dataIndex: 'typeCode', key: 'typeCode' },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        render: (value: string) => (
                          <span className={applicationStatusClass(value)}>{value}</span>
                        ),
                      },
                      {
                        title: 'Updated',
                        dataIndex: 'updatedAt',
                        key: 'updatedAt',
                        render: (value: string) => value.slice(0, 10),
                      },
                    ]}
                  />
                </div>
              )}
            </section>
          ) : null}

          {tab === 'communications' ? (
            <section className={cardClass()}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <h2 className="mt-0 mb-2 text-base font-semibold">Communications</h2>
                  <p className="m-0 text-sm text-text-muted">
                    Email, WhatsApp and call history remain on the CRM lead workspace. Open the linked
                    lead to continue counselling conversations without leaving context.
                  </p>
                </div>
                {student.lead ? (
                  <PrimaryButton
                    type="button"
                    variant="primary"
                    icon={<HugeiconsIcon icon={SentIcon} size={15} />}
                    label="Open lead communications"
                    onClick={() =>
                      navigate(`/leads/${student.lead!.id}?tab=more&more=communications`)
                    }
                  />
                ) : null}
              </div>
              {!student.lead ? (
                <p className="mb-0 mt-4 text-sm text-text-muted">
                  This student has no linked lead, so communications are unavailable here.
                </p>
              ) : (
                <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
                  <StatTile label="Lead" value={student.lead.code} hint={student.lead.name} />
                  <StatTile label="Lead status" value={student.lead.status} />
                  <StatTile
                    label="Contact"
                    value={phone || email || '—'}
                    hint="Via lead workspace"
                  />
                </div>
              )}
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
