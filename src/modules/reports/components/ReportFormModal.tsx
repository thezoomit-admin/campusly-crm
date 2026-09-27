import { Button, Form } from 'antd'
import { FormInput } from '@/components/common/Forms'
import { AntModal } from '@/components/common/Modals'
import type { ReportFormValues } from '../types'

type ReportFormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (values: ReportFormValues) => void
}

export default function ReportFormModal({ open, onClose, onSubmit }: ReportFormModalProps) {
  const [form] = Form.useForm<ReportFormValues>()

  return (
    <AntModal open={open} onClose={onClose} title="Add report metric" width={520}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSubmit?.(values)
          form.resetFields()
          onClose()
        }}
      >
        <FormInput name="metric" label="Metric" rules={[{ required: true, message: 'Metric is required' }]} placeholder="Metric name" />
        <FormInput name="period" label="Period" placeholder="e.g. This month" />
        <FormInput name="value" label="Value" placeholder="Value" />
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
