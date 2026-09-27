import { Button, Form } from 'antd'
import { FormInput } from '@/components/common/Forms'
import { AntModal } from '@/components/common/Modals'
import type { ApplicationFormValues } from '../types'

type ApplicationFormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (values: ApplicationFormValues) => void
}

export default function ApplicationFormModal({ open, onClose, onSubmit }: ApplicationFormModalProps) {
  const [form] = Form.useForm<ApplicationFormValues>()

  return (
    <AntModal open={open} onClose={onClose} title="Add application" width={520}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSubmit?.(values)
          form.resetFields()
          onClose()
        }}
      >
        <FormInput name="applicant" label="Applicant" rules={[{ required: true, message: 'Applicant is required' }]} placeholder="Applicant name" />
        <FormInput name="university" label="University" placeholder="University" />
        <FormInput name="program" label="Program" placeholder="Program" />
        <FormInput name="intake" label="Intake" placeholder="e.g. Sep 2026" />
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
