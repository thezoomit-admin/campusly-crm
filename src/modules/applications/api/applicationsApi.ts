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
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Applications', id: 'LIST' },
        { type: 'Applications', id: `LEAD-${arg.leadId}` },
        { type: 'Leads', id: arg.leadId },
        { type: 'Students', id: 'LIST' },
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
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Applications', id: arg.id },
        { type: 'Applications', id: 'LIST' },
        { type: 'Students', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useListApplicationsQuery,
  useGetApplicationQuery,
  useListLeadApplicationsQuery,
  useCreateLeadApplicationMutation,
  useUpdateApplicationStatusMutation,
} = applicationsApi
