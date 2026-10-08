import { Button, Checkbox, Input, Select, Switch, Tabs } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { toast } from 'react-toastify'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { getApiError } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import { useDebounce } from '@/hooks/useDebounce'
import type { AuthSession } from '@/types'
import { adminCard, adminPage } from '../../../styles/admin'
import {
  useArchiveNotificationMutation,
  useListNotificationConfigQuery,
  useListNotificationPreferencesQuery,
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useSaveNotificationPreferencesMutation,
  useUpdateNotificationConfigMutation,
  type AppNotification,
  type NotificationConfigItem,
  type NotificationPreferenceItem,
} from '../api/notificationsApi'

const TEAM_ROLES = new Set(['admin', 'ceo', 'manager'])

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function HistoryPanel({ auth }: { auth: AuthSession }) {
  const navigate = useNavigate()
  const canTeam = TEAM_ROLES.has(auth.role.key)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>()
  const [eventType, setEventType] = useState<string>()
  const [priority, setPriority] = useState<string>()
  const [scope, setScope] = useState('own')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { data, isFetching } = useListNotificationsQuery({
    limit: 50,
    search: debouncedSearch || undefined,
    status,
    eventType,
    priority,
    scope: scope === 'team' ? 'team' : undefined,
    from: from || undefined,
    to: to ? `${to}T23:59:59` : undefined,
  })
  const [markRead] = useMarkNotificationReadMutation()
  const [archive] = useArchiveNotificationMutation()
  const items = data?.items || []

  function openRecord(item: AppNotification) {
    if (item.status === 'Unread' && item.recipientName && scope === 'own') void markRead(item.id)
    else if (item.status === 'Unread' && scope === 'own') void markRead(item.id)
    const href = item.actions?.find((action) => action.href)?.href || item.link
    if (href) navigate(href)
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        <Input placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} allowClear />
        <Select
          allowClear
          placeholder="Status"
          value={status}
          onChange={setStatus}
          options={['Unread', 'Read', 'Archived'].map((value) => ({ value, label: value }))}
        />
        <Select
          allowClear
          placeholder="Priority"
          value={priority}
          onChange={setPriority}
          options={['Normal', 'Important', 'Critical'].map((value) => ({ value, label: value }))}
        />
        <Select
          allowClear
          placeholder="Type"
          value={eventType}
          onChange={setEventType}
          options={[...new Set(items.map((item) => item.eventType || item.type || '').filter(Boolean))].map((value) => ({
            value,
            label: value.replaceAll('_', ' '),
          }))}
        />
        {canTeam ? (
          <Select
            value={scope}
            onChange={setScope}
            options={[
              { value: 'own', label: 'My notifications' },
              { value: 'team', label: auth.role.key === 'manager' ? 'Team notifications' : 'All notifications' },
            ]}
          />
        ) : null}
        <div className="flex gap-2">
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-[0.84rem]">
          <thead>
            <tr className="border-b border-border text-text-faint">
              <th className="px-2 py-2 font-medium">Date</th>
              <th className="px-2 py-2 font-medium">Type</th>
              <th className="px-2 py-2 font-medium">Notification</th>
              <th className="px-2 py-2 font-medium">Priority</th>
              <th className="px-2 py-2 font-medium">Status</th>
              <th className="px-2 py-2 font-medium">Delivery</th>
              {scope === 'team' ? <th className="px-2 py-2 font-medium">Recipient</th> : null}
              <th className="px-2 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-2 py-8 text-center text-text-muted">
                  {isFetching ? 'Loading…' : 'No notifications match these filters.'}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className={`border-b border-border-subtle ${item.status === 'Unread' ? 'bg-[#f8fbff] dark:bg-blue-500/5' : ''}`}>
                  <td className="px-2 py-2 whitespace-nowrap">{formatWhen(item.createdAt)}</td>
                  <td className="px-2 py-2 capitalize">{(item.eventType || item.type || 'general').replaceAll('_', ' ')}</td>
                  <td className="px-2 py-2">
                    <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-left" onClick={() => openRecord(item)}>
                      <span className="block font-semibold text-text-strong">{item.title}</span>
                      {item.body ? <span className="block text-[0.78rem] text-text-muted">{item.body}</span> : null}
                    </button>
                  </td>
                  <td className="px-2 py-2">{item.priority || 'Normal'}</td>
                  <td className="px-2 py-2">{item.status}</td>
                  <td className="px-2 py-2">{item.deliveryStatus || 'Sent'}</td>
                  {scope === 'team' ? <td className="px-2 py-2">{item.recipientName || '—'}</td> : null}
                  <td className="px-2 py-2 text-right">
                    {item.status !== 'Archived' && scope === 'own' ? (
                      <button
                        type="button"
                        className="cursor-pointer border-0 bg-transparent p-0 text-[0.75rem] text-primary hover:underline"
                        onClick={() => void archive(item.id)}
                      >
                        Archive
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PreferencesPanel() {
  const { data, isFetching } = useListNotificationPreferencesQuery()
  const [save, { isLoading }] = useSaveNotificationPreferencesMutation()
  const [draft, setDraft] = useState<NotificationPreferenceItem[] | null>(null)
  const items = draft || data?.items || []

  function update(eventType: string, key: 'inApp' | 'email' | 'whatsapp' | 'browser', value: boolean) {
    const source = draft || data?.items || []
    setDraft(
      source.map((item) =>
        item.eventType === eventType ? { ...item, preference: { ...item.preference, [key]: value } } : item,
      ),
    )
    if (key === 'browser' && value && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      void Notification.requestPermission()
    }
  }

  async function onSave() {
    try {
      const saved = await save({
        items: items.map((item) => ({
          eventType: item.eventType,
          inApp: item.preference.inApp,
          email: item.preference.email,
          whatsapp: item.preference.whatsapp,
          browser: item.preference.browser,
        })),
      }).unwrap()
      setDraft(saved.items)
      toast.success('Notification preferences saved.')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to process the notification request. Please try again.'))
    }
  }

  return (
    <div className="grid gap-3">
      <p className="m-0 text-[0.84rem] text-text-muted">
        Mandatory notifications stay on. Channels that an administrator has turned off cannot be enabled here.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[0.84rem]">
          <thead>
            <tr className="border-b border-border text-text-faint">
              <th className="px-2 py-2 font-medium">Event</th>
              <th className="px-2 py-2 font-medium">In-app</th>
              <th className="px-2 py-2 font-medium">Email</th>
              <th className="px-2 py-2 font-medium">WhatsApp</th>
              <th className="px-2 py-2 font-medium">Browser</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.eventType} className="border-b border-border-subtle">
                <td className="px-2 py-2">
                  {item.label}
                  {item.mandatory ? <span className="ml-2 text-[0.72rem] text-text-faint">Mandatory</span> : null}
                </td>
                {(['inApp', 'email', 'whatsapp', 'browser'] as const).map((key) => (
                  <td key={key} className="px-2 py-2">
                    <Checkbox
                      checked={item.preference[key]}
                      disabled={item.mandatory || !item.channels[key] || isFetching}
                      onChange={(event) => update(item.eventType, key, event.target.checked)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <Button type="primary" loading={isLoading} onClick={() => void onSave()}>
          Save preferences
        </Button>
      </div>
    </div>
  )
}

function ConfigPanel() {
  const { data } = useListNotificationConfigQuery()
  const [update, { isLoading }] = useUpdateNotificationConfigMutation()
  const [editing, setEditing] = useState<string | null>(null)

  async function save(item: NotificationConfigItem, patch: Partial<NotificationConfigItem>) {
    setEditing(item.eventType)
    try {
      await update({ eventType: item.eventType, body: patch }).unwrap()
      toast.success('Notification configuration saved.')
    } catch (error) {
      toast.error(getApiError(error, 'Notification configuration is invalid.'))
    } finally {
      setEditing(null)
    }
  }

  const items = data?.items || []
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-left text-[0.82rem]">
        <thead>
          <tr className="border-b border-border text-text-faint">
            <th className="px-2 py-2 font-medium">Event</th>
            <th className="px-2 py-2 font-medium">Enabled</th>
            <th className="px-2 py-2 font-medium">In-app</th>
            <th className="px-2 py-2 font-medium">Email</th>
            <th className="px-2 py-2 font-medium">WhatsApp</th>
            <th className="px-2 py-2 font-medium">Browser</th>
            <th className="px-2 py-2 font-medium">Mandatory</th>
            <th className="px-2 py-2 font-medium">Recipient</th>
            <th className="px-2 py-2 font-medium">Priority</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.eventType} className="border-b border-border-subtle align-top">
              <td className="px-2 py-2">
                <div className="font-medium">{item.label}</div>
                {item.eventType === 'lead_reassigned' ? (
                  <label className="mt-1 flex items-center gap-2 text-[0.75rem] text-text-muted">
                    <Checkbox
                      checked={item.notifyPreviousOwner}
                      onChange={(event) => void save(item, { notifyPreviousOwner: event.target.checked })}
                    />
                    Also notify previous owner
                  </label>
                ) : null}
                {item.eventType === 'follow_up_overdue' ? (
                  <label className="mt-1 grid gap-1 text-[0.75rem] text-text-muted">
                    Overdue after (minutes)
                    <Input
                      type="number"
                      min={0}
                      defaultValue={item.overdueAfterMinutes}
                      className="max-w-[120px]"
                      onBlur={(event) => void save(item, { overdueAfterMinutes: Number(event.target.value) })}
                    />
                  </label>
                ) : null}
                {item.eventType === 'lead_status_updated' ? (
                  <label className="mt-1 grid gap-1 text-[0.75rem] text-text-muted">
                    Status codes (comma separated)
                    <Input
                      defaultValue={(item.statusAllowlist || []).join(', ')}
                      onBlur={(event) =>
                        void save(item, {
                          statusAllowlist: event.target.value
                            .split(',')
                            .map((part) => part.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </label>
                ) : null}
              </td>
              {(['enabled', 'inApp', 'email', 'whatsapp', 'browser', 'mandatory'] as const).map((key) => (
                <td key={key} className="px-2 py-2">
                  <Switch
                    size="small"
                    checked={Boolean(item[key])}
                    loading={isLoading && editing === item.eventType}
                    onChange={(checked) => void save(item, { [key]: checked } as Partial<NotificationConfigItem>)}
                  />
                </td>
              ))}
              <td className="px-2 py-2">
                <Select
                  size="small"
                  className="min-w-[140px]"
                  value={item.recipientRule}
                  onChange={(value) => void save(item, { recipientRule: value })}
                  options={[
                    { value: 'owner', label: 'Lead owner' },
                    { value: 'owner_manager', label: 'Owner + manager' },
                    { value: 'admin', label: 'Admin' },
                  ]}
                />
              </td>
              <td className="px-2 py-2">
                <Select
                  size="small"
                  value={item.priority}
                  onChange={(value) => void save(item, { priority: value })}
                  options={['Normal', 'Important', 'Critical'].map((value) => ({ value, label: value }))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function NotificationsPage() {
  const auth = useOutletContext<AuthSession>()
  const canConfigure = hasPermission(auth, 'notification:configure')
  const items = useMemo(
    () => [
      { key: 'history', label: 'History', children: <HistoryPanel auth={auth} /> },
      { key: 'preferences', label: 'Preferences', children: <PreferencesPanel /> },
      ...(canConfigure ? [{ key: 'config', label: 'Configuration', children: <ConfigPanel /> }] : []),
    ],
    [auth, canConfigure],
  )

  return (
    <div className={adminPage}>
      <PageMeta title="Notifications & Reminders" description="Notification history, preferences, and reminder settings." />
      <PageHeader
        title="Notifications & Reminders"
        subtitle="Review alerts, manage your channels, and open the related CRM record."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Notifications' }]}
      />
      <div className={adminCard}>
        <Tabs items={items} />
      </div>
    </div>
  )
}
