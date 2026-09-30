import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Input, Select } from 'antd'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { useDebounce } from '@/hooks/useDebounce'
import { adminBanner, adminCard, adminPage } from '@/styles/admin'
import { useGetWhatsAppSettingsQuery, useListWhatsAppConversationsQuery } from '../api/whatsappApi'
import ConversationList from '../components/ConversationList'
import ConversationView from '../components/ConversationView'
import { WA_STATUS_LABELS, WA_STATUS_ORDER } from '../types'

const ASSIGNED_OPTIONS = [
  { value: 'all', label: 'All conversations' },
  { value: 'me', label: 'Assigned to me' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'unidentified', label: 'Unidentified (review)' },
]

export default function WhatsAppInboxPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('c')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>()
  const [assigned, setAssigned] = useState('all')
  const debouncedSearch = useDebounce(search, 300)

  const { data: settings } = useGetWhatsAppSettingsQuery()
  const { data, isFetching, isError } = useListWhatsAppConversationsQuery(
    {
      search: debouncedSearch || undefined,
      status,
      assigned: assigned === 'all' ? undefined : assigned,
      limit: 50,
    },
    { pollingInterval: 10000 },
  )

  const items = useMemo(() => data?.items || [], [data?.items])
  const byStatus = data?.summary.byStatus
  const totalAll = byStatus ? Object.values(byStatus).reduce((sum, n) => sum + n, 0) : 0

  useEffect(() => {
    if (!selectedId && items.length > 0 && window.matchMedia('(min-width: 1024px)').matches) {
      setSearchParams({ c: items[0].id }, { replace: true })
    }
  }, [selectedId, items, setSearchParams])

  function select(id: string | null) {
    if (id) setSearchParams({ c: id })
    else setSearchParams({})
  }

  return (
    <div className={adminPage}>
      <PageMeta title="WhatsApp Inbox" description="Official WhatsApp Business conversations connected to CRM leads." />
      <PageHeader
        title="WhatsApp Inbox"
        subtitle="Receive, assign, and reply to student WhatsApp enquiries. Every message is saved on the lead timeline."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'WhatsApp Inbox' }]}
        extra={
          data?.summary.unread ? (
            <span className="rounded-full bg-[#25d366] px-3 py-1 text-[0.8rem] font-semibold text-white">
              {data.summary.unread} unread
            </span>
          ) : null
        }
      />

      {settings?.mockMode ? (
        <p className={adminBanner}>
          WhatsApp Business API is not configured. Running in test mode: outgoing messages are saved but not
          delivered. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID on the API server to go live.
        </p>
      ) : null}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <StatusChip label="All" count={totalAll} active={!status} onClick={() => setStatus(undefined)} />
        {WA_STATUS_ORDER.map((key) => (
          <StatusChip
            key={key}
            label={WA_STATUS_LABELS[key]}
            count={byStatus?.[key] ?? 0}
            active={status === key}
            onClick={() => setStatus(status === key ? undefined : key)}
          />
        ))}
      </div>

      <div className={`${adminCard} grid overflow-hidden p-0 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]`}>
        <aside
          className={`flex min-h-0 flex-col border-border-subtle lg:h-[calc(100vh-290px)] lg:min-h-[520px] lg:border-r ${
            selectedId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="grid gap-2 border-b border-border-subtle p-3">
            <Input.Search
              allowClear
              placeholder="Search name, phone, lead code, message"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={assigned} onChange={setAssigned} options={ASSIGNED_OPTIONS} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isError ? (
              <p className="m-0 p-4 text-danger">Could not load conversations. Check API connection.</p>
            ) : (
              <ConversationList items={items} selectedId={selectedId} loading={isFetching} onSelect={select} />
            )}
          </div>
        </aside>

        <section className={`min-h-0 ${selectedId ? 'flex' : 'hidden lg:flex'} flex-col`}>
          {selectedId ? (
            <>
              <button
                type="button"
                className="cursor-pointer border-0 border-b border-border-subtle bg-transparent px-4 py-2 text-left text-[0.85rem] text-primary lg:hidden"
                onClick={() => select(null)}
              >
                ← Back to inbox
              </button>
              <ConversationView
                key={selectedId}
                conversationId={selectedId}
                settings={settings}
                className="h-[calc(100vh-240px)] min-h-[520px] lg:h-[calc(100vh-290px)]"
              />
            </>
          ) : (
            <div className="grid h-full min-h-[520px] place-items-center p-6 text-center text-text-muted">
              Select a conversation to view messages.
            </div>
          )}
        </section>
      </div>
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
      className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8rem] ${
        active
          ? 'border-primary bg-primary text-on-primary'
          : 'border-border bg-surface text-text hover:bg-hover-bg'
      }`}
    >
      {label}
      <span className={`rounded-full px-1.5 text-[0.72rem] font-semibold ${active ? 'bg-white/25' : 'bg-hover-bg'}`}>
        {count}
      </span>
    </button>
  )
}
