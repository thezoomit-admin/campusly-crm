import { Checkbox, Dropdown, Input, Select, Spin } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getApiError } from '@/lib/api'
import { useDebounce } from '@/hooks/useDebounce'
import type { AuthSession } from '@/types'
import {
  useArchiveNotificationMutation,
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  type AppNotification,
} from '../api/notificationsApi'
import {
  CHANNEL_META,
  ChannelIcon,
  Pill,
  TYPE_META,
  TypeIcon,
  categoryOf,
  channelOf,
  formatWhen,
  recordHref,
  recordLabel,
  priorityClass,
  statusClass,
  type NotificationCategory,
  type NotificationChannelKey,
} from './notificationMeta'

const TEAM_ROLES = new Set(['admin', 'ceo', 'manager'])

type InboxMode = 'notifications' | 'reminders'


export default function NotificationInbox({ auth, mode }: { auth: AuthSession; mode: InboxMode }) {
  const navigate = useNavigate()
  const canTeam = TEAM_ROLES.has(auth.role.key)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>()
  const [priority, setPriority] = useState<string>()
  const [category, setCategory] = useState<NotificationCategory>('all')
  const [channel, setChannel] = useState<NotificationChannelKey>('all')
  const [scope, setScope] = useState('own')
  const [checked, setChecked] = useState<string[]>([])
  const debouncedSearch = useDebounce(search, 300)
  const canMutate = scope === 'own'

  const { data, isFetching, isError, error } = useListNotificationsQuery({
    limit: 100,
    search: debouncedSearch || undefined,
    status,
    priority,
    category: category === 'all' ? undefined : category,
    channel: channel === 'all' ? undefined : channel,
    scope: scope === 'team' ? 'team' : undefined,
    kind: mode === 'reminders' ? 'reminder' : mode === 'notifications' ? 'system' : undefined,
  })
  const [markRead] = useMarkNotificationReadMutation()
  const [archive] = useArchiveNotificationMutation()

  const items = useMemo(() => data?.items || [], [data?.items])

  useEffect(() => {
    setChecked((current) => current.filter((id) => items.some((item) => item.id === id)))
  }, [items])

  const allChecked = items.length > 0 && items.every((item) => checked.includes(item.id))
  const searchPlaceholder = mode === 'reminders' ? 'Search reminders...' : 'Search notifications...'

  async function markOne(item: AppNotification) {
    if (!canMutate || item.status !== 'Unread') return
    try {
      await markRead(item.id).unwrap()
    } catch (err) {
      toast.error(getApiError(err, 'Unable to mark this notification as read.'))
    }
  }

  async function markMany(ids: string[]) {
    const targets = items.filter((item) => ids.includes(item.id) && item.status === 'Unread')
    if (!canMutate || !targets.length) return
    try {
      await Promise.all(targets.map((item) => markRead(item.id).unwrap()))
      setChecked([])
      toast.success(targets.length === 1 ? 'Notification marked as read.' : `${targets.length} notifications marked as read.`)
    } catch (err) {
      toast.error(getApiError(err, 'Unable to update the selected notifications.'))
    }
  }

  async function archiveOne(item: AppNotification) {
    if (!canMutate || item.status === 'Archived') return
    try {
      await archive(item.id).unwrap()
      toast.success('Notification archived.')
    } catch (err) {
      toast.error(getApiError(err, 'Unable to archive this notification.'))
    }
  }

  async function archiveMany(ids: string[]) {
    const targets = items.filter((item) => ids.includes(item.id) && item.status !== 'Archived')
    if (!canMutate || !targets.length) return
    try {
      await Promise.all(targets.map((item) => archive(item.id).unwrap()))
      setChecked([])
      toast.success(targets.length === 1 ? 'Notification archived.' : `${targets.length} notifications archived.`)
    } catch (err) {
      toast.error(getApiError(err, 'Unable to archive the selected notifications.'))
    }
  }

  function openRecord(item: AppNotification) {
    if (item.status === 'Unread' && canMutate) void markRead(item.id)
    const href = recordHref(item)
    if (href) navigate(href)
  }

  function openLead(item: AppNotification) {
    const leadId = item.lead?.id || item.leadId
    if (!leadId) return
    if (item.status === 'Unread' && canMutate) void markRead(item.id)
    navigate(`/leads/${leadId}`)
  }

  function toggleAll(next: boolean) {
    setChecked(next ? items.map((item) => item.id) : [])
  }

  function toggleOne(id: string, next: boolean) {
    setChecked((current) => (next ? [...current, id] : current.filter((value) => value !== id)))
  }

  const emptyLabel = isError
    ? getApiError(error, 'Unable to load notifications.')
    : mode === 'reminders'
      ? 'No reminders match these filters.'
      : 'No notifications match these filters.'

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border-subtle px-3 py-3">
        <Input
          allowClear
          value={search}
          placeholder={searchPlaceholder}
          prefix={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-faint" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          }
          className="!w-[220px] shrink-0"
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          className="!w-[140px] shrink-0"
          value={category}
          onChange={(value) => setCategory(value)}
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'lead', label: 'Lead' },
            { value: 'follow_up', label: 'Follow-up' },
            { value: 'payment', label: 'Payment' },
            { value: 'offer', label: 'Offer' },
            { value: 'file', label: 'File' },
            { value: 'email', label: 'Email' },
            { value: 'security', label: 'Security' },
            { value: 'system', label: 'System' },
          ]}
        />
        <Select
          className="!w-[132px] shrink-0"
          value={status || 'all'}
          onChange={(value) => setStatus(value === 'all' ? undefined : value)}
          options={['all', 'Unread', 'Read', 'Archived'].map((value) => ({
            value,
            label: value === 'all' ? 'All Status' : value,
          }))}
        />
        <Select
          className="!w-[140px] shrink-0"
          value={priority || 'all'}
          onChange={(value) => setPriority(value === 'all' ? undefined : value)}
          options={['all', 'Normal', 'Important', 'Critical'].map((value) => ({
            value,
            label: value === 'all' ? 'All Priority' : value,
          }))}
        />
        <Select
          className="!w-[148px] shrink-0"
          value={channel}
          onChange={(value) => setChannel(value)}
          options={[
            { value: 'all', label: 'All Channels' },
            { value: 'system', label: 'System' },
            { value: 'email', label: 'Email' },
            { value: 'whatsapp', label: 'WhatsApp' },
            { value: 'browser', label: 'Browser' },
          ]}
        />
        {canTeam ? (
          <Select
            className="!w-[170px] shrink-0"
            value={scope}
            onChange={setScope}
            options={[
              { value: 'own', label: 'My notifications' },
              { value: 'team', label: auth.role.key === 'manager' ? 'Team notifications' : 'All notifications' },
            ]}
          />
        ) : null}
      </div>

      {checked.length > 0 && canMutate ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-surface))] px-3 py-2 text-[0.8rem]">
          <span className="font-medium text-text-strong">{checked.length} selected</span>
          <button type="button" className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-primary" onClick={() => void markMany(checked)}>
            Mark as read
          </button>
          <button type="button" className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-text-muted" onClick={() => void archiveMany(checked)}>
            Archive
          </button>
        </div>
      ) : null}

      <Spin spinning={isFetching}>
      <div className={`min-w-0 overflow-x-auto ${isFetching && items.length === 0 ? 'min-h-60' : ''}`}>
          <table className="w-full table-fixed border-collapse text-left text-[0.82rem]">
              <colgroup>
                <col className="w-10" />
                <col className="w-[108px]" />
                <col className="w-[112px]" />
                <col />
                <col className="w-[92px]" />
                <col className="w-[88px]" />
                <col className="w-[108px]" />
                <col className="w-[108px]" />
              </colgroup>
              <thead>
                <tr className="bg-[#f7fafc] text-[0.75rem] text-text-faint dark:bg-[color-mix(in_srgb,var(--color-text)_6%,transparent)]">
                  <th className="w-10 px-3 py-2.5 font-medium">
                    <Checkbox checked={allChecked} onChange={(event) => toggleAll(event.target.checked)} aria-label="Select all" />
                  </th>
                  <th className="px-2 py-2.5 font-medium">Date & Time</th>
                  <th className="px-2 py-2.5 font-medium">Type</th>
                  <th className="px-2 py-2.5 font-medium">Message</th>
                  <th className="px-2 py-2.5 font-medium">Priority</th>
                  <th className="px-2 py-2.5 font-medium">Status</th>
                  <th className="px-2 py-2.5 font-medium">Channel</th>
                  <th className="px-3 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-14 text-center text-text-muted">
                      {isFetching ? null : emptyLabel}
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const categoryKey = categoryOf(item)
                    const type = TYPE_META[categoryKey]
                    const channelKey = channelOf(item)
                    const channelMeta = CHANNEL_META[channelKey]
                    const unread = item.status === 'Unread'
                    return (
                      <tr
                        key={item.id}
                        className={`cursor-pointer border-t border-border-subtle hover:bg-hover-bg ${
                          unread
                            ? 'bg-[color-mix(in_srgb,var(--color-primary)_8%,white)] dark:bg-primary/10'
                            : ''
                        }`}
                        onClick={() => openLead(item)}
                      >
                        <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            checked={checked.includes(item.id)}
                            onChange={(event) => toggleOne(item.id, event.target.checked)}
                            aria-label={`Select ${item.title}`}
                          />
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap text-text-muted">{formatWhen(item.createdAt)}</td>
                        <td className="px-2 py-3">
                          <Pill className={type.className}>
                            <TypeIcon category={categoryKey} />
                            {type.label}
                          </Pill>
                        </td>
                        <td className="px-2 py-3">
                          <span className="flex items-center gap-2">
                            {unread ? (
                              <i className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                            ) : null}
                            <span className={`block ${unread ? 'font-bold text-text-strong' : 'font-medium text-text-muted'}`}>
                              {item.title}
                            </span>
                          </span>
                          {item.body ? <span className={`mt-0.5 line-clamp-2 block text-[0.75rem] ${unread ? 'text-text-muted' : 'text-text-faint'}`}>{item.body}</span> : null}
                          {scope === 'team' && item.recipientName ? (
                            <span className="mt-0.5 block text-[0.72rem] text-text-faint">To {item.recipientName}</span>
                          ) : null}
                        </td>
                        <td className="px-2 py-3">
                          <Pill className={priorityClass(item.priority)}>{item.priority || 'Normal'}</Pill>
                        </td>
                        <td className="px-2 py-3">
                          <Pill className={statusClass(item.status)}>{item.status}</Pill>
                        </td>
                        <td className="px-2 py-3">
                          <Pill className={channelMeta.className}>
                            <ChannelIcon channel={channelKey} />
                            {channelMeta.label}
                          </Pill>
                        </td>
                        <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className="cursor-pointer rounded-lg border border-border bg-surface px-2.5 py-1 text-[0.75rem] font-semibold text-text-strong hover:bg-hover-bg"
                              onClick={() => openLead(item)}
                            >
                              View
                            </button>
                            <RowMenu
                              item={item}
                              canMutate={canMutate}
                              onOpen={() => openRecord(item)}
                              onRead={() => void markOne(item)}
                              onArchive={() => void archiveOne(item)}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
      </div>
      </Spin>
    </div>
  )
}

function RowMenu({
  item,
  canMutate,
  onOpen,
  onRead,
  onArchive,
}: {
  item: AppNotification
  canMutate: boolean
  onOpen: () => void
  onRead: () => void
  onArchive: () => void
}) {
  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: [
          { key: 'read', label: 'Mark as read', disabled: !canMutate || item.status !== 'Unread' },
          { key: 'archive', label: 'Archive', disabled: !canMutate || item.status === 'Archived' },
          { key: 'open', label: recordLabel(item), disabled: !recordHref(item) },
        ],
        onClick: ({ key }) => {
          if (key === 'read') onRead()
          if (key === 'archive') onArchive()
          if (key === 'open') onOpen()
        },
      }}
    >
      <button
        type="button"
        aria-label="More actions"
        className="grid size-7 cursor-pointer place-items-center rounded-lg border border-border bg-surface text-text-muted hover:bg-hover-bg"
      >
        ···
      </button>
    </Dropdown>
  )
}

