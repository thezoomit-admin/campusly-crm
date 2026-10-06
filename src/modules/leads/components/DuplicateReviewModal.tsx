import { Modal } from 'antd'
import { PrimaryButton } from '@/components/ui'
import type { LeadRecord } from '../types'

export type DuplicateReviewAction = 'keep' | 'cancel_duplicate' | 'archive' | 'delete'

type DuplicateReviewModalProps = {
  open: boolean
  lead: LeadRecord | null
  loading?: boolean
  canDelete?: boolean
  onClose: () => void
  onAction: (action: DuplicateReviewAction) => void
}

export default function DuplicateReviewModal({
  open,
  lead,
  loading,
  canDelete,
  onClose,
  onAction,
}: DuplicateReviewModalProps) {
  if (!open || !lead) return null

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title="Review Duplicate Lead"
      destroyOnHidden
      width={480}
    >
      <p className="mt-0 mb-3 text-sm text-text-muted">
        This inbound lead matches an existing phone number. Choose how to handle it.
      </p>
      <dl className="mb-4 grid gap-2 rounded-xl border border-border bg-input-bg px-3 py-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-text-muted">Lead ID</dt>
          <dd className="m-0 font-medium">{lead.code}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-text-muted">Name</dt>
          <dd className="m-0 font-medium">{lead.name}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-text-muted">Phone</dt>
          <dd className="m-0 font-medium">{lead.phone || '—'}</dd>
        </div>
        {lead.duplicateOf ? (
          <div className="flex justify-between gap-3">
            <dt className="text-text-muted">Matched lead</dt>
            <dd className="m-0 font-medium">
              {lead.duplicateOf.code} — {lead.duplicateOf.name}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="flex flex-col gap-2">
        <PrimaryButton
          type="button"
          variant="primary"
          disabled={loading}
          onClick={() => onAction('keep')}
          label="Keep"
        />
        <PrimaryButton
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => onAction('cancel_duplicate')}
          label="Cancel Duplicate"
        />
        <PrimaryButton
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => onAction('archive')}
          label="Remove / Archive"
        />
        {canDelete ? (
          <PrimaryButton
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onAction('delete')}
            label="Delete"
          />
        ) : null}
      </div>
    </Modal>
  )
}
