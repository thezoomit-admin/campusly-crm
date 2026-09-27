import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { FollowUpRow } from '../types'

export type FollowUpListParams = {
  search?: string
}

export type FollowUpListResponse = {
  items: FollowUpRow[]
  total: number
}

const followUpsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listFollowUps: builder.query<FollowUpListResponse, FollowUpListParams | void>({
      query: (params) => `/pipeline/follow-ups${toQuery({ search: params?.search })}`,
      providesTags: [{ type: 'FollowUps', id: 'LIST' }],
    }),
  }),
})

export const { useListFollowUpsQuery } = followUpsApi
