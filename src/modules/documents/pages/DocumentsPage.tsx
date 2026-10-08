import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { FormSelect } from '@/components/common/Forms'
import { useDebounce } from '@/hooks/useDebounce'
import { useListDocumentsQuery } from '../api/documentsApi'
import { useListFileDocumentsQuery } from '@/modules/files/api/filesApi'
import { adminCard, adminPage } from '../../../styles/admin'
import DocumentFilters from '../components/DocumentFilters'
import DocumentsTable from '../components/DocumentsTable'
import type { DocumentRow } from '../types'

export default function DocumentsPage() {
  const [vault, setVault] = useState<'lead' | 'file'>('file')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>()
  const [categoryCode, setCategoryCode] = useState<string | undefined>()
  const [typeCode, setTypeCode] = useState<string | undefined>()
  const [expiryStatus, setExpiryStatus] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const debouncedSearch = useDebounce(search, 300)

  const leadQuery = useListDocumentsQuery(
    { search: debouncedSearch, status, categoryCode, page, limit },
    { skip: vault !== 'lead' },
  )
  const fileQuery = useListFileDocumentsQuery(
    {
      search: debouncedSearch,
      status,
      categoryCode,
      typeCode,
      expiryStatus,
      page,
      limit,
    },
    { skip: vault !== 'file' },
  )
  const active = vault === 'file' ? fileQuery : leadQuery
  const rows = useMemo(() => {
    const items = active.data?.items || []
    if (vault === 'file') {
      return items.map((row) => ({ ...row, vault: 'file' as const })) as DocumentRow[]
    }
    return items as DocumentRow[]
  }, [active.data?.items, vault])

  const fileStatuses = [
    { value: 'NOT_REQUESTED', label: 'Not Requested' },
    { value: 'REQUESTED', label: 'Requested' },
    { value: 'RECEIVED', label: 'Received' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'REUPLOAD_REQUIRED', label: 'Re-upload Required' },
  ]
  const leadStatuses = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'EXPIRED', label: 'Expired' },
  ]

  return (
    <div className={adminPage}>
      <PageMeta
        title="Documents"
        description="Search file documents and lead documents, including status, expiry, and verification."
      />
      <PageHeader
        title="Documents"
        subtitle={
          vault === 'file'
            ? 'File opening documents with request, review, and expiry tracking.'
            : 'Lead documents with status, category, and verification tracking.'
        }
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Documents' }]}
      />

      <div className="flex justify-end" role="tablist" aria-label="Document vault">
        {(
          [
            { key: 'file' as const, label: 'File documents' },
            { key: 'lead' as const, label: 'Lead documents' },
          ]
        ).map((item) => {
          const selected = vault === item.key
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`cursor-pointer border px-4 py-1.5 text-sm font-medium first:rounded-l-lg last:rounded-r-lg ${
                selected
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-surface text-text-muted'
              }`}
              onClick={() => {
                setVault(item.key)
                setStatus(undefined)
                setPage(1)
              }}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <div className={`${adminCard} grid gap-3`}>
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
          <div className="min-w-[180px] flex-1">
            <DocumentFilters
              search={search}
              onSearchChange={(value) => {
                setSearch(value)
                setPage(1)
              }}
              placeholder={
                vault === 'file'
                  ? 'Search document, file ID, student, uploader…'
                  : 'Search lead, document, category, uploader…'
              }
            />
          </div>
          <div className="w-[150px] shrink-0">
            <FormSelect
              allowClear
              placeholder="Category"
              value={categoryCode}
              options={[
                { value: 'PERSONAL', label: 'Personal' },
                { value: 'ACADEMIC', label: 'Academic' },
                { value: 'LANGUAGE', label: 'Language' },
                { value: 'FINANCIAL', label: 'Financial' },
                { value: 'PROFESSIONAL', label: 'Professional' },
                { value: 'OTHER', label: 'Other' },
              ]}
              onChange={(value) => {
                setCategoryCode(typeof value === 'string' ? value : undefined)
                setPage(1)
              }}
            />
          </div>
          {vault === 'file' ? (
            <div className="w-[168px] shrink-0">
              <FormSelect
                allowClear
                placeholder="Document type"
                value={typeCode}
                options={[
                  { value: 'PASSPORT', label: 'Passport' },
                  { value: 'NID', label: 'NID' },
                  { value: 'PHOTOGRAPH', label: 'Photograph' },
                  { value: 'ACADEMIC_CERTIFICATE', label: 'Academic Certificate' },
                  { value: 'TRANSCRIPT', label: 'Academic Transcript' },
                  { value: 'CV_PROFESSIONAL', label: 'CV' },
                  { value: 'IELTS', label: 'English Test Result' },
                  { value: 'EXPERIENCE_CERTIFICATE', label: 'Experience Certificate' },
                ]}
                onChange={(value) => {
                  setTypeCode(typeof value === 'string' ? value : undefined)
                  setPage(1)
                }}
              />
            </div>
          ) : null}
          <div className="w-[150px] shrink-0">
            <FormSelect
              allowClear
              placeholder="Status"
              value={status}
              options={vault === 'file' ? fileStatuses : leadStatuses}
              onChange={(value) => {
                setStatus(typeof value === 'string' ? value : undefined)
                setPage(1)
              }}
            />
          </div>
          {vault === 'file' ? (
            <div className="w-[132px] shrink-0">
              <FormSelect
                allowClear
                placeholder="Expiry"
                value={expiryStatus}
                options={[
                  { value: 'VALID', label: 'Valid' },
                  { value: 'EXPIRING', label: 'Expiring' },
                  { value: 'EXPIRED', label: 'Expired' },
                  { value: 'NONE', label: 'No expiry' },
                ]}
                onChange={(value) => {
                  setExpiryStatus(typeof value === 'string' ? value : undefined)
                  setPage(1)
                }}
              />
            </div>
          ) : null}
        </div>

        {active.isError ? <p className="m-0 text-danger">Could not load records. Check API connection.</p> : null}

        <DocumentsTable
          data={rows}
          loading={active.isFetching}
          page={page}
          limit={limit}
          total={active.data?.total || rows.length}
          onPageChange={setPage}
          onLimitChange={(next) => {
            setLimit(next)
            setPage(1)
          }}
        />
      </div>
    </div>
  )
}
