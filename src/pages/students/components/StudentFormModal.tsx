import { Button, Form } from 'antd'
import { FormInput } from '@/components/common/Forms'
import { AntModal } from '@/components/common/Modals'
import type { StudentFormValues } from '../types'

type StudentFormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (values: StudentFormValues) => void
}

export default function StudentFormModal({ open, onClose, onSubmit }: StudentFormModalProps) {
  const [form] = Form.useForm<StudentFormValues>()

  return (
    <AntModal open={open} onClose={onClose} title="Add student" width={520}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSubmit?.(values)
          form.resetFields()
          onClose()
        }}
      >
        <FormInput name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]} placeholder="Student name" />
        <FormInput name="studentId" label="Student ID" placeholder="Student ID" />
        <FormInput name="destination" label="Destination" placeholder="Country / city" />
        <FormInput name="program" label="Program" placeholder="Program" />
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
