import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { ApplicationRow } from '../types'

export type ApplicationListParams = {
  search?: string
}

export type ApplicationListResponse = {
  items: ApplicationRow[]
  total: number
}

const applicationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listApplications: builder.query<ApplicationListResponse, ApplicationListParams | void>({
      query: (params) => `/pipeline/applications${toQuery({ search: params?.search })}`,
      providesTags: [{ type: 'Applications', id: 'LIST' }],
    }),
  }),
})

export const { useListApplicationsQuery } = applicationsApi
