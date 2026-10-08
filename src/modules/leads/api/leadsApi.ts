import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type {
  DuplicateLead,
  LeadAssignee,
  LeadAssignmentHistoryItem,
  LeadDocumentChecklist,
  LeadDocumentItem,
  LeadListSummary,
  LeadNoteItem,
  LeadPoolRow,
  LeadRecord,
  LeadRow,
  LeadStatusHistoryItem,
  MyLeadRow,
  MyLeadsSummary,
} from '../types'

export type UploadLeadDocumentBody = {
  id: string
  file: File
  categoryCode: string
  typeCode: string
  name: string
  fileName?: string
  documentDate?: string
  expiryDate?: string
  remarks?: string
  duplicateAction?: 'replace' | 'new_version'
}

export type LeadListParams = {
  search?: string
  page?: number
  limit?: number
  status?: string
  source?: string
  priority?: string
  country?: string
  duplicatesOnly?: boolean
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
          duplicatesOnly: params?.duplicatesOnly ? 'true' : undefined,
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
    previewLeadAssignment: builder.query<
      {
        assignment: {
          ownerId: string | null
          ownerName: string | null
          teamId: string | null
          teamName: string | null
        }
      },
      string
    >({
      query: (countryCode) => `/leads/assignment-preview${toQuery({ countryCode })}`,
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
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Leads', id }, ...LEAD_COLLECTION_TAGS, 'Activities'],
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
    listLeadNotes: builder.query<{ items: LeadNoteItem[] }, string>({
      query: (id) => `/leads/${id}/notes`,
      providesTags: (_r, _e, id) => [{ type: 'Leads', id: `${id}-notes` }],
    }),
    createLeadNote: builder.mutation<
      { note: LeadNoteItem },
      { id: string; body: string; skipActivity?: boolean }
    >({
      query: ({ id, body, skipActivity }) => ({
        url: `/leads/${id}/notes`,
        method: 'POST',
        body: { body, skipActivity: Boolean(skipActivity) },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Leads', id: `${id}-notes` },
        { type: 'Leads', id },
        'Activities',
      ],
    }),
    listLeadDocuments: builder.query<
      { items: LeadDocumentItem[] },
      string | { id: string; archived?: boolean; includeHistory?: boolean }
    >({
      query: (arg) => {
        if (typeof arg === 'string') return `/leads/${arg}/documents`
        return `/leads/${arg.id}/documents${toQuery({
          archived: arg.archived ? '1' : undefined,
          includeHistory: arg.includeHistory ? '1' : undefined,
        })}`
      },
      providesTags: (_r, _e, arg) => [
        { type: 'Leads', id: `${typeof arg === 'string' ? arg : arg.id}-documents` },
      ],
    }),
    getLeadDocumentChecklist: builder.query<LeadDocumentChecklist, string>({
      query: (id) => `/leads/${id}/documents/checklist`,
      providesTags: (_r, _e, id) => [{ type: 'Leads', id: `${id}-documents` }],
    }),
    uploadLeadDocument: builder.mutation<{ document: LeadDocumentItem }, UploadLeadDocumentBody>({
      query: ({ id, file, categoryCode, typeCode, name, fileName, documentDate, expiryDate, remarks, duplicateAction }) => {
        const body = new FormData()
        body.set('file', file)
        body.set('categoryCode', categoryCode)
        body.set('typeCode', typeCode)
        body.set('name', name)
        body.set('fileName', fileName || file.name)
        if (documentDate) body.set('documentDate', documentDate)
        if (expiryDate) body.set('expiryDate', expiryDate)
        if (remarks) body.set('remarks', remarks)
        if (duplicateAction) body.set('duplicateAction', duplicateAction)
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
    verifyLeadDocument: builder.mutation<
      { document: LeadDocumentItem },
      { id: string; documentId: string; remarks?: string }
    >({
      query: ({ id, documentId, remarks }) => ({
        url: `/leads/${id}/documents/${documentId}/verify`,
        method: 'POST',
        body: { remarks },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Leads', id: `${id}-documents` },
        'Activities',
        'Documents',
      ],
    }),
    rejectLeadDocument: builder.mutation<
      { document: LeadDocumentItem },
      { id: string; documentId: string; reason: string }
    >({
      query: ({ id, documentId, reason }) => ({
        url: `/leads/${id}/documents/${documentId}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Leads', id: `${id}-documents` },
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
    getLeadDocumentHistory: builder.query<
      {
        document: LeadDocumentItem
        versions: LeadDocumentItem[]
        activities: Array<{
          id: string
          action: string
          notes: string | null
          createdAt: string
          user: { id: string; name: string } | null
        }>
      },
      { id: string; documentId: string }
    >({
      query: ({ id, documentId }) => `/leads/${id}/documents/${documentId}/history`,
    }),
    fetchLeadDocumentBlob: builder.query<
      { blob: Blob; mimeType: string },
      { id: string; documentId: string; download?: boolean }
    >({
      query: ({ id, documentId, download }) => ({
        url: `/leads/${id}/documents/${documentId}${toQuery({ download: download ? '1' : undefined })}`,
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
    reviewDuplicateLead: builder.mutation<
      { lead?: LeadRecord; message: string },
      { id: string; action: 'keep' | 'cancel_duplicate' | 'archive' | 'delete' }
    >({
      query: ({ id, action }) => ({
        url: `/leads/${id}/duplicate-review`,
        method: 'POST',
        body: { action },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Leads', id },
        ...LEAD_COLLECTION_TAGS,
        'Activities',
        'Dashboard',
        'Pipeline',
        'FollowUps',
      ],
    }),
  }),
})

export const {
  useListLeadsQuery,
  useGetLeadQuery,
  useLazyGetLeadQuery,
  useCheckLeadDuplicateMutation,
  usePreviewLeadAssignmentQuery,
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
  useListLeadNotesQuery,
  useCreateLeadNoteMutation,
  useListLeadDocumentsQuery,
  useGetLeadDocumentChecklistQuery,
  useUploadLeadDocumentMutation,
  useVerifyLeadDocumentMutation,
  useRejectLeadDocumentMutation,
  useDeleteLeadDocumentMutation,
  useGetLeadDocumentHistoryQuery,
  useLazyGetLeadDocumentHistoryQuery,
  useLazyFetchLeadDocumentBlobQuery,
  useHandoverLeadMutation,
  useAssignLeadMutation,
  useReviewDuplicateLeadMutation,
  useCorrectLeadSourceMutation,
  useCorrectLeadCampaignMutation,
  useListAttributionChangesQuery,
} = leadsApi
