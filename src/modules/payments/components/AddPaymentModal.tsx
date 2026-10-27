import { Alert, Button, Checkbox, DatePicker, Form, Input, InputNumber, Modal, Select, Space } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Invoice01Icon, UserIcon } from '@hugeicons/core-free-icons'
import { toast } from 'react-toastify'
import { getApiError } from '@/lib/api'
import { formatMoney } from '@/modules/packages/utils/offerCalculator'
import {
  useCreateOfferPaymentMutation,
  useListPaymentMethodsQuery,
} from '../api/paymentsApi'
import type { PaymentRecord } from '../types'

function RequiredMark() {
  return <span className="text-[#ef4444]"> *</span>
}

function FieldLabel({
  children,
  required,
}: {
  children: ReactNode
  required?: boolean
}) {
  return (
    <span>
      {children}
      {required ? <RequiredMark /> : null}
    </span>
  )
}

function InfoBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-full bg-white/80 px-2.5 py-0.5 text-[0.75rem] font-semibold text-[#17324f] ring-1 ring-[#d5e8dc] dark:bg-emerald-900/40 dark:text-text-strong dark:ring-emerald-800/60">
      {children}
    </span>
  )
}

type AddPaymentModalProps = {
  open: boolean
  onClose: () => void
  leadId: string
  leadName: string
  leadCode: string
  offerId: string
  offerLabel: string
  finalPayable: string
  previouslyPaid: string
  currentDue: string
  onSuccess?: (result: {
    payment: PaymentRecord | null
    followUpOffered?: boolean
    followUpCreated?: boolean
    receiptId?: string | null
  }) => void
}

export default function AddPaymentModal({
  open,
  onClose,
  leadId,
  leadName,
  leadCode,
  offerId,
  offerLabel,
  finalPayable,
  previouslyPaid,
  currentDue,
  onSuccess,
}: AddPaymentModalProps) {
  const [form] = Form.useForm()
  const { data: methodsData } = useListPaymentMethodsQuery()
  const [createPayment, { isLoading }] = useCreateOfferPaymentMutation()
  const [duplicate, setDuplicate] = useState<{
    id: string
    paymentNumber: string
    leadCode: string
    studentName: string
  } | null>(null)
  const [createFollowUp, setCreateFollowUp] = useState(false)

  const methods = methodsData?.items || []
  const methodCode = Form.useWatch('methodCode', form)
  const amount = Form.useWatch('amount', form)
  const selectedMethod = methods.find((item) => item.code === methodCode)
  const due = Number(currentDue) || 0
  const remaining = Math.max(0, due - (Number(amount) || 0))

  useEffect(() => {
    if (!open) return
    form.setFieldsValue({
      amount: undefined,
      methodCode: undefined,
      transactionRef: undefined,
      paymentDate: dayjs(),
      notes: undefined,
    })
    setDuplicate(null)
    setCreateFollowUp(false)
  }, [open, form])

  const refLabel = useMemo(() => {
    if (!selectedMethod) return 'Transaction / Reference No.'
    if (selectedMethod.requiresDescription) return 'Description'
    if (selectedMethod.code === 'CASH') return 'Reference No. (optional)'
    return 'Transaction / Reference No.'
  }, [selectedMethod])

  const refRequired = Boolean(
    selectedMethod?.requiresTransaction || selectedMethod?.requiresDescription,
  )

  async function submit(generateReceipt: boolean, allowDuplicate = false) {
    try {
      const values = await form.validateFields()
      const result = await createPayment({
        leadId,
        offerId,
        body: {
          amount: values.amount,
          methodCode: values.methodCode,
          transactionRef: values.transactionRef?.trim() || undefined,
          paymentDate: values.paymentDate
            ? dayjs(values.paymentDate).format('YYYY-MM-DD')
            : undefined,
          notes: values.notes?.trim() || undefined,
          generateReceipt,
          createFollowUp: createFollowUp && remaining > 0,
          allowDuplicateTransaction: allowDuplicate,
        },
      }).unwrap()
      toast.success(result.message)
      if (result.followUpCreated) {
        toast.info('Payment follow-up created for the remaining due.')
      }
      onSuccess?.({
        payment: result.payment,
        followUpOffered: result.followUpOffered,
        followUpCreated: result.followUpCreated,
        receiptId: result.receipt?.id || result.payment?.receipt?.id || null,
      })
      onClose()
    } catch (error) {
      const err = error as {
        status?: number
        data?: {
          code?: string
          error?: string
          existingPayment?: {
            id: string
            paymentNumber: string
            leadCode: string
            studentName: string
          }
        }
      }
      if (err?.data?.code === 'DUPLICATE_TRANSACTION' && err.data.existingPayment) {
        setDuplicate(err.data.existingPayment)
        return
      }
      toast.error(getApiError(error, 'Unable to process the payment. Please try again.'))
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Add Payment"
      width={640}
      footer={null}
      destroyOnHidden
    >
      <div className="mb-4 grid gap-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-[#eef8f3] px-3.5 py-2.5 text-[0.84rem] dark:bg-emerald-950/35">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#17324f] dark:text-text-strong">
            <HugeiconsIcon
              icon={UserIcon}
              size={16}
              color="#129a62"
              strokeWidth={1.8}
            />
            Lead Details
          </span>
          <span className="text-[#c5d5c9]">|</span>
          <InfoBadge>Lead: {leadName}</InfoBadge>
          <InfoBadge>Lead ID: {leadCode}</InfoBadge>
          <InfoBadge>Service Offer: {offerLabel}</InfoBadge>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-[#eef8f3] px-3.5 py-2.5 text-[0.84rem] dark:bg-emerald-950/35">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#17324f] dark:text-text-strong">
            <HugeiconsIcon
              icon={Invoice01Icon}
              size={16}
              color="#129a62"
              strokeWidth={1.8}
            />
            Payment Details
          </span>
          <span className="text-[#c5d5c9]">|</span>
          <InfoBadge>Final Payable: {formatMoney(finalPayable)}</InfoBadge>
          <InfoBadge>Previously Paid: {formatMoney(previouslyPaid)}</InfoBadge>
          <InfoBadge>Current Due: {formatMoney(currentDue)}</InfoBadge>
        </div>
      </div>

      {duplicate ? (
        <Alert
          className="mb-4"
          type="warning"
          showIcon
          message="This transaction number has already been used"
          description={`Existing payment ${duplicate.paymentNumber} for ${duplicate.studentName} (${duplicate.leadCode}).`}
          action={
            <Space direction="vertical">
              <Button size="small" onClick={() => setDuplicate(null)}>
                Cancel
              </Button>
              <Button size="small" type="primary" onClick={() => void submit(false, true)}>
                Save anyway
              </Button>
            </Space>
          }
        />
      ) : null}

      <Form form={form} layout="vertical" requiredMark={false}>
        <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
          <Form.Item
            name="amount"
            label={<FieldLabel required>Payment Amount</FieldLabel>}
            rules={[
              { required: true, message: 'Payment amount is required.' },
              {
                validator: async (_, value) => {
                  if (value == null || value === '') return
                  if (Number(value) <= 0) throw new Error('Please enter a valid payment amount.')
                  if (Number(value) > due) {
                    throw new Error('Payment amount cannot exceed the current due amount.')
                  }
                },
              },
            ]}
          >
            <InputNumber
              className="w-full"
              style={{ width: '100%' }}
              min={0.01}
              step={100}
              precision={2}
              placeholder="0.00"
            />
          </Form.Item>

          <Form.Item
            name="methodCode"
            label={<FieldLabel required>Payment Method</FieldLabel>}
            rules={[{ required: true, message: 'Please select a payment method.' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select method"
              options={methods.map((item) => ({ value: item.code, label: item.name }))}
            />
          </Form.Item>

          <Form.Item
            name="transactionRef"
            label={<FieldLabel required={refRequired}>{refLabel}</FieldLabel>}
            rules={[
              {
                validator: async (_, value) => {
                  if (!selectedMethod) return
                  const text = String(value || '').trim()
                  if (selectedMethod.requiresTransaction && !text) {
                    throw new Error('Transaction ID is required for this payment method.')
                  }
                  if (selectedMethod.requiresDescription && !text) {
                    throw new Error('Description is required for this payment method.')
                  }
                },
              },
            ]}
          >
            <Input placeholder={refLabel} maxLength={120} />
          </Form.Item>

          <Form.Item
            name="paymentDate"
            label={<FieldLabel required>Payment Date</FieldLabel>}
            rules={[{ required: true, message: 'Please select a valid payment date.' }]}
          >
            <DatePicker className="w-full" format="DD MMM YYYY" />
          </Form.Item>
        </div>

        <Form.Item name="notes" label={<FieldLabel>Notes</FieldLabel>}>
          <Input.TextArea rows={3} maxLength={500} showCount placeholder="Optional notes" />
        </Form.Item>
      </Form>

      <div className="mb-4 flex flex-wrap gap-x-4 text-sm">
        <span>
          Current Payment:{' '}
          <strong>{formatMoney(Number(amount) || 0)}</strong>
        </span>
        <span>
          Remaining Due: <strong>{formatMoney(remaining)}</strong>
        </span>
      </div>

      {remaining > 0 && Number(amount) > 0 ? (
        <div className="mb-4">
          <Checkbox checked={createFollowUp} onChange={(e) => setCreateFollowUp(e.target.checked)}>
            Create Payment Follow-up for remaining due
          </Checkbox>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button loading={isLoading} onClick={() => void submit(false)}>
          Save Payment
        </Button>
        <Button type="primary" loading={isLoading} onClick={() => void submit(true)}>
          Save & Generate Receipt
        </Button>
      </div>
    </Modal>
  )
}
