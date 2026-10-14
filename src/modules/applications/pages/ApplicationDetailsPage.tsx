import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Breadcrumb,
  Dropdown,
  Input,
  Modal,
  Progress,
  Select,
  Skeleton,
  Table,
  Upload,
} from 'antd'
import { toast } from 'react-toastify'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Building03Icon,
  Call02Icon,
  CheckmarkCircle02Icon,
  File01Icon,
  FileUploadIcon,
  Mail01Icon,
  MoreHorizontalIcon,
  Note01Icon,
  PencilEdit02Icon,
  SentIcon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import { PageMeta } from '@/components/common/Meta'
import { PrimaryButton } from '@/components/ui'
import { getApiError } from '@/lib/api'
import { useGetStudentQuery } from '@/modules/students/api/studentsApi'
import ApplicationProgressCard from '../components/ApplicationProgressCard'
import {
  useAttachSharedApplicationDocumentMutation,
  useCreateApplicationNoteMutation,
  useGetApplicationQuery,
  useListApplicationActivitiesQuery,
  useListApplicationDocumentsQuery,
  useListApplicationNotesQuery,
  useListApplicationPaymentsQuery,
  useUpdateApplicationDocumentStatusMutation,
  useUpdateApplicationStatusMutation,
  useUploadApplicationDocumentMutation,
} from '../api/applicationsApi'
import { applicationStatusClass } from '../utils/applicationStatus'
import { primaryStatusActionLabel } from '../utils/applicationProgress'

type AppTab =
  | 'overview'
  | 'documents'
  | 'communication'
  | 'activity'
  | 'notes'
  | 'payments'

const TABS: Array<{ key: AppTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'documents', label: 'Documents' },
  { key: 'communication', label: 'Communication' },
  { key: 'activity', label: 'Activity' },
  { key: 'notes', label: 'Notes' },
  { key: 'payments', label: 'Payments' },
]

function parseTab(value: string | null): AppTab {
  if (value === 'activities' || value === 'timeline') return 'activity'
  if (value === 'files') return 'documents'
  if (value && TABS.some((tab) => tab.key === value)) return value as AppTab
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

function MetaCell({
  label,
  value,
  icon,
}: {
  label: string
  value?: string | null
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

function cardClass() {
  return 'rounded-2xl border border-[#e7eef5] bg-surface p-5 shadow-[0_8px_24px_rgba(22,50,79,0.04)] dark:border-border'
}

export default function ApplicationDetailsPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = parseTab(searchParams.get('tab'))

  const { data, isFetching, isError } = useGetApplicationQuery(id, { skip: !id })
  const application = data?.application

  const [updateStatus, { isLoading: savingStatus }] = useUpdateApplicationStatusMutation()
  const [createNote, { isLoading: savingNote }] = useCreateApplicationNoteMutation()
  const [uploadDoc, { isLoading: uploading }] = useUploadApplicationDocumentMutation()
  const [attachShared, { isLoading: attaching }] = useAttachSharedApplicationDocumentMutation()
  const [updateDocStatus] = useUpdateApplicationDocumentStatusMutation()

  const loadDocs = Boolean(id && (tab === 'documents' || tab === 'overview'))
  const loadActivity = Boolean(id && (tab === 'activity' || tab === 'overview'))

  const notesQuery = useListApplicationNotesQuery(id, { skip: !id || tab !== 'notes' })
  const docsQuery = useListApplicationDocumentsQuery(id, { skip: !loadDocs })
  const activitiesQuery = useListApplicationActivitiesQuery(id, { skip: !loadActivity })
  const paymentsQuery = useListApplicationPaymentsQuery(id, {
    skip: !id || tab !== 'payments',
  })
  const studentQuery = useGetStudentQuery(application?.studentId || '', {
    skip: !application?.studentId,
  })

  const [remarks, setRemarks] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [noteOpen, setNoteOpen] = useState(false)
  const [sharedDocId, setSharedDocId] = useState<string>()

  const setTab = (next: AppTab) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      if (next === 'overview') params.delete('tab')
      else params.set('tab', next)
      return params
    })
  }

  const student = studentQuery.data?.student
  const documents = docsQuery.data?.items || []
  const verifiedCount = documents.filter((d) => d.status === 'VERIFIED').length
  const docProgress = documents.length
    ? Math.round((verifiedCount / documents.length) * 100)
    : 0

  const nextPrimary = application?.allowedTransitions.find(
    (status) => !['Rejected', 'Withdrawn'].includes(status),
  )
  const primaryLabel = application
    ? primaryStatusActionLabel(nextPrimary)
    : null

  const sharedOptions = useMemo(() => {
    const shared = student?.sharedDocuments || []
    const attached = new Set(
      documents
        .filter((item) => item.source === 'SHARED_LEAD_DOCUMENT' && item.sourceDocumentId)
        .map((item) => item.sourceDocumentId as string),
    )
    return shared
      .filter((doc) => !attached.has(doc.id))
      .map((doc) => ({ value: doc.id, label: `${doc.name} (${doc.typeCode})` }))
  }, [student, documents])

  async function advanceStatus(status: string) {
    if (!application) return
    try {
      await updateStatus({
        id: application.id,
        status,
        remarks: remarks || undefined,
      }).unwrap()
      toast.success('Application status updated.')
      setRemarks('')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to update application status.'))
    }
  }

  async function onAddNote() {
    if (!noteBody.trim()) {
      toast.error('Enter a note.')
      return
    }
    try {
      await createNote({ id, body: noteBody.trim() }).unwrap()
      toast.success('Note added.')
      setNoteBody('')
      setNoteOpen(false)
      setTab('notes')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to add note.'))
    }
  }

  async function onAttachShared() {
    if (!sharedDocId) {
      toast.error('Select a shared document.')
      return
    }
    try {
      await attachShared({ id, sourceDocumentId: sharedDocId }).unwrap()
      toast.success('Shared document attached.')
      setSharedDocId(undefined)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to attach shared document.'))
    }
  }

  function confirmDocumentStatus(
    documentId: string,
    title: string,
    nextStatus: 'VERIFIED' | 'REJECTED',
  ) {
    const isVerify = nextStatus === 'VERIFIED'
    Modal.confirm({
      title: isVerify ? 'Verify document?' : 'Reject document?',
      content: isVerify
        ? `Approve “${title}” for this application only? This does not change approval on other university applications.`
        : `Reject “${title}” for this application? You can verify it again later if needed.`,
      okText: isVerify ? 'Verify' : 'Reject',
      cancelText: 'Cancel',
      okButtonProps: isVerify
        ? {
            className:
              '!bg-primary !border-primary hover:!bg-primary-hover hover:!border-primary-hover',
          }
        : { danger: true },
      cancelButtonProps: {
        className: 'hover:!border-primary hover:!text-primary',
      },
      onOk: async () => {
        try {
          await updateDocStatus({
            id,
            documentId,
            status: nextStatus,
          }).unwrap()
          toast.success(isVerify ? 'Document verified.' : 'Document rejected.')
        } catch (error) {
          toast.error(
            getApiError(error, isVerify ? 'Unable to verify.' : 'Unable to reject.'),
          )
          throw error
        }
      },
    })
  }

  if (isError) {
    return (
      <div className="grid gap-3">
        <p className="m-0 text-danger">Application not found or access denied.</p>
        <PrimaryButton
          type="button"
          variant="outline"
          label="Back to applications"
          onClick={() => navigate('/applications')}
        />
      </div>
    )
  }

  const paymentItems = Array.isArray(paymentsQuery.data?.payments)
    ? (paymentsQuery.data.payments as Array<Record<string, unknown>>)
    : Array.isArray(paymentsQuery.data?.items)
      ? (paymentsQuery.data.items as Array<Record<string, unknown>>)
      : []

  const recentActivity = (activitiesQuery.data?.items || []).slice(0, 6)

  return (
    <div className="grid min-w-0 gap-4">
      <PageMeta
        title={application ? `${application.code} · Application` : 'Application'}
        description="University application admission workspace."
      />

      <Breadcrumb
        items={[
          { title: <Link to="/applications">Applications</Link> },
          {
            title: (
              <span className="font-medium text-primary">
                {application?.code || 'Details'}
              </span>
            ),
          },
        ]}
      />

      {isFetching && !application ? <Skeleton active paragraph={{ rows: 12 }} /> : null}

      {application ? (
        <>
          {/* Header */}
          <section className={cardClass()}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-primary">
                  <HugeiconsIcon icon={File01Icon} size={24} color="currentColor" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="m-0 text-xl font-semibold text-[#1b3a57] dark:text-text-strong">
                      {application.code}
                    </h1>
                    <span className={applicationStatusClass(application.status)}>
                      {application.status}
                    </span>
                  </div>
                  <p className="m-0 mt-1 text-sm text-text-muted">
                    <span className="font-medium text-text-strong">{application.applicantName}</span>
                    {application.studentId ? (
                      <>
                        {' · '}
                        <Link
                          to={`/students/${application.studentId}`}
                          className="text-primary hover:underline"
                        >
                          View Student Profile
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {application.allowedTransitions.length > 0 ? (
                  <Select
                    className="min-w-44"
                    size="middle"
                    placeholder="Change status"
                    value={undefined}
                    onChange={(value) => {
                      if (value) void advanceStatus(value)
                    }}
                    options={application.allowedTransitions.map((status) => ({
                      value: status,
                      label: status,
                    }))}
                    loading={savingStatus}
                  />
                ) : null}
                {primaryLabel && nextPrimary ? (
                  <PrimaryButton
                    type="button"
                    variant="primary"
                    loading={savingStatus}
                    icon={<HugeiconsIcon icon={SentIcon} size={16} />}
                    label={primaryLabel}
                    onClick={() => void advanceStatus(nextPrimary)}
                  />
                ) : null}
                <PrimaryButton
                  type="button"
                  size="sm"
                  variant="outline"
                  icon={<HugeiconsIcon icon={Note01Icon} size={15} />}
                  label="Add Note"
                  onClick={() => {
                    setNoteOpen(true)
                    setTab('notes')
                  }}
                />
                <Dropdown
                  menu={{
                    items: [
                      application.studentId
                        ? {
                            key: 'student',
                            label: 'Open student',
                            onClick: () => navigate(`/students/${application.studentId}`),
                          }
                        : null,
                      application.leadId
                        ? {
                            key: 'lead',
                            label: 'Open lead CRM',
                            onClick: () => navigate(`/leads/${application.leadId}`),
                          }
                        : null,
                      {
                        key: 'documents',
                        label: 'Upload document',
                        onClick: () => setTab('documents'),
                      },
                      {
                        key: 'payments',
                        label: 'View payments',
                        onClick: () => setTab('payments'),
                      },
                    ].filter(Boolean) as Array<{ key: string; label: string; onClick: () => void }>,
                  }}
                  trigger={['click']}
                >
                  <span>
                    <PrimaryButton
                      type="button"
                      size="sm"
                      variant="outline"
                      icon={<HugeiconsIcon icon={MoreHorizontalIcon} size={16} />}
                      label="More"
                    />
                  </span>
                </Dropdown>
              </div>
            </div>

            <div className="mt-5 grid gap-3 border-t border-[#eef3f8] pt-4 sm:grid-cols-2 lg:grid-cols-5 dark:border-border">
              <MetaCell
                label="Lead ID"
                value={application.lead?.code}
                icon={
                  application.leadId ? (
                    <Link to={`/leads/${application.leadId}`} className="text-primary">
                      <HugeiconsIcon icon={UserIcon} size={14} />
                    </Link>
                  ) : undefined
                }
              />
              <MetaCell
                label="University"
                value={application.university}
                icon={<HugeiconsIcon icon={Building03Icon} size={14} color="var(--color-primary)" />}
              />
              <MetaCell label="Program" value={application.program} />
              <MetaCell label="Intake" value={application.intake} />
              <MetaCell label="Counsellor" value={application.counsellorName} />
            </div>
          </section>

          {/* Tabs — underline style like reference */}
          <div className="flex min-w-0 gap-1 overflow-x-auto border-b border-[#e7eef5] dark:border-border">
            {TABS.map((item) => {
              const active = tab === item.key
              const badge =
                item.key === 'documents'
                  ? documents.length
                  : item.key === 'notes'
                    ? notesQuery.data?.items.length
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
                          : 'bg-[#eef2f6] text-text-muted dark:bg-border'
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

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="grid min-w-0 gap-4">
              {tab === 'overview' ? (
                <>
                  <ApplicationProgressCard
                    status={application.status}
                    statusHistory={application.statusHistory}
                    createdAt={application.createdAt}
                    submittedAt={application.submittedAt}
                  />

                  <div className="grid gap-4 lg:grid-cols-2">
                    <section className={cardClass()}>
                      <header className="mb-3 flex items-center justify-between gap-2">
                        <h2 className="m-0 text-base font-semibold">Application Details</h2>
                        {application.leadId ? (
                          <PrimaryButton
                            type="button"
                            size="sm"
                            variant="outline"
                            icon={<HugeiconsIcon icon={PencilEdit02Icon} size={14} />}
                            label="Edit"
                            onClick={() => navigate(`/leads/${application.leadId}`)}
                          />
                        ) : null}
                      </header>
                      <dl className="m-0">
                        <DetailRow label="University" value={application.university} />
                        <DetailRow label="Program" value={application.program} />
                        <DetailRow label="Intake" value={application.intake} />
                        <DetailRow label="Country" value={application.countryName} />
                        <DetailRow
                          label="Submitted On"
                          value={application.submittedAt || 'Not submitted'}
                        />
                        <DetailRow
                          label="Assigned To"
                          value={
                            <span className="inline-flex items-center gap-2">
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] text-[0.65rem] font-bold text-primary">
                                {initials(application.counsellorName)}
                              </span>
                              {application.counsellorName || '—'}
                            </span>
                          }
                        />
                        <DetailRow label="Remarks" value={application.remarks} />
                      </dl>
                    </section>

                    <section className={cardClass()}>
                      <header className="mb-2 flex items-center justify-between gap-2">
                        <h2 className="m-0 text-base font-semibold">Document Checklist</h2>
                        <button
                          type="button"
                          className="cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-primary hover:underline"
                          onClick={() => setTab('documents')}
                        >
                          Manage
                        </button>
                      </header>
                      <p className="m-0 mb-2 text-sm text-text-muted">
                        {verifiedCount} of {documents.length || 0} documents verified
                      </p>
                      <Progress
                        percent={documents.length ? docProgress : 0}
                        strokeColor="var(--color-primary)"
                        showInfo={Boolean(documents.length)}
                        size="small"
                      />
                      {documents.length === 0 ? (
                        <p className="mb-0 mt-4 text-sm text-text-muted">
                          No application documents yet.{' '}
                          <button
                            type="button"
                            className="cursor-pointer border-0 bg-transparent p-0 text-primary hover:underline"
                            onClick={() => setTab('documents')}
                          >
                            Upload or attach
                          </button>
                        </p>
                      ) : (
                        <ul className="m-0 mt-4 grid list-none gap-2 p-0">
                          {documents.slice(0, 6).map((doc) => (
                            <li
                              key={doc.id}
                              className="flex items-center justify-between gap-2 rounded-xl border border-[#eef3f8] px-3 py-2 dark:border-border"
                            >
                              <div className="min-w-0">
                                <p className="m-0 truncate text-sm font-medium">{doc.title}</p>
                                <p className="m-0 text-xs text-text-muted">
                                  {doc.source === 'SHARED_LEAD_DOCUMENT'
                                    ? 'Shared attach'
                                    : 'Upload'}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[0.68rem] font-semibold ${
                                  doc.status === 'VERIFIED'
                                    ? 'bg-[#e7f8ef] text-[#16a34a]'
                                    : doc.status === 'REJECTED'
                                      ? 'bg-[#ffe8ee] text-[#e11d48]'
                                      : 'bg-[#e8f1ff] text-[#2563eb]'
                                }`}
                              >
                                {doc.status === 'VERIFIED'
                                  ? 'Approved'
                                  : doc.status === 'REJECTED'
                                    ? 'Rejected'
                                    : 'Under Review'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </div>

                  <section className={cardClass()}>
                    <header className="mb-3 flex items-center justify-between gap-2">
                      <h2 className="m-0 text-base font-semibold">Recent Activity</h2>
                      <button
                        type="button"
                        className="cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-primary hover:underline"
                        onClick={() => setTab('activity')}
                      >
                        View all
                      </button>
                    </header>
                    {recentActivity.length === 0 ? (
                      <p className="m-0 text-sm text-text-muted">No recent activity yet.</p>
                    ) : (
                      <ul className="m-0 grid list-none gap-3 p-0">
                        {recentActivity.map((item) => (
                          <li key={item.id} className="flex gap-3">
                            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-primary">
                              <HugeiconsIcon
                                icon={CheckmarkCircle02Icon}
                                size={16}
                                color="currentColor"
                              />
                            </span>
                            <div className="min-w-0">
                              <p className="m-0 text-sm font-medium text-text-strong">
                                {item.outcome || item.type}
                              </p>
                              {item.notes ? (
                                <p className="m-0 mt-0.5 text-sm text-text-muted">{item.notes}</p>
                              ) : null}
                              <p className="m-0 mt-0.5 text-xs text-text-muted">
                                {new Date(item.occurredAt).toLocaleString()}
                                {item.user?.name ? ` · ${item.user.name}` : ''}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              ) : null}

              {tab === 'documents' ? (
                <section className={cardClass()}>
                  <h2 className="mt-0 mb-1 text-base font-semibold">University documents</h2>
                  <p className="mt-0 mb-4 text-sm text-text-muted">
                    Approval is per application. Attaching a shared student file does not auto-approve
                    it here.
                  </p>

                  <div className="mb-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-xl border border-[#eef3f8] p-3 dark:border-border">
                      <p className="mt-0 mb-2 text-sm font-medium">Upload university-specific file</p>
                      <Upload
                        maxCount={1}
                        beforeUpload={async (file) => {
                          const formData = new FormData()
                          formData.append('file', file)
                          formData.append('title', file.name)
                          formData.append('categoryCode', 'APPLICATION')
                          formData.append('typeCode', 'UNIVERSITY_DOC')
                          try {
                            await uploadDoc({ id, formData }).unwrap()
                            toast.success('Document uploaded.')
                          } catch (error) {
                            toast.error(getApiError(error, 'Upload failed.'))
                          }
                          return false
                        }}
                        showUploadList={false}
                      >
                        <PrimaryButton
                          type="button"
                          variant="primary"
                          size="sm"
                          loading={uploading}
                          icon={<HugeiconsIcon icon={FileUploadIcon} size={15} />}
                          label="Choose file"
                        />
                      </Upload>
                    </div>
                    <div className="rounded-xl border border-[#eef3f8] p-3 dark:border-border">
                      <p className="mt-0 mb-2 text-sm font-medium">Attach from student shared docs</p>
                      <div className="flex flex-wrap gap-2">
                        <Select
                          className="min-w-55 flex-1"
                          placeholder="Select shared document"
                          value={sharedDocId}
                          onChange={setSharedDocId}
                          options={sharedOptions}
                          allowClear
                        />
                        <PrimaryButton
                          type="button"
                          variant="outline"
                          size="sm"
                          loading={attaching}
                          label="Attach"
                          onClick={() => void onAttachShared()}
                        />
                      </div>
                    </div>
                  </div>

                  <Table
                    rowKey="id"
                    loading={docsQuery.isFetching}
                    dataSource={documents}
                    pagination={{ pageSize: 8 }}
                    columns={[
                      { title: 'Code', dataIndex: 'code', key: 'code' },
                      { title: 'Title', dataIndex: 'title', key: 'title' },
                      {
                        title: 'Source',
                        dataIndex: 'source',
                        key: 'source',
                        render: (value: string) =>
                          value === 'SHARED_LEAD_DOCUMENT' ? 'Shared attach' : 'Upload',
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        render: (value: string) => (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[0.68rem] font-semibold ${
                              value === 'VERIFIED'
                                ? 'bg-[#e7f8ef] text-[#16a34a]'
                                : value === 'REJECTED'
                                  ? 'bg-[#ffe8ee] text-[#e11d48]'
                                  : 'bg-[#e8f1ff] text-[#2563eb]'
                            }`}
                          >
                            {value === 'VERIFIED'
                              ? 'Approved'
                              : value === 'REJECTED'
                                ? 'Rejected'
                                : 'Under Review'}
                          </span>
                        ),
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        render: (
                          _: unknown,
                          row: { id: string; status: string; title: string },
                        ) => (
                          <div className="flex flex-wrap gap-1">
                            {row.status !== 'VERIFIED' ? (
                              <PrimaryButton
                                type="button"
                                size="sm"
                                variant="outline"
                                label="Verify"
                                onClick={() =>
                                  confirmDocumentStatus(row.id, row.title, 'VERIFIED')
                                }
                              />
                            ) : null}
                            {row.status !== 'REJECTED' ? (
                              <PrimaryButton
                                type="button"
                                size="sm"
                                variant="outline"
                                label="Reject"
                                onClick={() =>
                                  confirmDocumentStatus(row.id, row.title, 'REJECTED')
                                }
                              />
                            ) : null}
                          </div>
                        ),
                      },
                    ]}
                  />
                </section>
              ) : null}

              {tab === 'communication' ? (
                <section className={cardClass()}>
                  <h2 className="mt-0 mb-2 text-base font-semibold">Communication</h2>
                  <p className="m-0 text-sm text-text-muted">
                    Email, WhatsApp and call history remain on the CRM lead workspace.
                  </p>
                  {application.leadId ? (
                    <div className="mt-4">
                      <PrimaryButton
                        type="button"
                        variant="primary"
                        label="Open lead communications"
                        onClick={() =>
                          navigate(`/leads/${application.leadId}?tab=more&more=communications`)
                        }
                      />
                    </div>
                  ) : null}
                </section>
              ) : null}

              {tab === 'activity' ? (
                <div className="grid gap-4">
                  <section className={cardClass()}>
                    <h2 className="mt-0 mb-3 text-base font-semibold">Status timeline</h2>
                    {application.statusHistory.length === 0 ? (
                      <p className="m-0 text-sm text-text-muted">No status history yet.</p>
                    ) : (
                      <ol className="m-0 grid list-none gap-3 p-0">
                        {application.statusHistory.map((item) => (
                          <li
                            key={item.id}
                            className="border-b border-[#eef3f8] pb-3 last:border-0 dark:border-border"
                          >
                            <p className="m-0 text-sm font-medium text-text-strong">
                              {item.previousStatus ? `${item.previousStatus} → ` : ''}
                              {item.newStatus}
                            </p>
                            <p className="m-0 mt-0.5 text-xs text-text-muted">
                              {new Date(item.createdAt).toLocaleString()}
                              {item.createdBy?.name ? ` · ${item.createdBy.name}` : ''}
                            </p>
                            {item.remarks ? (
                              <p className="m-0 mt-1 text-xs text-text-muted">{item.remarks}</p>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    )}
                  </section>

                  <section className={cardClass()}>
                    <h2 className="mt-0 mb-3 text-base font-semibold">Activity feed</h2>
                    {activitiesQuery.isFetching ? <Skeleton active paragraph={{ rows: 4 }} /> : null}
                    {(activitiesQuery.data?.items || []).length === 0 ? (
                      <p className="m-0 text-sm text-text-muted">
                        No application-specific activities yet.
                      </p>
                    ) : (
                      <ul className="m-0 grid list-none gap-3 p-0">
                        {(activitiesQuery.data?.items || []).map((item) => (
                          <li
                            key={item.id}
                            className="rounded-xl border border-[#eef3f8] px-3 py-2.5 dark:border-border"
                          >
                            <p className="m-0 text-sm font-medium">
                              {item.outcome || item.type}
                              {item.user?.name ? (
                                <span className="font-normal text-text-muted">
                                  {' '}
                                  · {item.user.name}
                                </span>
                              ) : null}
                            </p>
                            <p className="m-0 mt-0.5 text-xs text-text-muted">
                              {new Date(item.occurredAt).toLocaleString()}
                            </p>
                            {item.notes ? (
                              <p className="m-0 mt-1 text-sm text-text-strong">{item.notes}</p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              ) : null}

              {tab === 'notes' ? (
                <section className={cardClass()}>
                  <h2 className="mt-0 mb-3 text-base font-semibold">Application notes</h2>
                  <div className="mb-4 grid gap-2">
                    <Input.TextArea
                      rows={3}
                      value={noteBody}
                      onChange={(event) => setNoteBody(event.target.value)}
                      placeholder="University or application-specific internal note"
                      autoFocus={noteOpen}
                    />
                    <div>
                      <PrimaryButton
                        type="button"
                        variant="primary"
                        loading={savingNote}
                        label="Add note"
                        onClick={() => void onAddNote()}
                      />
                    </div>
                  </div>
                  {(notesQuery.data?.items || []).length === 0 ? (
                    <p className="m-0 text-sm text-text-muted">No notes yet.</p>
                  ) : (
                    <ul className="m-0 grid list-none gap-3 p-0">
                      {(notesQuery.data?.items || []).map((note) => (
                        <li
                          key={note.id}
                          className="rounded-xl border border-[#eef3f8] px-3 py-2.5 dark:border-border"
                        >
                          <p className="m-0 text-sm text-text-strong">{note.body}</p>
                          <p className="m-0 mt-1 text-xs text-text-muted">
                            {new Date(note.createdAt).toLocaleString()}
                            {note.createdBy?.name ? ` · ${note.createdBy.name}` : ''}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ) : null}

              {tab === 'payments' ? (
                <section className={cardClass()}>
                  <h2 className="mt-0 mb-1 text-base font-semibold">Payments</h2>
                  <p className="mt-0 mb-4 text-sm text-text-muted">
                    {typeof paymentsQuery.data?.message === 'string'
                      ? paymentsQuery.data.message
                      : 'Package / service payments linked to this student lead.'}
                  </p>
                  {paymentsQuery.isFetching ? <Skeleton active paragraph={{ rows: 3 }} /> : null}
                  {paymentItems.length === 0 ? (
                    <p className="m-0 text-sm text-text-muted">No payment records found.</p>
                  ) : (
                    <Table
                      rowKey={(row) => String(row.id)}
                      dataSource={paymentItems}
                      pagination={{ pageSize: 8 }}
                      columns={[
                        {
                          title: 'Payment #',
                          dataIndex: 'paymentNumber',
                          key: 'paymentNumber',
                          render: (value: unknown) => String(value ?? '—'),
                        },
                        {
                          title: 'Amount',
                          key: 'amount',
                          render: (_: unknown, row: Record<string, unknown>) =>
                            String(row.amount ?? row.paymentAmount ?? '—'),
                        },
                        {
                          title: 'Status',
                          dataIndex: 'status',
                          key: 'status',
                          render: (value: unknown) => String(value ?? '—'),
                        },
                        {
                          title: 'Date',
                          key: 'date',
                          render: (_: unknown, row: Record<string, unknown>) =>
                            String(row.paymentDate ?? row.createdAt ?? '—').slice(0, 10),
                        },
                      ]}
                    />
                  )}
                </section>
              ) : null}

              {application.allowedTransitions.length > 0 && tab === 'overview' ? (
                <section className={cardClass()}>
                  <h2 className="mt-0 mb-2 text-base font-semibold">Status remarks (optional)</h2>
                  <Input.TextArea
                    rows={2}
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    placeholder="Remarks applied on the next status change"
                  />
                </section>
              ) : null}
            </div>

            {/* Sidebar */}
            <aside className="grid content-start gap-4">
              <section className={cardClass()}>
                <header className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="m-0 text-[0.95rem] font-semibold">Student Information</h3>
                  {application.studentId ? (
                    <Link
                      to={`/students/${application.studentId}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View Profile
                    </Link>
                  ) : null}
                </header>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] text-sm font-bold text-primary">
                    {initials(application.student?.name || application.applicantName)}
                  </span>
                  <div className="min-w-0">
                    <p className="m-0 truncate font-semibold text-text-strong">
                      {application.student?.name || application.applicantName}
                    </p>
                    <p className="m-0 text-xs text-text-muted">
                      {application.student?.studentCode || '—'}
                      {application.student?.status ? (
                        <span className="ml-1.5 rounded-full bg-[#e7f8ef] px-1.5 py-0.5 text-[0.65rem] font-semibold text-[#16a34a]">
                          {application.student.status}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm">
                  <p className="m-0 flex items-center gap-2 text-text-muted">
                    <HugeiconsIcon icon={Call02Icon} size={14} />
                    <span className="text-text-strong">{student?.phone || '—'}</span>
                  </p>
                  <p className="m-0 flex items-center gap-2 text-text-muted">
                    <HugeiconsIcon icon={Mail01Icon} size={14} />
                    <span className="truncate text-text-strong">{student?.email || '—'}</span>
                  </p>
                  <p className="m-0 text-text-muted">
                    Destination:{' '}
                    <span className="text-text-strong">
                      {student?.destination || application.countryName || '—'}
                    </span>
                  </p>
                </div>
              </section>

              <section className={cardClass()}>
                <header className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="m-0 text-[0.95rem] font-semibold">Lead Information</h3>
                  {application.leadId ? (
                    <Link
                      to={`/leads/${application.leadId}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View Lead
                    </Link>
                  ) : null}
                </header>
                {application.lead ? (
                  <div className="grid gap-2 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-text-strong">{application.lead.code}</span>
                      <span className={applicationStatusClass(application.lead.status)}>
                        {application.lead.status}
                      </span>
                    </div>
                    <p className="m-0 text-text-muted">
                      Name:{' '}
                      <span className="text-text-strong">{application.lead.name}</span>
                    </p>
                  </div>
                ) : (
                  <p className="m-0 text-sm text-text-muted">No linked lead.</p>
                )}
              </section>

              <section className={cardClass()}>
                <h3 className="mt-0 mb-3 text-[0.95rem] font-semibold">Status History</h3>
                {application.statusHistory.length === 0 ? (
                  <p className="m-0 text-sm text-text-muted">No history yet.</p>
                ) : (
                  <ol className="m-0 grid list-none gap-3 p-0">
                    {application.statusHistory.slice(0, 8).map((item, index) => (
                      <li key={item.id} className="relative pl-4">
                        <span
                          className={`absolute top-1 left-0 h-2.5 w-2.5 rounded-full ${
                            index === 0 ? 'bg-primary' : 'bg-[#c5d0dc]'
                          }`}
                        />
                        {index < Math.min(application.statusHistory.length, 8) - 1 ? (
                          <span className="absolute top-3.5 -bottom-3 left-1 w-px bg-[#e5ebf2] dark:bg-border" />
                        ) : null}
                        <p className="m-0 text-sm font-medium text-text-strong">{item.newStatus}</p>
                        <p className="m-0 text-[0.7rem] text-text-muted">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </aside>
          </div>
        </>
      ) : null}
    </div>
  )
}
