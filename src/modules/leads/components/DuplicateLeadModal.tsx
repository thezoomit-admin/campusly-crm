import { PrimaryButton } from '@/components/ui'
import type { DuplicateLead } from '../types'

type DuplicateLeadModalProps = {
  open: boolean
  lead: DuplicateLead | null
  canCreateAnyway: boolean
  onOpenExisting: () => void
  onCreateAnyway: () => void
  onClose: () => void
}

export default function DuplicateLeadModal({
  open,
  lead,
  canCreateAnyway,
  onOpenExisting,
  onCreateAnyway,
  onClose,
}: DuplicateLeadModalProps) {
  if (!open || !lead) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-lg">
        <h3 className="m-0 text-lg font-semibold">Existing Lead Found</h3>
        <p className="mt-3 mb-0 text-sm text-text-muted">Similar lead already exists.</p>
        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-text-muted">Lead ID</dt>
            <dd className="m-0 font-medium">{lead.code}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-text-muted">Name</dt>
            <dd className="m-0 font-medium">{lead.name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-text-muted">Status</dt>
            <dd className="m-0 font-medium">{lead.status}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <PrimaryButton type="button" variant="outline" onClick={onClose} label="Cancel" />
          <PrimaryButton type="button" variant="outline" onClick={onOpenExisting} label="Open Existing Lead" />
          {canCreateAnyway ? (
            <PrimaryButton type="button" onClick={onCreateAnyway} label="Create Anyway" />
          ) : null}
        </div>
      </div>
    </div>
  )
}
