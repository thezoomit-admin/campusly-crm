import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'

export type NotificationAction = {
  key: string
  label: string
  href?: string
}

export type AppNotification = {
  id: string
  title: string
  body: string | null
  link: string | null
  type: string | null
  eventType?: string | null
  kind?: string
  priority?: string
  status: string
  channel?: string
  leadId: string | null
  followUpId: string | null
  deliveryStatus?: string
  createdAt: string
  readAt: string | null
  archivedAt?: string | null
  payload?: Record<string, unknown> | null
  actions?: NotificationAction[]
  browser?: boolean
  lead?: { id: string; code: string; name: string } | null
  recipientName?: string | null
  deliveries?: Array<{ channel: string; status: string; attempts: number; lastError: string | null; sentAt: string | null }>
}

export type NotificationListResponse = {
  items: AppNotification[]
  unreadCount: number
  scope?: string
}

export type NotificationListParams = {
  limit?: number
  unreadOnly?: boolean
  scope?: string
  status?: string
  eventType?: string
  priority?: string
  leadId?: string
  search?: string
  from?: string
  to?: string
}

export type NotificationPreferenceItem = {
  eventType: string
  label: string
  mandatory: boolean
  enabled: boolean
  priority: string
  channels: { inApp: boolean; email: boolean; whatsapp: boolean; browser: boolean }
  preference: { inApp: boolean; email: boolean; whatsapp: boolean; browser: boolean }
}

export type NotificationConfigItem = {
  eventType: string
  label: string
  description: string | null
  enabled: boolean
  mandatory: boolean
  priority: string
  inApp: boolean
  email: boolean
  whatsapp: boolean
  browser: boolean
  recipientRule: string
  notifyPreviousOwner: boolean
  overdueAfterMinutes: number
  statusAllowlist: string[] | null
}

const LIST = { type: 'Notifications' as const, id: 'LIST' }

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listNotifications: builder.query<NotificationListResponse, NotificationListParams | void>({
      query: (params) =>
        `/notifications${toQuery({
          limit: params?.limit ? String(params.limit) : undefined,
          unreadOnly: params?.unreadOnly ? '1' : undefined,
          scope: params?.scope,
          status: params?.status,
          eventType: params?.eventType,
          priority: params?.priority,
          leadId: params?.leadId,
          search: params?.search,
          from: params?.from,
          to: params?.to,
        })}`,
      providesTags: [LIST],
    }),
    markNotificationRead: builder.mutation<{ notification: AppNotification; unreadCount?: number }, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'POST' }),
      invalidatesTags: [LIST],
    }),
    archiveNotification: builder.mutation<{ notification: AppNotification; unreadCount?: number }, string>({
      query: (id) => ({ url: `/notifications/${id}/archive`, method: 'POST' }),
      invalidatesTags: [LIST],
    }),
    markAllNotificationsRead: builder.mutation<{ ok: boolean; unreadCount: number }, void>({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      invalidatesTags: [LIST],
    }),
    listNotificationPreferences: builder.query<{ items: NotificationPreferenceItem[] }, void>({
      query: () => '/notifications/preferences',
      providesTags: [{ type: 'Notifications', id: 'PREFS' }],
    }),
    saveNotificationPreferences: builder.mutation<
      { items: NotificationPreferenceItem[] },
      { items: Array<{ eventType: string; inApp: boolean; email: boolean; whatsapp: boolean; browser: boolean }> }
    >({
      query: (body) => ({ url: '/notifications/preferences', method: 'PUT', body }),
      invalidatesTags: [{ type: 'Notifications', id: 'PREFS' }],
    }),
    listNotificationConfig: builder.query<{ items: NotificationConfigItem[] }, void>({
      query: () => '/notifications/config',
      providesTags: [{ type: 'Notifications', id: 'CONFIG' }],
    }),
    updateNotificationConfig: builder.mutation<{ item: NotificationConfigItem }, { eventType: string; body: Partial<NotificationConfigItem> }>({
      query: ({ eventType, body }) => ({ url: `/notifications/config/${eventType}`, method: 'PUT', body }),
      invalidatesTags: [{ type: 'Notifications', id: 'CONFIG' }, { type: 'Notifications', id: 'PREFS' }],
    }),
  }),
})

export const {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useArchiveNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useListNotificationPreferencesQuery,
  useSaveNotificationPreferencesMutation,
  useListNotificationConfigQuery,
  useUpdateNotificationConfigMutation,
} = notificationsApi
