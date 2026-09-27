import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'
import type { PaymentRow } from '../types'

export type PaymentListParams = {
  search?: string
}

export type PaymentListResponse = {
  items: PaymentRow[]
  total: number
}

const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPayments: builder.query<PaymentListResponse, PaymentListParams | void>({
      query: (params) => `/pipeline/payments${toQuery({ search: params?.search })}`,
      providesTags: [{ type: 'Payments', id: 'LIST' }],
    }),
  }),
})

export const { useListPaymentsQuery } = paymentsApi
