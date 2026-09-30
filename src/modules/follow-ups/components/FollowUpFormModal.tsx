import { useEffect, useState } from 'react'
import { Form } from 'antd'
import dayjs from 'dayjs'
import { PrimaryButton } from '@/components/ui'
import { FormDatePicker, FormInput, FormSelect, FormTextArea } from '@/components/common/Forms'
import { AntModal } from '@/components/common/Modals'
import { useListLeadsQuery } from '@/modules/leads/api/leadsApi'
import { useDebounce } from '@/hooks/useDebounce'
import {
  FOLLOW_UP_PRIORITIES,
  FOLLOW_UP_PURPOSES,
  FOLLOW_UP_REMINDERS,
  FOLLOW_UP_TYPES,
  type FollowUpFormValues,
} from '../types'

type FollowUpFormModalProps = {
  open: boolean
  saving?: boolean
  onClose: () => void
  onSubmit: (values: FollowUpFormValues) => Promise<void> | void
  fixedLeadId?: string
  fixedLeadLabel?: string
  title?: string
}

export default function FollowUpFormModal({
  open,
  saving,
  onClose,
  onSubmit,
  fixedLeadId,
  fixedLeadLabel,
  title = 'Create Follow-up',
}: FollowUpFormModalProps) {
  const [form] = Form.useForm<FollowUpFormValues>()
  const purpose = Form.useWatch('purpose', form)
  const [leadSearch, setLeadSearch] = useState('')
  const debouncedLeadSearch = useDebounce(leadSearch, 300)
  const { data: leadsData, isFetching: leadsLoading } = useListLeadsQuery(
    { search: debouncedLeadSearch, limit: 20 },
    { skip: !open || Boolean(fixedLeadId) },
  )

  useEffect(() => {
    if (!open) return
    form.setFieldsValue({
      leadId: fixedLeadId || undefined,
      type: 'Call',
      priority: 'Medium',
      purpose: 'Initial Contact',
      reminder: '30 Minutes Before',
      notes: '',
      nextAction: '',
      purposeOther: '',
      dueAt: undefined,
    })
    setLeadSearch('')
  }, [open, fixedLeadId, form])

  const leadOptions = (leadsData?.items || []).map((lead) => ({
    value: lead.id,
    label: `${lead.code || lead.id} — ${lead.name}`,
  }))

  return (
    <AntModal open={open} onClose={onClose} title={title} width={560}>
      <Form
        form={form}
        layout="vertical"
        onFinish={async (values) => {
          await onSubmit({
            ...values,
            leadId: fixedLeadId || values.leadId,
            dueAt: values.dueAt,
          })
          form.resetFields()
        }}
      >
        {fixedLeadId ? (
          <p className="m-0 mb-3 rounded-lg bg-[#f7fafc] px-3 py-2 text-sm text-[#3d5166] dark:bg-hover-bg dark:text-text">
            Lead: {fixedLeadLabel || fixedLeadId}
          </p>
        ) : (
          <FormSelect
            name="leadId"
            label="Lead"
            rules={[{ required: true, message: 'Lead is required.' }]}
            showSearch
            filterOption={false}
            placeholder={leadsLoading ? 'Loading leads…' : 'Search lead by name or code'}
            options={leadOptions}
            onSearch={setLeadSearch}
            notFoundContent={leadsLoading ? 'Loading…' : 'No leads found'}
          />
        )}

        <FormSelect
          name="type"
          label="Activity Type"
          rules={[{ required: true, message: 'Activity type is required.' }]}
          showSearch
          optionFilterProp="label"
          options={FOLLOW_UP_TYPES.map((value) => ({ value, label: value }))}
        />

        <Form.Item
          name="dueAt"
          label="Follow-up Date & Time"
          rules={[{ required: true, message: 'Follow-up date is required.' }]}
          getValueFromEvent={(value) => (value ? value.toISOString() : '')}
          getValueProps={(value) => ({ value: value ? dayjs(value) : null })}
        >
          <FormDatePicker showTime format="DD MMM YYYY hh:mm A" />
        </Form.Item>

        <div className="grid gap-0 min-[481px]:grid-cols-2 min-[481px]:gap-3">
          <FormSelect
            name="priority"
            label="Priority"
            rules={[{ required: true, message: 'Priority is required.' }]}
            options={FOLLOW_UP_PRIORITIES.map((value) => ({ value, label: value }))}
          />
          <FormSelect
            name="reminder"
            label="Reminder"
            options={FOLLOW_UP_REMINDERS.map((value) => ({ value, label: value }))}
          />
        </div>

        <FormSelect
          name="purpose"
          label="Purpose"
          rules={[{ required: true, message: 'Purpose is required.' }]}
          showSearch
          optionFilterProp="label"
          options={FOLLOW_UP_PURPOSES.map((value) => ({ value, label: value }))}
        />

        {purpose === 'Other' ? (
          <FormInput
            name="purposeOther"
            label="Purpose description"
            rules={[{ required: true, message: 'Please provide a reason.' }]}
            placeholder="Describe the purpose"
            maxLength={500}
            size="large"
          />
        ) : null}

        <FormTextArea
          name="nextAction"
          label="Next Action"
          rules={[{ required: true, message: 'Please enter the next action.' }]}
          autoSize={{ minRows: 2, maxRows: 5 }}
          maxLength={500}
          showCount
          placeholder="What needs to happen next?"
        />

        <FormTextArea
          name="notes"
          label="Notes"
          autoSize={{ minRows: 2, maxRows: 6 }}
          maxLength={1000}
          showCount
          placeholder="Optional notes"
        />

        <div className="mt-2 flex justify-end gap-2">
          <PrimaryButton type="button" variant="outline" onClick={onClose}>
            Cancel
          </PrimaryButton>
          <PrimaryButton type="submit" loading={Boolean(saving)}>
            Save Follow-up
          </PrimaryButton>
        </div>
      </Form>
    </AntModal>
  )
}
