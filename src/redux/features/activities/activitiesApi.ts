import { baseApi } from '../../api/baseApi'
import { toQuery } from '@/lib/api'
import type { ActivityFeedResponse } from '@/types'

export type ActivityFeedParams = {
  from?: string
  to?: string
  search?: string
  category?: string
  userId?: string
  relatedId?: string
}

export type ActivityPayload = {
  type: string
  relatedName?: string
  relatedType?: string
  relatedId?: string
  durationMin?: number | null
  outcome?: string
  notes?: string
  nextAction?: string
  nextDate?: string | null
  createNextFollowUp?: boolean
  nextFollowUpType?: string
  nextFollowUpPriority?: string
}

const activitiesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listActivityFeed: builder.query<ActivityFeedResponse, ActivityFeedParams | void>({
      query: (params) => `/activities${toQuery({ ...(params || {}) })}`,
      providesTags: ['Activities'],
    }),
    createActivity: builder.mutation<
      { activity: unknown; nextFollowUp: { id: string } | null },
      ActivityPayload
    >({
      query: (body) => ({
        url: '/activities',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Activities', 'FollowUps', 'Dashboard', { type: 'Leads', id: 'MINE' }, 'Leads'],
    }),
    recordActivityExport: builder.mutation<{ ok: boolean }, { count: number }>({
      query: (body) => ({
        url: '/activities/export',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const {
  useListActivityFeedQuery,
  useLazyListActivityFeedQuery,
  useCreateActivityMutation,
  useRecordActivityExportMutation,
} = activitiesApi
