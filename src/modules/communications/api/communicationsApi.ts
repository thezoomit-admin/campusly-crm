import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { CommunicationEvent } from '../types'

export type CommunicationListParams = {
  search?: string
  channel?: string
  status?: string
  page?: number
  limit?: number
}

export type CommunicationListResponse = {
  items: CommunicationEvent[]
  total: number
  page: number
  limit: number
  summary: { pending: number; failed: number; processed: number }
}

const communicationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCommunications: builder.query<CommunicationListResponse, CommunicationListParams | void>({
      query: (params) =>
        `/communications${toQuery({
          search: params?.search,
          channel: params?.channel,
          status: params?.status,
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
        })}`,
      providesTags: [{ type: 'Communications', id: 'LIST' }],
    }),
    listLeadCommunications: builder.query<{ items: CommunicationEvent[]; total: number }, string>({
      query: (leadId) => `/communications/lead/${leadId}`,
      providesTags: (_r, _e, leadId) => [
        { type: 'Communications', id: 'LIST' },
        { type: 'Communications', id: leadId },
      ],
    }),
    getCommunication: builder.query<{ event: CommunicationEvent }, string>({
      query: (id) => `/communications/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Communications', id }],
    }),
    reprocessCommunication: builder.mutation<{ event: CommunicationEvent; message: string }, string>({
      query: (id) => ({ url: `/communications/${id}/reprocess`, method: 'POST' }),
      invalidatesTags: [
        { type: 'Communications', id: 'LIST' },
        'Leads',
        'Activities',
        'Notifications',
        'Dashboard',
      ],
    }),
  }),
})

export const {
  useListCommunicationsQuery,
  useListLeadCommunicationsQuery,
  useGetCommunicationQuery,
  useReprocessCommunicationMutation,
} = communicationsApi
