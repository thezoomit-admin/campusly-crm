import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { ApplicationListItem } from '@/modules/applications/api/applicationsApi'
import type { StudentDetail, StudentRow } from '../types'

export type StudentListParams = {
  search?: string
  page?: number
  limit?: number
}

export type StudentListResponse = {
  items: StudentRow[]
  total: number
  page?: number
  limit?: number
}

const studentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listStudents: builder.query<StudentListResponse, StudentListParams | void>({
      query: (params) =>
        `/pipeline/students${toQuery({
          search: params?.search,
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
        })}`,
      providesTags: [{ type: 'Students', id: 'LIST' }],
    }),
    getStudent: builder.query<{ student: StudentDetail }, string>({
      query: (id) => `/applications/students/${id}`,
      providesTags: (_result, _error, id) => [
        { type: 'Students', id },
        { type: 'Applications', id: `STUDENT-${id}` },
      ],
    }),
    listStudentApplications: builder.query<
      { items: ApplicationListItem[]; total: number },
      string
    >({
      query: (studentId) => `/applications${toQuery({ studentId })}`,
      providesTags: (_result, _error, studentId) => [
        { type: 'Applications', id: `STUDENT-${studentId}` },
        { type: 'Applications', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useListStudentsQuery,
  useGetStudentQuery,
  useListStudentApplicationsQuery,
} = studentsApi
