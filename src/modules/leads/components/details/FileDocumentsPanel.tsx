import { useState } from 'react'
import { Input, Modal, Select, Tag } from 'antd'
import { toast } from 'react-toastify'
import { PrimaryButton } from '@/components/ui'
import { getApiError } from '@/lib/api'
import LeadSectionCard from './LeadSectionCard'
import {
  useAddFileChecklistItemMutation,
  useArchiveFileDocumentMutation,
  useGetFileWorkspaceQuery,
  useLazyFetchFileDocumentBlobQuery,
  useRejectFileDocumentMutation,
  useRequestFileDocumentMutation,
  useReviewFileDocumentMutation,
  useSetPrimaryFileAssetMutation,
  useUpdateFileChecklistItemMutation,
  useUploadFileDocumentMutation,
  useVerifyFileDocumentMutation,
  type FileDocumentRecord,
} from '@/modules/files/api/filesApi'

const METHODS = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'IN_PERSON', label: 'In Person' },
  { value: 'OTHER', label: 'Other' },
]

const fieldClass =
  'w-full rounded-lg border border-[#dbe4ee] bg-white px-3 py-2 text-sm dark:border-border dark:bg-transparent'

type UploadState = {
  open: boolean
  documentId?: string
  typeCode?: string
  mode: 'create' | 'additional' | 'reupload'
}

export default function FileDocumentsPanel({
  leadId,
  canUpload,
  canVerify,
  canManage,
  canDownload,
}: {
  leadId: string
  canUpload: boolean
  canVerify: boolean
  canManage: boolean
  canDownload: boolean
}) {
  const [showArchived, setShowArchived] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>({ open: false, mode: 'create' })
  const [requestId, setRequestId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [addType, setAddType] = useState<string>()
  const [file, setFile] = useState<File | null>(null)
  const [label, setLabel] = useState('')
  const [documentDate, setDocumentDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [remarks, setRemarks] = useState('')
  const [method, setMethod] = useState('WHATSAPP')
  const [dueDate, setDueDate] = useState('')
  const [reasonCode, setReasonCode] = useState<string>()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState('')

  const { data, isFetching } = useGetFileWorkspaceQuery({ leadId, archived: showArchived })
  const [uploadDocument, { isLoading: uploading }] = useUploadFileDocumentMutation()
  const [requestDocument, { isLoading: requesting }] = useRequestFileDocumentMutation()
  const [reviewDocument] = useReviewFileDocumentMutation()
  const [verifyDocument, { isLoading: verifying }] = useVerifyFileDocumentMutation()
  const [rejectDocument, { isLoading: rejecting }] = useRejectFileDocumentMutation()
  const [archiveDocument] = useArchiveFileDocumentMutation()
  const [setPrimary] = useSetPrimaryFileAssetMutation()
  const [addItem] = useAddFileChecklistItemMutation()
  const [updateItem] = useUpdateFileChecklistItemMutation()
  const [fetchBlob] = useLazyFetchFileDocumentBlobQuery()

  const selected = data?.documents.find((item) => item.id === selectedId) || null

  function resetUpload() {
    setFile(null)
    setLabel('')
    setDocumentDate('')
    setExpiryDate('')
    setRemarks('')
  }

  async function submitUpload() {
    if (!file) {
      toast.error('Please select a document.')
      return
    }
    try {
      await uploadDocument({
        leadId,
        file,
        typeCode: uploadState.typeCode,
        documentId: uploadState.documentId,
        mode: uploadState.mode,
        label,
        documentDate,
        expiryDate,
        remarks,
      }).unwrap()
      toast.success(uploadState.mode === 'reupload' ? 'New version uploaded.' : 'Document uploaded.')
      setUploadState({ open: false, mode: 'create' })
      resetUpload()
    } catch (error) {
      toast.error(getApiError(error, 'Unable to upload the document. Please try again.'))
    }
  }

  async function submitRequest() {
    if (!requestId) return
    try {
      await requestDocument({ leadId, documentId: requestId, method, dueDate, remarks }).unwrap()
      toast.success('Document request sent.')
      setRequestId(null)
      setRemarks('')
      setDueDate('')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to send the document request.'))
    }
  }

  async function submitReject() {
    if (!rejectId || !reasonCode) {
      toast.error('Please provide a rejection reason.')
      return
    }
    try {
      await rejectDocument({ leadId, documentId: rejectId, reasonCode, remarks }).unwrap()
      toast.success('Document rejected. Re-upload is required.')
      setRejectId(null)
      setRemarks('')
      setReasonCode(undefined)
    } catch (error) {
      toast.error(getApiError(error, 'Unable to reject the document.'))
    }
  }

  async function openContent(document: FileDocumentRecord, assetId: string | undefined, download: boolean) {
    try {
      const result = await fetchBlob({ leadId, documentId: document.id, assetId, download }).unwrap()
      const url = URL.createObjectURL(result.blob)
      if (download) {
        const anchor = window.document.createElement('a')
        anchor.href = url
        anchor.download = document.latestVersion?.assets.find((asset) => asset.id === assetId)?.fileName || document.typeName
        anchor.click()
        return
      }
      setPreviewType(result.mimeType)
      setPreviewUrl(url)
    } catch (error) {
      toast.error(getApiError(error, 'You are not authorized to access this document.'))
    }
  }

  if (!data?.available || !data.file || !data.summary) {
    return (
      <LeadSectionCard title="File Documents">
        <p className="m-0 text-sm text-[#8b97a8]">
          Initial documents are available after the file is opened. File status and document completion stay separate.
        </p>
      </LeadSectionCard>
    )
  }

  const summary = data.summary
  const fileRecord = data.file

  return (
    <div className="grid gap-4">
      <LeadSectionCard
        title={`${fileRecord.code} · ${fileRecord.studentName}`}
        extra={
          <div className="flex flex-wrap gap-2">
            {canUpload ? (
              <PrimaryButton
                type="button"
                size="sm"
                label="Upload Document"
                onClick={() => {
                  resetUpload()
                  setUploadState({ open: true, mode: 'create' })
                }}
              />
            ) : null}
            {canUpload ? (
              <PrimaryButton
                type="button"
                size="sm"
                variant="outline"
                label="Request Document"
                onClick={() => {
                  const first = data.documents.find((item) => item.status === 'NOT_REQUESTED') || data.documents[0]
                  setRequestId(first?.id || null)
                  setRemarks('')
                }}
              />
            ) : null}
          </div>
        }
      >
        <p className="m-0 text-sm text-[#17324f] dark:text-text-strong">
          Documents — Total: {summary.total} · Verified: {summary.verified} · Pending: {summary.pending} · Rejected:{' '}
          {summary.rejected}
        </p>
        <p className="mb-2 mt-1 text-sm text-[#8b97a8]">
          File status: {fileRecord.status} · Document completion: {summary.completionPercent}% (
          {fileRecord.documentReadiness === 'COMPLETE' ? 'Complete' : 'Incomplete'})
        </p>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#e8eef5]">
          <div className="h-full rounded-full bg-primary" style={{ width: `${summary.completionPercent}%` }} />
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-[#526277]">
          <Tag>Required {summary.required}</Tag>
          <Tag>Requested {summary.requested}</Tag>
          <Tag>Received {summary.received}</Tag>
          <Tag>Under Review {summary.underReview}</Tag>
          <Tag>Verified {summary.verified}</Tag>
          <Tag>Rejected {summary.rejected}</Tag>
          <Tag>Missing {summary.missing}</Tag>
        </div>
      </LeadSectionCard>

      <LeadSectionCard title="Initial File Documents">
        <ul className="m-0 grid list-none gap-2 p-0">
          {data.checklist
            .filter((item) => item.isActive || showArchived)
            .map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e7eef5] px-3 py-2.5">
                <span>{item.completed ? '☑' : '☐'}</span>
                <span className="min-w-0 flex-1 text-sm font-medium">
                  {item.typeName}{' '}
                  <span className="font-normal text-[#8b97a8]">({item.isRequired ? 'Required' : 'Optional'})</span>
                </span>
                <Tag>{item.status === 'MISSING' ? 'Missing' : item.status.replace(/_/g, ' ')}</Tag>
                {canUpload && item.documentId && (item.status === 'NOT_REQUESTED' || item.status === 'REQUESTED' || item.status === 'MISSING') ? (
                  <PrimaryButton
                    type="button"
                    size="sm"
                    variant="outline"
                    label="Upload"
                    onClick={() => {
                      resetUpload()
                      setUploadState({ open: true, mode: 'create', documentId: item.documentId || undefined, typeCode: item.typeCode })
                    }}
                  />
                ) : null}
                {canUpload && item.documentId ? (
                  <PrimaryButton
                    type="button"
                    size="sm"
                    variant="outline"
                    label="Request"
                    onClick={() => {
                      setRequestId(item.documentId)
                      setRemarks('')
                    }}
                  />
                ) : null}
                {canManage ? (
                  <PrimaryButton
                    type="button"
                    size="sm"
                    variant="outline"
                    label={item.isRequired ? 'Mark Optional' : 'Mark Required'}
                    onClick={() =>
                      updateItem({ leadId, itemId: item.id, isRequired: !item.isRequired })
                        .unwrap()
                        .catch((error) => toast.error(getApiError(error, 'Unable to update the checklist.')))
                    }
                  />
                ) : null}
                {canManage && item.isActive ? (
                  <PrimaryButton
                    type="button"
                    size="sm"
                    variant="outline"
                    label="Remove"
                    onClick={() =>
                      updateItem({ leadId, itemId: item.id, remove: true })
                        .unwrap()
                        .catch((error) => toast.error(getApiError(error, 'Unable to update the checklist.')))
                    }
                  />
                ) : null}
              </li>
            ))}
        </ul>
        {canManage ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Select
              className="min-w-[220px]"
              placeholder="Add checklist document"
              value={addType}
              options={data.catalog
                .filter((item) => item.typeCode)
                .map((item) => ({ value: item.typeCode as string, label: `${item.typeName} · ${item.categoryName}` }))}
              onChange={setAddType}
            />
            <PrimaryButton
              type="button"
              size="sm"
              label="Add"
              onClick={() => {
                if (!addType) return
                addItem({ leadId, typeCode: addType, isRequired: false })
                  .unwrap()
                  .then(() => {
                    setAddType(undefined)
                    toast.success('Checklist item added.')
                  })
                  .catch((error) => toast.error(getApiError(error, 'Unable to add the checklist item.')))
              }}
            />
          </div>
        ) : null}
      </LeadSectionCard>

      <LeadSectionCard
        title="Document Vault"
        extra={
          <PrimaryButton
            type="button"
            size="sm"
            variant="outline"
            label={showArchived ? 'Hide Archived' : 'View Archived'}
            onClick={() => setShowArchived((value) => !value)}
          />
        }
      >
        {isFetching && data.documents.length === 0 ? <p className="m-0 text-sm text-[#8b97a8]">Loading documents…</p> : null}
        <div className="grid gap-3">
          {data.documents.map((document) => (
            <article key={document.id} className="rounded-xl border border-[#e7eef5] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="text-left text-sm font-semibold" onClick={() => setSelectedId(document.id)}>
                  {document.code} · {document.typeName}
                </button>
                <Tag>{document.categoryName}</Tag>
                <Tag>{document.statusLabel}</Tag>
                {document.expiryStatus === 'EXPIRED' ? <Tag color="red">Expired</Tag> : null}
                {document.expiryStatus === 'EXPIRING' ? <Tag color="orange">Expiring</Tag> : null}
                {document.requirement ? <Tag>{document.requirement === 'REQUIRED' ? 'Required' : 'Optional'}</Tag> : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {canVerify && (document.status === 'RECEIVED' || document.status === 'UNDER_REVIEW') ? (
                  <>
                    <PrimaryButton type="button" size="sm" variant="outline" label="Review" onClick={() => reviewDocument({ leadId, documentId: document.id })} />
                    <PrimaryButton
                      type="button"
                      size="sm"
                      label="Verify"
                      onClick={() =>
                        verifyDocument({ leadId, documentId: document.id })
                          .unwrap()
                          .then(() => toast.success('Document verified.'))
                          .catch((error) => toast.error(getApiError(error, 'Unable to verify the document.')))
                      }
                    />
                    <PrimaryButton type="button" size="sm" variant="outline" label="Reject" onClick={() => setRejectId(document.id)} />
                  </>
                ) : null}
                {canUpload && (document.status === 'REUPLOAD_REQUIRED' || document.status === 'REJECTED') ? (
                  <PrimaryButton
                    type="button"
                    size="sm"
                    label="Re-upload"
                    onClick={() => {
                      resetUpload()
                      setUploadState({ open: true, mode: 'reupload', documentId: document.id, typeCode: document.typeCode })
                    }}
                  />
                ) : null}
                {canUpload && document.latestVersion && document.status !== 'REUPLOAD_REQUIRED' && document.status !== 'ARCHIVED' ? (
                  <PrimaryButton
                    type="button"
                    size="sm"
                    variant="outline"
                    label="Add File"
                    onClick={() => {
                      resetUpload()
                      setUploadState({ open: true, mode: 'additional', documentId: document.id, typeCode: document.typeCode })
                    }}
                  />
                ) : null}
                {canManage && document.status !== 'ARCHIVED' ? (
                  <PrimaryButton
                    type="button"
                    size="sm"
                    variant="outline"
                    label="Archive"
                    onClick={() =>
                      archiveDocument({ leadId, documentId: document.id })
                        .unwrap()
                        .then(() => toast.success('Document archived.'))
                        .catch((error) => toast.error(getApiError(error, 'This document cannot be permanently deleted.')))
                    }
                  />
                ) : null}
              </div>
              {document.latestVersion ? (
                <ul className="mt-2 grid list-none gap-1 p-0 text-sm">
                  {document.latestVersion.assets.map((asset) => (
                    <li key={asset.id} className="flex flex-wrap items-center gap-2">
                      <span>
                        {asset.fileName}
                        {asset.isPrimary ? ' · Primary' : ''}
                      </span>
                      <PrimaryButton type="button" size="sm" variant="outline" label="Preview" onClick={() => openContent(document, asset.id, false)} />
                      {canDownload ? (
                        <PrimaryButton type="button" size="sm" variant="outline" label="Download" onClick={() => openContent(document, asset.id, true)} />
                      ) : null}
                      {canUpload && !asset.isPrimary ? (
                        <PrimaryButton
                          type="button"
                          size="sm"
                          variant="outline"
                          label="Mark Primary"
                          onClick={() => setPrimary({ leadId, documentId: document.id, assetId: asset.id })}
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </LeadSectionCard>

      <Modal title={selected ? `${selected.typeName} history` : 'History'} open={Boolean(selected)} onCancel={() => setSelectedId(null)} footer={null} width={720}>
        {selected ? (
          <div className="grid gap-4">
            <div>
              <p className="mb-2 font-medium">Versions</p>
              <ul className="m-0 grid list-none gap-2 p-0">
                {selected.versions.map((version) => (
                  <li key={version.id} className="rounded-lg border border-[#e7eef5] p-2 text-sm">
                    Version {version.versionNumber}
                    {version.isLatest ? ' · Latest' : ''} · Uploaded {version.uploadedAt.slice(0, 10)}
                    {version.uploadedBy ? ` by ${version.uploadedBy.name}` : ''}
                    {version.verifiedAt ? ` · Verified ${version.verifiedAt.slice(0, 10)} by ${version.verifiedBy?.name || '—'}` : ''}
                    {version.rejectionReasonName ? ` · Rejected: ${version.rejectionReasonName}` : ''}
                    {version.expiryDate ? ` · Expiry ${version.expiryDate}` : ''}
                    <div className="text-[#8b97a8]">{version.assets.map((asset) => asset.fileName).join(', ')}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 font-medium">Activity</p>
              <ul className="m-0 grid list-none gap-1 p-0 text-sm">
                {selected.activities.map((activity) => (
                  <li key={activity.id}>
                    {activity.createdAt.slice(0, 16).replace('T', ' ')} · {activity.action.replace(/_/g, ' ')}
                    {activity.user ? ` · ${activity.user.name}` : ''}
                    {activity.notes ? ` · ${activity.notes}` : ''}
                  </li>
                ))}
              </ul>
            </div>
            {selected.requests.length ? (
              <div>
                <p className="mb-2 font-medium">Requests</p>
                <ul className="m-0 grid list-none gap-1 p-0 text-sm">
                  {selected.requests.map((request) => (
                    <li key={request.id}>
                      {request.code} · {request.method} · {request.requestedAt.slice(0, 10)}
                      {request.dueDate ? ` · due ${request.dueDate}` : ''}
                      {request.communicationEventId ? ' · linked to communication' : ''}
                      {request.remarks ? ` · ${request.remarks}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        title={uploadState.mode === 'reupload' ? 'Re-upload Document' : 'Upload Document'}
        open={uploadState.open}
        onCancel={() => setUploadState({ open: false, mode: 'create' })}
        onOk={submitUpload}
        confirmLoading={uploading}
        okText="Upload"
      >
        <div className="grid gap-3">
          {!uploadState.documentId ? (
            <Select
              placeholder="Document type"
              value={uploadState.typeCode}
              options={data.catalog.filter((item) => item.typeCode).map((item) => ({ value: item.typeCode as string, label: item.typeName }))}
              onChange={(value) => setUploadState((current) => ({ ...current, typeCode: value }))}
            />
          ) : null}
          <input className={fieldClass} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          <Input placeholder="Label, e.g. Front Page" value={label} onChange={(event) => setLabel(event.target.value)} />
          <label className="grid gap-1 text-sm">
            Document date
            <input className={fieldClass} type="date" value={documentDate} onChange={(event) => setDocumentDate(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Expiry date
            <input className={fieldClass} type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} />
          </label>
          <Input.TextArea placeholder="Remarks" value={remarks} onChange={(event) => setRemarks(event.target.value)} />
        </div>
      </Modal>

      <Modal title="Request Document" open={Boolean(requestId)} onCancel={() => setRequestId(null)} onOk={submitRequest} confirmLoading={requesting} okText="Send Request">
        <div className="grid gap-3">
          <Select
            value={requestId || undefined}
            options={data.documents.map((item) => ({ value: item.id, label: item.typeName }))}
            onChange={setRequestId}
          />
          <Select value={method} options={METHODS} onChange={setMethod} />
          <label className="grid gap-1 text-sm">
            Due date
            <input className={fieldClass} type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </label>
          <Input.TextArea placeholder="Please provide a clear scanned copy." value={remarks} onChange={(event) => setRemarks(event.target.value)} />
        </div>
      </Modal>

      <Modal title="Reject Document" open={Boolean(rejectId)} onCancel={() => setRejectId(null)} onOk={submitReject} confirmLoading={rejecting || verifying} okText="Reject">
        <div className="grid gap-3">
          <Select
            placeholder="Rejection reason"
            value={reasonCode}
            options={data.rejectionReasons.filter((item) => item.code).map((item) => ({ value: item.code as string, label: item.name }))}
            onChange={setReasonCode}
          />
          <Input.TextArea placeholder="Please upload a high-resolution copy." value={remarks} onChange={(event) => setRemarks(event.target.value)} />
        </div>
      </Modal>

      <Modal title="Preview" open={Boolean(previewUrl)} onCancel={() => setPreviewUrl(null)} footer={null} width={840}>
        {previewUrl && previewType.startsWith('image/') ? <img src={previewUrl} alt="Document preview" className="max-h-[70vh] w-full object-contain" /> : null}
        {previewUrl && !previewType.startsWith('image/') ? <iframe title="Document preview" src={previewUrl} className="h-[70vh] w-full" /> : null}
      </Modal>
    </div>
  )
}
