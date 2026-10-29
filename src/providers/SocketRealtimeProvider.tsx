import { useEffect, type ReactNode } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '@/hooks/useAuth'
import { isAuthSession } from '@/lib/auth'
import {
  connectSocket,
  disconnectSocket,
  SOCKET_EVENTS,
  type EmailInboundEvent,
  type NotificationCreatedEvent,
  type PermissionsUpdatedEvent,
} from '@/lib/socket'
import { setSession, useAppDispatch } from '@/redux'
import { authApi } from '@/redux/features/auth/authApi'
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
    id: event.notification.id,
    title: event.notification.title,
    body: event.notification.body,
    link: event.notification.link,
    type: event.notification.type,
    eventType: event.notification.eventType,
    kind: event.notification.kind,
    priority: event.notification.priority,
    status: event.notification.status,
    leadId: event.notification.leadId,
    followUpId: event.notification.followUpId,
    createdAt: event.notification.createdAt,
    readAt: event.notification.readAt,
    browser: event.notification.browser,
    payload: event.notification.payload,
    actions: event.notification.actions,
    deliveryStatus: event.notification.deliveryStatus,
  }

  const items = current?.items || []
  if (items.some((item) => item.id === incoming.id)) {
    return {
      items: items.map((item) =>
        item.id === incoming.id ? { ...item, ...incoming } : item,
      ),
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
 * Live notifications + email inbound + permission refresh (no permission toasts).
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
    let reconnectTimer: number | undefined

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
      if (!event?.notification?.id) return

      const type = event.notification.type || event.notification.eventType || ''
      const isPermissionChange = type === 'permission_change'

      // Always patch bell cache for permission changes; other types need notification:view.
      if (!canViewNotifications && !isPermissionChange) return

      dispatch(
        notificationsApi.util.updateQueryData('listNotifications', LIST_ARGS, (draft) => {
          const next = upsertNotificationCache(draft, event)
          draft.items = next.items
          draft.unreadCount = next.unreadCount
        }),
      )

      // Permission grant/withdraw: bell only — never toast / browser popup.
      if (isPermissionChange) return

      if (!canViewNotifications) return

      toast.info(event.notification.title, {
        toastId: `notification:${event.notification.id}`,
        autoClose: 5000,
      })

      if (
        event.notification.browser &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(event.notification.title, { body: event.notification.body || undefined })
        } catch {
          // Browser notifications are optional.
        }
      }

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

    const onPermissionsUpdated = async (_event: PermissionsUpdatedEvent) => {
      try {
        const result = await dispatch(
          authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true }),
        )
        if (result.data && isAuthSession(result.data)) {
          dispatch(setSession(result.data))
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('[socket] permission refresh failed:', error)
        }
      }

      // Refetch bell so grant/withdraw rows appear even if notification:created raced.
      dispatch(
        notificationsApi.util.invalidateTags([
          { type: 'Notifications', id: 'LIST' },
          'Notifications',
        ]),
      )

      // Defer reconnect so in-flight notification:created is not dropped.
      window.clearTimeout(reconnectTimer)
      reconnectTimer = window.setTimeout(() => {
        if (!socket.connected) {
          socket.connect()
          return
        }
        socket.disconnect()
        socket.connect()
      }, 750)
    }

    const onReconnect = () => {
      dispatch(notificationsApi.util.invalidateTags([{ type: 'Notifications', id: 'LIST' }]))
      if (canViewEmail) {
        dispatch(emailApi.util.invalidateTags([{ type: 'Email', id: 'LIST' }]))
      }
    }

    socket.on(SOCKET_EVENTS.notificationCreated, onNotificationCreated)
    socket.on(SOCKET_EVENTS.emailInbound, onEmailInbound)
    socket.on(SOCKET_EVENTS.permissionsUpdated, onPermissionsUpdated)
    socket.on('reconnect', onReconnect)

    return () => {
      window.clearTimeout(reconnectTimer)
      socket.off(SOCKET_EVENTS.notificationCreated, onNotificationCreated)
      socket.off(SOCKET_EVENTS.emailInbound, onEmailInbound)
      socket.off(SOCKET_EVENTS.permissionsUpdated, onPermissionsUpdated)
      socket.off('reconnect', onReconnect)
    }
  }, [canViewEmail, canViewNotifications, dispatch, hydrated, isAuthenticated])

  return <>{children}</>
}
