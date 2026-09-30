import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { Dropdown, Input, Select, Spin, Tooltip } from 'antd'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui'
import { getApiError, getApiErrorFields } from '@/lib/api'
import { statusClass } from '@/lib/statusClass'
import {
  useAssignWhatsAppConversationMutation,
  useConvertWhatsAppConversationMutation,
  useGetWhatsAppConversationQuery,
  useListWhatsAppMessagesQuery,
  useMarkWhatsAppReadMutation,
  useSendWhatsAppMessageMutation,
  useSendWhatsAppTemplateMutation,
  useUpdateWhatsAppStatusMutation,
} from '../api/whatsappApi'
import type { WhatsAppConversationStatus, WhatsAppMessage, WhatsAppSettings } from '../types'
import { WA_DOC_CATEGORIES, WA_ERRORS, WA_STATUS_LABELS } from '../types'
import { formatBubbleTime, formatBytes, formatDayDivider, waStatusClass } from '../utils/format'
import AssignConversationModal from './AssignConversationModal'
import ConvertToLeadModal, { type ConvertValues } from './ConvertToLeadModal'

type Props = {
  conversationId: string
  settings?: WhatsAppSettings
  /** Hide the lead link when already shown inside the lead workspace. */
  embedded?: boolean
  className?: string
}

const STATUS_ACTIONS: WhatsAppConversationStatus[] = ['IN_PROGRESS', 'WAITING_REPLY', 'RESOLVED', 'CLOSED']

const BASE_ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
]

export default function ConversationView({ conversationId, settings, embedded = false, className = '' }: Props) {
  const {
    data: conversationData,
    isError: conversationError,
    error: conversationErrorBody,
  } = useGetWhatsAppConversationQuery(conversationId, { pollingInterval: 10000 })
  const { data: messagesData, isLoading: messagesLoading } = useListWhatsAppMessagesQuery(conversationId, {
    pollingInterval: 5000,
  })
  const [sendMessage, { isLoading: sending }] = useSendWhatsAppMessageMutation()
  const [sendTemplate, { isLoading: sendingTemplate }] = useSendWhatsAppTemplateMutation()
  const [markRead] = useMarkWhatsAppReadMutation()
  const [assign, { isLoading: assigning }] = useAssignWhatsAppConversationMutation()
  const [updateStatus, { isLoading: statusSaving }] = useUpdateWhatsAppStatusMutation()
  const [convert, { isLoading: converting }] = useConvertWhatsAppConversationMutation()

  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [docCategory, setDocCategory] = useState<string | undefined>()
  const [assignOpen, setAssignOpen] = useState(false)
  const [convertOpen, setConvertOpen] = useState(false)
  const [convertErrors, setConvertErrors] = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  const conversation = conversationData?.conversation
  const messages = useMemo(() => messagesData?.items || [], [messagesData?.items])
  const canManage = Boolean(settings?.canManage)

  const accept = useMemo(() => {
    const list = [...BASE_ACCEPT]
    if (settings?.allowVideo) list.push('video/mp4', 'video/3gpp')
    if (settings?.allowVoice) list.push('audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/amr')
    return list.join(',')
  }, [settings?.allowVideo, settings?.allowVoice])

  useEffect(() => {
    if (conversation && conversation.unreadCount > 0) {
      void markRead(conversation.id)
    }
  }, [conversation, markRead])

  const lastMessageId = messages[messages.length - 1]?.id
  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lastMessageId, conversationId])

  async function onSend() {
    if (!conversation || sending) return
    const body = text.trim()
    if (!body && !file) return
    try {
      await sendMessage({ id: conversation.id, text: body || undefined, file, docCategory }).unwrap()
      setText('')
      setFile(null)
      setDocCategory(undefined)
    } catch (error) {
      toast.error(getApiError(error, file ? WA_ERRORS.attachmentFailed : WA_ERRORS.sendFailed))
    }
  }

  async function onSendTemplate() {
    if (!conversation) return
    try {
      await sendTemplate({ id: conversation.id }).unwrap()
      toast.success('Template message sent.')
    } catch (error) {
      toast.error(getApiError(error, WA_ERRORS.sendFailed))
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void onSend()
    }
  }

  async function onAssign(userId: string, reason: string) {
    if (!conversation) return
    try {
      const result = await assign({ id: conversation.id, userId, reason: reason || undefined }).unwrap()
      toast.success(result.message || 'Conversation assigned.')
      setAssignOpen(false)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to assign the conversation.'))
    }
  }

  async function onStatus(status: WhatsAppConversationStatus) {
    if (!conversation) return
    try {
      await updateStatus({ id: conversation.id, status }).unwrap()
      toast.success(`Conversation marked as ${WA_STATUS_LABELS[status].toLowerCase()}.`)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to update the conversation status.'))
    }
  }

  async function onConvert(values: ConvertValues) {
    if (!conversation) return
    setConvertErrors({})
    try {
      const result = await convert({ id: conversation.id, body: values }).unwrap()
      toast.success(result.message || 'Conversation converted.')
      setConvertOpen(false)
    } catch (error) {
      const fields = getApiErrorFields(error)
      if (Object.keys(fields).length) setConvertErrors(fields)
      toast.error(getApiError(error, 'Unable to convert this conversation.'))
    }
  }

  if (conversationError) {
    const status = (conversationErrorBody as { status?: number } | undefined)?.status
    return (
      <div className={`grid min-h-80 place-items-center p-6 text-center ${className}`}>
        <p className="m-0 text-danger">{status === 403 ? WA_ERRORS.denied : WA_ERRORS.unavailable}</p>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className={`grid min-h-80 place-items-center ${className}`}>
        <Spin />
      </div>
    )
  }

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <div className="grid min-w-0 gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 truncate text-[1rem] font-semibold text-text-strong">{conversation.displayName}</h3>
            <span className={waStatusClass(conversation.status)}>{WA_STATUS_LABELS[conversation.status]}</span>
            {!conversation.identified ? (
              <span className={statusClass('pending')}>Unidentified</span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.8rem] text-text-muted">
            <span>
              <span className="text-text-muted">Phone:</span>{' '}
              <span className="text-text-strong">{conversation.phone}</span>
            </span>
            <span>
              <span className="text-text-muted">Country:</span>{' '}
              <span className="text-text-strong">{conversation.lead?.country || '—'}</span>
            </span>
            <span>
              <span className="text-text-muted">Lead Status:</span>{' '}
              <span className="text-text-strong">{conversation.lead?.status || '—'}</span>
            </span>
            <span>
              <span className="text-text-muted">Assigned:</span>{' '}
              <span className="text-text-strong">{conversation.assignedUser?.name || 'Unassigned'}</span>
            </span>
            {conversation.lead && !embedded ? (
              <Link to={`/leads/${conversation.lead.id}`} className="font-medium text-primary">
                {conversation.lead.code} →
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!conversation.identified && canManage ? (
            <Button size="sm" onClick={() => setConvertOpen(true)}>
              Convert to Lead
            </Button>
          ) : null}
          {canManage ? (
            <Button size="sm" variant="secondary" onClick={() => setAssignOpen(true)}>
              Assign
            </Button>
          ) : null}
          <Dropdown
            trigger={['click']}
            menu={{
              items: STATUS_ACTIONS.filter((s) => s !== conversation.status).map((s) => ({
                key: s,
                label:
                  s === 'IN_PROGRESS' && ['RESOLVED', 'CLOSED'].includes(conversation.status)
                    ? 'Reopen'
                    : `Mark as ${WA_STATUS_LABELS[s]}`,
              })),
              onClick: ({ key }) => void onStatus(key as WhatsAppConversationStatus),
            }}
          >
            <Button size="sm" variant="secondary" loading={statusSaving}>
              Status ▾
            </Button>
          </Dropdown>
        </div>
      </header>

      <div
        ref={threadRef}
        className="min-h-0 flex-1 overflow-y-auto bg-[#efeae2] px-4 py-4 dark:bg-[#0f1a1f]"
      >
        {messagesLoading ? (
          <div className="grid h-full place-items-center">
            <Spin />
          </div>
        ) : messages.length === 0 ? (
          <p className="m-0 text-center text-[0.85rem] text-text-muted">No messages in this conversation yet.</p>
        ) : (
          <div className="grid gap-1.5">
            {messages.map((message, index) => {
              const prev = messages[index - 1]
              const showDay = !prev || new Date(prev.sentAt).toDateString() !== new Date(message.sentAt).toDateString()
              return (
                <Fragment key={message.id}>
                  {showDay ? (
                    <div className="my-2 flex justify-center">
                      <span className="rounded-lg bg-white/80 px-3 py-1 text-[0.72rem] text-[#54656f] shadow-sm dark:bg-[#1f2c33] dark:text-[#aebac1]">
                        {formatDayDivider(message.sentAt)}
                      </span>
                    </div>
                  ) : null}
                  <MessageBubble message={message} />
                </Fragment>
              )
            })}
          </div>
        )}
      </div>

      <footer className="border-t border-border-subtle bg-surface px-3 py-3">
        {!conversation.replyWindowOpen ? (
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-warn-bg px-3 py-2 text-[0.8rem] text-warn-fg">
            <span>
              The 24-hour WhatsApp reply window is closed. Send an approved template message to restart the
              conversation.
            </span>
            <Button size="sm" loading={sendingTemplate} onClick={() => void onSendTemplate()}>
              Send template
            </Button>
          </div>
        ) : null}

        {file ? (
          <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-[0.8rem]">
            <span className="min-w-0 flex-1 truncate">
              📎 {file.name} <span className="text-text-muted">({formatBytes(file.size)})</span>
            </span>
            <Select
              size="small"
              allowClear
              className="min-w-[160px]"
              placeholder="Document type"
              value={docCategory}
              onChange={setDocCategory}
              options={WA_DOC_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent text-danger"
              onClick={() => {
                setFile(null)
                setDocCategory(undefined)
              }}
            >
              Remove
            </button>
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={(event) => {
              const picked = event.target.files?.[0] || null
              setFile(picked)
              event.target.value = ''
            }}
          />
          <Tooltip title="Attach file">
            <Button
              variant="secondary"
              aria-label="Attach file"
              disabled={!conversation.replyWindowOpen}
              onClick={() => fileRef.current?.click()}
            >
              📎
            </Button>
          </Tooltip>
          <Input.TextArea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={onKeyDown}
            autoSize={{ minRows: 1, maxRows: 5 }}
            maxLength={4096}
            disabled={!conversation.replyWindowOpen}
            placeholder={file ? 'Add a caption (optional)' : 'Type a message'}
          />
          <Button
            loading={sending}
            disabled={!conversation.replyWindowOpen || (!text.trim() && !file)}
            onClick={() => void onSend()}
          >
            Send
          </Button>
        </div>
      </footer>

      <AssignConversationModal
        open={assignOpen}
        conversation={conversation}
        saving={assigning}
        onClose={() => setAssignOpen(false)}
        onSubmit={(userId, reason) => void onAssign(userId, reason)}
      />
      <ConvertToLeadModal
        open={convertOpen}
        conversation={conversation}
        saving={converting}
        errors={convertErrors}
        onClose={() => setConvertOpen(false)}
        onSubmit={(values) => void onConvert(values)}
      />
    </div>
  )
}

function DeliveryTicks({ status }: { status: string }) {
  if (status === 'failed') return <span className="text-danger">!</span>
  if (status === 'read') return <span className="text-[#53bdeb]">✓✓</span>
  if (status === 'delivered') return <span>✓✓</span>
  return <span>✓</span>
}

function MessageBubble({ message }: { message: WhatsAppMessage }) {
  const outgoing = message.direction === 'outgoing'
  const attachment = message.attachment
  const isImage = message.type === 'IMAGE' && attachment?.url
  const isVideo = message.type === 'VIDEO' && attachment?.url
  const isVoice = message.type === 'VOICE' && attachment?.url

  return (
    <div className={`flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[min(78%,520px)] rounded-lg px-2.5 py-1.5 text-[0.88rem] shadow-sm ${
          outgoing
            ? 'bg-[#d9fdd3] text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef]'
            : 'bg-white text-[#111b21] dark:bg-[#1f2c33] dark:text-[#e9edef]'
        } ${message.deliveryStatus === 'failed' ? 'ring-1 ring-danger' : ''}`}
      >
        {outgoing && message.sentBy ? (
          <p className="m-0 mb-0.5 text-[0.7rem] font-semibold text-[#128c7e] dark:text-[#7ae3c3]">{message.sentBy.name}</p>
        ) : null}

        {isImage ? (
          <a href={attachment!.url} target="_blank" rel="noreferrer" className="mb-1 block">
            <img
              src={attachment!.url}
              alt={attachment!.fileName || 'Image'}
              className="max-h-72 max-w-full rounded-md object-cover"
            />
          </a>
        ) : isVideo ? (
          <video src={attachment!.url} controls className="mb-1 max-h-72 max-w-full rounded-md" />
        ) : isVoice ? (
          <audio src={attachment!.url} controls className="mb-1 max-w-full" />
        ) : attachment?.url ? (
          <a
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            className="mb-1 flex items-center gap-2 rounded-md bg-black/5 px-2.5 py-2 text-inherit no-underline dark:bg-white/10"
          >
            <span className="text-lg">{message.type === 'PDF' ? '📄' : '📎'}</span>
            <span className="grid min-w-0">
              <span className="truncate font-medium">{attachment.fileName || 'Attachment'}</span>
              <span className="text-[0.72rem] opacity-70">
                {[attachment.docCategory, formatBytes(attachment.size)].filter(Boolean).join(' · ') || 'Open file'}
              </span>
            </span>
          </a>
        ) : attachment || ['IMAGE', 'PDF', 'DOCUMENT', 'VIDEO', 'VOICE'].includes(message.type) ? (
          <p className="m-0 mb-1 text-[0.8rem] italic opacity-70">
            {attachment?.fileName || `${message.type.toLowerCase()} attachment`} (not available)
          </p>
        ) : null}

        {attachment?.docCategory && isImage ? (
          <p className="m-0 mb-0.5 text-[0.72rem] opacity-70">{attachment.docCategory}</p>
        ) : null}

        {message.body ? (
          <p className={`m-0 whitespace-pre-wrap break-words ${message.type === 'TEMPLATE' ? 'italic opacity-80' : ''}`}>
            {message.body}
          </p>
        ) : null}

        <div className="mt-0.5 flex items-center justify-end gap-1 text-[0.68rem] text-[#667781] dark:text-[#8696a0]">
          <span>{formatBubbleTime(message.sentAt)}</span>
          {outgoing ? <DeliveryTicks status={message.deliveryStatus} /> : null}
        </div>
        {message.deliveryStatus === 'failed' || message.errorMessage ? (
          <p className="m-0 mt-0.5 text-[0.7rem] text-danger">
            {message.deliveryStatus === 'failed' ? WA_ERRORS.sendFailed : message.errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  )
}
