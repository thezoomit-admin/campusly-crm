import { Button, Form } from 'antd'
import { FormInput } from '@/components/common/Forms'
import { AntModal } from '@/components/common/Modals'
import type { FollowUpFormValues } from '../types'

type FollowUpFormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (values: FollowUpFormValues) => void
}

export default function FollowUpFormModal({ open, onClose, onSubmit }: FollowUpFormModalProps) {
  const [form] = Form.useForm<FollowUpFormValues>()

  return (
    <AntModal open={open} onClose={onClose} title="Add follow-up" width={520}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSubmit?.(values)
          form.resetFields()
          onClose()
        }}
      >
        <FormInput name="contact" label="Contact" rules={[{ required: true, message: 'Contact is required' }]} placeholder="Contact name" />
        <FormInput name="type" label="Type" placeholder="Call, Email, Visit…" />
        <FormInput name="owner" label="Owner" placeholder="Assigned to" />
        <FormInput name="due" label="Due" placeholder="Due date" />
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
