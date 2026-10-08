import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type {
  CreatePaymentBody,
  PaymentCollectionSummary,
  PaymentListParams,
  PaymentMethodOption,
  PaymentRecord,
  ReceiptRecord,
} from '../types'

export type PaymentListResponse = {
  items: PaymentRecord[]
  total: number
  page: number
  limit: number
}

export type LeadPaymentHistoryResponse = {
  summary: {
    finalPayable: string
    paidAmount: string
    dueAmount: string
    currency: 'BDT'
    paymentStatus: string | null
    activeOffer: {
      id: string
      offerVersion: number
      status: string
      packageName: string | null
    } | null
  }
  permissions: {
    canRecordPayment: boolean
    canCancelPayment: boolean
    canGenerateReceipt: boolean
    canViewReceipt: boolean
  }
  payments: PaymentRecord[]
  items: Array<{
    id: string
    offerId: string
    offerVersion: number
    packageName: string | null
    offerStatus: string
    sequence: number
    purpose: string
    amount: string
    dueDate: string | null
    status: 'PAID' | 'PENDING' | 'PARTIAL'
    paidAt: string | null
    paidBy: { id: string; fullName: string } | null
    canRecord: boolean
  }>
  leadStatusChanged?: boolean
}

const paymentInvalidate = (leadId?: string) => [
  { type: 'Payments' as const, id: 'LIST' },
  { type: 'Payments' as const, id: 'SUMMARY' },
  ...(leadId
    ? [
        { type: 'LeadPayments' as const, id: leadId },
        { type: 'ServiceOffers' as const, id: leadId },
        { type: 'Leads' as const, id: leadId },
      ]
    : []),
  'Activities' as const,
  'FollowUps' as const,
  'Dashboard' as const,
]

const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPayments: builder.query<PaymentListResponse, PaymentListParams | void>({
      query: (params) =>
        `/payments${toQuery({
          search: params?.search,
          methodCode: params?.methodCode,
          status: params?.status,
          receivedById: params?.receivedById,
          packageName: params?.packageName,
          dateFrom: params?.dateFrom,
          dateTo: params?.dateTo,
          amountMin: params?.amountMin,
          amountMax: params?.amountMax,
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
        })}`,
      providesTags: [{ type: 'Payments', id: 'LIST' }],
    }),
    listPaymentMethods: builder.query<{ items: PaymentMethodOption[] }, void>({
      query: () => '/payments/methods',
    }),
    getPaymentCollectionSummary: builder.query<PaymentCollectionSummary, void>({
      query: () => '/payments/summary',
      providesTags: [{ type: 'Payments', id: 'SUMMARY' }],
    }),
    getPayment: builder.query<{ payment: PaymentRecord }, string>({
      query: (id) => `/payments/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Payments', id }],
    }),
    getReceipt: builder.query<{ receipt: ReceiptRecord }, string>({
      query: (id) => `/receipts/${id}`,
    }),
    listLeadPaymentHistory: builder.query<LeadPaymentHistoryResponse, string>({
      query: (leadId) => `/leads/${leadId}/payments`,
      providesTags: (_r, _e, leadId) => [{ type: 'LeadPayments', id: leadId }],
    }),
    createOfferPayment: builder.mutation<
      {
        payment: PaymentRecord | null
        receipt: ReceiptRecord | null
        followUpOffered?: boolean
        followUpCreated?: boolean
        message: string
      },
      { leadId: string; offerId: string; body: CreatePaymentBody }
    >({
      query: ({ leadId, offerId, body }) => ({
        url: `/leads/${leadId}/payments/offers/${offerId}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { leadId }) => paymentInvalidate(leadId),
    }),
    cancelPayment: builder.mutation<
      { payment: PaymentRecord | null; message: string },
      { paymentId: string; reason: string; leadId?: string }
    >({
      query: ({ paymentId, reason }) => ({
        url: `/payments/${paymentId}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_r, _e, arg) => paymentInvalidate(arg.leadId),
    }),
    reversePayment: builder.mutation<
      { payment: PaymentRecord | null; message: string },
      { paymentId: string; reason: string; leadId?: string }
    >({
      query: ({ paymentId, reason }) => ({
        url: `/payments/${paymentId}/reverse`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_r, _e, arg) => paymentInvalidate(arg.leadId),
    }),
    generatePaymentReceipt: builder.mutation<
      { receipt: ReceiptRecord; payment: PaymentRecord | null; message: string },
      { paymentId: string; leadId?: string }
    >({
      query: ({ paymentId }) => ({
        url: `/payments/${paymentId}/receipt`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, arg) => paymentInvalidate(arg.leadId),
    }),
  }),
})

export const {
  useListPaymentsQuery,
  useListPaymentMethodsQuery,
  useGetPaymentCollectionSummaryQuery,
  useGetPaymentQuery,
  useGetReceiptQuery,
  useLazyGetReceiptQuery,
  useListLeadPaymentHistoryQuery,
  useCreateOfferPaymentMutation,
  useCancelPaymentMutation,
  useReversePaymentMutation,
  useGeneratePaymentReceiptMutation,
} = paymentsApi
