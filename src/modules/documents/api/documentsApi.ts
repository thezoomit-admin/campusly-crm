import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { DocumentRow, DocumentSummary } from '../types'

export type DocumentListParams = {
  search?: string
  categoryCode?: string
  status?: string
  verified?: string
  expired?: string
  missing?: string
  uploadedById?: string
  ownerId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export type DocumentListResponse = {
  items: DocumentRow[]
  total: number
  page?: number
  limit?: number
  summary?: DocumentSummary
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
          uploadedById: params?.uploadedById,
          ownerId: params?.ownerId,
          dateFrom: params?.dateFrom,
          dateTo: params?.dateTo,
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
        })}`,
      providesTags: [{ type: 'Documents', id: 'LIST' }],
    }),
  }),
})

export const { useListDocumentsQuery } = documentsApi
