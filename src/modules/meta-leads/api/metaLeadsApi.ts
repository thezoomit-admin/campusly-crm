import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { CampaignTouch, MetaLead, MetaLeadFormValues, MetaPerformance } from '../types'

export type MetaLeadListParams = {
  search?: string
  platform?: string
  formType?: string
  country?: string
  campaign?: string
  outcome?: string
  page?: number
  limit?: number
}

const metaLeadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMetaSettings: builder.query<
      {
        mockMode: boolean
        webhookPath: string
        platforms: Array<{ value: string; label: string }>
        formTypes: Array<{ value: string; label: string }>
      },
      void
    >({
      query: () => '/meta-leads/settings',
    }),
    getMetaPerformance: builder.query<MetaPerformance, { platform?: string; country?: string; campaign?: string } | void>({
      query: (params) =>
        `/meta-leads/performance${toQuery({
          platform: params?.platform,
          country: params?.country,
          campaign: params?.campaign,
        })}`,
      providesTags: [{ type: 'MetaLeads', id: 'PERFORMANCE' }],
    }),
    listMetaLeads: builder.query<{ items: MetaLead[]; total: number; page: number; limit: number }, MetaLeadListParams | void>({
      query: (params) =>
        `/meta-leads${toQuery({
          search: params?.search,
          platform: params?.platform,
          formType: params?.formType,
          country: params?.country,
          campaign: params?.campaign,
          outcome: params?.outcome,
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
        })}`,
      providesTags: [{ type: 'MetaLeads', id: 'LIST' }],
    }),
    getMetaLead: builder.query<{ metaLead: MetaLead }, string>({
      query: (id) => `/meta-leads/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'MetaLeads', id }],
    }),
    listLeadCampaignTouches: builder.query<{ items: CampaignTouch[]; total: number }, string>({
      query: (leadId) => `/meta-leads/lead/${leadId}`,
      providesTags: (_r, _e, leadId) => [{ type: 'MetaLeads', id: `lead-${leadId}` }],
    }),
    receiveMetaLead: builder.mutation<
      { success: boolean; message: string; campaignMessage?: string | null; duplicate: boolean; pooled: boolean; metaLead: MetaLead },
      MetaLeadFormValues
    >({
      query: (body) => ({ url: '/meta-leads/receive', method: 'POST', body }),
      invalidatesTags: [
        { type: 'MetaLeads', id: 'LIST' },
        { type: 'MetaLeads', id: 'PERFORMANCE' },
        { type: 'Leads', id: 'LIST' },
        { type: 'Communications', id: 'LIST' },
        { type: 'Notifications', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetMetaSettingsQuery,
  useGetMetaPerformanceQuery,
  useListMetaLeadsQuery,
  useGetMetaLeadQuery,
  useListLeadCampaignTouchesQuery,
  useReceiveMetaLeadMutation,
} = metaLeadsApi
