import { Button, Form } from 'antd'
import { FormInput } from '@/components/common/Forms'
import { AntModal } from '@/components/common/Modals'
import type { PaymentFormValues } from '../types'

type PaymentFormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (values: PaymentFormValues) => void
}

export default function PaymentFormModal({ open, onClose, onSubmit }: PaymentFormModalProps) {
  const [form] = Form.useForm<PaymentFormValues>()

  return (
    <AntModal open={open} onClose={onClose} title="Add payment" width={520}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSubmit?.(values)
          form.resetFields()
          onClose()
        }}
      >
        <FormInput name="invoice" label="Invoice" rules={[{ required: true, message: 'Invoice is required' }]} placeholder="Invoice number" />
        <FormInput name="payer" label="Payer" placeholder="Payer name" />
        <FormInput name="type" label="Type" placeholder="e.g. Tuition, Service fee" />
        <FormInput name="amount" label="Amount" placeholder="Amount" />
        <div className="mt-2 flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit">
            Save
          </Button>
        </div>
      </Form>
    </AntModal>
  )
}
