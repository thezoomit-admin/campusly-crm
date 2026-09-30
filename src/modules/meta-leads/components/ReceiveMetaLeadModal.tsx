import { Form, Input, Modal, Select } from 'antd'
import { FORM_TYPE_OPTIONS, PLATFORM_OPTIONS, type MetaLeadFormValues } from '../types'

export default function ReceiveMetaLeadModal({
  open,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean
  loading: boolean
  onClose: () => void
  onSubmit: (values: MetaLeadFormValues) => Promise<void>
}) {
  const [form] = Form.useForm<MetaLeadFormValues>()

  return (
    <Modal
      title="Receive Meta lead"
      open={open}
      okText="Receive"
      confirmLoading={loading}
      onCancel={onClose}
      onOk={() => form.submit()}
      destroyOnHidden
      width={720}
    >
      <p className="mb-4 text-[0.85rem] text-text-muted">
        This enters the Communication Hub, checks for duplicates, and starts assignment, timeline, and notifications.
      </p>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ platform: 'FACEBOOK', formType: 'STUDY_ABROAD' }}
        onFinish={onSubmit}
      >
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Form.Item name="platform" label="Platform" rules={[{ required: true }]}>
            <Select options={PLATFORM_OPTIONS} />
          </Form.Item>
          <Form.Item name="formType" label="Form type" rules={[{ required: true }]}>
            <Select options={FORM_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="fullName" label="Full name" rules={[{ required: true, message: 'Full name is required.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone number" rules={[{ required: true, message: 'Phone number is required.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="whatsapp" label="WhatsApp number">
            <Input />
          </Form.Item>
          <Form.Item name="currentEducation" label="Current education">
            <Input />
          </Form.Item>
          <Form.Item name="preferredCountry" label="Preferred country">
            <Input placeholder="Canada" />
          </Form.Item>
          <Form.Item name="preferredIntake" label="Preferred intake">
            <Input placeholder="Fall 2026" />
          </Form.Item>
          <Form.Item name="campaignName" label="Campaign name">
            <Input placeholder="Canada Fall Intake" />
          </Form.Item>
          <Form.Item name="metaCampaignId" label="Campaign ID">
            <Input />
          </Form.Item>
          <Form.Item name="adSetName" label="Ad set name">
            <Input placeholder="Canada Students 2026" />
          </Form.Item>
          <Form.Item name="adName" label="Advertisement name" className="sm:col-span-2">
            <Input placeholder="Canada Scholarship Video" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}
