import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { EmailMessage, EmailSettings, EmailTemplate, EmailThread, EmailThreadStatus } from '../types'

export type EmailListParams = {
  search?: string
  status?: string
  assigned?: string
  page?: number
  limit?: number
}

export type EmailListResponse = {
  items: EmailThread[]
  total: number
  page: number
  limit: number
  summary: { byStatus: Record<EmailThreadStatus, number>; unread: number }
}

type ThreadResult = { thread: EmailThread; message?: string }

const LIST = { type: 'Email' as const, id: 'LIST' }

const threadTags = (id: string) => [
  LIST,
  { type: 'Email' as const, id },
  { type: 'Email' as const, id: `MSG-${id}` },
]

export const emailApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmailSettings: builder.query<EmailSettings, void>({
      query: () => '/email/settings',
    }),
    listEmailTemplates: builder.query<{ items: EmailTemplate[] }, void>({
      query: () => '/email/templates',
      providesTags: [{ type: 'Email', id: 'TEMPLATES' }],
    }),
    listEmailThreads: builder.query<EmailListResponse, EmailListParams | void>({
      query: (params) =>
        `/email/threads${toQuery({
          search: params?.search,
          status: params?.status,
          assigned: params?.assigned,
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
        })}`,
      providesTags: [LIST],
    }),
    getEmailThread: builder.query<{ thread: EmailThread }, string>({
      query: (id) => `/email/threads/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Email', id }],
    }),
    listEmailMessages: builder.query<{ items: EmailMessage[]; hasMore: boolean }, string>({
      query: (id) => `/email/threads/${id}/messages?limit=200`,
      providesTags: (_r, _e, id) => [{ type: 'Email', id: `MSG-${id}` }],
    }),
    sendEmailMessage: builder.mutation<
      { message: EmailMessage; thread: EmailThread },
      { id: string; to: string; subject: string; text: string; file?: File | null; docCategory?: string; templateCode?: string }
    >({
      query: ({ id, to, subject, text, file, docCategory, templateCode }) => {
        if (file) {
          const body = new FormData()
          body.append('file', file)
          body.append('to', to)
          body.append('subject', subject)
          body.append('text', text)
          if (docCategory) body.append('docCategory', docCategory)
          if (templateCode) body.append('templateCode', templateCode)
          return { url: `/email/threads/${id}/messages`, method: 'POST', body }
        }
        return {
          url: `/email/threads/${id}/messages`,
          method: 'POST',
          body: { to, subject, text, docCategory, templateCode },
        }
      },
      invalidatesTags: (_r, _e, { id }) => [...threadTags(id), 'Activities'],
    }),
    markEmailRead: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/email/threads/${id}/read`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [LIST, { type: 'Email', id }],
    }),
    assignEmailThread: builder.mutation<ThreadResult, { id: string; userId: string; reason?: string }>({
      query: ({ id, userId, reason }) => ({
        url: `/email/threads/${id}/assign`,
        method: 'PATCH',
        body: { userId, reason },
      }),
      invalidatesTags: (_r, _e, { id }) => [...threadTags(id), 'Leads', 'Activities', 'Notifications'],
    }),
    updateEmailStatus: builder.mutation<ThreadResult, { id: string; status: EmailThreadStatus }>({
      query: ({ id, status }) => ({
        url: `/email/threads/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_r, _e, { id }) => [...threadTags(id), 'Activities'],
    }),
    convertEmailThread: builder.mutation<
      ThreadResult & { leadCreated: boolean },
      { id: string; body: { leadId?: string; name?: string; preferredCountryCode?: string; notes?: string } }
    >({
      query: ({ id, body }) => ({ url: `/email/threads/${id}/convert`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [
        ...threadTags(id),
        'Leads',
        'Activities',
        'Communications',
        'Notifications',
        'Dashboard',
      ],
    }),
    listLeadEmail: builder.query<{ items: EmailThread[] }, string>({
      query: (leadId) => `/email/lead/${leadId}`,
      providesTags: (_r, _e, leadId) => [LIST, { type: 'Email', id: `LEAD-${leadId}` }],
    }),
    startLeadEmail: builder.mutation<{ thread: EmailThread }, string>({
      query: (leadId) => ({ url: `/email/lead/${leadId}/start`, method: 'POST' }),
      invalidatesTags: (_r, _e, leadId) => [LIST, { type: 'Email', id: `LEAD-${leadId}` }],
    }),
    simulateInboundEmail: builder.mutation<
      { threadId: string | null; message?: string; duplicate?: boolean },
      { fromName?: string; fromEmail: string; subject: string; text: string }
    >({
      query: (body) => ({ url: '/email/simulate', method: 'POST', body }),
      invalidatesTags: [LIST, 'Leads', 'Activities', 'Communications', 'Notifications', 'Dashboard'],
    }),
  }),
})

export const {
  useGetEmailSettingsQuery,
  useListEmailTemplatesQuery,
  useListEmailThreadsQuery,
  useGetEmailThreadQuery,
  useListEmailMessagesQuery,
  useSendEmailMessageMutation,
  useMarkEmailReadMutation,
  useAssignEmailThreadMutation,
  useUpdateEmailStatusMutation,
  useConvertEmailThreadMutation,
  useListLeadEmailQuery,
  useStartLeadEmailMutation,
  useSimulateInboundEmailMutation,
} = emailApi
