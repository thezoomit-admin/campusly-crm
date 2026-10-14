import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumb, Input, Select, Skeleton } from 'antd'
import { toast } from 'react-toastify'
import { PageMeta } from '@/components/common/Meta'
import { PrimaryButton } from '@/components/ui'
import { getApiError } from '@/lib/api'
import {
  useGetApplicationQuery,
  useUpdateApplicationStatusMutation,
} from '../api/applicationsApi'
import { applicationStatusClass } from '../utils/applicationStatus'

export default function ApplicationDetailsPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data, isFetching, isError } = useGetApplicationQuery(id, { skip: !id })
  const [updateStatus, { isLoading: saving }] = useUpdateApplicationStatusMutation()
  const [nextStatus, setNextStatus] = useState<string>()
  const [remarks, setRemarks] = useState('')

  const application = data?.application

  async function onStatusChange() {
    if (!application || !nextStatus) {
      toast.error('Please select the next status.')
      return
    }
    try {
      await updateStatus({
        id: application.id,
        status: nextStatus,
        remarks: remarks || undefined,
      }).unwrap()
      toast.success('Application status updated.')
      setNextStatus(undefined)
      setRemarks('')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to update application status.'))
    }
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

      {isFetching && !application ? <Skeleton active paragraph={{ rows: 8 }} /> : null}

      {application ? (
        <>
          <section className="rounded-2xl border border-[#e7eef5] bg-surface p-5 shadow-[0_10px_28px_rgba(22,50,79,0.035)] dark:border-border">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="m-0 text-xl font-semibold text-[#1b3a57] dark:text-text-strong">
                  {application.code}
                </h1>
                <p className="m-0 mt-1 text-sm text-text-muted">
                  {application.applicantName}
                  {application.lead ? (
                    <>
                      {' · '}
                      <Link
                        to={`/leads/${application.lead.id}`}
                        className="text-primary hover:underline"
                      >
                        {application.lead.code}
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
              <span className={applicationStatusClass(application.status)}>
                {application.status}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="University" value={application.university} />
              <Field label="Program" value={application.program} />
              <Field label="Intake" value={application.intake} />
              <Field label="Country" value={application.countryName} />
              <Field label="Counsellor" value={application.counsellorName} />
              <Field
                label="Student"
                value={
                  application.student
                    ? `${application.student.studentCode} · ${application.student.status}`
                    : null
                }
              />
              <Field label="Submitted" value={application.submittedAt} />
              <Field label="Created" value={application.createdAt.slice(0, 10)} />
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-2xl border border-[#e7eef5] bg-surface p-5 dark:border-border">
              <h2 className="mt-0 mb-3 text-base font-semibold text-[#1b3a57] dark:text-text-strong">
                Advance status
              </h2>
              {application.allowedTransitions.length === 0 ? (
                <p className="m-0 text-sm text-text-muted">
                  This application is in a terminal status.
                </p>
              ) : (
                <div className="grid gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Next status</label>
                    <Select
                      className="w-full"
                      size="large"
                      placeholder="Select next status"
                      value={nextStatus}
                      onChange={setNextStatus}
                      options={application.allowedTransitions.map((status) => ({
                        value: status,
                        label: status,
                      }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Remarks</label>
                    <Input.TextArea
                      rows={3}
                      value={remarks}
                      onChange={(event) => setRemarks(event.target.value)}
                      placeholder="Optional status remarks"
                    />
                  </div>
                  <div>
                    <PrimaryButton
                      type="button"
                      variant="primary"
                      loading={saving}
                      label="Update status"
                      onClick={() => void onStatusChange()}
                    />
                  </div>
                </div>
              )}

              {application.leadId ? (
                <p className="mb-0 mt-5 text-sm text-text-muted">
                  Document checklist lives on the lead file workspace.{' '}
                  <Link
                    to={`/leads/${application.leadId}?tab=file-documents`}
                    className="text-primary hover:underline"
                  >
                    Open File Documents
                  </Link>
                </p>
              ) : null}
            </div>

            <aside className="rounded-2xl border border-[#e7eef5] bg-surface p-5 dark:border-border">
              <h2 className="mt-0 mb-3 text-base font-semibold text-[#1b3a57] dark:text-text-strong">
                Status history
              </h2>
              {application.statusHistory.length === 0 ? (
                <p className="m-0 text-sm text-text-muted">No history yet.</p>
              ) : (
                <ol className="m-0 grid list-none gap-3 p-0">
                  {application.statusHistory.map((item) => (
                    <li key={item.id} className="border-b border-[#eef3f8] pb-3 last:border-0 dark:border-border">
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
            </aside>
          </section>
        </>
      ) : null}
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="m-0 text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <p className="m-0 mt-1 text-sm text-text-strong">{value || '—'}</p>
    </div>
  )
}
