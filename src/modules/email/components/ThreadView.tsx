import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Dropdown, Input, Select, Spin } from 'antd'
import { toast } from 'react-toastify'
import { PrimaryButton } from '@/components/ui'
import { getApiError, getApiErrorFields } from '@/lib/api'
import { statusClass } from '@/lib/statusClass'
import type { AuthSession } from '@/types'
import {
  useAssignEmailThreadMutation,
  useConvertEmailThreadMutation,
  useGetEmailThreadQuery,
  useListEmailMessagesQuery,
  useListEmailTemplatesQuery,
  useMarkEmailReadMutation,
  useSendEmailMessageMutation,
  useUpdateEmailStatusMutation,
} from '../api/emailApi'
import type { EmailMessage, EmailSettings, EmailThreadStatus } from '../types'
import { EMAIL_DOC_CATEGORIES, EMAIL_ERRORS, EMAIL_STATUS_LABELS } from '../types'
import { applyTemplate, emailStatusClass, formatBubbleTime, formatBytes, formatDayDivider } from '../utils/format'
import AssignThreadModal from './AssignThreadModal'
import ConvertEmailModal, { type ConvertValues } from './ConvertEmailModal'

type Props = {
  threadId: string
  settings?: EmailSettings
  embedded?: boolean
  className?: string
}

const STATUS_ACTIONS: EmailThreadStatus[] = ['PROCESSING', 'WAITING_REPLY', 'CLOSED']

export default function ThreadView({ threadId, settings, embedded = false, className = '' }: Props) {
  const auth = useOutletContext<AuthSession | undefined>()
  const { data: threadData, isError, error } = useGetEmailThreadQuery(threadId)
  const { data: messagesData, isLoading: messagesLoading } = useListEmailMessagesQuery(threadId)
  const { data: templates, isLoading: templatesLoading } = useListEmailTemplatesQuery()
  const [sendMessage, { isLoading: sending }] = useSendEmailMessageMutation()
  const [markRead] = useMarkEmailReadMutation()
  const [assign, { isLoading: assigning }] = useAssignEmailThreadMutation()
  const [updateStatus, { isLoading: statusSaving }] = useUpdateEmailStatusMutation()
  const [convert, { isLoading: converting }] = useConvertEmailThreadMutation()

  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [text, setText] = useState('')
  const [templateCode, setTemplateCode] = useState<string | undefined>()
  const [file, setFile] = useState<File | null>(null)
  const [docCategory, setDocCategory] = useState<string | undefined>()
  const [assignOpen, setAssignOpen] = useState(false)
  const [convertOpen, setConvertOpen] = useState(false)
  const [convertErrors, setConvertErrors] = useState<Record<string, string>>({})
  const [composeOpen, setComposeOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  const thread = threadData?.thread
  const messages = useMemo(() => messagesData?.items || [], [messagesData?.items])
  const canManage = Boolean(settings?.canManage)
  const hasMessages = messages.length > 0
  const showComposer = composeOpen || !hasMessages

  useEffect(() => {
    if (!thread) return
    setTo(thread.participantEmail)
    setSubject((current) => current || (thread.subject ? `Re: ${thread.subject.replace(/^(\s*(re|fw|fwd)\s*:\s*)+/i, '')}` : ''))
  }, [thread])

  useEffect(() => {
    if (thread && thread.unreadCount > 0) void markRead(thread.id)
  }, [thread, markRead])

  const lastMessageId = messages[messages.length - 1]?.id
  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lastMessageId, threadId])

  function onTemplate(code: string) {
    const template = templates?.items.find((item) => item.code === code)
    if (!template || !thread) return
    setTemplateCode(code)
    setSubject(template.subject)
    setText(applyTemplate(template.body, thread.lead?.name || thread.displayName, auth?.user.fullName || ''))
  }

  async function onSend() {
    if (!thread || sending) return
    try {
      await sendMessage({
        id: thread.id,
        to: to.trim(),
        subject: subject.trim(),
        text: text.trim(),
        file,
        docCategory,
        templateCode,
      }).unwrap()
      setText('')
      setFile(null)
      setDocCategory(undefined)
      setTemplateCode(undefined)
      setComposeOpen(false)
      toast.success('Email sent.')
    } catch (sendError) {
      toast.error(getApiError(sendError, file ? EMAIL_ERRORS.attachmentFailed : EMAIL_ERRORS.sendFailed))
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      void onSend()
    }
  }

  async function onAssign(userId: string, reason: string) {
    if (!thread) return
    try {
      const result = await assign({ id: thread.id, userId, reason: reason || undefined }).unwrap()
      toast.success(result.message || 'Email assigned.')
      setAssignOpen(false)
    } catch (assignError) {
      toast.error(getApiError(assignError, 'Unable to assign this email.'))
    }
  }

  async function onStatus(status: EmailThreadStatus) {
    if (!thread) return
    try {
      await updateStatus({ id: thread.id, status }).unwrap()
      toast.success(`Email marked as ${EMAIL_STATUS_LABELS[status].toLowerCase()}.`)
    } catch (statusError) {
      toast.error(getApiError(statusError, 'Unable to update the email status.'))
    }
  }

  async function onConvert(values: ConvertValues) {
    if (!thread) return
    setConvertErrors({})
    try {
      const result = await convert({ id: thread.id, body: values }).unwrap()
      toast.success(result.message || 'Email converted.')
      setConvertOpen(false)
    } catch (convertError) {
      const fields = getApiErrorFields(convertError)
      if (Object.keys(fields).length) setConvertErrors(fields)
      toast.error(getApiError(convertError, 'Unable to create a lead from this email.'))
    }
  }

  if (isError) {
    const status = (error as { status?: number } | undefined)?.status
    return (
      <div className={`grid min-h-80 place-items-center p-6 text-center ${className}`}>
        <p className="m-0 text-danger">{status === 403 ? EMAIL_ERRORS.denied : EMAIL_ERRORS.unavailable}</p>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className={`grid min-h-80 place-items-center ${className}`}>
        <Spin />
      </div>
    )
  }

  return (
    <div className={`flex min-h-0 min-w-0 max-w-full flex-col overflow-hidden ${className}`}>
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <div className="grid min-w-0 max-w-full flex-1 gap-1 overflow-hidden">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="m-0 min-w-0 max-w-full truncate text-[1rem] font-semibold text-text-strong">
              {thread.displayName}
            </h3>
            <span className={emailStatusClass(thread.status)}>{EMAIL_STATUS_LABELS[thread.status]}</span>
            {!thread.identified ? <span className={statusClass('pending')}>Manual review</span> : null}
          </div>
          <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-[0.8rem] text-text-muted">
            <span className="min-w-0 max-w-full truncate">
              Name: <span className="text-text-strong">{thread.lead?.name || thread.displayName}</span>
            </span>
            <span className="min-w-0 max-w-full truncate">
              Phone: <span className="text-text-strong">{thread.lead?.phone || '—'}</span>
            </span>
            <span className="min-w-0 max-w-full truncate">
              Email: <span className="text-text-strong">{thread.participantEmail}</span>
            </span>
            <span className="min-w-0 max-w-full truncate">
              Country: <span className="text-text-strong">{thread.lead?.country || '—'}</span>
            </span>
            <span className="min-w-0 max-w-full truncate">
              Lead status: <span className="text-text-strong">{thread.lead?.status || '—'}</span>
            </span>
            <span className="min-w-0 max-w-full truncate">
              Assigned: <span className="text-text-strong">{thread.assignedUser?.name || 'Unassigned'}</span>
            </span>
            {thread.lead && !embedded ? (
              <Link to={`/leads/${thread.lead.id}`} className="shrink-0 font-medium text-primary">
                {thread.lead.code} →
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {!thread.identified && canManage ? (
            <PrimaryButton size="sm" onClick={() => setConvertOpen(true)}>
              Create lead
            </PrimaryButton>
          ) : null}
          {canManage ? (
            <PrimaryButton size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
              Assign
            </PrimaryButton>
          ) : null}
          <Dropdown
            trigger={['click']}
            menu={{
              items: STATUS_ACTIONS.filter((item) => item !== thread.status).map((item) => ({
                key: item,
                label: item === 'PROCESSING' && thread.status === 'CLOSED' ? 'Reopen' : `Mark as ${EMAIL_STATUS_LABELS[item]}`,
              })),
              onClick: ({ key }) => void onStatus(key as EmailThreadStatus),
            }}
          >
            <PrimaryButton size="sm" variant="outline" loading={statusSaving}>
              Status
            </PrimaryButton>
          </Dropdown>
        </div>
      </header>

      <div ref={threadRef} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#f4f7fb] px-4 py-4 dark:bg-[#0f1a1f]">
        {messagesLoading ? (
          <div className="grid h-full place-items-center">
            <Spin />
          </div>
        ) : messages.length === 0 ? (
          <p className="m-0 text-center text-[0.85rem] text-text-muted">No emails in this conversation yet.</p>
        ) : (
          <div className="grid min-w-0 gap-2">
            {messages.map((message, index) => {
              const prev = messages[index - 1]
              const showDay = !prev || new Date(prev.sentAt).toDateString() !== new Date(message.sentAt).toDateString()
              return (
                <Fragment key={message.id}>
                  {showDay ? (
                    <div className="my-1 flex justify-center">
                      <span className="rounded-lg bg-white/80 px-3 py-1 text-[0.72rem] text-text-muted shadow-sm dark:bg-[#1f2c33]">
                        {formatDayDivider(message.sentAt)}
                      </span>
                    </div>
                  ) : null}
                  <MessageCard message={message} />
                </Fragment>
              )
            })}
          </div>
        )}
      </div>

      <footer className="min-w-0 border-t border-border-subtle bg-surface px-3 py-3">
        {!showComposer ? (
          <div className="flex justify-end">
            <PrimaryButton size="sm" onClick={() => setComposeOpen(true)}>
              Add Email
            </PrimaryButton>
          </div>
        ) : (
          <div className="grid min-w-0 gap-2 [&_.ant-input]:min-w-0 [&_.ant-select]:w-full [&_.ant-select]:min-w-0">
            <div className="grid min-w-0 gap-2 sm:grid-cols-2">
              <Input
                value={to}
                onChange={(event) => setTo(event.target.value)}
                placeholder="To"
                prefix={<span className="text-text-muted">To</span>}
              />
              <Input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Subject"
                prefix={<span className="text-text-muted">Subject</span>}
              />
            </div>
            <Select
              allowClear
              loading={templatesLoading}
              placeholder="Use a template"
              value={templateCode}
              onChange={(value) => {
                if (!value) {
                  setTemplateCode(undefined)
                  return
                }
                onTemplate(value)
              }}
              options={(templates?.items || []).map((item) => ({ value: item.code, label: item.name }))}
            />
            {file ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-[0.8rem]">
                <span className="min-w-0 flex-1 truncate">
                  {file.name} <span className="text-text-muted">({formatBytes(file.size)})</span>
                </span>
                <Select
                  size="small"
                  allowClear
                  className="min-w-[180px]"
                  placeholder="Document type"
                  value={docCategory}
                  onChange={setDocCategory}
                  options={EMAIL_DOC_CATEGORIES.map((item) => ({ value: item, label: item }))}
                />
                <button type="button" className="cursor-pointer border-0 bg-transparent text-danger" onClick={() => setFile(null)}>
                  Remove
                </button>
              </div>
            ) : null}
            <Input.TextArea
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={onKeyDown}
              autoSize={{ minRows: 3, maxRows: 8 }}
              maxLength={20000}
              placeholder="Write a reply"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={(event) => {
                    setFile(event.target.files?.[0] || null)
                    event.target.value = ''
                  }}
                />
                <PrimaryButton variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  Attach file
                </PrimaryButton>
                {hasMessages ? (
                  <PrimaryButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setComposeOpen(false)
                      setText('')
                      setFile(null)
                      setDocCategory(undefined)
                      setTemplateCode(undefined)
                    }}
                  >
                    Cancel
                  </PrimaryButton>
                ) : null}
              </div>
              <PrimaryButton
                loading={sending}
                disabled={!text.trim() || !subject.trim() || !to.trim()}
                onClick={() => void onSend()}
              >
                Send
              </PrimaryButton>
            </div>
          </div>
        )}
      </footer>

      <AssignThreadModal
        open={assignOpen}
        thread={thread}
        saving={assigning}
        onClose={() => setAssignOpen(false)}
        onSubmit={(userId, reason) => void onAssign(userId, reason)}
      />
      <ConvertEmailModal
        open={convertOpen}
        thread={thread}
        saving={converting}
        errors={convertErrors}
        onClose={() => setConvertOpen(false)}
        onSubmit={(values) => void onConvert(values)}
      />
    </div>
  )
}

function MessageCard({ message }: { message: EmailMessage }) {
  const outgoing = message.direction === 'outgoing'
  const failed = message.deliveryStatus === 'failed'
  const bounced = message.deliveryStatus === 'bounced'
  const deliveryIssue = failed || bounced
  const showError = deliveryIssue || (Boolean(message.errorMessage) && outgoing)

  return (
    <article
      className={`min-w-0 max-w-full overflow-hidden rounded-xl border px-3 py-2.5 text-[0.88rem] shadow-sm ${
        outgoing
          ? 'ml-8 border-primary/20 bg-[#e8f1ff] dark:bg-blue-950/40'
          : 'mr-8 border-border-subtle bg-white dark:bg-[#1f2c33]'
      } ${deliveryIssue ? 'ring-1 ring-danger' : ''}`}
    >
      <div className="mb-1 flex min-w-0 flex-wrap items-baseline justify-between gap-2">
        <p className="m-0 min-w-0 break-words font-semibold text-text-strong [overflow-wrap:anywhere]">{message.subject}</p>
        <time className="shrink-0 text-[0.72rem] text-text-muted">{formatBubbleTime(message.sentAt)}</time>
      </div>
      <p className="m-0 mb-1 break-words text-[0.75rem] text-text-muted [overflow-wrap:anywhere]">
        {outgoing ? message.sentBy?.name || 'You' : message.fromName || message.fromEmail} · {message.fromEmail}
      </p>
      {message.body ? (
        <p className="m-0 whitespace-pre-wrap break-words text-text-strong [overflow-wrap:anywhere]">{message.body}</p>
      ) : null}
      {message.attachments.length ? (
        <ul className="m-0 mt-2 grid list-none gap-1 p-0">
          {message.attachments.map((file) => (
            <li key={file.id}>
              <a href={file.url} target="_blank" rel="noreferrer" className="text-[0.8rem] font-medium text-primary">
                {file.fileName || 'Attachment'}
                {file.docCategory ? ` · ${file.docCategory}` : ''}
                {file.size ? ` · ${formatBytes(file.size)}` : ''}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {outgoing ? (
        <div className="mt-1.5 flex items-center justify-end gap-1 text-[0.72rem] text-text-muted">
          <EmailDeliveryTicks status={message.deliveryStatus} />
        </div>
      ) : null}
      {showError ? (
        <p className="m-0 mt-1 text-[0.75rem] text-danger">
          {message.errorMessage || (bounced ? EMAIL_ERRORS.bounced : EMAIL_ERRORS.sendFailed)}
        </p>
      ) : null}
    </article>
  )
}

function EmailDeliveryTicks({ status }: { status: string }) {
  if (status === 'failed' || status === 'bounced') {
    return <span className="font-semibold text-danger">{status === 'bounced' ? 'Bounced' : 'Failed'}</span>
  }
  if (status === 'received') return <span className="text-text-muted">Received</span>
  return <span className="text-primary" title="Sent">
    ✓ Sent
  </span>
}
