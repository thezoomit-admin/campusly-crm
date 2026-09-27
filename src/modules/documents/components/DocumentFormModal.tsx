import { Button, Form } from 'antd'
import { FormInput } from '@/components/common/Forms'
import { AntModal } from '@/components/common/Modals'
import type { DocumentFormValues } from '../types'

type DocumentFormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (values: DocumentFormValues) => void
}

export default function DocumentFormModal({ open, onClose, onSubmit }: DocumentFormModalProps) {
  const [form] = Form.useForm<DocumentFormValues>()

  return (
    <AntModal open={open} onClose={onClose} title="Add document" width={520}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSubmit?.(values)
          form.resetFields()
          onClose()
        }}
      >
        <FormInput name="owner" label="Owner" rules={[{ required: true, message: 'Owner is required' }]} placeholder="Document owner" />
        <FormInput name="type" label="Type" placeholder="e.g. Passport, Transcript" />
        <FormInput name="category" label="Category" placeholder="Category" />
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
