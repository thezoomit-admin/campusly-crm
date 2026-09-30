import { Empty, Spin } from 'antd'
import type { EmailThread } from '../types'
import { EMAIL_STATUS_LABELS } from '../types'
import { emailStatusClass, formatListTime, initials } from '../utils/format'

type Props = {
  items: EmailThread[]
  selectedId: string | null
  loading?: boolean
  onSelect: (id: string) => void
}

export default function ThreadList({ items, selectedId, loading, onSelect }: Props) {
  if (loading && items.length === 0) {
    return (
      <div className="grid min-h-60 place-items-center">
        <Spin />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="grid min-h-60 place-items-center px-4">
        <Empty description="No email conversations found" />
      </div>
    )
  }

  return (
    <ul className="m-0 grid list-none gap-0 p-0">
      {items.map((item) => {
        const active = item.id === selectedId
        const unread = item.unreadCount > 0
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={`flex w-full cursor-pointer items-start gap-3 border-0 border-b border-border-subtle bg-transparent px-3 py-3 text-left transition-colors ${
                active
                  ? 'bg-[color-mix(in_srgb,var(--color-primary)_9%,var(--color-surface))]'
                  : 'hover:bg-hover-bg'
              }`}
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-full text-[0.8rem] font-bold ${
                  item.identified ? 'bg-primary/15 text-primary' : 'bg-[#f3f4f6] text-[#6b7280] dark:bg-[#24303a]'
                }`}
              >
                {initials(item.displayName)}
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="flex items-center justify-between gap-2">
                  <span className={`truncate text-[0.9rem] text-text-strong ${unread ? 'font-bold' : 'font-semibold'}`}>
                    {item.displayName}
                  </span>
                  <time className={`shrink-0 text-[0.72rem] ${unread ? 'font-semibold text-primary' : 'text-text-muted'}`}>
                    {formatListTime(item.lastMessageAt)}
                  </time>
                </span>
                <span className="truncate text-[0.75rem] text-text-muted">
                  {item.participantEmail}
                  {item.lead ? ` · ${item.lead.code}` : ' · Unidentified'}
                </span>
                <span className="truncate text-[0.78rem] font-medium text-text-strong">
                  {item.subject || 'No subject'}
                </span>
                <span className="flex items-center justify-between gap-2">
                  <span className={`truncate text-[0.8rem] ${unread ? 'text-text-strong' : 'text-text-muted'}`}>
                    {item.lastDirection === 'outgoing' ? 'You: ' : ''}
                    {item.lastMessagePreview || 'No messages yet'}
                  </span>
                  {unread ? (
                    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[0.7rem] font-bold text-on-primary">
                      {item.unreadCount > 99 ? '99+' : item.unreadCount}
                    </span>
                  ) : null}
                </span>
                <span className="mt-1">
                  <span className={emailStatusClass(item.status)}>{EMAIL_STATUS_LABELS[item.status]}</span>
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
