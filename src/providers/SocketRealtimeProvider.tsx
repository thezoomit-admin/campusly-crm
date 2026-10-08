import { useEffect, type ReactNode } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '@/hooks/useAuth'
import {
  connectSocket,
  disconnectSocket,
  SOCKET_EVENTS,
  type EmailInboundEvent,
  type NotificationCreatedEvent,
} from '@/lib/socket'
import { useAppDispatch } from '@/redux'
import { emailApi } from '@/modules/email/api/emailApi'
import {
  notificationsApi,
  type AppNotification,
  type NotificationListResponse,
} from '@/modules/notifications/api/notificationsApi'

const LIST_ARGS = { limit: 15 } as const

function upsertNotificationCache(
  current: NotificationListResponse | undefined,
  event: NotificationCreatedEvent,
): NotificationListResponse {
  const incoming: AppNotification = {
    ...event.notification,
    id: event.notification.id,
    title: event.notification.title,
    body: event.notification.body,
    link: event.notification.link,
    type: event.notification.type,
    status: event.notification.status,
    leadId: event.notification.leadId,
    followUpId: event.notification.followUpId,
    createdAt: event.notification.createdAt,
    readAt: event.notification.readAt,
  }

  const items = current?.items || []
  if (items.some((item) => item.id === incoming.id)) {
    return {
      items,
      unreadCount: event.unreadCount,
    }
  }

  return {
    items: [incoming, ...items].slice(0, LIST_ARGS.limit),
    unreadCount: event.unreadCount,
  }
}

/**
 * Keeps a cookie-authenticated Socket.IO connection while logged in.
 * Live notifications + email inbound → RTK cache invalidation / toast.
 */
export default function SocketRealtimeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, hydrated, can } = useAuth()
  const dispatch = useAppDispatch()
  const canViewNotifications = can('notification:view')
  const canViewEmail = can('communication:view')

  useEffect(() => {
    if (!hydrated) return

    if (!isAuthenticated) {
      disconnectSocket()
      return
    }

    const socket = connectSocket()

    const refreshEmailThread = (threadId: string, leadId?: string | null) => {
      if (!canViewEmail || !threadId) return
      dispatch(
        emailApi.util.invalidateTags([
          { type: 'Email', id: 'LIST' },
          { type: 'Email', id: threadId },
          { type: 'Email', id: `MSG-${threadId}` },
          ...(leadId ? [{ type: 'Email' as const, id: `LEAD-${leadId}` }] : []),
          'Activities',
          'Communications',
          ...(leadId
            ? [
                { type: 'Leads' as const, id: leadId },
                { type: 'Leads' as const, id: `${leadId}-documents` },
              ]
            : []),
        ]),
      )
    }

    const onNotificationCreated = (event: NotificationCreatedEvent) => {
      if (!event?.notification?.id || !canViewNotifications) return

      dispatch(
        notificationsApi.util.updateQueryData('listNotifications', LIST_ARGS, (draft) => {
          const next = upsertNotificationCache(draft, event)
          draft.items = next.items
          draft.unreadCount = next.unreadCount
        }),
      )

      toast.info(event.notification.title, {
        toastId: `notification:${event.notification.id}`,
        autoClose: 4000,
      })

      if (
        event.notification.browser &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(event.notification.title, { body: event.notification.body || undefined })
        } catch {
          // Browser notifications are optional and depend on permission.
        }
      }

      // Email notifications → refetch thread/list/messages once (no polling).
      const type = event.notification.type || ''
      const isEmailNotif = type.includes('email')
      if (canViewEmail && isEmailNotif) {
        const link = event.notification.link || ''
        const match = link.match(/[?&]c=([0-9a-f-]{36})/i)
        if (match?.[1]) {
          refreshEmailThread(match[1], event.notification.leadId)
        } else {
          dispatch(
            emailApi.util.invalidateTags([
              { type: 'Email', id: 'LIST' },
              ...(event.notification.leadId
                ? [{ type: 'Email' as const, id: `LEAD-${event.notification.leadId}` }]
                : []),
            ]),
          )
        }
      }
    }

    const onEmailInbound = (event: EmailInboundEvent) => {
      refreshEmailThread(event?.threadId, event?.leadId)
    }

    const onReconnect = () => {
      if (canViewNotifications) {
        dispatch(notificationsApi.util.invalidateTags([{ type: 'Notifications', id: 'LIST' }]))
      }
      if (canViewEmail) {
        dispatch(emailApi.util.invalidateTags([{ type: 'Email', id: 'LIST' }]))
      }
    }

    socket.on(SOCKET_EVENTS.notificationCreated, onNotificationCreated)
    socket.on(SOCKET_EVENTS.emailInbound, onEmailInbound)
    socket.on('reconnect', onReconnect)

    return () => {
      socket.off(SOCKET_EVENTS.notificationCreated, onNotificationCreated)
      socket.off(SOCKET_EVENTS.emailInbound, onEmailInbound)
      socket.off('reconnect', onReconnect)
    }
  }, [canViewEmail, canViewNotifications, dispatch, hydrated, isAuthenticated])

  return <>{children}</>
}
