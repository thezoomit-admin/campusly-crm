import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Mail01Icon, MessengerIcon, WhatsappIcon } from '@hugeicons/core-free-icons'
import { toast } from 'react-toastify'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { getApiError } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import { useDebounce } from '@/hooks/useDebounce'
import { useGetLeadQuery } from '@/modules/leads/api/leadsApi'
import {
  useGetEmailSettingsQuery,
  useListEmailThreadsQuery,
} from '@/modules/email/api/emailApi'
import ThreadView from '@/modules/email/components/ThreadView'
import {
  useGetWhatsAppSettingsQuery,
  useListWhatsAppConversationsQuery,
} from '@/modules/whatsapp/api/whatsappApi'
import ConversationView from '@/modules/whatsapp/components/ConversationView'
import type { AuthSession } from '@/types'
import { adminPage } from '@/styles/admin'
import {
  useListCommunicationsQuery,
  useListLeadCommunicationsQuery,
  useReprocessCommunicationMutation,
} from '../api/communicationsApi'
import ConversationListPanel, {
  type ListTab,
} from '../components/hub/ConversationListPanel'
import ConversationThreadPanel from '../components/hub/ConversationThreadPanel'
import LeadDetailPanel from '../components/hub/LeadDetailPanel'
import type { CommunicationEvent } from '../types'
import { matchesChannelFilter, type HubChannelFilter } from '../utils/hubFormat'
import {
  filterHubItems,
  mergeHubItems,
  parseHubId,
} from '../utils/hubItems'

export default function CommunicationHubPage() {
  const auth = useOutletContext<AuthSession>()
  const canReprocess = hasPermission(auth, 'communication:reprocess')
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedHubId = searchParams.get('c')

  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState<HubChannelFilter>('all')
  const [listTab, setListTab] = useState<ListTab>('all')
  const debouncedSearch = useDebounce(search, 300)

  const {
    data: eventsData,
    isFetching: eventsFetching,
    isError: eventsError,
  } = useListCommunicationsQuery({
    search: debouncedSearch || undefined,
    page: 1,
    limit: 80,
  })
  const {
    data: waData,
    isFetching: waFetching,
    isError: waError,
  } = useListWhatsAppConversationsQuery(
    {
      search: debouncedSearch || undefined,
      limit: 80,
    },
    { pollingInterval: 15000 },
  )
  const {
    data: emailData,
    isFetching: emailFetching,
    isError: emailError,
  } = useListEmailThreadsQuery({
    search: debouncedSearch || undefined,
    limit: 80,
  })
  const { data: waSettings } = useGetWhatsAppSettingsQuery()
  const { data: emailSettings } = useGetEmailSettingsQuery()
  const [reprocess, { isLoading: reprocessing }] = useReprocessCommunicationMutation()

  const mergedItems = useMemo(
    () =>
      mergeHubItems({
        events: eventsData?.items || [],
        whatsapp: waData?.items || [],
        email: emailData?.items || [],
      }),
    [eventsData?.items, waData?.items, emailData?.items],
  )

  const channelScoped = useMemo(() => {
    if (channelFilter === 'all') return mergedItems
    return mergedItems.filter((item) => matchesChannelFilter(item.channel, channelFilter))
  }, [mergedItems, channelFilter])

  const filteredItems = useMemo(
    () => filterHubItems(mergedItems, channelFilter, listTab, auth.user.id),
    [mergedItems, channelFilter, listTab, auth.user.id],
  )

  const channelCounts = useMemo(
    () => ({
      all: mergedItems.length,
      messenger: mergedItems.filter((item) => matchesChannelFilter(item.channel, 'messenger')).length,
      whatsapp: mergedItems.filter((item) => matchesChannelFilter(item.channel, 'whatsapp')).length,
      email: mergedItems.filter((item) => matchesChannelFilter(item.channel, 'email')).length,
    }),
    [mergedItems],
  )

  const listCounts = useMemo(
    () => ({
      all: channelScoped.length,
      unread: channelScoped.filter((item) => item.unreadCount > 0).length,
      assigned: channelScoped.filter((item) => item.assignedUserId === auth.user.id).length,
    }),
    [channelScoped, auth.user.id],
  )

  const selected = useMemo(
    () =>
      filteredItems.find((item) => item.hubId === selectedHubId) ||
      mergedItems.find((item) => item.hubId === selectedHubId) ||
      null,
    [filteredItems, mergedItems, selectedHubId],
  )

  const selectedRef = parseHubId(selectedHubId)
  const leadId = selected?.leadId || ''
  const { data: leadThreadData, isFetching: threadLoading } = useListLeadCommunicationsQuery(leadId, {
    skip: !leadId || selected?.source !== 'event',
  })
  const { data: leadData, isFetching: leadLoading } = useGetLeadQuery(leadId, { skip: !leadId })

  const eventThread = useMemo(() => {
    if (selected?.source !== 'event') return []
    if (leadId && leadThreadData?.items?.length) return leadThreadData.items
    return selected.event ? [selected.event] : []
  }, [selected, leadId, leadThreadData?.items])

  const loadingList = (eventsFetching || waFetching || emailFetching) && mergedItems.length === 0

  useEffect(() => {
    if (
      !selectedHubId &&
      filteredItems.length > 0 &&
      window.matchMedia('(min-width: 1024px)').matches
    ) {
      setSearchParams({ c: filteredItems[0]!.hubId }, { replace: true })
    }
  }, [selectedHubId, filteredItems, setSearchParams])

  function select(hubId: string) {
    setSearchParams({ c: hubId })
  }

  async function onReprocess(row: CommunicationEvent) {
    try {
      const result = await reprocess(row.id).unwrap()
      toast.success(result.message || 'Communication reprocessed.')
      setSearchParams({ c: `ce:${result.event.id}` })
    } catch (error) {
      toast.error(getApiError(error, 'Unable to process the communication.'))
    }
  }

  return (
    <div className={`${adminPage} gap-3`}>
      <PageMeta
        title="Communication Hub"
        description="Centralized entry point for website, WhatsApp, email, and Meta lead communications."
      />
      <PageHeader
        title="Communication Hub"
        subtitle="All your student communications in one place."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Communication Hub' }]}
        showDivider={false}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <ChannelPill
              label="All"
              count={channelCounts.all}
              active={channelFilter === 'all'}
              onClick={() => setChannelFilter('all')}
            />
            <ChannelPill
              label="Messenger"
              count={channelCounts.messenger}
              active={channelFilter === 'messenger'}
              tone="messenger"
              onClick={() => setChannelFilter('messenger')}
              icon={<HugeiconsIcon icon={MessengerIcon} size={14} color="#1877F2" strokeWidth={1.6} />}
            />
            <ChannelPill
              label="WhatsApp"
              count={channelCounts.whatsapp}
              active={channelFilter === 'whatsapp'}
              tone="whatsapp"
              onClick={() => setChannelFilter('whatsapp')}
              icon={<HugeiconsIcon icon={WhatsappIcon} size={14} color="#25D366" strokeWidth={1.6} />}
            />
            <ChannelPill
              label="Email"
              count={channelCounts.email}
              active={channelFilter === 'email'}
              tone="email"
              onClick={() => setChannelFilter('email')}
              icon={<HugeiconsIcon icon={Mail01Icon} size={14} color="#F97316" strokeWidth={1.6} />}
            />
          </div>
        }
      />

      {eventsError || waError || emailError ? (
        <p className="m-0 text-danger">
          Could not load some conversations. Check API connection for Communications, WhatsApp, or Email.
        </p>
      ) : null}

      <div className="grid min-h-[560px] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:shadow-none lg:h-[calc(100vh-220px)] lg:grid-cols-[minmax(360px,420px)_minmax(0,1fr)] xl:grid-cols-[minmax(380px,420px)_minmax(0,1fr)_minmax(260px,300px)]">
        <div className={`min-h-0 ${selectedHubId ? 'hidden lg:flex' : 'flex'} flex-col`}>
          <ConversationListPanel
            items={filteredItems}
            selectedId={selectedHubId}
            loading={loadingList}
            search={search}
            listTab={listTab}
            counts={listCounts}
            onSearchChange={setSearch}
            onListTabChange={setListTab}
            onSelect={select}
          />
        </div>

        <div className={`min-h-0 ${selectedHubId ? 'flex' : 'hidden lg:flex'} flex-col bg-surface`}>
          {selectedHubId ? (
            <button
              type="button"
              className="cursor-pointer border-0 border-b border-border-subtle bg-transparent px-4 py-2 text-left text-[0.85rem] text-link lg:hidden"
              onClick={() => setSearchParams({})}
            >
              ← Back to inbox
            </button>
          ) : null}

          {selectedRef?.source === 'whatsapp' ? (
            <ConversationView
              key={selectedRef.sourceId}
              conversationId={selectedRef.sourceId}
              settings={waSettings}
              embedded
              className="min-h-0 flex-1"
            />
          ) : selectedRef?.source === 'email' ? (
            <ThreadView
              key={selectedRef.sourceId}
              threadId={selectedRef.sourceId}
              settings={emailSettings}
              embedded
              className="min-h-0 flex-1"
            />
          ) : (
            <ConversationThreadPanel
              selected={selected?.event || null}
              thread={eventThread}
              loading={Boolean(leadId) && threadLoading}
              canReprocess={canReprocess}
              reprocessing={reprocessing}
              onReprocess={onReprocess}
            />
          )}
        </div>

        <LeadDetailPanel
          selected={selected}
          lead={leadData?.lead}
          leadLoading={Boolean(leadId) && leadLoading}
        />
      </div>
    </div>
  )
}

function ChannelPill({
  label,
  count,
  active,
  onClick,
  icon,
  tone = 'default',
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
  icon?: ReactNode
  tone?: 'default' | 'messenger' | 'whatsapp' | 'email'
}) {
  const activeTone =
    tone === 'whatsapp'
      ? 'border-[#86efac] bg-[#ecfdf5] text-[#047857] dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300'
      : tone === 'email'
        ? 'border-[#fdba74] bg-[#fff7ed] text-[#c2410c] dark:border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-300'
        : 'border-[#93c5fd] bg-[#eff6ff] text-[#2563eb] dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-link'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8rem] font-medium transition-colors ${
        active
          ? activeTone
          : 'border-border bg-surface text-text-muted hover:bg-hover-bg'
      }`}
    >
      {icon}
      <span>{label}</span>
      <span
        className={`rounded-full px-1.5 text-[0.7rem] font-bold ${
          active ? 'bg-surface/80 text-inherit' : 'bg-hover-bg text-text-muted'
        }`}
      >
        {count}
      </span>
    </button>
  )
}
