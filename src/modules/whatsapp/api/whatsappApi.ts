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

type ConversationResult = { conversation: WhatsAppConversation; message?: string }

const LIST = { type: 'WhatsApp' as const, id: 'LIST' }

const conversationTags = (id: string) => [
  LIST,
  { type: 'WhatsApp' as const, id },
  { type: 'WhatsApp' as const, id: `MSG-${id}` },
]

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
    listWhatsAppMessages: builder.query<{ items: WhatsAppMessage[]; hasMore: boolean }, string>({
      query: (id) => `/whatsapp/conversations/${id}/messages?limit=200`,
      providesTags: (_r, _e, id) => [{ type: 'WhatsApp', id: `MSG-${id}` }],
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
      invalidatesTags: (_r, _e, leadId) => [LIST, { type: 'WhatsApp', id: `LEAD-${leadId}` }, 'Activities'],
    }),
  }),
})

export const {
  useGetWhatsAppSettingsQuery,
  useListWhatsAppConversationsQuery,
  useGetWhatsAppConversationQuery,
  useListWhatsAppMessagesQuery,
  useSendWhatsAppMessageMutation,
  useSendWhatsAppTemplateMutation,
  useMarkWhatsAppReadMutation,
  useAssignWhatsAppConversationMutation,
  useUpdateWhatsAppStatusMutation,
  useConvertWhatsAppConversationMutation,
  useListLeadWhatsAppQuery,
  useStartLeadWhatsAppMutation,
} = whatsappApi
