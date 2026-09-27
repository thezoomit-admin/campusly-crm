import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { DocumentRow } from '../types'

export type DocumentListParams = {
  search?: string
}

export type DocumentListResponse = {
  items: DocumentRow[]
  total: number
}

const documentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listDocuments: builder.query<DocumentListResponse, DocumentListParams | void>({
      query: (params) => `/pipeline/documents${toQuery({ search: params?.search })}`,
      providesTags: [{ type: 'Documents', id: 'LIST' }],
    }),
  }),
})

export const { useListDocumentsQuery } = documentsApi
