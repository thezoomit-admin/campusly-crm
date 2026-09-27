import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { ReportRow } from '../types'

export type ReportListParams = {
  search?: string
}

export type ReportListResponse = {
  items: ReportRow[]
  total: number
}

const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listReports: builder.query<ReportListResponse, ReportListParams | void>({
      query: (params) => `/pipeline/reports${toQuery({ search: params?.search })}`,
      providesTags: [{ type: 'Reports', id: 'LIST' }],
    }),
  }),
})

export const { useListReportsQuery } = reportsApi
