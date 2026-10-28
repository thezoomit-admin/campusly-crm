import { useMemo, useState } from 'react'
import { Dropdown, Input, Modal, Select } from 'antd'
import { toast } from 'react-toastify'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  CircleIcon,
  Clock01Icon,
  File01Icon,
  Folder02Icon,
  Image01Icon,
  MoreHorizontalIcon,
  Pdf02Icon,
  RefreshIcon,
  Upload01Icon,
} from '@hugeicons/core-free-icons'
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
  useUpdateFileChecklistItemMutation,
  useUploadFileDocumentMutation,
  useVerifyFileDocumentMutation,
  type FileDocumentRecord,
  type FileWorkspace,
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

type StatusFilter =
  | 'all'
  | 'missing'
  | 'requested'
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'rejected'

type UploadState = {
  open: boolean
  documentId?: string
  typeCode?: string
  mode: 'create' | 'additional' | 'reupload'
}

type StatusVisual = {
  label: string
  className: string
  icon: typeof CheckmarkCircle02Icon
}

function formatShortDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function normalizeStatus(status: string) {
  return (status || '').toUpperCase()
}

function isMissingStatus(doc: FileDocumentRecord) {
  const status = normalizeStatus(doc.status)
  if (status === 'MISSING') return true
  if (doc.requirement !== 'REQUIRED') return false
  return status === 'NOT_REQUESTED' || (status === 'REQUESTED' && !doc.latestVersion)
}

function filterKeyForDocument(doc: FileDocumentRecord): StatusFilter {
  const status = normalizeStatus(doc.status)
  if (status === 'REJECTED' || status === 'REUPLOAD_REQUIRED') return 'rejected'
  if (status === 'VERIFIED') return 'verified'
  if (status === 'UNDER_REVIEW') return 'under_review'
  if (status === 'RECEIVED') return 'submitted'
  if (status === 'REQUESTED') return 'requested'
  if (isMissingStatus(doc) || status === 'MISSING' || status === 'NOT_REQUESTED') return 'missing'
  return 'all'
}

function statusVisual(doc: FileDocumentRecord): StatusVisual {
  const key = filterKeyForDocument(doc)
  const status = normalizeStatus(doc.status)
  if (key === 'verified') {
    return {
      label: 'Verified',
      className: 'bg-[#e8f8ef] text-[#15803d] ring-1 ring-[#bbf7d0]',
      icon: CheckmarkCircle02Icon,
    }
  }
  if (key === 'requested') {
    return {
      label: 'Requested',
      className: 'bg-[#e8f1ff] text-[#2563eb] ring-1 ring-[#bfdbfe]',
      icon: RefreshIcon,
    }
  }
  if (key === 'submitted') {
    return {
      label: 'Submitted',
      className: 'bg-[#f3e8ff] text-[#7c3aed] ring-1 ring-[#e9d5ff]',
      icon: Upload01Icon,
    }
  }
  if (key === 'under_review') {
    return {
      label: 'Under Review',
      className: 'bg-[#fff7e8] text-[#c2410c] ring-1 ring-[#fed7aa]',
      icon: Clock01Icon,
    }
  }
  if (key === 'rejected') {
    return {
      label: status === 'REUPLOAD_REQUIRED' ? 'Re-upload Required' : 'Rejected',
      className: 'bg-[#fee2e2] text-[#b91c1c] ring-1 ring-[#fecaca]',
      icon: Cancel01Icon,
    }
  }
  if (key === 'missing' && status === 'NOT_REQUESTED' && doc.requirement !== 'REQUIRED') {
    return {
      label: 'Not Requested',
      className: 'bg-[#f3f4f6] text-[#6b7280] ring-1 ring-[#e5e7eb]',
      icon: CircleIcon,
    }
  }
  return {
    label: 'Missing',
    className: 'bg-[#fef2f2] text-[#dc2626] ring-1 ring-[#fecaca]',
    icon: Alert02Icon,
  }
}

function requirementVisual(requirement: FileDocumentRecord['requirement']) {
  if (requirement === 'REQUIRED') {
    return { label: 'Required', className: 'bg-[#fef2f2] text-[#dc2626] ring-1 ring-[#fecaca]' }
  }
  return { label: 'Optional', className: 'bg-[#f3f4f6] text-[#6b7280] ring-1 ring-[#e5e7eb]' }
}

function priorityScore(doc: FileDocumentRecord) {
  const requiredBoost = doc.requirement === 'REQUIRED' ? 0 : 40
  const key = filterKeyForDocument(doc)
  const scores: Record<StatusFilter, number> = {
    missing: 0,
    rejected: 5,
    requested: 10,
    submitted: 15,
    under_review: 18,
    verified: 80,
    all: 50,
  }
  return requiredBoost + (scores[key] ?? 50)
}

function fileTypeIcon(doc: FileDocumentRecord) {
  const mime = doc.latestVersion?.assets.find((asset) => asset.isPrimary)?.mimeType
    || doc.latestVersion?.assets[0]?.mimeType
    || ''
  if (mime.startsWith('image/')) return Image01Icon
  if (mime.includes('pdf') || Boolean(doc.latestVersion)) return Pdf02Icon
  return File01Icon
}

function fileTypeIconTone(doc: FileDocumentRecord) {
  const mime = doc.latestVersion?.assets.find((asset) => asset.isPrimary)?.mimeType
    || doc.latestVersion?.assets[0]?.mimeType
    || ''
  if (mime.startsWith('image/')) return 'bg-[#fce7f3] text-[#db2777]'
  if (mime.includes('pdf') || Boolean(doc.latestVersion)) return 'bg-[#fee2e2] text-[#dc2626]'
  return 'bg-[#eef2ff] text-[#4f46e5]'
}

function uploadedLabel(doc: FileDocumentRecord) {
  const version = doc.latestVersion
  if (!version) return '—'
  const who =
    version.uploadedByKind === 'STUDENT_PORTAL'
      ? 'Student'
      : version.uploadedBy?.name || 'Staff'
  return `v${version.versionNumber} · ${formatShortDate(version.uploadedAt) || '—'} by ${who}`
}

function matchesStatusFilter(doc: FileDocumentRecord, filter: StatusFilter) {
  if (filter === 'all') return true
  return filterKeyForDocument(doc) === filter
}

function primaryActionLabel(doc: FileDocumentRecord, canVerify: boolean, canUpload: boolean) {
  const key = filterKeyForDocument(doc)
  if (key === 'verified' || (key === 'submitted' && !canVerify)) return 'View'
  if (key === 'rejected') return 'View Reason'
  if (key === 'under_review' || key === 'submitted') return canVerify ? 'Review' : 'View'
  if (key === 'requested') return canUpload ? 'Remind' : 'View'
  if (key === 'missing') {
    const status = normalizeStatus(doc.status)
    if (status === 'NOT_REQUESTED' || status === 'MISSING') return canUpload ? 'Request' : 'View'
    return canUpload ? 'Remind' : 'View'
  }
  return 'View'
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
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

  const { data, isFetching } = useGetFileWorkspaceQuery(
    { leadId, archived: showArchived },
    { refetchOnMountOrArgChange: true },
  )
  const [uploadDocument, { isLoading: uploading }] = useUploadFileDocumentMutation()
  const [requestDocument, { isLoading: requesting }] = useRequestFileDocumentMutation()
  const [reviewDocument] = useReviewFileDocumentMutation()
  const [verifyDocument, { isLoading: verifying }] = useVerifyFileDocumentMutation()
  const [rejectDocument, { isLoading: rejecting }] = useRejectFileDocumentMutation()
  const [archiveDocument] = useArchiveFileDocumentMutation()
  const [addItem] = useAddFileChecklistItemMutation()
  const [updateItem] = useUpdateFileChecklistItemMutation()
  const [fetchBlob] = useLazyFetchFileDocumentBlobQuery()

  const selected = data?.documents.find((item) => item.id === selectedId) || null

  const documents = useMemo(() => data?.documents || [], [data?.documents])

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: documents.length,
      missing: 0,
      requested: 0,
      submitted: 0,
      under_review: 0,
      verified: 0,
      rejected: 0,
    }
    for (const doc of documents) {
      const key = filterKeyForDocument(doc)
      if (key !== 'all') counts[key] += 1
    }
    return counts
  }, [documents])

  const filteredDocuments = useMemo(() => {
    const rows = documents.filter((doc) => matchesStatusFilter(doc, statusFilter))

    return [...rows].sort((a, b) => {
      const diff = priorityScore(a) - priorityScore(b)
      if (diff !== 0) return diff
      return a.typeName.localeCompare(b.typeName)
    })
  }, [documents, statusFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, { code: string; name: string; docs: FileDocumentRecord[] }>()
    for (const doc of filteredDocuments) {
      const code = doc.categoryCode || doc.categoryName
      const existing = map.get(code)
      if (existing) existing.docs.push(doc)
      else map.set(code, { code, name: doc.categoryName, docs: [doc] })
    }

    return [...map.values()].map((group) => {
      const verified = group.docs.filter((doc) => filterKeyForDocument(doc) === 'verified').length
      return { ...group, verified, total: group.docs.length }
    })
  }, [filteredDocuments])

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
        anchor.download =
          document.latestVersion?.assets.find((asset) => asset.id === assetId)?.fileName || document.typeName
        anchor.click()
        return
      }
      setPreviewType(result.mimeType)
      setPreviewUrl(url)
    } catch (error) {
      toast.error(getApiError(error, 'You are not authorized to access this document.'))
    }
  }

  function openPrimaryPreview(doc: FileDocumentRecord) {
    const asset = doc.latestVersion?.assets.find((item) => item.isPrimary) || doc.latestVersion?.assets[0]
    if (!asset) {
      toast.info('No file uploaded yet.')
      return
    }
    void openContent(doc, asset.id, false)
  }

  function handlePrimaryAction(doc: FileDocumentRecord) {
    const labelText = primaryActionLabel(doc, canVerify, canUpload)
    if (labelText === 'View') {
      openPrimaryPreview(doc)
      return
    }
    if (labelText === 'View Reason') {
      setSelectedId(doc.id)
      return
    }
    if (labelText === 'Review') {
      void reviewDocument({ leadId, documentId: doc.id })
        .unwrap()
        .then(() => toast.success('Marked under review.'))
        .catch((error) => toast.error(getApiError(error, 'Unable to review the document.')))
      return
    }
    if (labelText === 'Request' || labelText === 'Remind') {
      setRequestId(doc.id)
      setRemarks('')
    }
  }

  function moreMenuItems(doc: FileDocumentRecord) {
    const items: Array<{ key: string; label: string; onClick: () => void }> = [
      {
        key: 'history',
        label: 'View history',
        onClick: () => setSelectedId(doc.id),
      },
    ]

    if (doc.latestVersion) {
      items.push({
        key: 'preview',
        label: 'Preview',
        onClick: () => openPrimaryPreview(doc),
      })
    }

    if (canDownload && doc.latestVersion?.assets[0]) {
      items.push({
        key: 'download',
        label: 'Download',
        onClick: () => void openContent(doc, doc.latestVersion?.assets[0]?.id, true),
      })
    }

    if (canUpload) {
      items.push({
        key: 'upload',
        label: doc.latestVersion ? 'Add file' : 'Upload',
        onClick: () => {
          resetUpload()
          setUploadState({
            open: true,
            mode: doc.latestVersion ? 'additional' : 'create',
            documentId: doc.id,
            typeCode: doc.typeCode,
          })
        },
      })
    }

    if (canUpload && (doc.status === 'REUPLOAD_REQUIRED' || doc.status === 'REJECTED')) {
      items.push({
        key: 'reupload',
        label: 'Re-upload',
        onClick: () => {
          resetUpload()
          setUploadState({ open: true, mode: 'reupload', documentId: doc.id, typeCode: doc.typeCode })
        },
      })
    }

    if (canVerify && (doc.status === 'RECEIVED' || doc.status === 'UNDER_REVIEW')) {
      items.push(
        {
          key: 'verify',
          label: 'Verify',
          onClick: () =>
            void verifyDocument({ leadId, documentId: doc.id })
              .unwrap()
              .then(() => toast.success('Document verified.'))
              .catch((error) => toast.error(getApiError(error, 'Unable to verify the document.'))),
        },
        {
          key: 'reject',
          label: 'Reject',
          onClick: () => setRejectId(doc.id),
        },
      )
    }

    if (canUpload) {
      items.push({
        key: 'request',
        label: 'Request / Remind',
        onClick: () => {
          setRequestId(doc.id)
          setRemarks('')
        },
      })
    }

    if (canManage && doc.status !== 'ARCHIVED') {
      items.push({
        key: 'archive',
        label: 'Archive',
        onClick: () =>
          void archiveDocument({ leadId, documentId: doc.id })
            .unwrap()
            .then(() => toast.success('Document archived.'))
            .catch((error) => toast.error(getApiError(error, 'This document cannot be permanently deleted.'))),
      })
    }

    return items
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
    <div className="overflow-hidden rounded-2xl border border-[#e7eef5] bg-white dark:border-border dark:bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef2f7] px-4 py-3 sm:px-5">
        <p className="m-0 text-sm font-semibold text-[#17324f] dark:text-text-strong">
          Document Checklist
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {canUpload ? (
            <PrimaryButton
              type="button"
              size="sm"
              label="Upload"
              onClick={() => {
                resetUpload()
                setUploadState({ open: true, mode: 'create' })
              }}
            />
          ) : null}
          <PrimaryButton
            type="button"
            size="sm"
            variant="outline"
            label={showArchived ? 'Hide Archived' : 'Archived'}
            onClick={() => setShowArchived((value) => !value)}
          />
        </div>
      </div>

      <div className="border-b border-[#eef2f7] px-4 py-3 sm:px-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <p className="m-0 text-sm font-medium text-[#17324f] dark:text-text-strong">
            {fileRecord.code} · {fileRecord.studentName}
          </p>
          <p className="m-0 text-xs text-[#8b97a8]">
            Completion {summary.completionPercent}% · File status {fileRecord.status.replace(/_/g, ' ')}
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#e8eef5]">
          <div className="h-full rounded-full bg-primary" style={{ width: `${summary.completionPercent}%` }} />
        </div>
      </div>

      {canManage ? (
        <div className="border-b border-[#eef2f7] px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-[#dbe4ee] px-3 py-3">
            <Select
              className="min-w-[220px]"
              placeholder="Add checklist document"
              value={addType}
              options={data.catalog
                .filter((item) => item.typeCode)
                .map((item) => ({
                  value: item.typeCode as string,
                  label: `${item.typeName} · ${item.categoryName}`,
                }))}
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
            {data.checklist.some((item) => item.isActive) ? (
              <ChecklistManageHints
                checklist={data.checklist}
                leadId={leadId}
                canManage={canManage}
                updateItem={updateItem}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="border-b border-[#eef2f7] px-4 py-3 sm:px-5">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'missing', label: 'Missing' },
              { key: 'requested', label: 'Requested' },
              { key: 'submitted', label: 'Submitted' },
              { key: 'under_review', label: 'Under Review' },
              { key: 'verified', label: 'Verified' },
              { key: 'rejected', label: 'Rejected' },
            ] as const
          ).map((item) => {
            const active = statusFilter === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setStatusFilter(item.key)}
                className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors ${
                  active
                    ? 'border-primary bg-primary text-white'
                    : 'border-[#e5ebf2] bg-white text-[#526277] hover:border-[#c9d5e3] hover:bg-[#f8fafc] dark:border-border dark:bg-transparent'
                }`}
              >
                {item.label} ({statusCounts[item.key]})
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-3 py-3 sm:px-4">
        {isFetching && documents.length === 0 ? (
          <p className="m-0 px-2 py-8 text-center text-sm text-[#8b97a8]">Loading documents…</p>
        ) : null}
        {!isFetching && filteredDocuments.length === 0 ? (
          <p className="m-0 px-2 py-8 text-center text-sm text-[#8b97a8]">No documents match these filters.</p>
        ) : null}

        <div className="grid gap-2.5">
          {grouped.map((group) => {
            const isCollapsed = Boolean(collapsed[group.code])
            return (
              <section
                key={group.code}
                className="overflow-hidden rounded-xl border border-[#e7eef5] dark:border-border"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 border-0 bg-[#f4f8fc] px-3.5 py-3 text-left dark:bg-white/5"
                  onClick={() =>
                    setCollapsed((current) => ({ ...current, [group.code]: !current[group.code] }))
                  }
                >
                  <HugeiconsIcon
                    icon={isCollapsed ? ArrowRight01Icon : ArrowDown01Icon}
                    size={16}
                    className="text-[#6b7c8f]"
                  />
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white text-primary shadow-sm ring-1 ring-[#e7eef5] dark:bg-surface">
                    <HugeiconsIcon icon={Folder02Icon} size={15} />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold text-[#17324f] dark:text-text-strong">
                    {group.name}
                  </span>
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-[#526277] ring-1 ring-[#e7eef5] dark:bg-surface dark:ring-border">
                    {group.verified}/{group.total}
                  </span>
                </button>

                {!isCollapsed ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-[#eef2f7] text-[0.72rem] uppercase tracking-wide text-[#8b97a8]">
                          <th className="px-4 py-2.5 font-medium">Document Name</th>
                          <th className="px-3 py-2.5 font-medium">Requirement</th>
                          <th className="px-3 py-2.5 font-medium">Status</th>
                          <th className="px-3 py-2.5 font-medium">Uploaded</th>
                          <th className="px-3 py-2.5 font-medium">Expiry</th>
                          <th className="px-3 py-2.5 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.docs.map((doc) => {
                          const status = statusVisual(doc)
                          const requirement = requirementVisual(doc.requirement)
                          const TypeIcon = fileTypeIcon(doc)
                          const actionLabel = primaryActionLabel(doc, canVerify, canUpload)
                          const menuItems = moreMenuItems(doc)
                          return (
                            <tr
                              key={doc.id}
                              className="border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#fafcfe]"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${fileTypeIconTone(doc)}`}
                                  >
                                    <HugeiconsIcon icon={TypeIcon} size={18} />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="m-0 truncate text-sm font-semibold text-[#17324f] dark:text-text-strong">
                                      {doc.typeName}
                                    </p>
                                    <p className="m-0 truncate text-xs text-[#8b97a8]">
                                      {doc.categoryName}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ${requirement.className}`}
                                >
                                  {requirement.label}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ${status.className}`}
                                >
                                  <HugeiconsIcon icon={status.icon} size={13} />
                                  {status.label}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-xs text-[#6b7c8f]">{uploadedLabel(doc)}</td>
                              <td className="px-3 py-3 text-xs text-[#6b7c8f]">
                                {formatShortDate(doc.latestVersion?.expiryDate) || '—'}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handlePrimaryAction(doc)}
                                    className="inline-flex h-8 items-center rounded-lg border border-[#dbe4ee] bg-white px-3 text-xs font-semibold text-[#17324f] transition-colors hover:border-primary hover:text-primary dark:border-border dark:bg-transparent"
                                  >
                                    {actionLabel}
                                  </button>
                                  <Dropdown
                                    trigger={['click']}
                                    menu={{
                                      items: menuItems.map((item) => ({
                                        key: item.key,
                                        label: item.label,
                                        onClick: item.onClick,
                                      })),
                                    }}
                                  >
                                    <button
                                      type="button"
                                      aria-label="More actions"
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-[#8b97a8] hover:border-[#e5ebf2] hover:bg-[#f8fafc] hover:text-[#17324f]"
                                    >
                                      <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                                    </button>
                                  </Dropdown>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </section>
            )
          })}
        </div>
      </div>

      <Modal
        title={selected ? `${selected.typeName} history` : 'History'}
        open={Boolean(selected)}
        onCancel={() => setSelectedId(null)}
        footer={null}
        width={720}
      >
        {selected ? (
          <div className="grid gap-4">
            {(selected.status === 'REJECTED' || selected.status === 'REUPLOAD_REQUIRED')
            && selected.latestVersion?.rejectionReasonName ? (
              <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
                <strong>Rejection reason:</strong> {selected.latestVersion.rejectionReasonName}
                {selected.latestVersion.rejectionRemarks
                  ? ` — ${selected.latestVersion.rejectionRemarks}`
                  : ''}
              </div>
            ) : null}
            <div>
              <p className="mb-2 font-medium">Versions</p>
              <ul className="m-0 grid list-none gap-2 p-0">
                {selected.versions.map((version) => (
                  <li key={version.id} className="rounded-lg border border-[#e7eef5] p-2 text-sm">
                    Version {version.versionNumber}
                    {version.isLatest ? ' · Latest' : ''} · Uploaded {version.uploadedAt.slice(0, 10)}
                    {version.uploadedBy ? ` by ${version.uploadedBy.name}` : ''}
                    {version.verifiedAt
                      ? ` · Verified ${version.verifiedAt.slice(0, 10)} by ${version.verifiedBy?.name || '—'}`
                      : ''}
                    {version.rejectionReasonName ? ` · Rejected: ${version.rejectionReasonName}` : ''}
                    {version.expiryDate ? ` · Expiry ${version.expiryDate}` : ''}
                    <div className="text-[#8b97a8]">
                      {version.assets.map((asset) => asset.fileName).join(', ')}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 font-medium">Activity</p>
              <ul className="m-0 grid list-none gap-1 p-0 text-sm">
                {selected.activities.map((activity) => (
                  <li key={activity.id}>
                    {activity.createdAt.slice(0, 16).replace('T', ' ')} ·{' '}
                    {activity.action.replace(/_/g, ' ')}
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
              options={data.catalog
                .filter((item) => item.typeCode)
                .map((item) => ({ value: item.typeCode as string, label: item.typeName }))}
              onChange={(value) => setUploadState((current) => ({ ...current, typeCode: value }))}
            />
          ) : null}
          <input
            className={fieldClass}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          <Input
            placeholder="Label, e.g. Front Page"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
          <label className="grid gap-1 text-sm">
            Document date
            <input
              className={fieldClass}
              type="date"
              value={documentDate}
              onChange={(event) => setDocumentDate(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Expiry date
            <input
              className={fieldClass}
              type="date"
              value={expiryDate}
              onChange={(event) => setExpiryDate(event.target.value)}
            />
          </label>
          <Input.TextArea
            placeholder="Remarks"
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
          />
        </div>
      </Modal>

      <Modal
        title="Request Document"
        open={Boolean(requestId)}
        onCancel={() => setRequestId(null)}
        onOk={submitRequest}
        confirmLoading={requesting}
        okText="Send Request"
      >
        <div className="grid gap-3">
          <Select
            value={requestId || undefined}
            options={data.documents.map((item) => ({ value: item.id, label: item.typeName }))}
            onChange={setRequestId}
          />
          <Select value={method} options={METHODS} onChange={setMethod} />
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
        </div>
      </Modal>

      <Modal
        title="Reject Document"
        open={Boolean(rejectId)}
        onCancel={() => setRejectId(null)}
        onOk={submitReject}
        confirmLoading={rejecting || verifying}
        okText="Reject"
      >
        <div className="grid gap-3">
          <Select
            placeholder="Rejection reason"
            value={reasonCode}
            options={data.rejectionReasons
              .filter((item) => item.code)
              .map((item) => ({ value: item.code as string, label: item.name }))}
            onChange={setReasonCode}
          />
          <Input.TextArea
            placeholder="Please upload a high-resolution copy."
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
          />
        </div>
      </Modal>

      <Modal
        title="Preview"
        open={Boolean(previewUrl)}
        onCancel={() => setPreviewUrl(null)}
        footer={null}
        width={840}
      >
        {previewUrl && previewType.startsWith('image/') ? (
          <img src={previewUrl} alt="Document preview" className="max-h-[70vh] w-full object-contain" />
        ) : null}
        {previewUrl && !previewType.startsWith('image/') ? (
          <iframe title="Document preview" src={previewUrl} className="h-[70vh] w-full" />
        ) : null}
      </Modal>
    </div>
  )
}

function ChecklistManageHints({
  checklist,
  leadId,
  canManage,
  updateItem,
}: {
  checklist: FileWorkspace['checklist']
  leadId: string
  canManage: boolean
  updateItem: ReturnType<typeof useUpdateFileChecklistItemMutation>[0]
}) {
  if (!canManage) return null
  const active = checklist.filter((item) => item.isActive).slice(0, 3)
  if (!active.length) return null
  return (
    <div className="flex w-full flex-wrap gap-2 text-xs text-[#8b97a8]">
      {active.map((item) => (
        <button
          key={item.id}
          type="button"
          className="rounded-full border border-[#e5ebf2] bg-white px-2.5 py-1 hover:border-primary hover:text-primary"
          onClick={() =>
            updateItem({ leadId, itemId: item.id, isRequired: !item.isRequired })
              .unwrap()
              .catch((error) => toast.error(getApiError(error, 'Unable to update the checklist.')))
          }
        >
          {item.typeName}: {item.isRequired ? 'Mark optional' : 'Mark required'}
        </button>
      ))}
    </div>
  )
}

