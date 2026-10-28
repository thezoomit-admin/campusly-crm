import { useEffect, useState } from 'react'
import { Drawer, Input, Select, Spin } from 'antd'
import { PrimaryButton } from '@/components/ui'
import type { DocumentRow } from '../types'
import { documentStatusClass } from '../utils/documentStatus'
import { displayStatusLabel, isPendingReview, isRequestable } from '../utils/documentDisplay'
import { formatDocumentDate, formatDocumentDateTime } from '../utils/documentFormat'

const REQUEST_METHODS = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'IN_PERSON', label: 'In Person' },
  { value: 'OTHER', label: 'Other' },
]

const REJECTION_REASONS = [
  { value: 'BLURRY', label: 'Blurry' },
  { value: 'WRONG_DOCUMENT', label: 'Wrong Document' },
  { value: 'INCORRECT_INFORMATION', label: 'Incorrect Information' },
  { value: 'MISSING_PAGE', label: 'Missing Page' },
  { value: 'INVALID_COPY', label: 'Invalid Copy' },
  { value: 'OTHER', label: 'Other' },
]

const fieldClass =
  'w-full rounded-lg border border-[#dbe4ee] bg-white px-3 py-2 text-sm dark:border-border dark:bg-transparent'

type DocumentDrawerProps = {
  row: DocumentRow | null
  open: boolean
  onClose: () => void
  canUpload: boolean
  canVerify: boolean
  canDownload: boolean
  previewUrl: string | null
  previewType: string
  previewLoading: boolean
  verifying?: boolean
  requesting?: boolean
  rejecting?: boolean
  onOpenLead: (row: DocumentRow) => void
  onRequest: (row: DocumentRow, payload: { method: string; dueDate?: string; remarks?: string }) => void
  onVerify: (row: DocumentRow) => void
  onReject: (row: DocumentRow, payload: { reasonCode: string; remarks?: string }) => void
  onDownload: (row: DocumentRow) => void
  onLoadPreview: (row: DocumentRow) => void
}

export default function DocumentDrawer({
  row,
  open,
  onClose,
  canUpload,
  canVerify,
  canDownload,
  previewUrl,
  previewType,
  previewLoading,
  verifying,
  requesting,
  rejecting,
  onOpenLead,
  onRequest,
  onVerify,
  onReject,
  onDownload,
  onLoadPreview,
}: DocumentDrawerProps) {
  const [method, setMethod] = useState('WHATSAPP')
  const [dueDate, setDueDate] = useState('')
  const [remarks, setRemarks] = useState('')
  const [reasonCode, setReasonCode] = useState<string>()
  const [mode, setMode] = useState<'view' | 'request' | 'reject'>('view')

  useEffect(() => {
    setMode('view')
    setRemarks('')
    setDueDate('')
    setReasonCode(undefined)
    setMethod('WHATSAPP')
    if (row && row.hasFile && open) {
      onLoadPreview(row)
    }
    // Intentionally only when the opened document changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row?.id, open])

  if (!row) return null

  const statusLabel = displayStatusLabel(row)
  const pending = isPendingReview(row)
  const requestable = isRequestable(row)

  return (
    <Drawer
      title={
        <div className="pr-4">
          <p className="m-0 text-[15px] font-semibold text-text-strong">{row.type}</p>
          <p className="m-0 mt-0.5 text-[12px] font-normal text-text-muted">{row.owner}</p>
        </div>
      }
      open={open}
      onClose={onClose}
      width={520}
      destroyOnHidden
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={documentStatusClass(statusLabel)}>{statusLabel}</span>
          {row.requirement ? (
            <span className="rounded-md bg-[#f3f4f6] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#6b7280]">
              {row.requirement === 'REQUIRED' ? 'Required' : 'Optional'}
            </span>
          ) : null}
          {row.category ? (
            <span className="text-[12px] text-text-muted">{row.category}</span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="m-0 text-[11px] uppercase text-text-muted">Uploaded by</p>
            <p className="m-0 mt-0.5 text-text-strong">{row.uploadedBy || '—'}</p>
          </div>
          <div>
            <p className="m-0 text-[11px] uppercase text-text-muted">Verified by</p>
            <p className="m-0 mt-0.5 text-text-strong">{row.verifiedBy || '—'}</p>
          </div>
          <div>
            <p className="m-0 text-[11px] uppercase text-text-muted">Updated</p>
            <p className="m-0 mt-0.5 text-text-strong">{formatDocumentDateTime(row.updated)}</p>
          </div>
          <div>
            <p className="m-0 text-[11px] uppercase text-text-muted">Expiry</p>
            <p className="m-0 mt-0.5 text-text-strong">
              {row.expiryDate ? formatDocumentDate(row.expiryDate) : '—'}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-[#f8fafc] dark:bg-[#161d24]">
          {previewLoading ? (
            <div className="grid h-64 place-items-center">
              <Spin />
            </div>
          ) : previewUrl ? (
            previewType.startsWith('image/') ? (
              <img src={previewUrl} alt={row.type} className="max-h-[420px] w-full object-contain" />
            ) : (
              <iframe title="Document preview" src={previewUrl} className="h-[420px] w-full border-0" />
            )
          ) : (
            <div className="grid h-48 place-items-center px-4 text-center text-sm text-text-muted">
              {row.hasFile
                ? 'Preview is not available for this file type.'
                : 'No file uploaded yet. Request the document from the student.'}
            </div>
          )}
        </div>

        {mode === 'request' ? (
          <div className="grid gap-3 rounded-xl border border-border p-3">
            <p className="m-0 text-sm font-medium">Request document</p>
            <Select value={method} options={REQUEST_METHODS} onChange={setMethod} />
            <label className="grid gap-1 text-sm">
              Due date
              <input
                className={fieldClass}
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </label>
            <Input.TextArea
              placeholder="Please provide a clear scanned copy."
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <PrimaryButton type="button" size="sm" variant="outline" label="Cancel" onClick={() => setMode('view')} />
              <PrimaryButton
                type="button"
                size="sm"
                label="Send request"
                loading={requesting}
                onClick={() =>
                  onRequest(row, { method, dueDate: dueDate || undefined, remarks: remarks || undefined })
                }
              />
            </div>
          </div>
        ) : null}

        {mode === 'reject' ? (
          <div className="grid gap-3 rounded-xl border border-border p-3">
            <p className="m-0 text-sm font-medium">Reject document</p>
            <Select
              placeholder="Rejection reason"
              value={reasonCode}
              options={REJECTION_REASONS}
              onChange={setReasonCode}
            />
            <Input.TextArea
              placeholder="Please upload a high-resolution copy."
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <PrimaryButton type="button" size="sm" variant="outline" label="Cancel" onClick={() => setMode('view')} />
              <PrimaryButton
                type="button"
                size="sm"
                label="Reject"
                loading={rejecting}
                disabled={!reasonCode}
                onClick={() => {
                  if (!reasonCode) return
                  onReject(row, { reasonCode, remarks: remarks || undefined })
                }}
              />
            </div>
          </div>
        ) : null}

        {mode === 'view' ? (
          <div className="flex flex-wrap gap-2">
            {canVerify && pending ? (
              <>
                <PrimaryButton
                  type="button"
                  size="sm"
                  label="Verify"
                  loading={verifying}
                  onClick={() => onVerify(row)}
                />
                <PrimaryButton
                  type="button"
                  size="sm"
                  variant="outline"
                  label="Reject"
                  onClick={() => setMode('reject')}
                />
              </>
            ) : null}
            {canUpload && requestable ? (
              <PrimaryButton
                type="button"
                size="sm"
                variant="outline"
                label="Request document"
                onClick={() => setMode('request')}
              />
            ) : null}
            {canDownload && row.hasFile ? (
              <PrimaryButton
                type="button"
                size="sm"
                variant="outline"
                label="Download"
                onClick={() => onDownload(row)}
              />
            ) : null}
            <PrimaryButton
              type="button"
              size="sm"
              variant="outline"
              label="Open in lead"
              onClick={() => onOpenLead(row)}
            />
          </div>
        ) : null}
      </div>
    </Drawer>
  )
}
