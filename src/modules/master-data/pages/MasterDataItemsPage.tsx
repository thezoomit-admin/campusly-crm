import {
  adminCard,
  adminFilters,
  adminFiltersMaster,
  adminForm,
  adminFormFields,
  adminFormSpan,
  adminPage,
  adminTable,
  appToastClass,
  fieldLabelClass,
  formActions,
  historyKindTone,
  historyKindToneSoft,
  mdHistoryDetailIcon,
  mdHistoryEvent,
  mdHistoryEventActive,
  mdHistoryRole,
  mdTab,
  mdTabActive,
  modalBackdrop,
  modalClose,
  modalHeader,
  modalPanel,
  muted,
  rowActions,
  tableWrap,
} from '../../../styles/admin'
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, Navigate, NavLink, useLocation, useOutletContext, useParams } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  AddCircleIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  File01Icon,
  HashtagIcon,
  HistoryIcon,
  Key01Icon,
  Link01Icon,
  InformationCircleIcon,
  Note01Icon,
  PencilEdit02Icon,
  TextIcon,
  UserIcon,
  UserPlusIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { Pagination, Spin, Tooltip } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { PrimaryButton } from '@/components/ui'
import { FormDatePicker, FormInput, FormInputNumber, FormSelect, FormSwitch, FormTextArea } from '@/components/common/Forms'
import { DeleteModal } from '@/components/common/Modals'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { RowActionMenu, type RowActionItem } from '@/components/common/Dropdowns'
import {
  useCreateMasterDataItemMutation,
  useDeleteMasterDataItemMutation,
  useExportMasterDataMutation,
  useImportMasterDataMutation,
  useLazyListMasterDataCategoriesQuery,
  useLazyListMasterDataHistoryQuery,
  useLazyListMasterDataItemsQuery,
  useLazyListMasterDataOptionsQuery,
  useUpdateMasterDataItemMutation,
} from '@/redux/features/masterData/masterDataApi'
import { getApiError } from '@/lib/api'
import { hasPermission } from '../../../lib/access'
import { getMasterDataGroupByCategory, getMasterDataNavGroup } from '../../../config/masterData'
import { readUrlSearchQuery } from '@/lib/url'
import type {
  AuthSession,
  MasterDataCategory,
  MasterDataHistory,
  MasterDataImportResult,
  MasterDataItem,
  RecordStatus,
} from '../../../types'
type FormMode = 'create' | 'edit'
type ToastState = { text: string; type: 'success' | 'error' }

const PAGE_SIZE = 10

const DATE_PICKER_OVERFLOW = {
  adjustX: true,
  adjustY: true,
  shiftX: true,
  shiftY: true,
} as const

const DATE_PICKER_PLACEMENTS = {
  bottomLeft: {
    points: ['tl', 'bl'],
    offset: [0, 4],
    overflow: DATE_PICKER_OVERFLOW,
    htmlRegion: 'visible' as const,
  },
  bottomRight: {
    points: ['tr', 'br'],
    offset: [0, 4],
    overflow: DATE_PICKER_OVERFLOW,
    htmlRegion: 'visible' as const,
  },
  topLeft: {
    points: ['bl', 'tl'],
    offset: [0, -4],
    overflow: DATE_PICKER_OVERFLOW,
    htmlRegion: 'visible' as const,
  },
  topRight: {
    points: ['br', 'tr'],
    offset: [0, -4],
    overflow: DATE_PICKER_OVERFLOW,
    htmlRegion: 'visible' as const,
  },
}

const DATE_PICKER_POPUP = {
  getPopupContainer: () => document.body,
  placement: 'bottomLeft' as const,
  transitionName: '',
  builtinPlacements: DATE_PICKER_PLACEMENTS,
  styles: {
    popup: {
      root: { zIndex: 2200 },
    },
  },
  onOpenChange: (open: boolean) => {
    if (!open) return
    const panel = document.querySelector('[data-admin-modal-backdrop] [data-admin-modal-panel]')
    if (!(panel instanceof HTMLElement)) return
    const top = panel.scrollTop
    requestAnimationFrame(() => {
      panel.scrollTop = top
    })
  },
}

function ActionIcon({ icon }: { icon: IconSvgElement }) {
  return <HugeiconsIcon icon={icon} size={16} color="currentColor" strokeWidth={1.5} />
}

type ItemForm = {
  name: string
  code: string
  description: string
  status: RecordStatus
  parentId: string
  behaviorKey: string
  startDate: string
  endDate: string
  fileOpeningCharge: number | null
  icon: string
  activityType: string
  sortOrder: number
}

const DESCRIPTION_MAX = 100
const NOTE_CHANNEL_DESCRIPTION_MAX = 500

const EMPTY_FORM: ItemForm = {
  name: '',
  code: '',
  description: '',
  status: 'ACTIVE',
  parentId: '',
  behaviorKey: '',
  startDate: '',
  endDate: '',
  fileOpeningCharge: null,
  icon: '',
  activityType: 'OTHER',
  sortOrder: 0,
}

function slugCodeFromName(name: string) {
  return (
    name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 32) || 'CHANNEL'
  )
}

function activityTypeFromChannelCode(code: string) {
  const normalized = code.trim().toUpperCase()
  if (['CALL', 'WHATSAPP', 'EMAIL', 'SMS', 'MEETING'].includes(normalized)) return normalized
  if (normalized === 'IN_PERSON') return 'MEETING'
  return 'OTHER'
}

function FaIconPreview({ iconClass, className }: { iconClass: string; className?: string }) {
  const value = iconClass.trim().replace(/\s+/g, ' ')
  return (
    <span
      className={
        className ||
        'inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#e6eef6] bg-surface text-[1rem] text-[#3d5166] dark:border-border dark:text-text'
      }
      aria-hidden={!value}
    >
      {value ? <i className={value} /> : <span className="text-[0.72rem] text-[#a0aab8]">—</span>}
    </span>
  )
}

function extraAmount(extras: Record<string, unknown> | null, key: string) {
  const value = Number(extras?.[key])
  return extras?.[key] != null && extras?.[key] !== '' && Number.isFinite(value) ? value : null
}

function extraText(extras: Record<string, unknown> | null, key: string) {
  const value = extras?.[key]
  return typeof value === 'string' ? value : ''
}

function formFromItem(item: MasterDataItem): ItemForm {
  return {
    name: item.name,
    code: item.code || '',
    description: (item.description || '').slice(0, DESCRIPTION_MAX),
    status: item.status,
    parentId: item.parentId || '',
    behaviorKey: item.behaviorKey || '',
    startDate: extraText(item.extras, 'startDate'),
    endDate: extraText(item.extras, 'endDate'),
    fileOpeningCharge: extraAmount(item.extras, 'fileOpeningCharge'),
    icon: extraText(item.extras, 'icon'),
    activityType: extraText(item.extras, 'activityType') || activityTypeFromChannelCode(item.code || ''),
    sortOrder: item.sortOrder ?? 0,
  }
}

function asSelectString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function toDayjs(value: string) {
  return value ? dayjs(value) : null
}

function toDateString(value: Dayjs | null) {
  return value ? value.format('YYYY-MM-DD') : ''
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className={fieldLabelClass(required)}>{children}</span>
  )
}

function parentCategoryName(parentCategoryKey?: string) {
  if (!parentCategoryKey) {
    return 'Parent'
  }
  const group = getMasterDataGroupByCategory(parentCategoryKey)
  return group?.categories.find((item) => item.key === parentCategoryKey)?.name || 'Parent'
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

type HistoryKind = 'updated' | 'created' | 'status' | 'assigned' | 'deleted'

type HistoryChangeRow = {
  key: string
  label: string
  from: string
  to: string
}

function formatHistoryDate(value: string | Date) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
}

function displayHistoryValue(value: unknown) {
  if (value == null || value === '') {
    return '—'
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value)
  }
  if (typeof value === 'string') {
    return value
  }
  return JSON.stringify(value)
}

function humanizeField(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function fieldIcon(key: string): IconSvgElement {
  const normalized = key.toLowerCase()
  if (normalized.includes('name')) {
    return TextIcon
  }
  if (normalized.includes('code') || (normalized.includes('key') && !normalized.includes('category'))) {
    return HashtagIcon
  }
  if (normalized.includes('category')) {
    return Key01Icon
  }
  if (normalized.includes('parent') || normalized.includes('link')) {
    return Link01Icon
  }
  if (normalized.includes('status')) {
    return CheckmarkCircle02Icon
  }
  if (normalized.includes('user') || normalized.includes('assign')) {
    return UserIcon
  }
  return File01Icon
}

function parseHistoryMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return { fields: {} as Record<string, unknown>, changes: {} as Record<string, { from?: unknown; to?: unknown }>, notes: '' }
  }
  const record = metadata as Record<string, unknown>
  const rawChanges = record.changes
  const changes: Record<string, { from?: unknown; to?: unknown }> = {}
  if (rawChanges && typeof rawChanges === 'object' && !Array.isArray(rawChanges)) {
    for (const [key, value] of Object.entries(rawChanges as Record<string, unknown>)) {
      if (value && typeof value === 'object' && !Array.isArray(value) && ('from' in value || 'to' in value)) {
        const pair = value as { from?: unknown; to?: unknown }
        changes[key] = { from: pair.from, to: pair.to }
      } else {
        changes[key] = { to: value }
      }
    }
  }
  const notes = typeof record.notes === 'string' ? record.notes : typeof record.note === 'string' ? record.note : ''
  const fields: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (key !== 'changes' && key !== 'notes' && key !== 'note') {
      fields[key] = value
    }
  }
  return { fields, changes, notes }
}

function historyKind(action: string, changes: Record<string, { from?: unknown; to?: unknown }>): HistoryKind {
  if (action.includes('CREATED')) {
    return 'created'
  }
  if (action.includes('DELETED')) {
    return 'deleted'
  }
  if (action.includes('ACTIVATED') || action.includes('DEACTIVATED') || 'status' in changes) {
    return 'status'
  }
  const keys = Object.keys(changes)
  if (keys.length > 0 && keys.every((key) => key === 'parent' || key === 'parentId' || key === 'assignedTo')) {
    return 'assigned'
  }
  return 'updated'
}

function historyTitle(kind: HistoryKind) {
  if (kind === 'created') {
    return 'Created'
  }
  if (kind === 'deleted') {
    return 'Deleted'
  }
  if (kind === 'status') {
    return 'Status Changed'
  }
  if (kind === 'assigned') {
    return 'Assigned'
  }
  return 'Updated'
}

function historyKindIcon(kind: HistoryKind): IconSvgElement {
  if (kind === 'created') {
    return AddCircleIcon
  }
  if (kind === 'deleted') {
    return Delete02Icon
  }
  if (kind === 'status') {
    return CheckmarkCircle02Icon
  }
  if (kind === 'assigned') {
    return UserPlusIcon
  }
  return PencilEdit02Icon
}

function historyChangeRows(action: string, metadata: unknown): HistoryChangeRow[] {
  const parsed = parseHistoryMetadata(metadata)
  const rows: HistoryChangeRow[] = []
  const seen = new Set<string>()

  for (const [key, pair] of Object.entries(parsed.changes)) {
    seen.add(key)
    rows.push({
      key,
      label: humanizeField(key),
      from: displayHistoryValue(pair.from),
      to: displayHistoryValue(pair.to),
    })
  }

  if (rows.length === 0) {
    for (const key of ['name', 'code', 'categoryKey', 'status', 'parent']) {
      if (key in parsed.fields && !seen.has(key)) {
        rows.push({
          key,
          label: humanizeField(key),
          from: action.includes('DELETED') ? displayHistoryValue(parsed.fields[key]) : '—',
          to: action.includes('DELETED') ? '—' : displayHistoryValue(parsed.fields[key]),
        })
      }
    }
  }

  return rows
}

function HistoryFieldList({
  title,
  rows,
  valueKey,
}: {
  title: string
  rows: HistoryChangeRow[]
  valueKey: 'from' | 'to'
}) {
  const isNew = valueKey === 'to'
  return (
    <section className="min-w-0">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h4 className="m-0 text-[0.72rem] font-bold tracking-[0.06em] text-[#8b97a8] uppercase">{title}</h4>
        {rows.length > 0 ? (
          <span className="text-[0.72rem] font-medium text-text-faint">
            {rows.length} field{rows.length === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-[color-mix(in_srgb,var(--color-surface)_92%,#f1f5f9)] dark:bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))]">
        {rows.length === 0 ? (
          <p className="m-0 px-4 py-7 text-center text-[0.86rem] text-text-muted">No field changes recorded.</p>
        ) : (
          <ul className="m-0 list-none divide-y divide-border/70 p-0">
            {rows.map((row) => (
              <li
                key={`${title}-${row.key}`}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-3 px-3.5 py-3"
              >
                <span className="inline-flex min-w-0 items-center gap-2 text-[0.82rem] text-text-muted">
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface text-text-faint shadow-[inset_0_0_0_1px_var(--color-border)]">
                    <HugeiconsIcon icon={fieldIcon(row.key)} size={14} color="currentColor" strokeWidth={1.5} />
                  </span>
                  <span className="truncate font-medium">{row.label}</span>
                </span>
                <strong
                  className={`min-w-0 truncate justify-self-end rounded-lg px-2.5 py-1 text-right text-[0.84rem] font-semibold ${
                    isNew
                      ? 'bg-[color-mix(in_srgb,#17824b_10%,var(--color-surface))] text-[#17824b]'
                      : 'bg-[color-mix(in_srgb,var(--color-text)_5%,var(--color-surface))] text-text'
                  }`}
                >
                  {row[valueKey]}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default function MasterDataItemsPage() {
  const auth = useOutletContext<AuthSession>()
  const location = useLocation()
  const { groupSlug = '', categoryKey: categoryParam } = useParams()
  const navGroup = getMasterDataNavGroup(groupSlug)
  const categoryKey = categoryParam || navGroup?.categories[0]?.key || ''
  const canCreate = hasPermission(auth, 'master_data:create')
  const canEdit = hasPermission(auth, 'master_data:edit')
  const canDelete = hasPermission(auth, 'master_data:delete')
  const fileRef = useRef<HTMLInputElement>(null)

  const [category, setCategory] = useState<MasterDataCategory | null>(null)
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [metaLoading, setMetaLoading] = useState(true)
  const [items, setItems] = useState<MasterDataItem[]>([])
  const [parents, setParents] = useState<Array<{ id: string; name: string }>>([])
  const [parentsLoading, setParentsLoading] = useState(false)
  const parentsRequest = useRef(0)
  const [search, setSearch] = useState(() => readUrlSearchQuery(location.search))
  const [status, setStatus] = useState('')
  const [parentId, setParentId] = useState('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [sortBy, setSortBy] = useState('sortOrder')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const historyRequest = useRef(0)
  const [importOpen, setImportOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [selected, setSelected] = useState<MasterDataItem | null>(null)
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM)
  const [history, setHistory] = useState<MasterDataHistory[]>([])
  const [historyEntryId, setHistoryEntryId] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<MasterDataImportResult | null>(null)
  const [formSaving, setFormSaving] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MasterDataItem | null>(null)
  const [deleteSaving, setDeleteSaving] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncedSearch = useRef(false)
  const entityName = category?.name || 'Master data'
  const [listMasterDataCategories] = useLazyListMasterDataCategoriesQuery()
  const [listMasterDataItems] = useLazyListMasterDataItemsQuery()
  const [listMasterDataOptions] = useLazyListMasterDataOptionsQuery()
  const [listMasterDataHistory] = useLazyListMasterDataHistoryQuery()
  const [createMasterDataItem] = useCreateMasterDataItemMutation()
  const [updateMasterDataItem] = useUpdateMasterDataItemMutation()
  const [deleteMasterDataItem] = useDeleteMasterDataItemMutation()
  const [exportMasterData] = useExportMasterDataMutation()
  const [importMasterData] = useImportMasterDataMutation()

  function showToast(text: string, type: ToastState['type'] = 'success') {
    setToast({ text, type })
    if (toastTimer.current) {
      clearTimeout(toastTimer.current)
    }
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  async function loadParents(parentCategoryKey?: string) {
    const requestId = ++parentsRequest.current
    if (!parentCategoryKey) {
      setParents([])
      setParentsLoading(false)
      return
    }
    setParentsLoading(true)
    try {
      const data = await listMasterDataOptions({ category: parentCategoryKey }).unwrap()
      if (requestId !== parentsRequest.current) {
        return
      }
      setParents(data.items)
    } catch {
      if (requestId === parentsRequest.current) {
        setParents([])
      }
    } finally {
      if (requestId === parentsRequest.current) {
        setParentsLoading(false)
      }
    }
  }

  async function loadCategory(options?: { quiet?: boolean }) {
    const quiet = options?.quiet === true
    if (!quiet) {
      setMetaLoading(true)
      setParents([])
    }
    try {
      const data = await listMasterDataCategories().unwrap()
      const allCategories = data.groups.flatMap((group) => group.categories)
      const counts: Record<string, number> = {}
      for (const item of allCategories) {
        counts[item.key] = item.recordCount
      }
      setCategoryCounts(counts)
      const match = allCategories.find((item) => item.key === categoryKey)
      if (!quiet) {
        if (match?.parentCategoryKey) {
          setParentsLoading(true)
        } else {
          setParentsLoading(false)
        }
        setCategory(match || null)
        await loadParents(match?.parentCategoryKey)
      } else if (match) {
        setCategory(match)
      }
    } catch (err) {
      if (!quiet) {
        showToast(getApiError(err, 'You are not authorized to manage master data.'), 'error')
        setParentsLoading(false)
      }
    }
    if (!quiet) {
      setMetaLoading(false)
    }
  }

  async function loadItems(fromSearch = false, searchValue = search, resetPage = true) {
    if (fromSearch) {
      setSearching(true)
    }
    setLoading(true)
    try {
      const data = await listMasterDataItems({
        category: categoryKey,
        search: searchValue,
        status,
        parentId,
        createdFrom,
        createdTo,
        sortBy,
        sortDir: 'asc',
      }).unwrap()
      setItems(data.items)
      if (resetPage) {
        setPage(1)
      }
    } catch (err) {
      showToast(getApiError(err, 'Unable to process the request. Please try again.'), 'error')
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  useEffect(() => {
    void loadCategory()
    setSearch(readUrlSearchQuery(location.search))
    setStatus('')
    setParentId('')
    setCreatedFrom('')
    setCreatedTo('')
    setPage(1)
    setFormOpen(false)
  }, [categoryKey])

  useEffect(() => {
    if (categoryKey) {
      void loadItems(false, readUrlSearchQuery(location.search) || search)
    }
  }, [categoryKey, status, parentId, createdFrom, createdTo, sortBy])

  useEffect(() => {
    const next = readUrlSearchQuery(location.search)
    setSearch(next)
    if (syncedSearch.current && categoryKey) {
      void loadItems(Boolean(next), next)
    }
    syncedSearch.current = true
  }, [location.search])

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = useMemo(
    () => items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [items, safePage],
  )

  useEffect(
    () => () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current)
      }
    },
    [],
  )

  const filteredParents = useMemo(() => {
    if (form.parentId && !parents.some((item) => item.id === form.parentId) && selected?.parentName) {
      return [{ id: form.parentId, name: selected.parentName }, ...parents]
    }
    return parents
  }, [form.parentId, parents, selected])

  function openCreate() {
    setSelected(null)
    setForm({ ...EMPTY_FORM, parentId })
    setFormMode('create')
    setFormSaving(false)
    setFormOpen(true)
    if (category?.parentCategoryKey) {
      void loadParents(category.parentCategoryKey)
    }
  }

  function openItem(item: MasterDataItem, mode: FormMode) {
    setSelected(item)
    setForm(formFromItem(item))
    setFormMode(mode)
    setFormSaving(false)
    setFormOpen(true)
    if (category?.parentCategoryKey) {
      void loadParents(category.parentCategoryKey)
    }
  }

  async function openHistory(item: MasterDataItem) {
    const requestId = ++historyRequest.current
    setSelected(item)
    setHistory([])
    setHistoryEntryId(null)
    setHistoryLoading(true)
    setHistoryOpen(true)
    try {
      const data = await listMasterDataHistory({ id: item.id, category: categoryKey }).unwrap()
      if (requestId !== historyRequest.current) {
        return
      }
      setHistoryLoading(false)
      setHistory(data.history)
      setHistoryEntryId(data.history[0]?.id ?? null)
    } catch (err) {
      if (requestId !== historyRequest.current) {
        return
      }
      setHistoryLoading(false)
      showToast(getApiError(err, 'Unable to load history.'), 'error')
    }
  }

  function closeHistory() {
    historyRequest.current += 1
    setHistoryOpen(false)
    setHistoryLoading(false)
    setHistoryEntryId(null)
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (formSaving) {
      return
    }
    const isNoteChannel = category?.extraFields === 'conversationChannel'
    const descriptionMax = isNoteChannel ? NOTE_CHANNEL_DESCRIPTION_MAX : DESCRIPTION_MAX
    if (!form.name.trim()) {
      showToast(isNoteChannel ? 'Channel name is required.' : 'Name is required.', 'error')
      return
    }
    const resolvedCode =
      isNoteChannel && formMode === 'create' && !form.code.trim()
        ? slugCodeFromName(form.name)
        : form.code.trim()
    if (category?.codePolicy === 'required' && !resolvedCode) {
      showToast('Please enter a valid unique code.', 'error')
      return
    }
    if (category?.parentCategoryKey && (parentsLoading || !form.parentId)) {
      showToast(
        parentsLoading
          ? `${parentCategoryName(category.parentCategoryKey)} options are still loading.`
          : 'Selected parent value is not available.',
        'error',
      )
      return
    }
    if (form.description.length > descriptionMax) {
      showToast(`Description cannot exceed ${descriptionMax} characters.`, 'error')
      return
    }
    if (isNoteChannel && !form.icon.trim()) {
      showToast('Please enter an icon class.', 'error')
      return
    }
    const payload = {
      categoryKey,
      name: form.name,
      code: resolvedCode,
      description: form.description.slice(0, descriptionMax),
      status: form.status,
      sortOrder: isNoteChannel ? form.sortOrder : selected?.sortOrder ?? 0,
      parentId: form.parentId || null,
      behaviorKey: form.behaviorKey || null,
      startDate: form.startDate,
      endDate: form.endDate,
      fileOpeningCharge: form.fileOpeningCharge,
      icon: form.icon.trim(),
      activityType: isNoteChannel
        ? activityTypeFromChannelCode(resolvedCode)
        : form.activityType,
    }
    setFormSaving(true)
    try {
      if (selected) {
        await updateMasterDataItem({ id: selected.id, body: payload }).unwrap()
      } else {
        await createMasterDataItem(payload).unwrap()
      }
      showToast(`${entityName} successfully ${selected ? 'updated' : 'created'}.`)
      setFormOpen(false)
      await Promise.all([loadItems(false, search, !selected), loadCategory({ quiet: true })])
    } catch (err) {
      showToast(getApiError(err, 'Unable to process the request. Please try again.'), 'error')
    } finally {
      setFormSaving(false)
    }
  }

  async function setItemStatus(item: MasterDataItem, next: RecordStatus) {
    if (statusUpdatingId) {
      return
    }
    setStatusUpdatingId(item.id)
    try {
      await updateMasterDataItem({
        id: item.id,
        body: {
          categoryKey,
          name: item.name,
          code: item.code || '',
          description: item.description || '',
          status: next,
          sortOrder: item.sortOrder,
          parentId: item.parentId,
          behaviorKey: item.behaviorKey,
          startDate: extraText(item.extras, 'startDate'),
          endDate: extraText(item.extras, 'endDate'),
        },
      }).unwrap()
      showToast(`${entityName} successfully ${next === 'ACTIVE' ? 'activated' : 'deactivated'}.`)
      await loadItems(false, search, false)
    } catch (err) {
      showToast(getApiError(err, 'Unable to process the request. Please try again.'), 'error')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  function askDelete(item: MasterDataItem) {
    setDeleteTarget(item)
  }

  async function confirmDelete() {
    if (!deleteTarget || deleteSaving) {
      return
    }
    setDeleteSaving(true)
    try {
      await deleteMasterDataItem({ id: deleteTarget.id, category: categoryKey }).unwrap()
      showToast(`${entityName} successfully deleted.`)
      setDeleteTarget(null)
      await Promise.all([loadItems(false, search, false), loadCategory({ quiet: true })])
    } catch (err) {
      showToast(getApiError(err, 'This value is already being used and cannot be deleted.'), 'error')
    } finally {
      setDeleteSaving(false)
    }
  }

  async function handleExport(format: 'csv' | 'xlsx') {
    try {
      const data = await exportMasterData({ category: categoryKey, format }).unwrap()
      downloadBlob(data.blob, data.fileName)
      showToast(`Exported ${category?.name || 'master data'}.`)
    } catch (err) {
      showToast(getApiError(err, 'Unable to process the request. Please try again.'), 'error')
    }
  }

  async function handleImport(file: File) {
    try {
      const data = await importMasterData({ category: categoryKey, file }).unwrap()
      setImportResult(data)
      setImportOpen(true)
      showToast(`Imported ${data.successful} of ${data.total} records.`)
      await Promise.all([loadItems(), loadCategory({ quiet: true })])
    } catch (err) {
      showToast(getApiError(err, 'Unable to import the selected data.'), 'error')
    }
  }

  function downloadErrors() {
    if (!importResult) {
      return
    }
    const lines = ['Row,Message', ...importResult.errors.map((item) => `${item.row},"${item.message.replace(/"/g, '""')}"`)]
    downloadBlob(new Blob([lines.join('\n')], { type: 'text/csv' }), `${categoryKey.toLowerCase()}-import-errors.csv`)
  }

  if (!navGroup) {
    const mapped = getMasterDataGroupByCategory(groupSlug)
    if (mapped) {
      return <Navigate to={`/master-data/${mapped.slug}/${groupSlug}`} replace />
    }
    return (
      <div className={`${adminPage}`}>
        <PageMeta
          title="Master Data"
          description="The requested master data category was not found. Choose a valid category to continue."
        />
        <PageHeader
          title="Master Data"
          subtitle="Category not found."
          breadcrumbs={[
            { title: 'Dashboard', path: '/dashboard' },
            { title: 'Master Data', path: '/master-data' },
            { title: 'Not found' },
          ]}
        />
        <Link to="/master-data">Back to Master Data</Link>
      </div>
    )
  }

  if (!categoryParam || !navGroup.categories.some((item) => item.key === categoryParam)) {
    return <Navigate to={`/master-data/${navGroup.slug}/${navGroup.categories[0].key}`} replace />
  }

  if (!category && !metaLoading) {
    return (
      <div className={`${adminPage}`}>
        <PageMeta
          title="Master Data"
          description="The requested master data category was not found. Choose a valid category to continue."
        />
        <PageHeader
          title="Master Data"
          subtitle="Category not found."
          breadcrumbs={[
            { title: 'Dashboard', path: '/dashboard' },
            { title: 'Master Data', path: '/master-data' },
            { title: 'Not found' },
          ]}
        />
        <Link to="/master-data">Back to categories</Link>
      </div>
    )
  }

  return (
    <div className={`${adminPage}`}>
      <PageMeta
        title={category ? `${category.name} — Master Data` : `${navGroup.name} — Master Data`}
        description={
          category
            ? `Create, edit, and manage ${category.name} reference values used across EduConsult CRM.`
            : `Manage ${navGroup.name} master data values used across leads, applications, and operations.`
        }
      />
      <PageHeader
        title={navGroup.name}
        subtitle={
          category
            ? `Manage ${category.name} values.`
            : 'Create, edit, activate, and import reusable reference values.'
        }
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'Master Data', path: '/master-data' },
          { title: navGroup.name },
        ]}
        extra={canCreate ? <PrimaryButton onClick={openCreate} label="Add New" /> : undefined}
      />

      <nav className="flex max-w-full gap-1 overflow-x-auto border-b border-border" aria-label="Master data categories">
        {navGroup.categories.map((tab) => (
          <NavLink
            key={tab.key}
            to={`/master-data/${navGroup.slug}/${tab.key}`}
            className={({ isActive }) => `${mdTab}${isActive ? ` ${mdTabActive}` : ''}`}
          >
            {tab.name}
            <span className="ml-1.5 tabular-nums opacity-80">
              ({categoryCounts[tab.key] ?? 0})
            </span>
          </NavLink>
        ))}
      </nav>

      <section className={`${adminFilters} ${adminFiltersMaster}`}>
        <FormInput.Search
          allowClear
          enterButton="Search"
          loading={searching}
          placeholder="Search name or code"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onSearch={() => {
            void loadItems(true)
          }}
        />
        <FormSelect
          allowClear
          placeholder="All statuses"
          style={{ width: '100%' }}
          value={status || undefined}
          options={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
          ]}
          onChange={(value) => setStatus(asSelectString(value))}
        />
        {category?.parentCategoryKey ? (
          <FormSelect
            allowClear
            loading={parentsLoading}
            style={{ width: '100%' }}
            placeholder={
              parentsLoading
                ? `Loading ${parentCategoryName(category.parentCategoryKey)}...`
                : `All ${parentCategoryName(category.parentCategoryKey)}`
            }
            value={parentId || undefined}
            options={parents.map((item) => ({ value: item.id, label: item.name }))}
            onChange={(value) => setParentId(asSelectString(value))}
          />
        ) : null}
        <FormDatePicker
          allowClear
          placeholder="Start date"
          aria-label="Start date"
          style={{ width: '100%' }}
          value={toDayjs(createdFrom)}
          disabledDate={(current) => Boolean(createdTo && current.isAfter(dayjs(createdTo), 'day'))}
          onChange={(value) => setCreatedFrom(toDateString(value))}
        />
        <FormDatePicker
          allowClear
          placeholder="End date"
          aria-label="End date"
          style={{ width: '100%' }}
          value={toDayjs(createdTo)}
          disabledDate={(current) => Boolean(createdFrom && current.isBefore(dayjs(createdFrom), 'day'))}
          onChange={(value) => setCreatedTo(toDateString(value))}
        />
        <FormSelect
          style={{ width: '100%' }}
          value={sortBy}
          options={[
            { value: 'sortOrder', label: 'Sort order' },
            { value: 'name', label: 'Name' },
            { value: 'code', label: 'Code' },
            { value: 'createdAt', label: 'Created date' },
            { value: 'status', label: 'Status' },
          ]}
          onChange={(value) => setSortBy(asSelectString(value) || 'sortOrder')}
        />
      </section>

      <div className="flex max-w-full min-w-0 flex-wrap items-center justify-end gap-2">
        <div className="ml-auto flex min-w-0 flex-wrap justify-end gap-2">
          {canCreate ? (
            <>
              <input
                ref={fileRef}
                className="sr-only"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) {
                    void handleImport(file)
                  }
                }}
              />
              <PrimaryButton variant="outline" onClick={() => fileRef.current?.click()} label="Bulk Import" />
            </>
          ) : null}
          <PrimaryButton variant="outline" onClick={() => void handleExport('csv')} label="Export CSV" />
          <PrimaryButton variant="outline" onClick={() => void handleExport('xlsx')} label="Export Excel" />
        </div>
      </div>

      <section className={`${adminCard} ${tableWrap}`}>
        <Spin spinning={loading}>
          <table className={`${adminTable}`}>
            <thead>
              <tr>
                <th>Name</th>
                {category?.extraFields === 'conversationChannel' ? <th>Icon</th> : <th>Code</th>}
                {category?.extraFields === 'conversationChannel' ? <th>Description</th> : null}
                {category?.parentCategoryKey ? <th>{parentCategoryName(category.parentCategoryKey)}</th> : null}
                {category?.extraFields === 'conversationChannel' ? null : <th>Status</th>}
                <th>Sort</th>
                {category?.extraFields === 'conversationChannel' ? <th>Status</th> : <th>Used by</th>}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      category?.extraFields === 'conversationChannel'
                        ? 6
                        : category?.parentCategoryKey
                          ? 7
                          : 6
                    }
                  >
                    No master data found.
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      {category?.extraFields === 'conversationChannel' || !item.description ? null : (
                        <div className={`${muted}`}>{item.description}</div>
                      )}
                    </td>
                    {category?.extraFields === 'conversationChannel' ? (
                      <td>
                        <FaIconPreview iconClass={extraText(item.extras, 'icon')} />
                      </td>
                    ) : (
                      <td>{item.code || '—'}</td>
                    )}
                    {category?.extraFields === 'conversationChannel' ? (
                      <td className="max-w-[280px]">
                        <span className="line-clamp-2 text-[#5b6b7c]">{item.description || '—'}</span>
                      </td>
                    ) : null}
                    {category?.parentCategoryKey ? <td>{item.parentName || '—'}</td> : null}
                    {category?.extraFields === 'conversationChannel' ? null : (
                      <td>
                        <FormSwitch
                          checked={item.status === 'ACTIVE'}
                          checkedChildren="Active"
                          unCheckedChildren="Inactive"
                          disabled={!canEdit || item.isSystem}
                          loading={statusUpdatingId === item.id}
                          onChange={(checked) => {
                            void setItemStatus(item, checked ? 'ACTIVE' : 'INACTIVE')
                          }}
                        />
                      </td>
                    )}
                    <td>{item.sortOrder}</td>
                    {category?.extraFields === 'conversationChannel' ? (
                      <td>
                        <FormSwitch
                          checked={item.status === 'ACTIVE'}
                          checkedChildren="Active"
                          unCheckedChildren="Inactive"
                          disabled={!canEdit || item.isSystem}
                          loading={statusUpdatingId === item.id}
                          onChange={(checked) => {
                            void setItemStatus(item, checked ? 'ACTIVE' : 'INACTIVE')
                          }}
                        />
                      </td>
                    ) : (
                      <td>{item.usageCount > 0 ? `Used by: ${item.usageCount}` : '—'}</td>
                    )}
                    <td className={`${rowActions}`}>
                      {category?.extraFields === 'conversationChannel' ? (
                        <div className="flex items-center gap-2">
                          {canEdit ? (
                            <PrimaryButton
                              type="button"
                              variant="outline"
                              aria-label="Edit"
                              className="!min-w-0 !border-primary !px-2 !text-primary"
                              onClick={() => openItem(item, 'edit')}
                              icon={<ActionIcon icon={PencilEdit02Icon} />}
                            />
                          ) : null}
                          {canDelete && item.usageCount === 0 && !item.isSystem ? (
                            <PrimaryButton
                              type="button"
                              variant="outline"
                              aria-label="Delete"
                              className="!min-w-0 !border-danger !px-2 !text-danger"
                              onClick={() => askDelete(item)}
                              icon={<ActionIcon icon={Delete02Icon} />}
                            />
                          ) : null}
                        </div>
                      ) : (
                        <RowActionMenu
                          items={(
                            [
                              {
                                key: 'history',
                                label: 'History',
                                icon: <ActionIcon icon={ViewIcon} />,
                                onSelect: () => {
                                  void openHistory(item)
                                },
                              },
                              canEdit
                                ? {
                                    key: 'edit',
                                    label: 'Edit',
                                    icon: <ActionIcon icon={PencilEdit02Icon} />,
                                    onSelect: () => openItem(item, 'edit'),
                                  }
                                : null,
                              canDelete && item.usageCount === 0 && !item.isSystem
                                ? {
                                    key: 'delete',
                                    label: 'Delete',
                                    icon: <ActionIcon icon={Delete02Icon} />,
                                    danger: true,
                                    onSelect: () => {
                                      askDelete(item)
                                    },
                                  }
                                : null,
                            ] satisfies Array<RowActionItem | null>
                          ).filter((item) => item !== null)}
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Spin>
        {items.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <span className="text-[0.82rem] text-text-muted">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, items.length)} of{' '}
              {items.length}
            </span>
            <Pagination
              current={safePage}
              pageSize={PAGE_SIZE}
              total={items.length}
              showSizeChanger={false}
              onChange={(next) => setPage(next)}
            />
          </div>
        ) : null}
      </section>

      {formOpen
        ? createPortal(
            <div className={`${modalBackdrop}`} data-admin-modal-backdrop onClick={() => !formSaving && setFormOpen(false)}>
              <div
                className={`${modalPanel}`}
                data-admin-modal-panel
                role="dialog"
                aria-modal="true"
                aria-labelledby="md-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className={`${modalHeader}`}>
                  <h3 id="md-modal-title">
                    {category?.extraFields === 'conversationChannel'
                      ? formMode === 'create'
                        ? 'Add Note Channel'
                        : 'Edit Note Channel'
                      : formMode === 'create'
                        ? `Add ${category?.name || ''}`
                        : `Edit ${category?.name || ''}`}
                  </h3>
                  <PrimaryButton
                    type="button"
                    className={`${modalClose}`}
                    aria-label="Close"
                    disabled={formSaving}
                    onClick={() => !formSaving && setFormOpen(false)} icon={<HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />} />
                </div>
                <form className={`${adminForm}`} onSubmit={(event) => void saveItem(event)}>
                  <fieldset className={`${adminFormFields}`} disabled={formSaving}>
                    {category?.extraFields === 'conversationChannel' ? (
                      <>
                        <label>
                          <FieldLabel required>Channel Name</FieldLabel>
                          <FormInput
                            value={form.name}
                            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                            required
                          />
                        </label>
                        <label>
                          Sort Order (SL)
                          <FormInputNumber
                            min={0}
                            className="w-full"
                            value={form.sortOrder}
                            onChange={(value) =>
                              setForm((current) => ({
                                ...current,
                                sortOrder: typeof value === 'number' ? value : 0,
                              }))
                            }
                          />
                        </label>
                        <label>
                          <span className="inline-flex items-center gap-1.5">
                            Icon class
                            <Tooltip title="Font Awesome class, e.g. fa-solid fa-phone or fa-brands fa-whatsapp">
                              <span className="inline-flex text-[#8b97a8]">
                                <HugeiconsIcon icon={InformationCircleIcon} size={14} color="currentColor" strokeWidth={1.8} />
                              </span>
                            </Tooltip>
                          </span>
                          <span className="mt-1.5 flex items-center gap-2">
                            <FaIconPreview iconClass={form.icon} />
                            <FormInput
                              className="flex-1"
                              value={form.icon}
                              placeholder="fa-solid fa-phone"
                              onChange={(event) =>
                                setForm((current) => ({ ...current, icon: event.target.value }))
                              }
                            />
                          </span>
                        </label>
                        <label className={`${adminFormSpan}`}>
                          <span className="inline-flex items-center gap-1.5">
                            Description
                            <Tooltip title="Short helper text shown with this channel">
                              <span className="inline-flex text-[#8b97a8]">
                                <HugeiconsIcon icon={InformationCircleIcon} size={14} color="currentColor" strokeWidth={1.8} />
                              </span>
                            </Tooltip>
                          </span>
                          <FormTextArea
                            rows={4}
                            value={form.description}
                            maxLength={NOTE_CHANNEL_DESCRIPTION_MAX}
                            showCount
                            placeholder="e.g. Quick updates and follow-ups on WhatsApp"
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                description: event.target.value.slice(0, NOTE_CHANNEL_DESCRIPTION_MAX),
                              }))
                            }
                          />
                        </label>
                        <label>
                          <FieldLabel required>Status</FieldLabel>
                          <div className="mt-1.5">
                            <FormSwitch
                              checked={form.status === 'ACTIVE'}
                              checkedChildren="Active"
                              unCheckedChildren="Inactive"
                              disabled={Boolean(selected?.isSystem)}
                              onChange={(checked) =>
                                setForm((current) => ({
                                  ...current,
                                  status: checked ? 'ACTIVE' : 'INACTIVE',
                                }))
                              }
                            />
                          </div>
                        </label>
                      </>
                    ) : (
                      <>
                    <label>
                      <FieldLabel required>Name</FieldLabel>
                      <FormInput
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      <FieldLabel required={category?.codePolicy === 'required'}>Code</FieldLabel>
                      <FormInput
                        value={form.code}
                        onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                        disabled={Boolean(selected?.isSystem)}
                        required={category?.codePolicy === 'required'}
                        placeholder={category?.codePolicy === 'required' ? 'Required' : 'Recommended'}
                      />
                    </label>
                    {category?.parentCategoryKey ? (
                      <label>
                        <FieldLabel required>{parentCategoryName(category.parentCategoryKey)}</FieldLabel>
                        <FormSelect
                          loading={parentsLoading}
                          placeholder={
                            parentsLoading
                              ? `Loading ${parentCategoryName(category.parentCategoryKey)}...`
                              : `Select ${parentCategoryName(category.parentCategoryKey)}`
                          }
                          value={form.parentId || undefined}
                          options={filteredParents.map((item) => ({ value: item.id, label: item.name }))}
                          onChange={(value) => setForm((current) => ({ ...current, parentId: asSelectString(value) }))}
                          disabled={parentsLoading}
                        />
                      </label>
                    ) : null}
                    <label>
                      Status
                      <FormSelect
                        value={form.status}
                        options={[
                          { value: 'ACTIVE', label: 'Active' },
                          { value: 'INACTIVE', label: 'Inactive' },
                        ]}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            status: (asSelectString(value) || 'ACTIVE') as RecordStatus,
                          }))
                        }
                        disabled={Boolean(selected?.isSystem)}
                      />
                    </label>
                    {category?.extraFields === 'leadStatus' ? (
                      <label>
                        Behavior
                        <FormSelect
                          allowClear
                          placeholder="No special behavior"
                          value={form.behaviorKey || undefined}
                          options={[
                            { value: 'converted', label: 'Converted process' },
                            { value: 'lost', label: 'Lost reason required' },
                            { value: 'closed', label: 'Closed' },
                            { value: 'file_opening_pending', label: 'File opening pending' },
                            { value: 'file_opened', label: 'File opened' },
                            { value: 'duplicate', label: 'Duplicate' },
                            { value: 'invalid', label: 'Invalid' },
                          ]}
                          onChange={(value) => setForm((current) => ({ ...current, behaviorKey: asSelectString(value) }))}
                          disabled={Boolean(selected?.isSystem)}
                        />
                      </label>
                    ) : null}
                    {category?.extraFields === 'country' ? (
                      <label>
                        File Opening Charge (BDT)
                        <FormInputNumber
                          min={0}
                          precision={2}
                          prefix="৳"
                          placeholder="Default charge for offers"
                          value={form.fileOpeningCharge ?? undefined}
                          onChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              fileOpeningCharge: typeof value === 'number' ? value : null,
                            }))
                          }
                        />
                      </label>
                    ) : null}
                    {category?.extraFields === 'intake' ? (
                      <>
                        <label>
                          Start Date
                          <FormDatePicker
                            allowClear
                            format="YYYY-MM-DD"
                            placeholder="Select start date"
                            {...DATE_PICKER_POPUP}
                            value={toDayjs(form.startDate)}
                            disabledDate={(current) =>
                              Boolean(form.endDate && current.isAfter(dayjs(form.endDate), 'day'))
                            }
                            onChange={(value) =>
                              setForm((current) => ({ ...current, startDate: toDateString(value) }))
                            }
                          />
                        </label>
                        <label>
                          End Date
                          <FormDatePicker
                            allowClear
                            format="YYYY-MM-DD"
                            placeholder="Select end date"
                            {...DATE_PICKER_POPUP}
                            value={toDayjs(form.endDate)}
                            disabledDate={(current) =>
                              Boolean(form.startDate && current.isBefore(dayjs(form.startDate), 'day'))
                            }
                            onChange={(value) =>
                              setForm((current) => ({ ...current, endDate: toDateString(value) }))
                            }
                          />
                        </label>
                      </>
                    ) : null}
                    <label className={`${adminFormSpan}`}>
                      Description
                      <FormInput
                        value={form.description}
                        maxLength={DESCRIPTION_MAX}
                        showCount
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            description: event.target.value.slice(0, DESCRIPTION_MAX),
                          }))
                        }
                      />
                    </label>
                      </>
                    )}
                  </fieldset>
                  {selected && formMode !== 'create' ? (
                    <p className={`${muted}`}>
                      Created {new Date(selected.createdAt).toLocaleString()}
                      {selected.createdBy ? ` by ${selected.createdBy.fullName}` : ''}
                      {selected.updatedBy ? ` · Updated by ${selected.updatedBy.fullName}` : ''}
                    </p>
                  ) : null}
                  <div className={`${formActions}`}>
                    <PrimaryButton type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={formSaving} label="Cancel" />
                    {(selected ? canEdit : canCreate) ? (
                      <PrimaryButton
                        type="submit"
                        loading={formSaving}
                        label={
                          category?.extraFields === 'conversationChannel'
                            ? formMode === 'create'
                              ? 'Create'
                              : 'Update'
                            : 'Save'
                        }
                      />
                    ) : null}
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}

      {historyOpen && selected
        ? createPortal(
            <div className={`${modalBackdrop}`} onClick={closeHistory}>
              <div
                className={`${modalPanel} flex max-h-[min(92vh,760px)] w-[min(100%,980px)] flex-col overflow-hidden rounded-[18px] p-0`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="md-history-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 border-b border-border px-5 pt-[18px] pb-3.5">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[#2f6fed]" aria-hidden>
                      <HugeiconsIcon icon={HistoryIcon} size={18} color="currentColor" strokeWidth={1.8} />
                    </span>
                    <div>
                      <h3 id="md-history-title">History · {selected.name}</h3>
                      <p>Track the changes made to this record over time.</p>
                    </div>
                  </div>
                  <PrimaryButton type="button" className={`${modalClose}`} aria-label="Close" onClick={closeHistory} icon={<HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />} />
                </div>
                {historyLoading ? (
                  <div className="m-0 flex min-h-60 items-center justify-center">
                    <Spin />
                  </div>
                ) : history.length === 0 ? (
                  <p className={`${muted} m-0 flex min-h-60 items-center justify-center`}>No history yet.</p>
                ) : (
                  <div className="grid min-h-0 flex-1 grid-cols-1 min-[721px]:grid-cols-[280px_minmax(0,1fr)]">
                    <aside
                      className="overflow-auto border-r border-border bg-[color-mix(in_srgb,#f8fafc_85%,var(--color-surface))] px-3 py-4 dark:bg-[color-mix(in_srgb,var(--color-text)_3%,var(--color-surface))]"
                      aria-label="Timeline"
                    >
                      <h4 className="mb-3 mt-0 px-1 text-[0.72rem] font-bold tracking-[0.06em] text-[#8b97a8] uppercase">
                        Timeline
                      </h4>
                      <ol className="relative m-0 list-none p-0">
                        {history.map((entry, index) => {
                          const parsed = parseHistoryMetadata(entry.metadata)
                          const kind = historyKind(entry.action, parsed.changes)
                          const active = entry.id === historyEntryId
                          const isLast = index === history.length - 1
                          return (
                            <li key={entry.id} className="relative">
                              {!isLast ? (
                                <span
                                  className="absolute top-8 bottom-0 left-[15px] w-px bg-border"
                                  aria-hidden
                                />
                              ) : null}
                              <button
                                type="button"
                                className={`${mdHistoryEvent} ${active ? mdHistoryEventActive : ''}`}
                                onClick={() => setHistoryEntryId(entry.id)}
                              >
                                <span
                                  className={`relative z-[1] mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full ${historyKindTone[kind] || 'bg-[#94a3b8] text-white'}`}
                                  aria-hidden
                                >
                                  <HugeiconsIcon icon={historyKindIcon(kind)} size={14} color="currentColor" strokeWidth={2} />
                                </span>
                                <span className="min-w-0 flex-1 pt-0.5">
                                  <strong className={`block text-[0.88rem] leading-tight ${active ? 'text-text' : 'text-text-strong'}`}>
                                    {historyTitle(kind)}
                                  </strong>
                                  <time
                                    className="mt-0.5 block text-[0.72rem] leading-snug text-text-muted"
                                    dateTime={new Date(entry.createdAt).toISOString()}
                                  >
                                    {formatHistoryDate(entry.createdAt)}
                                  </time>
                                  <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[0.74rem] text-text-muted">
                                    <HugeiconsIcon icon={UserIcon} size={12} color="currentColor" strokeWidth={1.8} />
                                    <span className="truncate font-medium text-text-strong/80">
                                      {entry.user?.fullName || 'System'}
                                    </span>
                                    <em className={mdHistoryRole}>
                                      {entry.user?.role || (entry.user ? 'User' : 'System')}
                                    </em>
                                  </span>
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ol>
                    </aside>
                    {(() => {
                      const active = history.find((entry) => entry.id === historyEntryId) || history[0]
                      const parsed = parseHistoryMetadata(active.metadata)
                      const kind = historyKind(active.action, parsed.changes)
                      const rows = historyChangeRows(active.action, active.metadata)
                      const isLatest = active.id === history[0]?.id
                      const roleLabel = active.user?.role || (active.user ? 'User' : 'System')
                      return (
                        <div className="flex min-h-0 flex-col gap-5 overflow-auto p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3.5">
                              <span
                                className={`${mdHistoryDetailIcon} ${historyKindToneSoft[kind] || ''}`}
                                aria-hidden
                              >
                                <HugeiconsIcon icon={historyKindIcon(kind)} size={18} color="currentColor" strokeWidth={1.8} />
                              </span>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <strong className="text-[1.05rem] leading-tight tracking-[-0.01em] text-text">
                                    {historyTitle(kind)}
                                  </strong>
                                  {isLatest ? (
                                    <span className="rounded-md bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] px-1.5 py-0.5 text-[0.68rem] font-bold tracking-[0.02em] text-primary uppercase">
                                      Latest
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-1.5 mb-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8rem] text-text-muted">
                                  <time dateTime={new Date(active.createdAt).toISOString()}>
                                    {formatHistoryDate(active.createdAt)}
                                  </time>
                                  <span className="text-border" aria-hidden>
                                    ·
                                  </span>
                                  <span className="inline-flex items-center gap-1.5">
                                    <HugeiconsIcon icon={UserIcon} size={13} color="currentColor" strokeWidth={1.8} />
                                    <span className="font-medium text-text-strong/85">
                                      {active.user?.fullName || 'System'}
                                    </span>
                                    <em className={mdHistoryRole}>{roleLabel}</em>
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-4">
                            <HistoryFieldList title="Changes Made" rows={rows} valueKey="to" />
                            {kind === 'created' ? null : (
                              <HistoryFieldList title="Previous Value" rows={rows} valueKey="from" />
                            )}
                          </div>

                          <section className="rounded-2xl border border-dashed border-border bg-[color-mix(in_srgb,var(--color-text)_2%,var(--color-surface))] px-4 py-3.5">
                            <h4 className="m-0 mb-1.5 inline-flex items-center gap-1.5 text-[0.72rem] font-bold tracking-[0.06em] text-[#8b97a8] uppercase">
                              <HugeiconsIcon icon={Note01Icon} size={14} color="currentColor" strokeWidth={1.6} />
                              Additional Information
                            </h4>
                            <p className={`m-0 text-[0.88rem] leading-relaxed ${parsed.notes ? 'text-text' : 'text-text-muted'}`}>
                              {parsed.notes || 'No additional notes for this change.'}
                            </p>
                          </section>
                        </div>
                      )
                    })()}
                  </div>
                )}
                <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
                  <PrimaryButton type="button" variant="outline" onClick={closeHistory} label="Close" />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <DeleteModal
        open={Boolean(deleteTarget)}
        loading={deleteSaving}
        title={`Delete ${entityName}?`}
        itemName={deleteTarget?.name || `this ${entityName.toLowerCase()}`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />

      {importOpen && importResult
        ? createPortal(
            <div className={`${modalBackdrop}`} onClick={() => setImportOpen(false)}>
              <div className={`${modalPanel}`} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
                <div className={`${modalHeader}`}>
                  <h3>Import result</h3>
                  <PrimaryButton type="button" className={`${modalClose}`} aria-label="Close" onClick={() => setImportOpen(false)} icon={<HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />} />
                </div>
                <p>
                  Total {importResult.total}, Successful {importResult.successful}, Failed {importResult.failed}
                </p>
                {importResult.errors.length > 0 ? (
                  <ul className="mb-3 mt-0 pl-[18px]">
                    {importResult.errors.slice(0, 8).map((item) => (
                      <li key={`${item.row}-${item.message}`}>
                        Row {item.row}: {item.message}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className={`${formActions}`}>
                  {importResult.errors.length > 0 ? (
                    <PrimaryButton variant="outline" onClick={downloadErrors} label="Export errors" />
                  ) : null}
                  <PrimaryButton onClick={() => setImportOpen(false)} label="Close" />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {toast
        ? createPortal(
            <div className={appToastClass(toast.type)} role="status">
              {toast.text}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
