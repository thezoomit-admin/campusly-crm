import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Empty, Spin } from 'antd'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Attachment01Icon,
  Call02Icon,
  File01Icon,
  Image01Icon,
  MoreHorizontalIcon,
  SentIcon,
  SmileIcon,
  Video01Icon,
} from '@hugeicons/core-free-icons'
import { statusClass } from '@/lib/statusClass'
import type { CommunicationEvent } from '../../types'
import { CHANNEL_LABELS, STATUS_LABELS } from '../../types'
import {
  avatarTone,
  displayName,
  formatBubbleTime,
  formatThreadStamp,
  hubInitials,
} from '../../utils/hubFormat'
import ChannelIcon from './ChannelIcon'

type CenterTab = 'conversation' | 'profile' | 'timeline' | 'notes' | 'documents'

type Props = {
  selected: CommunicationEvent | null
  thread: CommunicationEvent[]
  loading?: boolean
  canReprocess?: boolean
  reprocessing?: boolean
  onReprocess?: (row: CommunicationEvent) => void
}

export default function ConversationThreadPanel({
  selected,
  thread,
  loading,
  canReprocess,
  reprocessing,
  onReprocess,
}: Props) {
  const [tab, setTab] = useState<CenterTab>('conversation')
  const [draft, setDraft] = useState('')
  const scrollerRef = useRef<HTMLDivElement>(null)

  const name = selected ? displayName(selected) : ''
  const sorted = useMemo(
    () => [...thread].sort((a, b) => new Date(a.eventAt).getTime() - new Date(b.eventAt).getTime()),
    [thread],
  )

  useEffect(() => {
    setTab('conversation')
    setDraft('')
  }, [selected?.id])

  useEffect(() => {
    const el = scrollerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [sorted.length, selected?.id])

  if (!selected) {
    return (
      <section className="grid min-h-0 place-items-center bg-input-bg px-6 text-center">
        <Empty description="Select a conversation to view messages" />
      </section>
    )
  }

  const showReprocess =
    canReprocess &&
    (selected.processingStatus === 'FAILED' || selected.processingStatus === 'PENDING')

  return (
    <section className="flex min-h-0 min-w-0 flex-col bg-surface">
      <header className="flex items-start justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`grid size-11 shrink-0 place-items-center rounded-full text-[0.8rem] font-bold ${avatarTone(selected.channel)}`}
          >
            {hubInitials(name)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="m-0 truncate text-[1rem] font-semibold text-text-strong">{name}</h2>
              {selected.lead ? (
                <span className="rounded-md bg-[#eff6ff] px-2 py-0.5 text-[0.7rem] font-semibold text-[#2563eb] dark:bg-blue-500/15 dark:text-link">
                  Lead
                </span>
              ) : null}
              <span className={statusClass(STATUS_LABELS[selected.processingStatus])}>
                {STATUS_LABELS[selected.processingStatus]}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.78rem] text-text-muted">
              <ChannelIcon channel={selected.channel} size={14} />
              <span>{selected.senderPhone || selected.senderEmail || CHANNEL_LABELS[selected.channel]}</span>
              {selected.currentLocation || selected.preferredCountryCode ? (
                <>
                  <span className="text-text-faint">·</span>
                  <span>{selected.currentLocation || selected.preferredCountryCode}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconBtn label="Call">
            <HugeiconsIcon icon={Call02Icon} size={16} color="currentColor" strokeWidth={1.7} />
          </IconBtn>
          <IconBtn label="Video">
            <HugeiconsIcon icon={Video01Icon} size={16} color="currentColor" strokeWidth={1.7} />
          </IconBtn>
          <IconBtn label="More">
            <HugeiconsIcon icon={MoreHorizontalIcon} size={16} color="currentColor" strokeWidth={1.7} />
          </IconBtn>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-border-subtle px-3">
        {(
          [
            ['conversation', 'Conversation'],
            ['profile', 'Profile'],
            ['timeline', 'Timeline'],
            ['notes', 'Notes'],
            ['documents', 'Documents'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`cursor-pointer border-0 border-b-2 bg-transparent px-3 py-2.5 text-[0.84rem] font-medium ${
              tab === key
                ? 'border-[#3b82f6] font-semibold text-link'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {selected.lead ? (
        <div className="mx-4 mt-3 flex items-center justify-between gap-2 rounded-xl bg-[#ecfdf5] px-3 py-2 text-[0.8rem] text-[#047857] dark:bg-emerald-500/15 dark:text-emerald-300">
          <span>This conversation is linked with a lead.</span>
          <Link
            to={`/leads/${selected.lead.id}`}
            className="inline-flex items-center gap-1 font-semibold text-inherit no-underline hover:underline"
          >
            View Lead Details →
          </Link>
        </div>
      ) : null}

      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto bg-input-bg px-4 py-4 dark:bg-[#0f1a1f]">
        {loading && sorted.length === 0 ? (
          <div className="grid min-h-40 place-items-center">
            <Spin />
          </div>
        ) : tab !== 'conversation' ? (
          <div className="grid min-h-40 place-items-center text-[0.9rem] text-text-muted">
            {tab === 'profile' && selected.lead ? (
              <Link to={`/leads/${selected.lead.id}`} className="font-semibold text-link">
                Open full lead profile →
              </Link>
            ) : (
              <span className="capitalize">{tab} will appear here for linked leads.</span>
            )}
          </div>
        ) : sorted.length === 0 ? (
          <div className="grid min-h-40 place-items-center">
            <Empty description="No messages in this thread" />
          </div>
        ) : (
          <div className="grid gap-4">
            {sorted.map((item, index) => {
              const outgoing = item.direction === 'outgoing'
              const prev = sorted[index - 1]
              const showStamp =
                !prev ||
                Math.abs(new Date(item.eventAt).getTime() - new Date(prev.eventAt).getTime()) >
                  1000 * 60 * 60 * 4
              const body = item.message || item.subject || '—'
              return (
                <div key={item.id} className="grid gap-3">
                  {showStamp ? (
                    <div className="text-center text-[0.72rem] font-medium text-text-faint">
                      {formatThreadStamp(item.eventAt)}
                    </div>
                  ) : null}
                  <div className={`flex items-end gap-2 ${outgoing ? 'justify-end' : 'justify-start'}`}>
                    {!outgoing ? (
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-full text-[0.68rem] font-bold ${avatarTone(item.channel)}`}
                      >
                        {hubInitials(displayName(item))}
                      </span>
                    ) : null}
                    <div
                      className={`max-w-[min(100%,420px)] rounded-2xl px-3.5 py-2.5 text-[0.88rem] leading-relaxed ${
                        outgoing
                          ? 'rounded-br-md bg-[#dcf8c6] text-[#14532d] dark:bg-[#005c4b] dark:text-[#e9edef]'
                          : 'rounded-bl-md bg-hover-bg text-text-strong dark:bg-[#1f2c33]'
                      }`}
                    >
                      <p className="m-0 whitespace-pre-wrap">{body}</p>
                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-[0.68rem] ${
                          outgoing ? 'text-[#3f6212] dark:text-[#8696a0]' : 'text-text-faint'
                        }`}
                      >
                        <span>{formatBubbleTime(item.eventAt)}</span>
                        {outgoing ? <span aria-hidden>✓✓</span> : null}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <footer className="border-t border-border-subtle bg-surface p-3">
        {showReprocess ? (
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              disabled={reprocessing}
              onClick={() => onReprocess?.(selected)}
              className="cursor-pointer rounded-lg border border-[#93c5fd] bg-[#eff6ff] px-3 py-1.5 text-[0.78rem] font-semibold text-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-link"
            >
              {reprocessing ? 'Reprocessing…' : 'Reprocess'}
            </button>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border bg-input-bg px-3 py-2">
            <button
              type="button"
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-text-faint hover:bg-surface"
              aria-label="Attach"
            >
              <HugeiconsIcon icon={Attachment01Icon} size={16} color="currentColor" strokeWidth={1.7} />
            </button>
            <textarea
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a message…"
              className="max-h-28 min-h-[24px] min-w-0 flex-1 resize-none border-0 bg-transparent text-[0.9rem] text-text-strong outline-none placeholder:text-text-faint"
            />
            <button
              type="button"
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-text-faint hover:bg-surface"
              aria-label="Emoji"
            >
              <HugeiconsIcon icon={SmileIcon} size={16} color="currentColor" strokeWidth={1.7} />
            </button>
          </div>
          <button
            type="button"
            className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-[#22c55e] text-white shadow-[0_8px_18px_rgba(34,197,94,0.28)] hover:bg-[#16a34a]"
            aria-label="Send"
          >
            <HugeiconsIcon icon={SentIcon} size={18} color="currentColor" strokeWidth={1.8} />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <QuickBtn icon={File01Icon} label="Template" />
          <QuickBtn icon={File01Icon} label="File" />
          <QuickBtn icon={Image01Icon} label="Image" />
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#d1fae5] bg-[#ecfdf5] px-2.5 py-1.5 text-[0.75rem] font-semibold text-[#047857] dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
          >
            WhatsApp Template ▾
          </button>
        </div>
      </footer>
    </section>
  )
}

function IconBtn({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-text-muted hover:bg-hover-bg hover:text-text-strong"
    >
      {children}
    </button>
  )
}

function QuickBtn({
  icon,
  label,
}: {
  icon: typeof File01Icon
  label: string
}) {
  return (
    <button
      type="button"
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[0.75rem] font-medium text-text-muted hover:bg-hover-bg"
    >
      <HugeiconsIcon icon={icon} size={13} color="currentColor" strokeWidth={1.7} />
      {label}
    </button>
  )
}
