import { useEffect } from 'react'
import { Form } from 'antd'
import { toast } from 'react-toastify'
import { AntModal } from '@/components/common/Modals'
import { FormInput, FormSelect, FormTextArea } from '@/components/common/Forms'
import { PrimaryButton } from '@/components/ui'
import { getApiError } from '@/lib/api'
import { useLeadMasterOptions } from '@/modules/leads/hooks/useLeadMasterOptions'
import type { LeadRecord } from '@/modules/leads/types'
import { useCreateLeadApplicationMutation } from '../api/applicationsApi'

type Props = {
  open: boolean
  lead: LeadRecord
  onClose: () => void
  onCreated?: (applicationId: string) => void
}

export default function CreateApplicationModal({ open, lead, onClose, onCreated }: Props) {
  const [form] = Form.useForm()
  const options = useLeadMasterOptions()
  const [createApplication, { isLoading }] = useCreateLeadApplicationMutation()

  useEffect(() => {
    if (!open) return
    const intake = options.intake.find((item) => item.value === lead.preferredIntakeCode)
    form.setFieldsValue({
      university: '',
      program: lead.preferredCourse || '',
      intake: intake?.label || lead.preferredIntakeCode || '',
      countryCode: lead.preferredCountryCode || undefined,
      remarks: '',
    })
  }, [open, lead, form, options.intake])

  async function submit() {
    try {
      const values = await form.validateFields()
      const country = options.country.find((item) => item.value === values.countryCode)
      const result = await createApplication({
        leadId: lead.id,
        body: {
          university: values.university,
          program: values.program,
          intake: values.intake,
          countryCode: values.countryCode || undefined,
          countryName: country?.label || lead.country || undefined,
          remarks: values.remarks || undefined,
        },
      }).unwrap()
      toast.success(`Application ${result.application.code} created.`)
      form.resetFields()
      onClose()
      onCreated?.(result.application.id)
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) return
      toast.error(getApiError(error, 'Unable to create the application.'))
    }
  }

  return (
    <AntModal
      open={open}
      onClose={onClose}
      title={`Create Application — ${lead.name}`}
      width={560}
      footer={
        <div className="flex justify-end gap-2 px-1 pb-1">
          <PrimaryButton type="button" variant="outline" onClick={onClose} label="Cancel" />
          <PrimaryButton
            type="button"
            variant="primary"
            loading={isLoading}
            onClick={() => void submit()}
            label="Create Application"
          />
        </div>
      }
    >
      <p className="m-0 mb-4 text-sm text-text-muted">
        Prefills from lead <strong>{lead.code}</strong>. This starts the university admission
        pipeline without changing the lead&apos;s Converted status.
      </p>
      <Form form={form} layout="vertical" requiredMark={false}>
        <FormSelect
          name="countryCode"
          label="Country"
          options={options.country}
          placeholder="Select country"
          allowClear
        />
        <FormInput
          name="university"
          label="University"
          rules={[{ required: true, message: 'University is required' }]}
          placeholder="e.g. University of Melbourne"
        />
        <FormInput
          name="program"
          label="Program / Course"
          rules={[{ required: true, message: 'Program is required' }]}
          placeholder="e.g. Diploma of IT"
        />
        <FormInput
          name="intake"
          label="Intake"
          rules={[{ required: true, message: 'Intake is required' }]}
          placeholder="e.g. Feb 2027"
        />
        <FormTextArea name="remarks" label="Remarks" rows={3} placeholder="Optional notes" />
      </Form>
    </AntModal>
  )
}
