import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AntModal } from '@/components/common/Modals'
import type { FollowUpRecord } from '../types'
import {
  displayFollowUpStatus,
  followUpDisplayStatusClass,
  followUpPriorityClass,
} from '../utils/followUpList'

type FollowUpDetailsModalProps = {
  open: boolean
  followUp: FollowUpRecord | null
  onClose: () => void
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border-subtle py-2.5 last:border-b-0 sm:grid-cols-[140px_1fr] sm:gap-3">
      <span className="text-[12px] font-medium text-text-muted">{label}</span>
      <div className="text-[13px] text-text-strong">{children}</div>
    </div>
  )
}

export default function FollowUpDetailsModal({
  open,
  followUp,
  onClose,
}: FollowUpDetailsModalProps) {
  if (!followUp) return null

  const purpose =
    followUp.purpose === 'Other' && followUp.purposeOther
      ? followUp.purposeOther
      : followUp.purpose

  return (
    <AntModal open={open} onClose={onClose} title="Follow-up details" width={520}>
      <div className="grid">
        <DetailRow label="Contact">
          {followUp.leadId ? (
            <Link
              to={`/leads/${followUp.leadId}`}
              className="font-semibold text-primary hover:underline"
            >
              {followUp.contact || followUp.contactName || '—'}
            </Link>
          ) : (
            followUp.contact || followUp.contactName || '—'
          )}
        </DetailRow>
        <DetailRow label="Lead code">{followUp.lead?.code || '—'}</DetailRow>
        <DetailRow label="Type">{followUp.type || '—'}</DetailRow>
        <DetailRow label="Purpose">{purpose || '—'}</DetailRow>
        <DetailRow label="Owner">{followUp.owner || followUp.ownerName || '—'}</DetailRow>
        <DetailRow label="Due">{followUp.due || '—'}</DetailRow>
        <DetailRow label="Priority">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${followUpPriorityClass(followUp.priority || 'Medium')}`}
          >
            {followUp.priority || 'Medium'}
          </span>
        </DetailRow>
        <DetailRow label="Status">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${followUpDisplayStatusClass(followUp.status)}`}
          >
            {displayFollowUpStatus(followUp.status)}
          </span>
        </DetailRow>
        <DetailRow label="Next action">{followUp.nextAction || '—'}</DetailRow>
        <DetailRow label="Reminder">{followUp.reminder || '—'}</DetailRow>
        <DetailRow label="Outcome">{followUp.outcome || '—'}</DetailRow>
        <DetailRow label="Notes">{followUp.notes || '—'}</DetailRow>
        {followUp.cancelReason ? (
          <DetailRow label="Cancel reason">{followUp.cancelReason}</DetailRow>
        ) : null}
      </div>
    </AntModal>
  )
}
