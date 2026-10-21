import type { MetaLead } from './types'

export function formatRate(value: number | null | undefined) {
  const rate = Number(value || 0)
  const rounded = Math.round(rate * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`
}

type ResultLead = Pick<MetaLead, 'processingStatus' | 'duplicate' | 'pooled' | 'message' | 'processingError'>

const RESULT_TONE = {
  failed: 'text-[#b42318]',
  existing: 'text-[#b54708] dark:text-[#fdba74]',
  pool: 'text-[#1d4ed8] dark:text-[#93c5fd]',
  received: 'text-[#0f7a4a] dark:text-[#86efac]',
  pending: 'text-text-muted',
} as const

const RESULT_DOT = {
  failed: 'bg-[#b42318]',
  existing: 'bg-[#d97706]',
  pool: 'bg-[#2563eb]',
  received: 'bg-[#16a34a]',
  pending: 'bg-text-faint',
} as const

function resultTone(lead: ResultLead) {
  if (lead.processingStatus === 'FAILED' || lead.processingError) return 'failed' as const
  if (lead.duplicate || lead.processingStatus === 'DUPLICATE') return 'existing' as const
  if (lead.pooled) return 'pool' as const
  if (lead.processingStatus === 'PROCESSED') return 'received' as const
  return 'pending' as const
}

export function ResultText({ lead, truncate = false }: { lead: ResultLead; truncate?: boolean }) {
  const tone = resultTone(lead)
  const message = lead.message || lead.processingError || lead.processingStatus
  return (
    <span className={`inline-flex max-w-full items-center gap-2 ${RESULT_TONE[tone]}`}>
      <span className={`size-1.5 shrink-0 rounded-full ${RESULT_DOT[tone]}`} />
      <span className={truncate ? 'min-w-0 truncate' : 'leading-snug'} title={message}>
        {message}
      </span>
    </span>
  )
}

export function PlatformBadge({ platform, label }: { platform: string; label: string }) {
  const tone =
    platform === 'INSTAGRAM'
      ? 'bg-[#fde8f4] text-[#9d174d] dark:bg-[rgba(157,23,77,0.22)] dark:text-[#f9a8d4]'
      : platform === 'FACEBOOK'
        ? 'bg-[#e8f1ff] text-[#1d4ed8] dark:bg-[rgba(29,78,216,0.22)] dark:text-[#93c5fd]'
        : 'bg-[#f3f4f6] text-[#4b5563] dark:bg-[#24303a] dark:text-[#cbd5e1]'

  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.72rem] font-semibold ${tone}`}>{label}</span>
}

export function RateBar({ value }: { value: number }) {
  const width = Math.max(0, Math.min(100, value))
  return (
    <span className="inline-flex min-w-[108px] items-center justify-end gap-2">
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-[#eef2f6] dark:bg-[#24303a]">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
      </span>
      <span className="w-12 text-right text-[13px] font-semibold tabular-nums text-text-strong">{formatRate(value)}</span>
    </span>
  )
}
