import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { CampaignFormValues, CampaignRecord } from '../../communications/types'

export type CampaignListParams = {
  search?: string
  status?: string
  page?: number
  limit?: number
}

export type CampaignListResponse = {
  items: CampaignRecord[]
  total: number
  page: number
  limit: number
}

export type CampaignOption = {
  value: string
  label: string
  code: string
  name: string
  sourceCode: string | null
  channel: string | null
}

export type AttributionBucket = {
  total: number
  converted: number
  conversionRate: number
}

export type AttributionSummary = {
  sources: Array<AttributionBucket & { code: string; label: string }>
  campaigns: Array<AttributionBucket & { id: string | null; label: string }>
}

const campaignsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCampaigns: builder.query<CampaignListResponse, CampaignListParams | void>({
      query: (params) =>
        `/campaigns${toQuery({
          search: params?.search,
          status: params?.status,
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
        })}`,
      providesTags: [{ type: 'Campaigns', id: 'LIST' }],
    }),
    getCampaign: builder.query<{ campaign: CampaignRecord }, string>({
      query: (id) => `/campaigns/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Campaigns', id }],
    }),
    listCampaignOptions: builder.query<{ items: CampaignOption[] }, { sourceCode?: string } | void>({
      query: (params) => `/campaigns/options${toQuery({ sourceCode: params?.sourceCode })}`,
      providesTags: [{ type: 'Campaigns', id: 'OPTIONS' }],
    }),
    attributionSummary: builder.query<AttributionSummary, void>({
      query: () => '/campaigns/performance',
      providesTags: [{ type: 'Campaigns', id: 'PERFORMANCE' }],
    }),
    createCampaign: builder.mutation<{ campaign: CampaignRecord; message: string }, CampaignFormValues>({
      query: (body) => ({ url: '/campaigns', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Campaigns', id: 'LIST' },
        { type: 'Campaigns', id: 'OPTIONS' },
      ],
    }),
    updateCampaign: builder.mutation<
      { campaign: CampaignRecord; message: string },
      { id: string; body: Partial<CampaignFormValues> }
    >({
      query: ({ id, body }) => ({ url: `/campaigns/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Campaigns', id: 'LIST' },
        { type: 'Campaigns', id: 'OPTIONS' },
        { type: 'Campaigns', id: arg.id },
      ],
    }),
  }),
})

export const {
  useListCampaignsQuery,
  useGetCampaignQuery,
  useListCampaignOptionsQuery,
  useAttributionSummaryQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
} = campaignsApi
