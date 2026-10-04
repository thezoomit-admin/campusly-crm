import { useEffect, type ReactNode } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '@/hooks/useAuth'
import {
  connectSocket,
  disconnectSocket,
  SOCKET_EVENTS,
  type NotificationCreatedEvent,
} from '@/lib/socket'
import { useAppDispatch } from '@/redux'
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
 * Phase 1: live `notification:created` → RTK cache + toast.
 */
export default function SocketRealtimeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, hydrated, can } = useAuth()
  const dispatch = useAppDispatch()
  const canViewNotifications = can('notification:view')

  useEffect(() => {
    if (!hydrated) return

    if (!isAuthenticated) {
      disconnectSocket()
      return
    }

    const socket = connectSocket()

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
    }

    const onReconnect = () => {
      if (!canViewNotifications) return
      dispatch(notificationsApi.util.invalidateTags([{ type: 'Notifications', id: 'LIST' }]))
    }

    socket.on(SOCKET_EVENTS.notificationCreated, onNotificationCreated)
    socket.on('reconnect', onReconnect)

    return () => {
      socket.off(SOCKET_EVENTS.notificationCreated, onNotificationCreated)
      socket.off('reconnect', onReconnect)
    }
  }, [canViewNotifications, dispatch, hydrated, isAuthenticated])

  return <>{children}</>
}
