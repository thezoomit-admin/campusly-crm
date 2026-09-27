import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { LeadRow } from '../types'

export type LeadListParams = {
  search?: string
}

export type LeadListResponse = {
  items: LeadRow[]
  total: number
}

const leadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listLeads: builder.query<LeadListResponse, LeadListParams | void>({
      query: (params) => `/pipeline/leads${toQuery({ search: params?.search })}`,
      providesTags: [{ type: 'Leads', id: 'LIST' }],
    }),
  }),
})

export const { useListLeadsQuery } = leadsApi
