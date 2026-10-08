import { Alert, Button, Checkbox, DatePicker, Form, Input, InputNumber, Modal, Select, Space } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { getApiError } from '@/lib/api'
import { formatMoney } from '@/modules/packages/utils/offerCalculator'
import {
  useCreateOfferPaymentMutation,
  useListPaymentMethodsQuery,
} from '../api/paymentsApi'
import type { PaymentRecord } from '../types'

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
      <div className="mb-4 grid gap-1 text-sm text-text-muted">
        <p className="m-0">
          <span className="font-medium text-text-strong">Lead:</span> {leadName}{' '}
          <span className="mx-2">·</span>
          <span className="font-medium text-text-strong">Lead ID:</span> {leadCode}
        </p>
        <p className="m-0">
          <span className="font-medium text-text-strong">Service Offer:</span> {offerLabel}
        </p>
        <p className="m-0 mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <span>Final Payable: {formatMoney(finalPayable)}</span>
          <span>Previously Paid: {formatMoney(previouslyPaid)}</span>
          <span>Current Due: {formatMoney(currentDue)}</span>
        </p>
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
        <Form.Item
          name="amount"
          label="Payment Amount"
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
          <InputNumber className="w-full" min={0.01} step={100} precision={2} placeholder="0.00" />
        </Form.Item>

        <Form.Item
          name="methodCode"
          label="Payment Method"
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
          label={refLabel}
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
          label="Payment Date"
          rules={[{ required: true, message: 'Please select a valid payment date.' }]}
        >
          <DatePicker className="w-full" format="DD MMM YYYY" />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
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
