import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { ReportOverviewData, ReportRow } from '../types'

export type ReportListParams = {
  search?: string
}

export type ReportListResponse = {
  items: ReportRow[]
  total: number
}

export type ReportOverviewParams = {
  datePreset?: string
  customFrom?: string
  customTo?: string
  employeeId?: string
  employeeScope?: string
  country?: string
  leadSource?: string
  service?: string
  fileStatus?: string
  paymentStatus?: string
}

const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listReports: builder.query<ReportListResponse, ReportListParams | void>({
      query: (params) => `/pipeline/reports${toQuery({ search: params?.search })}`,
      providesTags: [{ type: 'Reports', id: 'LIST' }],
    }),
    getReportOverview: builder.query<ReportOverviewData, ReportOverviewParams>({
      query: (params) =>
        `/pipeline/reports/overview${toQuery({
          datePreset: params.datePreset,
          customFrom: params.customFrom,
          customTo: params.customTo,
          employeeId: params.employeeId,
          employeeScope: params.employeeScope,
          country: params.country,
          leadSource: params.leadSource,
          service: params.service,
          fileStatus: params.fileStatus,
          paymentStatus: params.paymentStatus,
        })}`,
      providesTags: [
        { type: 'Reports', id: 'OVERVIEW' },
        { type: 'Leads', id: 'LIST' },
        { type: 'Payments', id: 'LIST' },
        { type: 'FollowUps', id: 'LIST' },
        { type: 'Documents', id: 'LIST' },
        { type: 'FileDocuments', id: 'LIST' },
        { type: 'ServiceOffers', id: 'LIST' },
      ],
    }),
  }),
})

export const { useListReportsQuery, useGetReportOverviewQuery } = reportsApi
