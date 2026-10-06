import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'

export default function LeadInfoField({
  icon,
  avatarUrl,
  label,
  value,
  empty = 'Not specified',
  extra,
  editing = false,
  valueNode,
  children,
}: {
  icon: IconSvgElement
  avatarUrl?: string | null
  label: string
  value?: string | number | null
  empty?: string
  extra?: ReactNode
  editing?: boolean
  valueNode?: ReactNode
  children?: ReactNode
}) {
  const text = value == null ? '' : String(value).trim()
  const filled = text.length > 0
  const [avatarFailed, setAvatarFailed] = useState(false)
  const showAvatar = Boolean(avatarUrl) && !avatarFailed

  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-[#f3f7fb] text-[#8b97a8] dark:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] dark:text-icon">
        {showAvatar ? (
          <img
            key={avatarUrl || ''}
            src={avatarUrl || ''}
            alt=""
            className="size-full object-cover"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <HugeiconsIcon icon={icon} size={16} color="currentColor" strokeWidth={1.7} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="m-0 text-[0.78rem] font-medium text-[#7d8b9a] dark:text-text-muted">{label}</p>
          {extra}
        </div>
        {editing ? (
          <div className="mt-1 min-w-0 [&_.ant-input]:min-h-9 [&_.ant-input]:text-[0.9rem] [&_.ant-picker]:min-h-9 [&_.ant-picker]:w-full [&_.ant-select]:w-full [&_.ant-select-selector]:!min-h-9">
            {children}
          </div>
        ) : valueNode ? (
          <div className="mt-1">{valueNode}</div>
        ) : (
          <p
            className={`m-0 mt-0.5 truncate text-[0.92rem] ${
              filled ? 'font-semibold text-[#17324f] dark:text-text-strong' : 'text-[#9aa6b2] dark:text-text-faint'
            }`}
          >
            {filled ? text : empty}
          </p>
        )}
      </div>
    </div>
  )
}
