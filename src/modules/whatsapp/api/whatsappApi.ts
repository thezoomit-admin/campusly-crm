import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { WhatsAppConversation, WhatsAppConversationStatus, WhatsAppMessage, WhatsAppSettings } from '../types'

export type WhatsAppListParams = {
  search?: string
  status?: string
  assigned?: string
  page?: number
  limit?: number
}

export type WhatsAppListResponse = {
  items: WhatsAppConversation[]
  total: number
  page: number
  limit: number
  summary: { byStatus: Record<WhatsAppConversationStatus, number>; unread: number }
}

export type WhatsAppMessagesArgs = {
  id: string
  /** ISO timestamp — load messages older than this (pagination). */
  before?: string
}

export type WhatsAppMessagesResult = {
  items: WhatsAppMessage[]
  hasMore: boolean
}

type ConversationResult = { conversation: WhatsAppConversation; message?: string }

const LIST = { type: 'WhatsApp' as const, id: 'LIST' }

const conversationTags = (id: string) => [
  LIST,
  { type: 'WhatsApp' as const, id },
  { type: 'WhatsApp' as const, id: `MSG-${id}` },
]

function upsertMessage(items: WhatsAppMessage[], message: WhatsAppMessage) {
  const index = items.findIndex((item) => item.id === message.id)
  if (index >= 0) {
    items[index] = message
    return
  }
  const insertAt = items.findIndex((item) => new Date(item.sentAt).getTime() > new Date(message.sentAt).getTime())
  if (insertAt < 0) items.push(message)
  else items.splice(insertAt, 0, message)
}

function failedMessageFromError(error: unknown): WhatsAppMessage | null {
  if (!error || typeof error !== 'object') return null
  const data = (error as { data?: unknown }).data
  if (!data || typeof data !== 'object') return null
  const message = (data as { message?: unknown }).message
  if (!message || typeof message !== 'object') return null
  const row = message as WhatsAppMessage
  return typeof row.id === 'string' && typeof row.conversationId === 'string' ? row : null
}

const whatsappApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWhatsAppSettings: builder.query<WhatsAppSettings, void>({
      query: () => '/whatsapp/settings',
    }),
    listWhatsAppConversations: builder.query<WhatsAppListResponse, WhatsAppListParams | void>({
      query: (params) =>
        `/whatsapp/conversations${toQuery({
          search: params?.search,
          status: params?.status,
          assigned: params?.assigned,
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
        })}`,
      providesTags: [LIST],
    }),
    getWhatsAppConversation: builder.query<{ conversation: WhatsAppConversation }, string>({
      query: (id) => `/whatsapp/conversations/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'WhatsApp', id }],
    }),
    listWhatsAppMessages: builder.query<WhatsAppMessagesResult, WhatsAppMessagesArgs>({
      query: ({ id, before }) =>
        `/whatsapp/conversations/${id}/messages${toQuery({
          limit: '80',
          before,
        })}`,
      serializeQueryArgs: ({ queryArgs }) => queryArgs.id,
      merge: (current, incoming, { arg }) => {
        if (!current || !arg.before) {
          if (!current?.items?.length) return incoming
          // Polling / refresh of the latest page — keep any older messages already loaded.
          const latest = [...incoming.items]
          const oldestLatest = latest[0]?.sentAt
          const older = current.items.filter((message) => {
            if (latest.some((row) => row.id === message.id)) return false
            if (!oldestLatest) return true
            return new Date(message.sentAt).getTime() < new Date(oldestLatest).getTime()
          })
          return {
            items: [...older, ...latest],
            hasMore: older.length > 0 ? Boolean(current.hasMore) : incoming.hasMore,
          }
        }
        const existingIds = new Set(current.items.map((message) => message.id))
        const older = incoming.items.filter((message) => !existingIds.has(message.id))
        return { items: [...older, ...current.items], hasMore: incoming.hasMore }
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.id !== previousArg?.id || currentArg?.before !== previousArg?.before,
      providesTags: (_r, _e, arg) => [{ type: 'WhatsApp', id: `MSG-${arg.id}` }],
    }),
    sendWhatsAppMessage: builder.mutation<
      { message: WhatsAppMessage; conversation: WhatsAppConversation },
      { id: string; text?: string; file?: File | null; docCategory?: string }
    >({
      query: ({ id, text, file, docCategory }) => {
        if (file) {
          const body = new FormData()
          body.append('file', file)
          if (text) body.append('text', text)
          if (docCategory) body.append('docCategory', docCategory)
          return { url: `/whatsapp/conversations/${id}/messages`, method: 'POST', body }
        }
        return { url: `/whatsapp/conversations/${id}/messages`, method: 'POST', body: { text } }
      },
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            whatsappApi.util.updateQueryData('listWhatsAppMessages', { id }, (draft) => {
              upsertMessage(draft.items, data.message)
            }),
          )
          dispatch(
            whatsappApi.util.updateQueryData('getWhatsAppConversation', id, (draft) => {
              draft.conversation = data.conversation
            }),
          )
        } catch (error) {
          const failed = failedMessageFromError((error as { error?: unknown })?.error)
          if (!failed) return
          dispatch(
            whatsappApi.util.updateQueryData('listWhatsAppMessages', { id }, (draft) => {
              upsertMessage(draft.items, failed)
            }),
          )
        }
      },
      invalidatesTags: (_r, _e, { id }) => [...conversationTags(id), 'Activities'],
    }),
    sendWhatsAppTemplate: builder.mutation<
      { message: WhatsAppMessage; conversation: WhatsAppConversation },
      { id: string; templateName?: string }
    >({
      query: ({ id, templateName }) => ({
        url: `/whatsapp/conversations/${id}/template`,
        method: 'POST',
        body: templateName ? { templateName } : {},
      }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            whatsappApi.util.updateQueryData('listWhatsAppMessages', { id }, (draft) => {
              upsertMessage(draft.items, data.message)
            }),
          )
          dispatch(
            whatsappApi.util.updateQueryData('getWhatsAppConversation', id, (draft) => {
              draft.conversation = data.conversation
            }),
          )
        } catch (error) {
          const failed = failedMessageFromError((error as { error?: unknown })?.error)
          if (!failed) return
          dispatch(
            whatsappApi.util.updateQueryData('listWhatsAppMessages', { id }, (draft) => {
              upsertMessage(draft.items, failed)
            }),
          )
        }
      },
      invalidatesTags: (_r, _e, { id }) => [...conversationTags(id), 'Activities'],
    }),
    markWhatsAppRead: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/whatsapp/conversations/${id}/read`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [LIST, { type: 'WhatsApp', id }],
    }),
    assignWhatsAppConversation: builder.mutation<ConversationResult, { id: string; userId: string; reason?: string }>({
      query: ({ id, userId, reason }) => ({
        url: `/whatsapp/conversations/${id}/assign`,
        method: 'PATCH',
        body: { userId, reason },
      }),
      invalidatesTags: (_r, _e, { id }) => [...conversationTags(id), 'Leads', 'Activities', 'Notifications'],
    }),
    updateWhatsAppStatus: builder.mutation<ConversationResult, { id: string; status: WhatsAppConversationStatus }>({
      query: ({ id, status }) => ({
        url: `/whatsapp/conversations/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_r, _e, { id }) => [...conversationTags(id), 'Activities'],
    }),
    convertWhatsAppConversation: builder.mutation<
      ConversationResult & { leadCreated: boolean },
      { id: string; body: { leadId?: string; name?: string; email?: string; preferredCountryCode?: string; notes?: string } }
    >({
      query: ({ id, body }) => ({ url: `/whatsapp/conversations/${id}/convert`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [
        ...conversationTags(id),
        'Leads',
        'Activities',
        'Communications',
        'Notifications',
        'Dashboard',
      ],
    }),
    listLeadWhatsApp: builder.query<{ items: WhatsAppConversation[] }, string>({
      query: (leadId) => `/whatsapp/lead/${leadId}`,
      providesTags: (_r, _e, leadId) => [LIST, { type: 'WhatsApp', id: `LEAD-${leadId}` }],
    }),
    startLeadWhatsApp: builder.mutation<
      { message: WhatsAppMessage; conversation: WhatsAppConversation },
      string
    >({
      query: (leadId) => ({ url: `/whatsapp/lead/${leadId}/start`, method: 'POST' }),
      invalidatesTags: (result, _e, leadId) => [
        LIST,
        { type: 'WhatsApp', id: `LEAD-${leadId}` },
        ...(result
          ? [
              { type: 'WhatsApp' as const, id: result.conversation.id },
              { type: 'WhatsApp' as const, id: `MSG-${result.conversation.id}` },
            ]
          : []),
        'Activities',
      ],
    }),
  }),
})

export const {
  useGetWhatsAppSettingsQuery,
  useListWhatsAppConversationsQuery,
  useGetWhatsAppConversationQuery,
  useListWhatsAppMessagesQuery,
  useLazyListWhatsAppMessagesQuery,
  useSendWhatsAppMessageMutation,
  useSendWhatsAppTemplateMutation,
  useMarkWhatsAppReadMutation,
  useAssignWhatsAppConversationMutation,
  useUpdateWhatsAppStatusMutation,
  useConvertWhatsAppConversationMutation,
  useListLeadWhatsAppQuery,
  useStartLeadWhatsAppMutation,
} = whatsappApi
