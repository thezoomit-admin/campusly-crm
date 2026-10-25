import { Input, Select, Spin, Switch } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { PrimaryButton } from '@/components/ui'
import { getApiError } from '@/lib/api'
import { hasPermission } from '@/lib/access'
import type { AuthSession } from '@/types'
import { adminCard, adminPage } from '../../../styles/admin'
import {
  useListNotificationConfigQuery,
  useListNotificationPreferencesQuery,
  useSaveNotificationPreferencesMutation,
  useUpdateNotificationConfigMutation,
  type NotificationConfigItem,
  type NotificationPreferenceItem,
} from '../api/notificationsApi'

type SettingsTab = 'preferences' | 'config'
type ChannelKey = 'inApp' | 'email' | 'whatsapp' | 'browser'

const CHANNELS: Array<{ key: ChannelKey; label: string }> = [
  { key: 'inApp', label: 'In app' },
  { key: 'email', label: 'Email' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'browser', label: 'Browser' },
]

const PRIORITY_OPTIONS = [
  { value: 'Normal', label: 'Normal' },
  { value: 'Important', label: 'Important' },
  { value: 'Critical', label: 'Critical' },
]

const RECIPIENT_OPTIONS = [
  { value: 'owner', label: 'Lead owner' },
  { value: 'owner_manager', label: 'Owner and manager' },
  { value: 'admin', label: 'Admins' },
]

export default function NotificationSettingsPage() {
  const auth = useOutletContext<AuthSession>()
  const canConfigure = hasPermission(auth, 'notification:configure')
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('tab')
  const tab: SettingsTab = requested === 'config' && canConfigure ? 'config' : 'preferences'

  const tabs = useMemo(
    () => [
      { key: 'preferences' as const, label: 'Preferences', icon: <SlidersIcon /> },
      ...(canConfigure ? [{ key: 'config' as const, label: 'Configuration', icon: <GearIcon /> }] : []),
    ],
    [canConfigure],
  )

  function setTab(next: SettingsTab) {
    const params = new URLSearchParams(searchParams)
    if (next === 'preferences') params.delete('tab')
    else params.set('tab', next)
    setSearchParams(params, { replace: true })
  }

  return (
    <div className={adminPage}>
      <PageMeta title="Notification Settings" description="Choose how you receive alerts and which events the CRM sends." />
      <PageHeader
        showDivider={false}
        title="Notification Settings"
        subtitle="Choose how you receive alerts, and configure which events the CRM sends."
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'Notifications', path: '/notifications' },
          { title: 'Settings' },
        ]}
      />

      <div className="flex gap-1 overflow-x-auto border-b border-border-subtle">
        {tabs.map((item) => {
          const active = tab === item.key
          return (
            <button
              key={item.key}
              type="button"
              className={`inline-flex cursor-pointer items-center gap-2 border-0 border-b-2 bg-transparent px-3 py-2.5 text-[0.88rem] whitespace-nowrap ${
                active ? 'border-primary font-semibold text-primary' : 'border-transparent font-medium text-text-muted hover:text-text-strong'
              }`}
              onClick={() => setTab(item.key)}
            >
              {item.icon}
              {item.label}
            </button>
          )
        })}
      </div>

      <div className={adminCard}>{tab === 'config' ? <ConfigPanel /> : <PreferencesPanel />}</div>
    </div>
  )
}

function PreferencesPanel() {
  const { data, isFetching, isError, error } = useListNotificationPreferencesQuery()
  const [save, { isLoading: saving }] = useSaveNotificationPreferencesMutation()
  const [draft, setDraft] = useState<Record<string, NotificationPreferenceItem['preference']>>({})

  useEffect(() => {
    if (!data?.items) return
    setDraft(Object.fromEntries(data.items.map((item) => [item.eventType, { ...item.preference }])))
  }, [data])

  function setChannel(item: NotificationPreferenceItem, key: ChannelKey, value: boolean) {
    if (key === 'browser' && value && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      void Notification.requestPermission()
    }
    setDraft((current) => ({
      ...current,
      [item.eventType]: { ...(current[item.eventType] || item.preference), [key]: value },
    }))
  }

  async function onSave() {
    try {
      await save({
        items: (data?.items || []).map((item) => ({
          eventType: item.eventType,
          ...(draft[item.eventType] || item.preference),
        })),
      }).unwrap()
      toast.success('Preferences saved.')
    } catch (err) {
      toast.error(getApiError(err, 'Unable to save preferences.'))
    }
  }

  if (isError) {
    return <p className="m-0 text-[0.84rem] text-text-muted">{getApiError(error, 'Unable to load preferences.')}</p>
  }

  return (
    <Spin spinning={isFetching}>
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-[0.84rem] text-text-muted">Turn channels on or off for each event. Required alerts stay on.</p>
          <PrimaryButton label="Save preferences" loading={saving} disabled={!data?.items.length} onClick={() => void onSave()} />
        </div>
        <div className="min-h-40 overflow-x-auto">
          {(data?.items || []).map((item) => {
            const values = draft[item.eventType] || item.preference
            return (
              <div key={item.eventType} className="grid gap-3 border-b border-border-subtle py-3 last:border-b-0 md:grid-cols-[minmax(180px,1fr)_auto] md:items-center">
                <div>
                  <p className="m-0 font-semibold text-text-strong">{item.label}</p>
                  <p className="m-0 text-[0.75rem] text-text-faint">
                    {item.mandatory ? 'Required' : item.enabled ? item.priority : 'Turned off by an admin'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  {CHANNELS.map((channel) => {
                    const locked = item.mandatory || !item.enabled || !item.channels[channel.key]
                    return (
                      <label key={channel.key} className="inline-flex items-center gap-2 text-[0.78rem] text-text-muted">
                        <Switch
                          size="small"
                          checked={locked && channel.key === 'inApp' && item.mandatory ? true : values[channel.key]}
                          disabled={locked}
                          onChange={(checked) => setChannel(item, channel.key, checked)}
                        />
                        {channel.label}
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Spin>
  )
}

function ConfigPanel() {
  const { data, isFetching, isError, error } = useListNotificationConfigQuery()
  const [update] = useUpdateNotificationConfigMutation()
  const [drafts, setDrafts] = useState<Record<string, NotificationConfigItem>>({})
  const [allowlistText, setAllowlistText] = useState<Record<string, string>>({})
  const [savingType, setSavingType] = useState<string | null>(null)

  useEffect(() => {
    if (!data?.items) return
    setDrafts(Object.fromEntries(data.items.map((item) => [item.eventType, item])))
    setAllowlistText(Object.fromEntries(data.items.map((item) => [item.eventType, (item.statusAllowlist || []).join(', ')])))
  }, [data])

  function patch(eventType: string, next: Partial<NotificationConfigItem>) {
    setDrafts((current) => ({ ...current, [eventType]: { ...current[eventType], ...next } }))
  }

  async function onSave(eventType: string) {
    const item = drafts[eventType]
    if (!item) return
    const statusAllowlist = allowlistText[eventType]
      ?.split(',')
      .map((part) => part.trim())
      .filter(Boolean)
    setSavingType(eventType)
    try {
      await update({
        eventType,
        body: {
          enabled: item.enabled,
          mandatory: item.mandatory,
          inApp: item.mandatory ? true : item.inApp,
          email: item.email,
          whatsapp: item.whatsapp,
          browser: item.browser,
          priority: item.priority,
          recipientRule: item.recipientRule,
          notifyPreviousOwner: item.notifyPreviousOwner,
          overdueAfterMinutes: item.overdueAfterMinutes,
          statusAllowlist: statusAllowlist ?? item.statusAllowlist,
        },
      }).unwrap()
      toast.success('Configuration saved.')
    } catch (err) {
      toast.error(getApiError(err, 'Unable to save configuration.'))
    } finally {
      setSavingType(null)
    }
  }

  if (isError) {
    return <p className="m-0 text-[0.84rem] text-text-muted">{getApiError(error, 'Unable to load configuration.')}</p>
  }

  return (
    <Spin spinning={isFetching && !data}>
      <div className="grid gap-4">
        {(data?.items || []).map((source) => {
          const item = drafts[source.eventType] || source
          return (
            <section key={item.eventType} className="grid gap-3 rounded-xl border border-border-subtle p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="m-0 text-[0.95rem] font-semibold text-text-strong">{item.label}</h3>
                  {item.description ? <p className="m-0 mt-1 text-[0.78rem] text-text-muted">{item.description}</p> : null}
                </div>
                <PrimaryButton label="Save" loading={savingType === item.eventType} onClick={() => void onSave(item.eventType)} />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-[0.78rem] text-text-muted">
                  <Switch size="small" checked={item.enabled} onChange={(checked) => patch(item.eventType, { enabled: checked })} />
                  Enabled
                </label>
                <label className="inline-flex items-center gap-2 text-[0.78rem] text-text-muted">
                  <Switch
                    size="small"
                    checked={item.mandatory}
                    onChange={(checked) => patch(item.eventType, { mandatory: checked, inApp: checked ? true : item.inApp })}
                  />
                  Required
                </label>
                {CHANNELS.map((channel) => (
                  <label key={channel.key} className="inline-flex items-center gap-2 text-[0.78rem] text-text-muted">
                    <Switch
                      size="small"
                      checked={channel.key === 'inApp' && item.mandatory ? true : item[channel.key]}
                      disabled={channel.key === 'inApp' && item.mandatory}
                      onChange={(checked) => patch(item.eventType, { [channel.key]: checked })}
                    />
                    {channel.label}
                  </label>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-[0.78rem] font-medium text-text-muted">
                  Priority
                  <Select value={item.priority} options={PRIORITY_OPTIONS} onChange={(value) => patch(item.eventType, { priority: value })} />
                </label>
                <label className="grid gap-1 text-[0.78rem] font-medium text-text-muted">
                  Recipients
                  <Select value={item.recipientRule} options={RECIPIENT_OPTIONS} onChange={(value) => patch(item.eventType, { recipientRule: value })} />
                </label>
              </div>
              {item.eventType === 'lead_reassigned' ? (
                <label className="inline-flex items-center gap-2 text-[0.78rem] text-text-muted">
                  <Switch
                    size="small"
                    checked={item.notifyPreviousOwner}
                    onChange={(checked) => patch(item.eventType, { notifyPreviousOwner: checked })}
                  />
                  Also notify the previous owner
                </label>
              ) : null}
              {item.eventType === 'follow_up_overdue' ? (
                <label className="grid max-w-xs gap-1 text-[0.78rem] font-medium text-text-muted">
                  Overdue after (minutes)
                  <Input
                    inputMode="numeric"
                    value={String(item.overdueAfterMinutes ?? 0)}
                    onChange={(event) => patch(item.eventType, { overdueAfterMinutes: Number(event.target.value.replace(/[^\d]/g, '') || 0) })}
                  />
                </label>
              ) : null}
              {item.eventType === 'lead_status_updated' ? (
                <label className="grid gap-1 text-[0.78rem] font-medium text-text-muted">
                  Status allowlist
                  <Input
                    value={allowlistText[item.eventType] ?? ''}
                    placeholder="CONVERTED, LOST"
                    onChange={(event) => setAllowlistText((current) => ({ ...current, [item.eventType]: event.target.value }))}
                  />
                </label>
              ) : null}
            </section>
          )
        })}
      </div>
    </Spin>
  )
}

function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 7h16M4 17h16" />
      <circle cx="8" cy="7" r="2" fill="currentColor" />
      <circle cx="16" cy="17" r="2" fill="currentColor" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </svg>
  )
}
