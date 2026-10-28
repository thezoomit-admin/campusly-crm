import type { DocumentSummary } from '../types'

type KpiItem = {
  key: string
  label: string
  value: number
  hint: string
  tone: string
}

type DocumentKpiStripProps = {
  vault: 'file' | 'lead'
  summary?: DocumentSummary | null
}

export default function DocumentKpiStrip({ vault, summary }: DocumentKpiStripProps) {
  const items: KpiItem[] =
    vault === 'file'
      ? [
          {
            key: 'all',
            label: 'Total',
            value: summary?.total ?? 0,
            hint: 'All file documents',
            tone: 'text-text-strong',
          },
          {
            key: 'missing',
            label: 'Missing',
            value: summary?.missing ?? 0,
            hint: 'Required · not received yet',
            tone: 'text-[#d97706]',
          },
          {
            key: 'pending_review',
            label: 'Pending review',
            value: summary?.pendingReview ?? 0,
            hint: 'Ready to verify / reject',
            tone: 'text-[#7c3aed]',
          },
          {
            key: 'rejected',
            label: 'Rejected',
            value: summary?.rejected ?? 0,
            hint: 'Needs re-upload',
            tone: 'text-[#e11d48]',
          },
          {
            key: 'expiring',
            label: 'Expiring',
            value: summary?.expiring ?? 0,
            hint: 'Within reminder window',
            tone: 'text-[#d97706]',
          },
          {
            key: 'verified',
            label: 'Verified',
            value: summary?.verified ?? 0,
            hint: 'Ready documents',
            tone: 'text-[#16a34a]',
          },
        ]
      : [
          {
            key: 'all',
            label: 'Total',
            value: summary?.total ?? 0,
            hint: 'All lead documents',
            tone: 'text-text-strong',
          },
          {
            key: 'pending',
            label: 'Pending',
            value: summary?.pending ?? summary?.pendingReview ?? 0,
            hint: 'Awaiting verification',
            tone: 'text-[#2563eb]',
          },
          {
            key: 'verified',
            label: 'Verified',
            value: summary?.verified ?? 0,
            hint: 'Approved documents',
            tone: 'text-[#16a34a]',
          },
          {
            key: 'rejected',
            label: 'Rejected',
            value: summary?.rejected ?? 0,
            hint: 'Needs replacement',
            tone: 'text-[#e11d48]',
          },
          {
            key: 'expired',
            label: 'Expired',
            value: summary?.expired ?? 0,
            hint: 'Past expiry date',
            tone: 'text-[#e11d48]',
          },
        ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <div
          key={item.key}
          className="rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-soft"
        >
          <p className="m-0 text-[12px] font-medium text-text-muted">{item.label}</p>
          <p className={`m-0 mt-1 text-[26px] font-bold leading-none tabular-nums ${item.tone}`}>
            {item.value}
          </p>
          <p className="m-0 mt-2 text-[11px] text-text-muted">{item.hint}</p>
        </div>
      ))}
    </div>
  )
}
