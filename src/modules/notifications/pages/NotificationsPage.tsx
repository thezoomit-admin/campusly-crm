import { useEffect, useMemo } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { PrimaryButton } from '@/components/ui'
import { getApiError } from '@/lib/api'
import type { AuthSession } from '@/types'
import { adminPage } from '../../../styles/admin'
import NotificationInbox from '../components/NotificationInbox'
import {
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
} from '../api/notificationsApi'

type TabKey = 'notifications' | 'reminders'

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
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

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M5 12.5 9.2 17 19 7" />
    </svg>
  )
}

function TabBadge({ count, tone }: { count: number; tone: 'red' | 'orange' }) {
  if (!count) return null
  return (
    <span
      className={`grid min-w-5 place-items-center rounded-full px-1.5 text-[0.68rem] font-bold leading-5 text-white ${
        tone === 'orange' ? 'bg-[#fa8c16]' : 'bg-[#ff4d4f]'
      }`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default function NotificationsPage() {
  const auth = useOutletContext<AuthSession>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const activeTab: TabKey = requestedTab === 'reminders' ? 'reminders' : 'notifications'

  useEffect(() => {
    if (requestedTab === 'preferences') navigate('/notifications/settings', { replace: true })
    if (requestedTab === 'config') navigate('/notifications/settings?tab=config', { replace: true })
  }, [navigate, requestedTab])

  const { data: summary } = useListNotificationsQuery({ limit: 1 })
  const [markAll, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation()
  const unread = summary?.unreadCount || 0

  const tabs = useMemo(
    () => [
      { key: 'notifications' as const, label: 'Notifications', icon: <BellIcon />, count: summary?.unreadSystem || 0, tone: 'red' as const },
      { key: 'reminders' as const, label: 'Reminders', icon: <CalendarIcon />, count: summary?.unreadReminder || 0, tone: 'orange' as const },
    ],
    [summary?.unreadReminder, summary?.unreadSystem],
  )

  function setTab(next: TabKey) {
    const params = new URLSearchParams(searchParams)
    if (next === 'notifications') params.delete('tab')
    else params.set('tab', next)
    setSearchParams(params, { replace: true })
  }

  async function onMarkAll() {
    try {
      await markAll().unwrap()
      toast.success('All notifications marked as read.')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to mark notifications as read.'))
    }
  }

  return (
    <div className={adminPage}>
      <PageMeta title="Notifications & Reminders" description="Review alerts, reminders, preferences, and notification configuration." />
      <PageHeader
        showDivider={false}
        title="Notifications & Reminders"
        subtitle="Review alerts, manage your channels, and open the related CRM record."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Notifications' }]}
        extra={
          <>
            <PrimaryButton
              label="Mark all as read"
              icon={<CheckIcon />}
              loading={markingAll}
              disabled={!unread}
              onClick={() => void onMarkAll()}
            />
            <PrimaryButton variant="outline" label="Notification Settings" icon={<GearIcon />} onClick={() => navigate('/notifications/settings')} />
          </>
        }
      />

      <div className="flex gap-1 overflow-x-auto border-b border-border-subtle">
        {tabs.map((item) => {
          const active = activeTab === item.key
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
              {'count' in item ? <TabBadge count={item.count || 0} tone={item.tone || 'red'} /> : null}
            </button>
          )
        })}
      </div>

      <NotificationInbox auth={auth} mode={activeTab} />
    </div>
  )
}
