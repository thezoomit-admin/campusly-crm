import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type {
  CancelFollowUpValues,
  CompleteFollowUpValues,
  FollowUpFormValues,
  FollowUpRecord,
  RescheduleFollowUpValues,
} from '../types'

export type FollowUpListParams = {
  search?: string
  leadId?: string
  status?: string
}

export type FollowUpListResponse = {
  items: FollowUpRecord[]
  total: number
}

const followUpsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listFollowUps: builder.query<FollowUpListResponse, FollowUpListParams | void>({
      query: (params) =>
        `/follow-ups${toQuery({
          search: params?.search,
          leadId: params?.leadId,
          status: params?.status,
        })}`,
      providesTags: [{ type: 'FollowUps', id: 'LIST' }],
    }),
    getFollowUp: builder.query<{ followUp: FollowUpRecord }, string>({
      query: (id) => `/follow-ups/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'FollowUps', id }],
    }),
    updateFollowUpReminder: builder.mutation<{ followUp: FollowUpRecord }, { id: string; reminder: string }>({
      query: ({ id, reminder }) => ({ url: `/follow-ups/${id}/reminder`, method: 'POST', body: { reminder } }),
      invalidatesTags: [{ type: 'FollowUps', id: 'LIST' }],
    }),
    listLeadFollowUps: builder.query<FollowUpListResponse, string>({
      query: (leadId) => `/follow-ups/lead/${leadId}`,
      providesTags: (_r, _e, leadId) => [
        { type: 'FollowUps', id: 'LIST' },
        { type: 'FollowUps', id: leadId },
      ],
    }),
    createFollowUp: builder.mutation<{ followUp: FollowUpRecord }, FollowUpFormValues>({
      query: (body) => ({ url: '/follow-ups', method: 'POST', body }),
      invalidatesTags: (result, _e, body) => {
        const leadId = body.leadId || result?.followUp?.leadId || result?.followUp?.lead?.id || undefined
        return [
          { type: 'FollowUps', id: 'LIST' },
          ...(leadId
            ? [
                { type: 'FollowUps' as const, id: leadId },
                { type: 'Leads' as const, id: leadId },
              ]
            : [{ type: 'Leads' as const }]),
          { type: 'Leads', id: 'LIST' },
          { type: 'Leads', id: 'MINE' },
          'Activities',
          'Dashboard',
        ]
      },
    }),
    completeFollowUp: builder.mutation<
      { followUp: FollowUpRecord; nextFollowUp: FollowUpRecord | null },
      { id: string; body: CompleteFollowUpValues }
    >({
      query: ({ id, body }) => ({ url: `/follow-ups/${id}/complete`, method: 'POST', body }),
      invalidatesTags: (result) => {
        const leadId = result?.followUp?.leadId || result?.followUp?.lead?.id || undefined
        return [
          { type: 'FollowUps', id: 'LIST' },
          ...(leadId
            ? [
                { type: 'FollowUps' as const, id: leadId },
                { type: 'Leads' as const, id: leadId },
              ]
            : [{ type: 'Leads' as const }]),
          'Activities',
          'Dashboard',
        ]
      },
    }),
    rescheduleFollowUp: builder.mutation<
      { followUp: FollowUpRecord; nextFollowUp: FollowUpRecord },
      { id: string; body: RescheduleFollowUpValues }
    >({
      query: ({ id, body }) => ({ url: `/follow-ups/${id}/reschedule`, method: 'POST', body }),
      invalidatesTags: (result) => {
        const leadId = result?.followUp?.leadId || result?.followUp?.lead?.id || undefined
        return [
          { type: 'FollowUps', id: 'LIST' },
          ...(leadId
            ? [
                { type: 'FollowUps' as const, id: leadId },
                { type: 'Leads' as const, id: leadId },
              ]
            : [{ type: 'Leads' as const }]),
          'Activities',
          'Dashboard',
        ]
      },
    }),
    cancelFollowUp: builder.mutation<{ followUp: FollowUpRecord }, { id: string; body: CancelFollowUpValues }>({
      query: ({ id, body }) => ({ url: `/follow-ups/${id}/cancel`, method: 'POST', body }),
      invalidatesTags: (result) => {
        const leadId = result?.followUp?.leadId || result?.followUp?.lead?.id || undefined
        return [
          { type: 'FollowUps', id: 'LIST' },
          ...(leadId
            ? [
                { type: 'FollowUps' as const, id: leadId },
                { type: 'Leads' as const, id: leadId },
              ]
            : [{ type: 'Leads' as const }]),
          'Activities',
          'Dashboard',
        ]
      },
    }),
  }),
})

export const {
  useListFollowUpsQuery,
  useGetFollowUpQuery,
  useUpdateFollowUpReminderMutation,
  useListLeadFollowUpsQuery,
  useCreateFollowUpMutation,
  useCompleteFollowUpMutation,
  useRescheduleFollowUpMutation,
  useCancelFollowUpMutation,
} = followUpsApi
