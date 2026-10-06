import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Input, Select } from 'antd'
import { toast } from 'react-toastify'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { PrimaryButton } from '@/components/ui'
import { useDebounce } from '@/hooks/useDebounce'
import { getApiError } from '@/lib/api'
import { adminBanner, adminCard, adminPage } from '@/styles/admin'
import { useGetEmailSettingsQuery, useListEmailThreadsQuery, useSimulateInboundEmailMutation } from '../api/emailApi'
import SimulateInboundModal from '../components/SimulateInboundModal'
import ThreadList from '../components/ThreadList'
import ThreadView from '../components/ThreadView'
import { EMAIL_STATUS_LABELS, EMAIL_STATUS_ORDER } from '../types'

const ASSIGNED_OPTIONS = [
  { value: 'all', label: 'All emails' },
  { value: 'me', label: 'Assigned to me' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'unidentified', label: 'Manual review' },
]

export default function EmailInboxPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('c')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>()
  const [assigned, setAssigned] = useState('all')
  const [simulateOpen, setSimulateOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const { data: settings } = useGetEmailSettingsQuery()
  const { data, isFetching, isError } = useListEmailThreadsQuery({
    search: debouncedSearch || undefined,
    status,
    assigned: assigned === 'all' ? undefined : assigned,
    limit: 50,
  })
  const [simulate, { isLoading: simulating }] = useSimulateInboundEmailMutation()

  const items = useMemo(() => data?.items || [], [data?.items])
  const byStatus = data?.summary.byStatus
  const totalAll = byStatus ? Object.values(byStatus).reduce((sum, count) => sum + count, 0) : 0

  useEffect(() => {
    if (!selectedId && items.length > 0 && window.matchMedia('(min-width: 1024px)').matches) {
      setSearchParams({ c: items[0].id }, { replace: true })
    }
  }, [selectedId, items, setSearchParams])

  function select(id: string | null) {
    if (id) setSearchParams({ c: id })
    else setSearchParams({})
  }

  async function onSimulate(values: { fromName: string; fromEmail: string; subject: string; text: string }) {
    try {
      const result = await simulate(values).unwrap()
      toast.success(result.message || 'Test email received.')
      setSimulateOpen(false)
      if (result.threadId) setSearchParams({ c: result.threadId })
    } catch (error) {
      toast.error(getApiError(error, 'Unable to receive the test email.'))
    }
  }

  return (
    <div className={adminPage}>
      <PageMeta title="Email Inbox" description="Official email conversations connected to CRM leads." />
      <PageHeader
        title="Email Communication"
        subtitle="Receive, match, and reply to student emails. Every message is saved on the lead timeline."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Email Communication' }]}
        extra={
          <div className="flex items-center gap-2">
            {settings?.mockMode && settings.canManage ? (
              <PrimaryButton size="sm" onClick={() => setSimulateOpen(true)}>
                Receive test email
              </PrimaryButton>
            ) : null}
            {data?.summary.unread ? (
              <span className="rounded-full bg-primary px-3 py-1 text-[0.8rem] font-semibold text-on-primary">
                {data.summary.unread} unread
              </span>
            ) : null}
          </div>
        }
      />

      {settings?.mockMode ? (
        <p className={adminBanner}>
          Company mailbox is not configured. Running in test mode: outgoing mail is saved in the CRM and is not
          delivered. Set SMTP_HOST and EMAIL_FROM_ADDRESS on the API server to send live mail. Inbound mail can arrive
          via IMAP sync or POST /api/webhooks/email.
        </p>
      ) : null}

      {settings && !settings.mockMode && settings.inbound && !settings.inbound.imap ? (
        <p className={adminBanner}>
          Outbound SMTP is live for {settings.fromAddress}, but inbound sync is off. Enable IMAP
          (EMAIL_IMAP_ENABLED) or wire POST /api/webhooks/email so student replies appear here.
        </p>
      ) : null}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <StatusChip label="All" count={totalAll} active={!status} onClick={() => setStatus(undefined)} />
        {EMAIL_STATUS_ORDER.map((key) => (
          <StatusChip
            key={key}
            label={EMAIL_STATUS_LABELS[key]}
            count={byStatus?.[key] ?? 0}
            active={status === key}
            onClick={() => setStatus(status === key ? undefined : key)}
          />
        ))}
      </div>

      <div
        className={`${adminCard} grid min-w-0 max-w-full overflow-hidden p-0 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]`}
      >
        <aside
          className={`flex min-h-0 min-w-0 max-w-full flex-col overflow-hidden border-border-subtle lg:h-[calc(100vh-290px)] lg:min-h-[520px] lg:border-r ${
            selectedId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="grid min-w-0 gap-2 border-b border-border-subtle p-3 [&_.ant-input-search]:w-full [&_.ant-input-search]:min-w-0 [&_.ant-select]:w-full [&_.ant-select]:min-w-0">
            <Input.Search
              allowClear
              placeholder="Search name, email, subject, lead"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={assigned} onChange={setAssigned} options={ASSIGNED_OPTIONS} className="w-full" />
          </div>
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
            {isError ? (
              <p className="m-0 p-4 text-danger">Could not load emails. Check API connection.</p>
            ) : (
              <ThreadList items={items} selectedId={selectedId} loading={isFetching} onSelect={select} />
            )}
          </div>
        </aside>

        <section
          className={`min-h-0 min-w-0 max-w-full overflow-hidden ${selectedId ? 'flex' : 'hidden lg:flex'} flex-col`}
        >
          {selectedId ? (
            <>
              <button
                type="button"
                className="cursor-pointer border-0 border-b border-border-subtle bg-transparent px-4 py-2 text-left text-[0.85rem] text-primary lg:hidden"
                onClick={() => select(null)}
              >
                Back to inbox
              </button>
              <ThreadView
                key={selectedId}
                threadId={selectedId}
                settings={settings}
                className="h-[calc(100vh-240px)] min-h-[520px] min-w-0 lg:h-[calc(100vh-290px)]"
              />
            </>
          ) : (
            <div className="grid h-full min-h-[520px] place-items-center p-6 text-center text-text-muted">
              Select an email to view the conversation.
            </div>
          )}
        </section>
      </div>

      <SimulateInboundModal
        open={simulateOpen}
        saving={simulating}
        onClose={() => setSimulateOpen(false)}
        onSubmit={(values) => void onSimulate(values)}
      />
    </div>
  )
}

function StatusChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-[0.8rem] ${
        active ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface text-text hover:bg-hover-bg'
      }`}
    >
      {label}
      <span className={`rounded px-1.5 text-[0.72rem] font-semibold ${active ? 'bg-white/25' : 'bg-hover-bg'}`}>
        {count}
      </span>
    </button>
  )
}
