export type PaymentTxnStatus =
  | 'COMPLETED'
  | 'PENDING'
  | 'FAILED'
  | 'CANCELLED'
  | 'REVERSED'

export type PaymentMethodOption = {
  code: string
  name: string
  requiresTransaction: boolean
  requiresDescription: boolean
}

export type PaymentAllocation = {
  id: string
  installmentId: string | null
  offerItemId: string | null
  label: string
  amount: string
}

export type PaymentRecord = {
  id: string
  paymentNumber: string
  leadId: string
  leadCode: string
  studentName: string
  serviceOfferId: string
  offerVersion: number
  packageName: string | null
  offerStatus: string
  finalPayable: string
  amount: string
  currency: string
  methodCode: string
  methodName: string
  transactionRef: string | null
  paymentDate: string
  notes: string | null
  status: PaymentTxnStatus
  previousPaidAmount: string
  remainingDueAmount: string
  receivedBy: { id: string; fullName: string }
  receipt: {
    id: string
    receiptNumber: string
    status: string
    generatedAt: string
  } | null
  allocations: PaymentAllocation[]
  cancelReason: string | null
  cancelledAt: string | null
  cancelledBy: { id: string; fullName: string } | null
  reverseReason: string | null
  reversedAt: string | null
  reversedBy: { id: string; fullName: string } | null
  createdAt: string
}

export type ReceiptSnapshot = {
  consultancyName: string
  receiptNumber: string
  paymentDate: string
  studentName: string
  leadCode: string
  paymentFor: string
  paymentAmount: string
  paymentMethod: string
  transactionRef: string | null
  totalPayable: string
  previouslyPaid: string
  thisPayment: string
  remainingDue: string
  receivedBy: string
  paymentNumber: string
  currency: string
}

export type ReceiptRecord = {
  id: string
  receiptNumber: string
  status: string
  snapshot: ReceiptSnapshot | Record<string, unknown>
  generatedAt: string
  generatedBy?: { id: string; fullName: string } | null
  paymentId?: string
  paymentNumber?: string
}

export type CreatePaymentBody = {
  amount: number | string
  methodCode: string
  transactionRef?: string
  paymentDate?: string
  notes?: string
  status?: PaymentTxnStatus
  generateReceipt?: boolean
  createFollowUp?: boolean
  allowDuplicateTransaction?: boolean
  allocations?: Array<{
    installmentId?: string
    offerItemId?: string
    label?: string
    amount: number
  }>
}

export type PaymentListParams = {
  search?: string
  methodCode?: string
  status?: string
  receivedById?: string
  packageName?: string
  dateFrom?: string
  dateTo?: string
  amountMin?: string
  amountMax?: string
  page?: number
  limit?: number
}

export type PaymentCollectionSummary = {
  todayCollection: string
  monthCollection: string
  pendingDue: string
  partialPayments: number
  completedPayments: number
  pendingTransactions: number
  currency: 'BDT'
  byEmployee: Array<{ userId: string; name: string; amount: string }>
}

/** Legacy list-row shape still used by the pipeline bridge. */
export type PaymentRow = Record<string, string | null | undefined>

export type PaymentFormValues = {
  amount: string
  methodCode: string
  transactionRef?: string
  paymentDate?: string
  notes?: string
}
