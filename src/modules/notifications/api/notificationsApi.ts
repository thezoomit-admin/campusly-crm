import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'

export type AppNotification = {
  id: string
  title: string
  body: string | null
  link: string | null
  type: string | null
  status: string
  leadId: string | null
  followUpId: string | null
  createdAt: string
  readAt: string | null
}

export type NotificationListResponse = {
  items: AppNotification[]
  unreadCount: number
}

const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listNotifications: builder.query<NotificationListResponse, { limit?: number; unreadOnly?: boolean } | void>({
      query: (params) =>
        `/notifications${toQuery({
          limit: params?.limit ? String(params.limit) : undefined,
          unreadOnly: params?.unreadOnly ? '1' : undefined,
        })}`,
      providesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),
    markNotificationRead: builder.mutation<{ ok?: boolean }, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'POST' }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),
    markAllNotificationsRead: builder.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),
  }),
})

export const {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi
