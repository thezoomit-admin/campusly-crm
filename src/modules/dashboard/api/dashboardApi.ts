import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { DashboardOverview } from '../types'

export type DashboardParams = {
  year?: number
  month?: number
}

const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<DashboardOverview, DashboardParams | void>({
      query: (params) =>
        `/pipeline/dashboard${toQuery({
          year: params?.year != null ? String(params.year) : undefined,
          month: params?.month != null ? String(params.month) : undefined,
        })}`,
      providesTags: [
        { type: 'Dashboard', id: 'OVERVIEW' },
        { type: 'Leads', id: 'LIST' },
        { type: 'Applications', id: 'LIST' },
        { type: 'Students', id: 'LIST' },
        { type: 'Payments', id: 'LIST' },
        { type: 'FollowUps', id: 'LIST' },
      ],
    }),
  }),
})

export const { useGetDashboardQuery } = dashboardApi
