import { PrimaryButton } from '@/components/ui'

type DocumentBulkBarProps = {
  count: number
  canRequest: boolean
  canVerify: boolean
  requestableCount: number
  verifiableCount: number
  onClear: () => void
  onRequest: () => void
  onVerify: () => void
  onExport: () => void
}

export default function DocumentBulkBar({
  count,
  canRequest,
  canVerify,
  requestableCount,
  verifiableCount,
  onClear,
  onRequest,
  onVerify,
  onExport,
}: DocumentBulkBarProps) {
  if (count <= 0) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface))] px-3 py-2.5">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-text-strong">{count} selected</span>
        <button
          type="button"
          className="border-0 bg-transparent p-0 text-primary hover:underline"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {canRequest && requestableCount > 0 ? (
          <PrimaryButton
            type="button"
            size="sm"
            label={`Request selected (${requestableCount})`}
            onClick={onRequest}
          />
        ) : null}
        {canVerify && verifiableCount > 0 ? (
          <PrimaryButton
            type="button"
            size="sm"
            variant="outline"
            label={`Verify selected (${verifiableCount})`}
            onClick={onVerify}
          />
        ) : null}
        <PrimaryButton
          type="button"
          size="sm"
          variant="outline"
          label="Export selected"
          onClick={onExport}
        />
      </div>
    </div>
  )
}
