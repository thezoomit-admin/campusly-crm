import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type {
  DuplicateLead,
  LeadAssignee,
  LeadAssignmentHistoryItem,
  LeadDocumentItem,
  LeadListSummary,
  LeadPoolRow,
  LeadRecord,
  LeadRow,
  LeadStatusHistoryItem,
  MyLeadRow,
  MyLeadsSummary,
} from '../types'

export type LeadListParams = {
  search?: string
  page?: number
  limit?: number
  status?: string
  source?: string
  priority?: string
  country?: string
}

export type LeadListResponse = {
  items: LeadRow[]
  total: number
  page?: number
  limit?: number
  summary?: LeadListSummary
}

export type LeadPoolParams = {
  search?: string
  page?: number
  limit?: number
  source?: string
  country?: string
  createdFrom?: string
  createdTo?: string
}

export type LeadPoolResponse = {
  items: LeadPoolRow[]
  total: number
  page?: number
  limit?: number
}

export type MyLeadsParams = {
  search?: string
  page?: number
  limit?: number
  status?: string
  source?: string
  priority?: string
  country?: string
  followUpStatus?: string
  sort?: string
  order?: string
}

export type MyLeadsResponse = {
  items: MyLeadRow[]
  total: number
  page?: number
  limit?: number
  summary?: MyLeadsSummary
}

const LEAD_COLLECTION_TAGS = [
  { type: 'Leads' as const, id: 'LIST' },
  { type: 'Leads' as const, id: 'POOL' },
  { type: 'Leads' as const, id: 'MINE' },
]

const leadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listLeads: builder.query<LeadListResponse, LeadListParams | void>({
      query: (params) =>
        `/leads${toQuery({
          search: params?.search,
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
          status: params?.status && params.status !== 'all' ? params.status : undefined,
          source: params?.source,
          priority: params?.priority,
          country: params?.country,
        })}`,
      providesTags: [{ type: 'Leads', id: 'LIST' }],
    }),
    getLead: builder.query<{ lead: LeadRecord }, string>({
      query: (id) => `/leads/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Leads', id }],
    }),
    checkLeadDuplicate: builder.mutation<
      { duplicate: boolean; existingLead?: DuplicateLead },
      { phone: string }
    >({
      query: (body) => ({ url: '/leads/duplicate-check', method: 'POST', body }),
    }),
    createLead: builder.mutation<{ lead: LeadRecord; message: string }, Record<string, unknown>>({
      query: (body) => ({ url: '/leads', method: 'POST', body }),
      invalidatesTags: [...LEAD_COLLECTION_TAGS, 'Dashboard', 'Pipeline', { type: 'Campaigns', id: 'PERFORMANCE' }],
    }),
    updateLead: builder.mutation<{ lead: LeadRecord }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/leads/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Leads', id }, ...LEAD_COLLECTION_TAGS],
    }),
    updateLeadQualification: builder.mutation<{ lead: LeadRecord }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/leads/${id}/qualification`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Leads', id }, ...LEAD_COLLECTION_TAGS],
    }),
    updateLeadPriority: builder.mutation<{ lead: LeadRecord }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/leads/${id}/priority`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Leads', id }, ...LEAD_COLLECTION_TAGS],
    }),
    createLeadFollowUp: builder.mutation<{ followUp: { id: string } }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/leads/${id}/follow-ups`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'FollowUps', id: 'LIST' },
        { type: 'Leads', id },
        { type: 'Leads', id: 'MINE' },
        'Activities',
      ],
    }),
    updateLeadStatus: builder.mutation<{ lead: LeadRecord }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/leads/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Leads', id },
        ...LEAD_COLLECTION_TAGS,
        'Activities',
        'Dashboard',
        'Pipeline',
      ],
    }),
    closeLead: builder.mutation<{ lead: LeadRecord }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/leads/${id}/close`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Leads', id },
        ...LEAD_COLLECTION_TAGS,
        'Activities',
        'Dashboard',
        'Pipeline',
        { type: 'FollowUps', id: 'LIST' },
      ],
    }),
    reopenLead: builder.mutation<{ lead: LeadRecord }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/leads/${id}/reopen`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Leads', id },
        ...LEAD_COLLECTION_TAGS,
        'Activities',
        'Dashboard',
        'Pipeline',
        { type: 'FollowUps', id: 'LIST' },
      ],
    }),
    listLeadStatusHistory: builder.query<{ items: LeadStatusHistoryItem[] }, string>({
      query: (id) => `/leads/${id}/status-history`,
      providesTags: (_r, _e, id) => [{ type: 'Leads', id }],
    }),
    listLeadPool: builder.query<LeadPoolResponse, LeadPoolParams | void>({
      query: (params) =>
        `/leads/pool${toQuery({
          search: params?.search,
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
          source: params?.source,
          country: params?.country,
          createdFrom: params?.createdFrom,
          createdTo: params?.createdTo,
        })}`,
      providesTags: [{ type: 'Leads', id: 'POOL' }],
    }),
    listMyLeads: builder.query<MyLeadsResponse, MyLeadsParams | void>({
      query: (params) =>
        `/leads/mine${toQuery({
          search: params?.search,
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
          status: params?.status,
          source: params?.source,
          priority: params?.priority,
          country: params?.country,
          followUpStatus: params?.followUpStatus,
          sort: params?.sort && params.sort !== 'assigned' ? params.sort : undefined,
          order: params?.order,
        })}`,
      providesTags: [{ type: 'Leads', id: 'MINE' }],
    }),
    listLeadAssignees: builder.query<{ items: LeadAssignee[] }, { teamId?: string; search?: string; role?: string } | void>({
      query: (params) =>
        `/leads/assignees${toQuery({
          teamId: params?.teamId,
          search: params?.search,
          role: params?.role,
        })}`,
    }),
    listLeadAssignments: builder.query<{ items: LeadAssignmentHistoryItem[] }, string>({
      query: (id) => `/leads/${id}/assignments`,
      providesTags: (_r, _e, id) => [{ type: 'Leads', id }],
    }),
    listLeadDocuments: builder.query<{ items: LeadDocumentItem[] }, string>({
      query: (id) => `/leads/${id}/documents`,
      providesTags: (_r, _e, id) => [{ type: 'Leads', id: `${id}-documents` }],
    }),
    uploadLeadDocument: builder.mutation<
      { document: LeadDocumentItem },
      { id: string; fileName: string; file: File }
    >({
      query: ({ id, fileName, file }) => {
        const body = new FormData()
        body.set('fileName', fileName)
        body.set('file', file)
        return {
          url: `/leads/${id}/documents`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Leads', id: `${id}-documents` },
        { type: 'Leads', id },
        'Activities',
        'Documents',
      ],
    }),
    deleteLeadDocument: builder.mutation<{ message: string }, { id: string; documentId: string }>({
      query: ({ id, documentId }) => ({
        url: `/leads/${id}/documents/${documentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Leads', id: `${id}-documents` },
        { type: 'Leads', id },
        'Activities',
        'Documents',
      ],
    }),
    fetchLeadDocumentBlob: builder.query<
      { blob: Blob; mimeType: string },
      { id: string; documentId: string }
    >({
      query: ({ id, documentId }) => ({
        url: `/leads/${id}/documents/${documentId}`,
        responseHandler: async (response) => {
          const blob = await response.blob()
          return {
            blob,
            mimeType: response.headers.get('content-type') || blob.type,
          }
        },
      }),
    }),
    correctLeadSource: builder.mutation<
      { message: string },
      { id: string; body: { sourceCode: string; channelCode?: string; referralBy?: string; referralDetails?: string; reason: string } }
    >({
      query: ({ id, body }) => ({ url: `/leads/${id}/source-correction`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Leads', id }, 'Activities'],
    }),
    correctLeadCampaign: builder.mutation<{ message: string }, { id: string; body: { campaignId: string; reason: string } }>({
      query: ({ id, body }) => ({ url: `/leads/${id}/campaign-correction`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Leads', id }, 'Activities'],
    }),
    listAttributionChanges: builder.query<
      {
        items: Array<{
          id: string
          kind: 'SOURCE' | 'CAMPAIGN'
          previousValue: string | null
          nextValue: string | null
          reason: string
          changedBy: { id: string; name: string } | null
          createdAt: string
        }>
      },
      string
    >({
      query: (id) => `/leads/${id}/attribution-changes`,
      providesTags: (_r, _e, id) => [{ type: 'Leads', id }],
    }),
    handoverLead: builder.mutation<
      { message: string; leadId: string; ownerId: string },
      {
        id: string
        body: {
          counsellorId: string
          note?: {
            studentRequirement?: string
            preferredCountryCode?: string
            preferredIntakeCode?: string
            academicBackground?: string
            conversationSummary?: string
            importantConcern?: string
          }
        }
      }
    >({
      query: ({ id, body }) => ({ url: `/leads/${id}/handover`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Leads', id },
        ...LEAD_COLLECTION_TAGS,
        'Activities',
        'Dashboard',
        'Pipeline',
        'Notifications',
        'FollowUps',
      ],
    }),
    assignLead: builder.mutation<
      { lead: LeadRecord; message?: string },
      { id: string; body: { ownerId: string; reason?: string } }
    >({
      query: ({ id, body }) => ({ url: `/leads/${id}/assign`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Leads', id },
        ...LEAD_COLLECTION_TAGS,
        'Activities',
        'Dashboard',
        'Pipeline',
      ],
    }),
  }),
})

export const {
  useListLeadsQuery,
  useGetLeadQuery,
  useLazyGetLeadQuery,
  useCheckLeadDuplicateMutation,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useUpdateLeadQualificationMutation,
  useUpdateLeadPriorityMutation,
  useCreateLeadFollowUpMutation,
  useUpdateLeadStatusMutation,
  useCloseLeadMutation,
  useReopenLeadMutation,
  useListLeadStatusHistoryQuery,
  useListLeadPoolQuery,
  useListMyLeadsQuery,
  useListLeadAssigneesQuery,
  useListLeadAssignmentsQuery,
  useListLeadDocumentsQuery,
  useUploadLeadDocumentMutation,
  useDeleteLeadDocumentMutation,
  useLazyFetchLeadDocumentBlobQuery,
  useHandoverLeadMutation,
  useAssignLeadMutation,
  useCorrectLeadSourceMutation,
  useCorrectLeadCampaignMutation,
  useListAttributionChangesQuery,
} = leadsApi
