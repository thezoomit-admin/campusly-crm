import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'

export type ApplicationListItem = {
  id: string
  code: string
  applicant: string
  university: string
  program: string
  intake: string
  counsellor: string
  status: string
  country?: string
  submitted: string
  leadId?: string | null
  leadCode?: string | null
  leadName?: string | null
  studentId?: string | null
  studentCode?: string | null
}

export type ApplicationRecord = {
  id: string
  code: string
  leadId: string | null
  studentId: string | null
  applicantName: string
  countryCode: string | null
  countryName: string | null
  university: string | null
  program: string | null
  intake: string | null
  counsellorName: string | null
  counsellorId: string | null
  status: string
  remarks: string | null
  submittedAt: string | null
  createdAt: string
  updatedAt: string
  allowedTransitions: string[]
  lead: { id: string; code: string; name: string; status: string } | null
  student: { id: string; studentCode: string; name: string; status: string } | null
  createdBy: { id: string; name: string } | null
  statusHistory: Array<{
    id: string
    previousStatus: string | null
    newStatus: string
    remarks: string | null
    createdAt: string
    createdBy: { id: string; name: string } | null
  }>
}

export type ApplicationNote = {
  id: string
  body: string
  createdAt: string
  createdBy: { id: string; name: string } | null
}

export type ApplicationDocument = {
  id: string
  code: string
  title: string
  categoryCode: string
  typeCode: string
  status: string
  source: string
  sourceDocumentId: string | null
  fileName: string | null
  mimeType: string | null
  fileSize: number | null
  remarks: string | null
  createdAt: string
  updatedAt: string
  createdBy: { id: string; name: string } | null
}

export type ApplicationActivity = {
  id: string
  type: string
  outcome: string | null
  notes: string | null
  occurredAt: string
  relatedType: string | null
  relatedId: string | null
  user: { id: string; name: string } | null
}

export type CreateApplicationBody = {
  university: string
  program: string
  intake: string
  countryCode?: string
  countryName?: string
  remarks?: string
  status?: string
}

export type ApplicationListParams = {
  search?: string
  leadId?: string
  studentId?: string
  counsellorId?: string
  status?: string
  page?: number
  limit?: number
}

export type ApplicationListResponse = {
  items: ApplicationListItem[]
  total: number
  page?: number
  limit?: number
}

const applicationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listApplications: builder.query<ApplicationListResponse, ApplicationListParams | void>({
      query: (params) =>
        `/applications${toQuery({
          search: params?.search,
          leadId: params?.leadId,
          studentId: params?.studentId,
          counsellorId: params?.counsellorId,
          status: params?.status,
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
        })}`,
      providesTags: [{ type: 'Applications', id: 'LIST' }],
    }),
    getApplication: builder.query<{ application: ApplicationRecord }, string>({
      query: (id) => `/applications/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Applications', id }],
    }),
    listLeadApplications: builder.query<ApplicationListResponse, string>({
      query: (leadId) => `/leads/${leadId}/applications`,
      providesTags: (_result, _error, leadId) => [
        { type: 'Applications', id: `LEAD-${leadId}` },
        { type: 'Applications', id: 'LIST' },
      ],
    }),
    createLeadApplication: builder.mutation<
      { application: ApplicationRecord },
      { leadId: string; body: CreateApplicationBody }
    >({
      query: ({ leadId, body }) => ({
        url: `/leads/${leadId}/applications`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, _error, arg) => [
        { type: 'Applications', id: 'LIST' },
        { type: 'Applications', id: `LEAD-${arg.leadId}` },
        { type: 'Leads', id: arg.leadId },
        { type: 'Students', id: 'LIST' },
        ...(result?.application.studentId
          ? [
              { type: 'Students' as const, id: result.application.studentId },
              {
                type: 'Applications' as const,
                id: `STUDENT-${result.application.studentId}`,
              },
            ]
          : []),
      ],
    }),
    updateApplicationStatus: builder.mutation<
      { application: ApplicationRecord },
      { id: string; status: string; remarks?: string }
    >({
      query: ({ id, status, remarks }) => ({
        url: `/applications/${id}/status`,
        method: 'PATCH',
        body: { status, remarks },
      }),
      invalidatesTags: (result, _error, arg) => [
        { type: 'Applications', id: arg.id },
        { type: 'Applications', id: 'LIST' },
        { type: 'Students', id: 'LIST' },
        ...(result?.application.studentId
          ? [{ type: 'Students' as const, id: result.application.studentId }]
          : []),
      ],
    }),
    listApplicationNotes: builder.query<{ items: ApplicationNote[] }, string>({
      query: (id) => `/applications/${id}/notes`,
      providesTags: (_result, _error, id) => [{ type: 'Applications', id: `NOTES-${id}` }],
    }),
    createApplicationNote: builder.mutation<
      { note: ApplicationNote },
      { id: string; body: string }
    >({
      query: ({ id, body }) => ({
        url: `/applications/${id}/notes`,
        method: 'POST',
        body: { body },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Applications', id: `NOTES-${arg.id}` },
        { type: 'Applications', id: `ACTIVITIES-${arg.id}` },
      ],
    }),
    listApplicationDocuments: builder.query<{ items: ApplicationDocument[] }, string>({
      query: (id) => `/applications/${id}/documents`,
      providesTags: (_result, _error, id) => [{ type: 'Applications', id: `DOCS-${id}` }],
    }),
    uploadApplicationDocument: builder.mutation<
      { document: ApplicationDocument },
      { id: string; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/applications/${id}/documents`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Applications', id: `DOCS-${arg.id}` },
        { type: 'Applications', id: `ACTIVITIES-${arg.id}` },
      ],
    }),
    attachSharedApplicationDocument: builder.mutation<
      { document: ApplicationDocument },
      { id: string; sourceDocumentId: string; remarks?: string }
    >({
      query: ({ id, sourceDocumentId, remarks }) => ({
        url: `/applications/${id}/documents/attach-shared`,
        method: 'POST',
        body: { sourceDocumentId, remarks },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Applications', id: `DOCS-${arg.id}` },
      ],
    }),
    updateApplicationDocumentStatus: builder.mutation<
      { document: ApplicationDocument },
      { id: string; documentId: string; status: string; remarks?: string }
    >({
      query: ({ id, documentId, status, remarks }) => ({
        url: `/applications/${id}/documents/${documentId}/status`,
        method: 'PATCH',
        body: { status, remarks },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Applications', id: `DOCS-${arg.id}` },
      ],
    }),
    listApplicationActivities: builder.query<{ items: ApplicationActivity[] }, string>({
      query: (id) => `/applications/${id}/activities`,
      providesTags: (_result, _error, id) => [{ type: 'Applications', id: `ACTIVITIES-${id}` }],
    }),
    listApplicationPayments: builder.query<Record<string, unknown>, string>({
      query: (id) => `/applications/${id}/payments`,
      providesTags: (_result, _error, id) => [{ type: 'Applications', id: `PAYMENTS-${id}` }],
    }),
  }),
})

export const {
  useListApplicationsQuery,
  useGetApplicationQuery,
  useListLeadApplicationsQuery,
  useCreateLeadApplicationMutation,
  useUpdateApplicationStatusMutation,
  useListApplicationNotesQuery,
  useCreateApplicationNoteMutation,
  useListApplicationDocumentsQuery,
  useUploadApplicationDocumentMutation,
  useAttachSharedApplicationDocumentMutation,
  useUpdateApplicationDocumentStatusMutation,
  useListApplicationActivitiesQuery,
  useListApplicationPaymentsQuery,
} = applicationsApi
