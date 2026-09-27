import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { StudentRow } from '../types'

export type StudentListParams = {
  search?: string
}

export type StudentListResponse = {
  items: StudentRow[]
  total: number
}

const studentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listStudents: builder.query<StudentListResponse, StudentListParams | void>({
      query: (params) => `/pipeline/students${toQuery({ search: params?.search })}`,
      providesTags: [{ type: 'Students', id: 'LIST' }],
    }),
  }),
})

export const { useListStudentsQuery } = studentsApi
