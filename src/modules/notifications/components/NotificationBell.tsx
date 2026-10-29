import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hasPermission } from '@/lib/access'
import type { AuthSession } from '@/types'
import {
  useArchiveNotificationMutation,
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  type AppNotification,
  type NotificationAction,
} from '../api/notificationsApi'
import { leadDetailsHref } from './notificationMeta'

const ICON_BTN =
  'relative grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-[color-mix(in_srgb,var(--color-primary)_16%,white)] text-primary-active transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--color-primary)_24%,white)] dark:bg-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] dark:text-nav-active dark:hover:bg-[color-mix(in_srgb,var(--color-primary)_32%,transparent)]'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function payloadLines(payload: AppNotification['payload']) {
  if (!payload) return []
  const labels: Record<string, string> = {
    leadName: 'Lead',
    leadCode: 'Lead ID',
    country: 'Country',
    assignedBy: 'Assigned By',
    assignedAt: 'Assigned At',
    followUpType: 'Follow-up Type',
    amount: 'Amount',
    paymentType: 'Payment Type',
    receiptNumber: 'Receipt',
    fileCode: 'File ID',
    ownerName: 'Owner',
    offerName: 'Offer',
    previousStatus: 'Previous',
    newStatus: 'New',
    previousPriority: 'Previous',
    priority: 'Priority',
    score: 'Score',
    status: 'Status',
  }
  return Object.entries(labels)
    .filter(([key]) => payload[key] !== undefined && payload[key] !== null && payload[key] !== '')
    .map(([key, label]) => ({ label, value: String(payload[key]) }))
}

export default function NotificationBell({
  auth,
  className = ICON_BTN,
}: {
  auth: AuthSession | null | undefined
  className?: string
}) {
  const canView = hasPermission(auth, 'notification:view')
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<AppNotification | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Initial fetch + live socket patches; reopen also refetches so grant/withdraw never stick empty.
  const { data, refetch } = useListNotificationsQuery(
    { limit: 15 },
    {
      skip: !canView,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  )
  const [markRead] = useMarkNotificationReadMutation()
  const [archive] = useArchiveNotificationMutation()
  const [markAllRead] = useMarkAllNotificationsReadMutation()

  const items = data?.items || []
  const unreadCount = data?.unreadCount || 0

  useEffect(() => {
    if (open && canView) {
      void refetch()
    }
  }, [open, canView, refetch])

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setSelected(null)
      }
    }
    if (open) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  if (!canView) return null

  function openItem(item: AppNotification) {
    if (item.status === 'Unread') void markRead(item.id)
    const href = leadDetailsHref(item)
    if (!href) {
      setSelected(item)
      return
    }
    setOpen(false)
    setSelected(null)
    navigate(href)
  }

  function runAction(action: NotificationAction) {
    setOpen(false)
    setSelected(null)
    if (action.href) navigate(action.href)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className={className}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount})` : 'Notifications'}
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value)
          setSelected(null)
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -top-1 right-0 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 font-sans text-[0.58rem] font-normal not-italic leading-4 text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute top-[calc(100%+8px)] right-0 z-70 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_40px_rgba(22,50,79,0.14)]">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-2.5">
            <strong className="text-[0.92rem]">
              Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </strong>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && !selected ? (
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent p-0 text-[0.75rem] font-medium text-primary hover:underline"
                  onClick={() => void markAllRead()}
                >
                  Mark all read
                </button>
              ) : null}
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent p-0 text-[0.75rem] font-medium text-primary hover:underline"
                onClick={() => {
                  setOpen(false)
                  navigate('/notifications')
                }}
              >
                History
              </button>
            </div>
          </div>

          {selected ? (
            <div className="grid gap-2 px-3.5 py-3">
              <button
                type="button"
                className="w-fit cursor-pointer border-0 bg-transparent p-0 text-[0.75rem] text-primary hover:underline"
                onClick={() => setSelected(null)}
              >
                Back
              </button>
              <strong className="text-[0.95rem] text-text-strong">{selected.title}</strong>
              {selected.body ? <p className="m-0 text-[0.82rem] leading-snug text-text-muted">{selected.body}</p> : null}
              <dl className="m-0 grid gap-1">
                {payloadLines(selected.payload).map((line) => (
                  <div key={line.label} className="grid grid-cols-[110px_1fr] gap-2 text-[0.78rem]">
                    <dt className="text-text-faint">{line.label}</dt>
                    <dd className="m-0 text-text-strong">{line.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-1 flex flex-wrap gap-2">
                {(selected.actions || []).map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    className="cursor-pointer rounded-lg border border-primary bg-primary px-2.5 py-1 text-[0.75rem] font-medium text-white"
                    onClick={() => runAction(action)}
                  >
                    {action.label}
                  </button>
                ))}
                {selected.status !== 'Archived' ? (
                  <button
                    type="button"
                    className="cursor-pointer rounded-lg border border-border bg-transparent px-2.5 py-1 text-[0.75rem]"
                    onClick={() => {
                      void archive(selected.id)
                      setSelected(null)
                    }}
                  >
                    Archive
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <ul className="m-0 max-h-[360px] list-none overflow-y-auto p-0">
              {items.length === 0 ? (
                <li className="px-3.5 py-8 text-center text-[0.84rem] text-text-muted">No notifications yet.</li>
              ) : (
                items.map((item) => {
                  const unread = item.status === 'Unread'
                  return (
                    <li key={item.id} className="border-b border-border-subtle last:border-b-0">
                      <button
                        type="button"
                        className={`grid w-full cursor-pointer grid-cols-[10px_minmax(0,1fr)] gap-x-2.5 gap-y-0.5 border-0 px-3.5 py-2.5 text-left transition-colors ${
                          unread
                            ? 'bg-[color-mix(in_srgb,var(--color-primary)_10%,white)] hover:bg-[color-mix(in_srgb,var(--color-primary)_16%,white)] dark:bg-primary/15 dark:hover:bg-primary/22'
                            : 'bg-transparent opacity-75 hover:bg-hover-bg hover:opacity-100'
                        }`}
                        onClick={() => openItem(item)}
                      >
                        <span className="col-start-1 row-span-3 mt-1.5 flex justify-center self-start">
                          {unread ? (
                            <i
                              className="size-2.5 shrink-0 rounded-full bg-primary shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_25%,transparent)]"
                              aria-hidden
                            />
                          ) : (
                            <i className="size-2.5 shrink-0 rounded-full bg-border" aria-hidden />
                          )}
                        </span>
                        <span className="col-start-2 flex min-w-0 items-center gap-2">
                          <span
                            className={`min-w-0 truncate text-[0.86rem] ${
                              unread
                                ? 'font-bold text-text-strong'
                                : 'font-medium text-text-muted'
                            }`}
                          >
                            {item.title}
                          </span>
                          {unread ? (
                            <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-white">
                              New
                            </span>
                          ) : (
                            <span className="shrink-0 text-[0.62rem] font-medium uppercase tracking-wide text-text-faint">
                              Read
                            </span>
                          )}
                        </span>
                        {item.body ? (
                          <span
                            className={`col-start-2 line-clamp-2 text-[0.78rem] leading-snug ${
                              unread ? 'text-text' : 'text-text-faint'
                            }`}
                          >
                            {item.body}
                          </span>
                        ) : null}
                        <span className="col-start-2 mt-0.5 text-[0.7rem] text-text-faint">
                          {timeAgo(item.createdAt)}
                        </span>
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
