import { useEffect, useState } from 'react'
import { Input, Modal, Select } from 'antd'
import { useListLeadAssigneesQuery } from '@/modules/leads/api/leadsApi'
import type { EmailThread } from '../types'

type Props = {
  open: boolean
  thread: EmailThread | null
  saving?: boolean
  onClose: () => void
  onSubmit: (userId: string, reason: string) => void
}

export default function AssignThreadModal({ open, thread, saving, onClose, onSubmit }: Props) {
  const [userId, setUserId] = useState<string | undefined>()
  const [reason, setReason] = useState('')
  const { data, isFetching } = useListLeadAssigneesQuery(undefined, { skip: !open })

  useEffect(() => {
    if (open) {
      setUserId(thread?.assignedUser?.id)
      setReason('')
    }
  }, [open, thread?.assignedUser?.id])

  const options = (data?.items || []).map((user) => ({
    value: user.id,
    label: `${user.name}${user.role ? ` · ${user.role.name}` : ''}${user.team ? ` · ${user.team.name}` : ''}`,
  }))

  return (
    <Modal
      title="Assign email"
      open={open}
      onCancel={onClose}
      onOk={() => userId && onSubmit(userId, reason.trim())}
      okText="Assign"
      okButtonProps={{ disabled: !userId || userId === thread?.assignedUser?.id }}
      confirmLoading={saving}
      width={480}
    >
      <div className="mt-3 grid gap-3">
        {thread?.lead ? (
          <p className="m-0 text-[0.82rem] text-text-muted">
            This email belongs to lead {thread.lead.code}. Assigning it will reassign the lead, and email access moves
            with it.
          </p>
        ) : null}
        <label className="grid gap-1.5">
          <span className="text-[0.85rem] font-medium">Employee</span>
          <Select
            showSearch
            optionFilterProp="label"
            loading={isFetching}
            value={userId}
            onChange={setUserId}
            options={options}
            placeholder="Select employee"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[0.85rem] font-medium">Reason (optional)</span>
          <Input.TextArea rows={2} maxLength={400} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
      </div>
    </Modal>
  )
}
