import { Button, Form } from 'antd'
import { FormInput } from '@/components/common/Forms'
import { AntModal } from '@/components/common/Modals'
import type { LeadFormValues } from '../types'

type LeadFormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (values: LeadFormValues) => void
}

export default function LeadFormModal({ open, onClose, onSubmit }: LeadFormModalProps) {
  const [form] = Form.useForm<LeadFormValues>()

  return (
    <AntModal open={open} onClose={onClose} title="Add lead" width={520}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSubmit?.(values)
          form.resetFields()
          onClose()
        }}
      >
        <FormInput name="name" label="Lead name" rules={[{ required: true, message: 'Name is required' }]} placeholder="Full name" />
        <FormInput name="phone" label="Phone" placeholder="Phone number" />
        <FormInput name="country" label="Country" placeholder="Preferred country" />
        <FormInput name="source" label="Source" placeholder="e.g. Facebook, Walk-in" />
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
