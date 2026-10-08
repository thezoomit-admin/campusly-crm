import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { DocumentRow } from '../types'

export type DocumentListParams = {
  search?: string
  categoryCode?: string
  status?: string
  verified?: string
  expired?: string
  missing?: string
  page?: number
  limit?: number
}

export type DocumentListResponse = {
  items: DocumentRow[]
  total: number
  page?: number
  limit?: number
}

const documentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listDocuments: builder.query<DocumentListResponse, DocumentListParams | void>({
      query: (params) =>
        `/pipeline/documents${toQuery({
          search: params?.search,
          categoryCode: params?.categoryCode,
          status: params?.status,
          verified: params?.verified,
          expired: params?.expired,
          missing: params?.missing,
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
        })}`,
      providesTags: [{ type: 'Documents', id: 'LIST' }],
    }),
  }),
})

export const { useListDocumentsQuery } = documentsApi
