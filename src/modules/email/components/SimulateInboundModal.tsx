import { useState } from 'react'
import { Input, Modal } from 'antd'

type Props = {
  open: boolean
  saving?: boolean
  onClose: () => void
  onSubmit: (values: { fromName: string; fromEmail: string; subject: string; text: string }) => void
}

export default function SimulateInboundModal({ open, saving, onClose, onSubmit }: Props) {
  const [fromName, setFromName] = useState('Ayesha Rahman')
  const [fromEmail, setFromEmail] = useState('ayesha.student@example.com')
  const [subject, setSubject] = useState('Interested in studying in Canada')
  const [text, setText] = useState('I want to know admission requirements.')

  const canSubmit = Boolean(fromEmail.trim() && subject.trim() && text.trim())

  return (
    <Modal
      title="Receive a test email"
      open={open}
      onCancel={onClose}
      okText="Receive"
      confirmLoading={saving}
      okButtonProps={{ disabled: !canSubmit }}
      onOk={() =>
        onSubmit({
          fromName: fromName.trim(),
          fromEmail: fromEmail.trim(),
          subject: subject.trim(),
          text: text.trim(),
        })
      }
      width={520}
    >
      <div className="mt-3 grid gap-3">
        <p className="m-0 text-[0.82rem] text-text-muted">
          SMTP is not configured, so this creates an incoming email the same way the mailbox webhook does. A matching
          lead is attached, or a new lead is created when auto-create is on.
        </p>
        <label className="grid gap-1.5">
          <span className="text-[0.85rem] font-medium">Sender name</span>
          <Input value={fromName} onChange={(e) => setFromName(e.target.value)} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[0.85rem] font-medium">Email address</span>
          <Input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[0.85rem] font-medium">Subject</span>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[0.85rem] font-medium">Message</span>
          <Input.TextArea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
      </div>
    </Modal>
  )
}
