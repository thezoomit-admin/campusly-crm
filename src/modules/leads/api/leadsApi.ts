import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { DuplicateLead, LeadListSummary, LeadRecord, LeadRow } from '../types'

export type LeadListParams = {
  search?: string
  page?: number
  limit?: number
  status?: string
  source?: string
  priority?: string
  country?: string
}

export type LeadListResponse = {
  items: LeadRow[]
  total: number
  page?: number
  limit?: number
  summary?: LeadListSummary
}

const leadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listLeads: builder.query<LeadListResponse, LeadListParams | void>({
      query: (params) =>
        `/leads${toQuery({
          search: params?.search,
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
          status: params?.status && params.status !== 'all' ? params.status : undefined,
          source: params?.source,
          priority: params?.priority,
          country: params?.country,
        })}`,
      providesTags: [{ type: 'Leads', id: 'LIST' }],
    }),
    getLead: builder.query<{ lead: LeadRecord }, string>({
      query: (id) => `/leads/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Leads', id }],
    }),
    checkLeadDuplicate: builder.mutation<
      { duplicate: boolean; existingLead?: DuplicateLead },
      { phone: string }
    >({
      query: (body) => ({ url: '/leads/duplicate-check', method: 'POST', body }),
    }),
    createLead: builder.mutation<{ lead: LeadRecord; message: string }, Record<string, unknown>>({
      query: (body) => ({ url: '/leads', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Leads', id: 'LIST' },
        'Dashboard',
        'Pipeline',
      ],
    }),
    updateLead: builder.mutation<{ lead: LeadRecord }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/leads/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Leads', id },
        { type: 'Leads', id: 'LIST' },
      ],
    }),
    updateLeadQualification: builder.mutation<{ lead: LeadRecord }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/leads/${id}/qualification`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Leads', id },
        { type: 'Leads', id: 'LIST' },
      ],
    }),
    updateLeadPriority: builder.mutation<{ lead: LeadRecord }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/leads/${id}/priority`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Leads', id }, { type: 'Leads', id: 'LIST' }],
    }),
    createLeadFollowUp: builder.mutation<{ followUp: { id: string } }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/leads/${id}/follow-ups`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'FollowUps', id: 'LIST' },
        { type: 'Leads', id },
        'Activities',
      ],
    }),
  }),
})

export const {
  useListLeadsQuery,
  useGetLeadQuery,
  useLazyGetLeadQuery,
  useCheckLeadDuplicateMutation,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useUpdateLeadQualificationMutation,
  useUpdateLeadPriorityMutation,
  useCreateLeadFollowUpMutation,
} = leadsApi
