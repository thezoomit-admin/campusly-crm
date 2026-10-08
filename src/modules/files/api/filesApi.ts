import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'

export type FileDocumentAsset = {
  id: string
  fileName: string
  label: string | null
  mimeType: string
  fileSize: number
  isPrimary: boolean
  createdAt: string
}

export type FileDocumentVersion = {
  id: string
  versionNumber: number
  isLatest: boolean
  documentDate: string | null
  expiryDate: string | null
  expiryStatus: 'NONE' | 'VALID' | 'EXPIRING' | 'EXPIRED'
  remarks: string | null
  rejectionReasonCode: string | null
  rejectionReasonName: string | null
  rejectionRemarks: string | null
  verifiedBy: { id: string; name: string } | null
  verifiedAt: string | null
  verificationRemarks: string | null
  uploadedBy: { id: string; name: string } | null
  uploadedByKind: 'EMPLOYEE' | 'STUDENT_PORTAL'
  uploadedAt: string
  assets: FileDocumentAsset[]
}

export type FileDocumentRecord = {
  id: string
  code: string
  categoryCode: string
  categoryName: string
  typeCode: string
  typeName: string
  requirement: 'REQUIRED' | 'OPTIONAL' | null
  status: string
  statusLabel: string
  expiryStatus: string
  archivedAt: string | null
  latestVersion: FileDocumentVersion | null
  versions: FileDocumentVersion[]
  requests: Array<{
    id: string
    code: string
    method: string
    dueDate: string | null
    remarks: string | null
    status: string
    requestedAt: string
    requestedBy: { id: string; name: string } | null
    activityId: string | null
    communicationEventId: string | null
  }>
  activities: Array<{
    id: string
    action: string
    notes: string | null
    createdAt: string
    user: { id: string; name: string } | null
  }>
}

export type FileWorkspace = {
  available: boolean
  file: {
    id: string
    code: string
    leadId: string
    leadCode: string
    studentName: string
    status: string
    documentReadiness: string
    openedAt: string
  } | null
  summary: {
    total: number
    verified: number
    pending: number
    rejected: number
    required: number
    requested: number
    received: number
    underReview: number
    missing: number
    completionPercent: number
  } | null
  checklist: Array<{
    id: string
    categoryCode: string
    categoryName: string
    typeCode: string
    typeName: string
    isRequired: boolean
    isActive: boolean
    completed: boolean
    documentId: string | null
    status: string
  }>
  documents: FileDocumentRecord[]
  catalog: Array<{ typeCode: string | null; typeName: string; categoryCode: string; categoryName: string }>
  rejectionReasons: Array<{ code: string | null; name: string }>
}

export type FileDocumentListParams = {
  search?: string
  categoryCode?: string
  typeCode?: string
  status?: string
  uploadedById?: string
  verifiedById?: string
  expiryStatus?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

const fileTag = (leadId: string) => [{ type: 'FileDocuments' as const, id: leadId }, 'Documents' as const, 'Activities' as const]

const filesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFileWorkspace: builder.query<FileWorkspace, { leadId: string; archived?: boolean }>({
      query: ({ leadId, archived }) => `/files/lead/${leadId}${toQuery({ archived: archived ? '1' : undefined })}`,
      providesTags: (_r, _e, { leadId }) => [{ type: 'FileDocuments', id: leadId }],
    }),
    addFileChecklistItem: builder.mutation<FileWorkspace, { leadId: string; typeCode: string; isRequired: boolean }>({
      query: ({ leadId, typeCode, isRequired }) => ({
        url: `/files/lead/${leadId}/checklist`,
        method: 'POST',
        body: { typeCode, isRequired },
      }),
      invalidatesTags: (_r, _e, { leadId }) => fileTag(leadId),
    }),
    updateFileChecklistItem: builder.mutation<
      FileWorkspace,
      { leadId: string; itemId: string; isRequired?: boolean; remove?: boolean }
    >({
      query: ({ leadId, itemId, isRequired, remove }) => ({
        url: `/files/lead/${leadId}/checklist/${itemId}`,
        method: 'PATCH',
        body: { isRequired, remove },
      }),
      invalidatesTags: (_r, _e, { leadId }) => fileTag(leadId),
    }),
    uploadFileDocument: builder.mutation<
      { document: FileDocumentRecord },
      {
        leadId: string
        file: File
        typeCode?: string
        documentId?: string
        mode: 'create' | 'additional' | 'reupload'
        label?: string
        documentDate?: string
        expiryDate?: string
        remarks?: string
        primary?: boolean
      }
    >({
      query: ({ leadId, file, typeCode, documentId, mode, label, documentDate, expiryDate, remarks, primary }) => {
        const body = new FormData()
        body.set('file', file)
        body.set('mode', mode)
        if (typeCode) body.set('typeCode', typeCode)
        if (documentId) body.set('documentId', documentId)
        if (label) body.set('label', label)
        if (documentDate) body.set('documentDate', documentDate)
        if (expiryDate) body.set('expiryDate', expiryDate)
        if (remarks) body.set('remarks', remarks)
        if (primary) body.set('primary', 'true')
        return { url: `/files/lead/${leadId}/documents`, method: 'POST', body }
      },
      invalidatesTags: (_r, _e, { leadId }) => fileTag(leadId),
    }),
    requestFileDocument: builder.mutation<
      { document: FileDocumentRecord },
      { leadId: string; documentId: string; method: string; dueDate?: string; remarks?: string }
    >({
      query: ({ leadId, documentId, method, dueDate, remarks }) => ({
        url: `/files/lead/${leadId}/documents/${documentId}/request`,
        method: 'POST',
        body: { method, dueDate, remarks },
      }),
      invalidatesTags: (_r, _e, { leadId }) => fileTag(leadId),
    }),
    reviewFileDocument: builder.mutation<{ document: FileDocumentRecord }, { leadId: string; documentId: string }>({
      query: ({ leadId, documentId }) => ({
        url: `/files/lead/${leadId}/documents/${documentId}/review`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, { leadId }) => fileTag(leadId),
    }),
    verifyFileDocument: builder.mutation<
      { document: FileDocumentRecord },
      { leadId: string; documentId: string; remarks?: string }
    >({
      query: ({ leadId, documentId, remarks }) => ({
        url: `/files/lead/${leadId}/documents/${documentId}/verify`,
        method: 'POST',
        body: { remarks },
      }),
      invalidatesTags: (_r, _e, { leadId }) => fileTag(leadId),
    }),
    rejectFileDocument: builder.mutation<
      { document: FileDocumentRecord },
      { leadId: string; documentId: string; reasonCode: string; remarks?: string }
    >({
      query: ({ leadId, documentId, reasonCode, remarks }) => ({
        url: `/files/lead/${leadId}/documents/${documentId}/reject`,
        method: 'POST',
        body: { reasonCode, remarks },
      }),
      invalidatesTags: (_r, _e, { leadId }) => fileTag(leadId),
    }),
    archiveFileDocument: builder.mutation<{ message: string }, { leadId: string; documentId: string }>({
      query: ({ leadId, documentId }) => ({
        url: `/files/lead/${leadId}/documents/${documentId}/archive`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, { leadId }) => fileTag(leadId),
    }),
    setPrimaryFileAsset: builder.mutation<
      { document: FileDocumentRecord },
      { leadId: string; documentId: string; assetId: string }
    >({
      query: ({ leadId, documentId, assetId }) => ({
        url: `/files/lead/${leadId}/documents/${documentId}/assets/${assetId}/primary`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, { leadId }) => fileTag(leadId),
    }),
    fetchFileDocumentBlob: builder.query<
      { blob: Blob; mimeType: string },
      { leadId: string; documentId: string; assetId?: string; download?: boolean }
    >({
      query: ({ leadId, documentId, assetId, download }) => ({
        url: `/files/lead/${leadId}/documents/${documentId}/content${toQuery({
          assetId,
          download: download ? '1' : undefined,
        })}`,
        responseHandler: async (response) => {
          const blob = await response.blob()
          return { blob, mimeType: response.headers.get('content-type') || blob.type }
        },
      }),
    }),
    listFileDocuments: builder.query<
      {
        items: Array<{
          id: string
          code: string
          fileId: string
          fileCode: string
          leadId: string
          leadCode: string
          owner: string
          leadName: string
          type: string
          typeCode: string
          category: string
          categoryCode: string
          uploadedBy: string
          verifiedBy: string
          status: string
          statusCode: string
          expiryStatus: string
          updated: string
          createdAt: string
        }>
        total: number
        page: number
        limit: number
      },
      FileDocumentListParams | void
    >({
      query: (params) =>
        `/files/documents${toQuery({
          search: params?.search,
          categoryCode: params?.categoryCode,
          typeCode: params?.typeCode,
          status: params?.status,
          uploadedById: params?.uploadedById,
          verifiedById: params?.verifiedById,
          expiryStatus: params?.expiryStatus,
          dateFrom: params?.dateFrom,
          dateTo: params?.dateTo,
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
        })}`,
      providesTags: [{ type: 'FileDocuments', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetFileWorkspaceQuery,
  useAddFileChecklistItemMutation,
  useUpdateFileChecklistItemMutation,
  useUploadFileDocumentMutation,
  useRequestFileDocumentMutation,
  useReviewFileDocumentMutation,
  useVerifyFileDocumentMutation,
  useRejectFileDocumentMutation,
  useArchiveFileDocumentMutation,
  useSetPrimaryFileAssetMutation,
  useLazyFetchFileDocumentBlobQuery,
  useListFileDocumentsQuery,
} = filesApi
