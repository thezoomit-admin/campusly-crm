import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import { Spin } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { toast } from 'react-toastify'
import { createPortal } from 'react-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Activity01Icon,
  Calendar03Icon,
  Call02Icon,
  Camera01Icon,
  Cancel01Icon,
  CreditCardIcon,
  File01Icon,
  Folder01Icon,
  Key01Icon,
  Mail01Icon,
  Message01Icon,
  SquareLock01Icon,
  Settings01Icon,
  Shield01Icon,
  UserIcon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import { PrimaryButton, UserAvatar } from '@/components/ui'
import { FormInput, FormSelect } from '@/components/common/Forms'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { useWorkspaceBrand } from '@/modules/settings/hooks/useWorkspaceBrand'
import { getApiError, isGloballyToastedApiError } from '@/lib/api'
import { isAuthSession } from '@/lib/auth'
import { setSession, useAppDispatch } from '@/redux'
import {
  useChangePasswordMutation,
  useGetMyPermissionsQuery,
  useListMyActivityQuery,
  useUpdateMyProfileMutation,
} from '@/redux/features/auth/authApi'
import type { ActivityFeedCategory, ActivityFeedItem, AuthSession, DataScopeLevel, PermissionRecord } from '@/types'
import {
  adminEmpty,
  adminForm,
  fieldError,
  fieldHint,
  fieldLabelClass,
  formActions,
  formField,
  modalBackdrop,
  modalClose,
  modalPanel,
} from '@/styles/admin'

dayjs.extend(relativeTime)

const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
  INVITED: 'Invited',
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'permissions', label: 'Permission', icon: Shield01Icon },
  { id: 'activity', label: 'Activity log', icon: Activity01Icon },
] as const

type ProfileTab = (typeof TABS)[number]['id']

const ACTIVITY_RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
]

const ACTIVITY_CATEGORIES: Array<{ value: 'all' | ActivityFeedCategory; label: string }> = [
  { value: 'all', label: 'All activity' },
  { value: 'call', label: 'Calls' },
  { value: 'message', label: 'Messages' },
  { value: 'meeting', label: 'Meetings' },
  { value: 'email', label: 'Emails' },
  { value: 'counselling', label: 'Counselling' },
  { value: 'document', label: 'Documents' },
  { value: 'status', label: 'Status changes' },
  { value: 'assignment', label: 'Assignments' },
  { value: 'payment', label: 'Payments' },
  { value: 'file', label: 'Files' },
  { value: 'system', label: 'System' },
]

const CATEGORY_ICON: Record<ActivityFeedCategory, typeof Activity01Icon> = {
  call: Call02Icon,
  message: Message01Icon,
  meeting: Calendar03Icon,
  email: Mail01Icon,
  counselling: UserMultiple02Icon,
  document: File01Icon,
  status: Activity01Icon,
  assignment: UserMultiple02Icon,
  payment: CreditCardIcon,
  file: Folder01Icon,
  system: Settings01Icon,
}

const PAGE_SIZE = 12
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

const SCOPE_TITLES: Record<string, string> = {
  lead: 'Leads',
  document: 'Documents',
  employee_performance: 'Employee performance',
}

function headerStatusClass(status: string) {
  if (status === 'ACTIVE') {
    return 'bg-[#e7f8ef] text-[#15803d] dark:bg-[rgba(21,128,61,0.2)] dark:text-[#86efac]'
  }
  if (status === 'SUSPENDED') {
    return 'bg-[#fde8e8] text-[#b42318] dark:bg-[rgba(180,35,24,0.22)] dark:text-[#fca5a5]'
  }
  if (status === 'INVITED') {
    return 'bg-[#fff7ed] text-[#c2410c] dark:bg-[rgba(194,65,12,0.22)] dark:text-[#fdba74]'
  }
  return 'bg-[#f3f4f6] text-[#4b5563] dark:bg-[#24303a] dark:text-[#cbd5e1]'
}

function displayValue(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '—'
}

function parseTab(value: string | null): ProfileTab {
  if (value === 'permissions' || value === 'activity' || value === 'profile') return value
  return 'profile'
}

function usernameError(value: string) {
  const username = value.trim().toLowerCase()
  if (username.length < 3) return 'Username must be at least 3 characters.'
  if (username.length > 30) return 'Username must be 30 characters or fewer.'
  if (/\s/.test(value)) return 'Username cannot contain spaces.'
  if (!/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/.test(username)) {
    return 'Username can only use letters, numbers, dot, hyphen, and underscore.'
  }
  return ''
}

function mobileError(value: string) {
  const mobile = value.replace(/[\s()-]/g, '')
  if (!/^\+?[0-9]{10,15}$/.test(mobile)) return 'Enter a valid mobile number.'
  return ''
}

function rangeStart(range: string) {
  if (range === 'all') return '2020-01-01'
  const days = Number(range) || 365
  return dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD')
}

function permissionLabel(item: PermissionRecord) {
  const description = item.description?.trim()
  if (description) return description
  return item.action.replaceAll('_', ' ')
}

function scopeTitle(resource: string) {
  return SCOPE_TITLES[resource] || resource.replaceAll('_', ' ')
}

function scopeLevelLabel(level?: DataScopeLevel) {
  if (level === 'ALL') return 'All records'
  if (level === 'DEPARTMENT') return 'Department'
  if (level === 'TEAM') return 'Team'
  return 'Own records'
}

function relatedHref(item: ActivityFeedItem) {
  const type = (item.relatedType || '').toLowerCase()
  if (!item.relatedId) return null
  if (type === 'lead') return `/leads/${item.relatedId}`
  return null
}

export default function ProfilePage() {
  const auth = useOutletContext<AuthSession>()
  const dispatch = useAppDispatch()
  const companyName = useWorkspaceBrand().name
  const user = auth.user
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = parseTab(searchParams.get('tab'))
  const name = user.fullName || user.username || user.email

  const [fullName, setFullName] = useState(user.fullName || '')
  const [username, setUsername] = useState(user.username || '')
  const [mobile, setMobile] = useState(user.mobile || '')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [passwordOpen, setPasswordOpen] = useState(false)
  const previewUrl = useRef('')

  const [updateProfile, { isLoading: saving }] = useUpdateMyProfileMutation()

  useEffect(() => {
    setFullName(user.fullName || '')
    setUsername(user.username || '')
    setMobile(user.mobile || '')
  }, [user.fullName, user.username, user.mobile])

  useEffect(() => {
    return () => {
      if (previewUrl.current.startsWith('blob:')) URL.revokeObjectURL(previewUrl.current)
    }
  }, [])

  const dirty =
    fullName.trim() !== (user.fullName || '').trim() ||
    username.trim().toLowerCase() !== (user.username || '').trim().toLowerCase() ||
    mobile.replace(/[\s()-]/g, '') !== (user.mobile || '').replace(/[\s()-]/g, '') ||
    Boolean(photoFile)

  function selectTab(next: ProfileTab) {
    const params = new URLSearchParams(searchParams)
    if (next === 'profile') params.delete('tab')
    else params.set('tab', next)
    setSearchParams(params, { replace: true })
  }

  function clearPhotoSelection() {
    if (previewUrl.current.startsWith('blob:')) URL.revokeObjectURL(previewUrl.current)
    previewUrl.current = ''
    setPhotoFile(null)
    setPhotoPreview('')
  }

  function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      toast.error('Profile photo must be a JPG, PNG, or WEBP image.')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error('Profile photo must be 5 MB or smaller.')
      return
    }
    if (previewUrl.current.startsWith('blob:')) URL.revokeObjectURL(previewUrl.current)
    const url = URL.createObjectURL(file)
    previewUrl.current = url
    setPhotoFile(file)
    setPhotoPreview(url)
    selectTab('profile')
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = {
      fullName:
        fullName.trim().length < 2 || fullName.trim().length > 100
          ? 'Full name must be 2–100 characters.'
          : '',
      username: usernameError(username),
      mobile: mobileError(mobile),
    }
    setFieldErrors(nextErrors)
    if (nextErrors.fullName || nextErrors.username || nextErrors.mobile) return

    const payload = {
      fullName: fullName.trim(),
      username: username.trim(),
      mobile: mobile.trim(),
    }
    const body = photoFile
      ? (() => {
          const form = new FormData()
          form.set('fullName', payload.fullName)
          form.set('username', payload.username)
          form.set('mobile', payload.mobile)
          form.set('photo', photoFile)
          return form
        })()
      : payload

    try {
      const session = await updateProfile(body).unwrap()
      if (isAuthSession(session)) dispatch(setSession(session))
      clearPhotoSelection()
      toast.success('Profile updated.')
    } catch (error) {
      if (!isGloballyToastedApiError(error)) {
        toast.error(getApiError(error, 'Unable to update your profile.'))
      }
    }
  }

  return (
    <div className="grid min-w-0 max-w-full gap-2 overflow-x-hidden">
      <PageMeta
        title="My Profile"
        description="Update your photo, name, and contact details, and review your permissions and activity."
      />
      <PageHeader
        title="My profile"
        subtitle="Your account, access, and the work you have done in this CRM."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Profile' }]}
        showDivider={false}
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
        <div className="flex flex-col gap-3 px-4 pt-2.5 pb-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative shrink-0">
              <input
                id="profile-photo"
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onPhotoChange}
              />
              <label htmlFor="profile-photo" className="relative m-0 block cursor-pointer">
                {photoPreview ? (
                  <span className="grid size-18 place-items-center overflow-hidden rounded-full bg-primary text-xl font-semibold text-on-primary">
                    <img src={photoPreview} alt="" className="h-full w-full object-cover" />
                  </span>
                ) : (
                  <UserAvatar
                    key={user.photoUrl || user.id}
                    name={name}
                    photoUrl={user.photoUrl}
                    className="grid size-18 place-items-center overflow-hidden rounded-full bg-primary text-xl font-semibold text-on-primary [&_img]:h-full [&_img]:w-full [&_img]:object-cover"
                  />
                )}
                <span className="absolute -right-0.5 -bottom-0.5 grid size-7 place-items-center rounded-full bg-primary text-on-primary shadow-[0_0_0_2px_var(--color-surface)]">
                  <HugeiconsIcon icon={Camera01Icon} size={14} color="currentColor" strokeWidth={1.8} />
                </span>
                <span className="sr-only">Change profile photo</span>
              </label>
            </div>
            <div className="min-w-0">
              <h2 className="m-0 truncate text-[1.35rem] leading-tight font-semibold text-text-strong">
                {displayValue(user.fullName)}
              </h2>
              <span
                className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${headerStatusClass(user.status)}`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {USER_STATUS_LABELS[user.status] || displayValue(user.status)}
              </span>
              <p className="mt-1.5 mb-0 text-sm text-text-muted">
                {auth.role?.name || 'No role'}
                <span className="px-1.5">·</span>
                {companyName}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center self-end sm:self-auto">
            <PrimaryButton
              variant="outline"
              icon={<HugeiconsIcon icon={SquareLock01Icon} size={16} color="currentColor" strokeWidth={1.8} />}
              label="Change Password"
              onClick={() => setPasswordOpen(true)}
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
      <nav className="flex gap-1 overflow-x-auto border-b border-border-subtle px-2 sm:px-4" aria-label="Profile sections">
          {TABS.map((item) => {
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => selectTab(item.id)}
                className={[
                  'inline-flex shrink-0 cursor-pointer items-center gap-2 border-0 border-b-2 bg-transparent px-3 py-3 text-[0.9rem] whitespace-nowrap',
                  active
                    ? 'border-primary font-semibold text-primary'
                    : 'border-transparent font-medium text-text-muted hover:text-text-strong',
                ].join(' ')}
              >
                <HugeiconsIcon icon={item.icon} size={18} color="currentColor" strokeWidth={1.6} />
                {item.label}
                {item.id === 'permissions' ? (
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] px-1.5 py-0.5 text-[0.68rem] font-semibold text-primary">
                    {auth.permissions.length}
                  </span>
                ) : null}
              </button>
            )
          })}
      </nav>

      <div className="p-4 sm:p-5">
      {tab === 'profile' ? (
        <form className={adminForm} onSubmit={saveProfile}>
          <div className="mb-1">
            <h3 className="m-0 text-base font-semibold text-text-strong">Personal information</h3>
            <p className={`${fieldHint} mt-1`}>
              Photo, full name, username, and mobile number are yours to update. Email and role stay with your administrator.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={formField}>
              <span className={fieldLabelClass(true)}>Full name</span>
              <FormInput
                value={fullName}
                maxLength={100}
                autoComplete="name"
                onChange={(event) => setFullName(event.target.value)}
                status={fieldErrors.fullName ? 'error' : undefined}
              />
              {fieldErrors.fullName ? <span className={fieldError}>{fieldErrors.fullName}</span> : null}
            </label>
            <label className={formField}>
              <span className={fieldLabelClass(true)}>Username</span>
              <FormInput
                value={username}
                maxLength={30}
                autoComplete="username"
                onChange={(event) => setUsername(event.target.value)}
                status={fieldErrors.username ? 'error' : undefined}
              />
              {fieldErrors.username ? <span className={fieldError}>{fieldErrors.username}</span> : null}
            </label>
            <label className={formField}>
              <span className={fieldLabelClass(true)}>Mobile number</span>
              <FormInput
                value={mobile}
                inputMode="tel"
                autoComplete="tel"
                onChange={(event) => setMobile(event.target.value)}
                status={fieldErrors.mobile ? 'error' : undefined}
              />
              {fieldErrors.mobile ? <span className={fieldError}>{fieldErrors.mobile}</span> : null}
            </label>
            <label className={formField}>
              <span className={fieldLabelClass()}>Email</span>
              <FormInput value={user.email} disabled />
            </label>
            <label className={formField}>
              <span className={fieldLabelClass()}>Role</span>
              <FormInput value={auth.role?.name || 'No role assigned'} disabled />
            </label>
            <label className={formField}>
              <span className={fieldLabelClass()}>Status</span>
              <FormInput value={USER_STATUS_LABELS[user.status] || user.status} disabled />
            </label>
          </div>
          {photoFile ? (
            <p className={`${fieldHint} m-0`}>
              New photo selected. Save to apply it.{' '}
              <button type="button" className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-primary" onClick={clearPhotoSelection}>
                Clear photo
              </button>
            </p>
          ) : (
            <p className={`${fieldHint} m-0`}>JPG, PNG, or WEBP. Maximum 5 MB. Use the photo on the card above to replace it.</p>
          )}
          <div className={formActions}>
            <PrimaryButton
              type="submit"
              disabled={!dirty || saving}
              label={saving ? 'Saving…' : 'Save changes'}
            />
          </div>
        </form>
      ) : null}

      {tab === 'permissions' ? <PermissionsPanel auth={auth} /> : null}
      {tab === 'activity' ? <ActivityPanel /> : null}
      </div>
      </section>

      {passwordOpen ? <ChangePasswordModal onClose={() => setPasswordOpen(false)} /> : null}
    </div>
  )
}

function PermissionsPanel({ auth }: { auth: AuthSession }) {
  const { data, isLoading, isError } = useGetMyPermissionsQuery()
  const [query, setQuery] = useState('')
  const permissions = data?.permissions ?? []
  const scopes = data?.dataScopes ?? auth.dataScopes
  const roleName = data?.role?.name || auth.role?.name || 'your role'

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return permissions
    return permissions.filter((item) =>
      `${item.module} ${item.key} ${item.description ?? ''} ${item.action}`.toLowerCase().includes(needle),
    )
  }, [permissions, query])

  const groups = useMemo(() => {
    const map = new Map<string, PermissionRecord[]>()
    for (const item of filtered) {
      const list = map.get(item.module) ?? []
      list.push(item)
      map.set(item.module, list)
    }
    return [...map.entries()]
  }, [filtered])

  const known = new Set(permissions.map((item) => item.key))
  const extraKeys = auth.permissions.filter((key) => !known.has(key))
  const scopeEntries = Object.entries(scopes || {})

  return (
    <section className="grid gap-5">
      <article>
        <header className="mb-4 flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] text-primary">
            <HugeiconsIcon icon={Shield01Icon} size={18} color="currentColor" strokeWidth={1.7} />
          </span>
          <div>
            <h3 className="m-0 text-base font-semibold text-text-strong">Access for {roleName}</h3>
            <p className={`${fieldHint} mt-1`}>
              {auth.permissions.length} permission{auth.permissions.length === 1 ? '' : 's'} on this account. These are assigned by an administrator.
            </p>
          </div>
        </header>
        {scopeEntries.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {scopeEntries.map(([resource, level]) => (
              <div key={resource} className="rounded-xl border border-border bg-input-bg px-3.5 py-3">
                <p className="m-0 text-xs font-semibold tracking-wide text-text-muted uppercase">{scopeTitle(resource)}</p>
                <p className="mt-1 mb-0 text-sm font-semibold text-text-strong">{scopeLevelLabel(level)}</p>
              </div>
            ))}
          </div>
        ) : null}
      </article>

      <article className="border-t border-border-subtle pt-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="m-0 text-base font-semibold text-text-strong">Permissions</h3>
          <div className="w-full sm:max-w-xs">
            <FormInput
              value={query}
              placeholder="Search permissions"
              aria-label="Search permissions"
              allowClear
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        {isLoading ? (
          <div className="grid min-h-40 place-items-center">
            <Spin />
          </div>
        ) : isError && permissions.length === 0 ? (
          <FallbackPermissionList keys={auth.permissions} />
        ) : groups.length === 0 && extraKeys.length === 0 ? (
          <div className={adminEmpty}>
            <strong>{query ? 'No matching permissions' : 'No permissions yet'}</strong>
            <p>{query ? 'Try a different module or action.' : `${roleName} does not include any permissions yet.`}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {groups.map(([moduleName, items]) => (
              <div key={moduleName} className="rounded-xl border border-border px-3.5 py-3">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <strong className="text-sm text-text-strong">{moduleName}</strong>
                  <span className="text-xs text-text-muted">{items.length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item) => (
                    <span
                      key={item.id}
                      title={item.key}
                      className="inline-flex rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] px-2.5 py-1 text-[0.75rem] font-medium text-primary"
                    >
                      {permissionLabel(item)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {extraKeys.length > 0 && !query.trim() ? (
              <div className="rounded-xl border border-border px-3.5 py-3">
                <strong className="mb-2.5 block text-sm text-text-strong">Other access</strong>
                <div className="flex flex-wrap gap-1.5">
                  {extraKeys.map((key) => (
                    <span
                      key={key}
                      className="inline-flex rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] px-2.5 py-1 text-[0.75rem] font-medium text-primary"
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </article>
    </section>
  )
}

function FallbackPermissionList({ keys }: { keys: string[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const key of keys) {
      const resource = key.split(':')[0] || 'access'
      const list = map.get(resource) ?? []
      list.push(key)
      map.set(resource, list)
    }
    return [...map.entries()]
  }, [keys])

  if (groups.length === 0) {
    return (
      <div className={adminEmpty}>
        <strong>No permissions yet</strong>
        <p>This account does not include any permissions yet.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {groups.map(([resource, items]) => (
        <div key={resource} className="rounded-xl border border-border px-3.5 py-3">
          <strong className="mb-2.5 block text-sm text-text-strong capitalize">{resource.replaceAll('_', ' ')}</strong>
          <div className="flex flex-wrap gap-1.5">
            {items.map((key) => (
              <span
                key={key}
                className="inline-flex rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] px-2.5 py-1 text-[0.75rem] font-medium text-primary"
              >
                {key.split(':').slice(1).join(' ').replaceAll('_', ' ') || key}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ActivityPanel() {
  const [range, setRange] = useState('365')
  const [category, setCategory] = useState<'all' | ActivityFeedCategory>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [range, category, search])

  const { data, isLoading, isFetching, isError } = useListMyActivityQuery({
    from: rangeStart(range),
    to: dayjs().format('YYYY-MM-DD'),
    search: search || undefined,
    category: category === 'all' ? undefined : category,
  })

  const items = data?.items ?? []
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const visible = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <section>
      <header className="mb-4 flex flex-col gap-1">
        <h3 className="m-0 text-base font-semibold text-text-strong">Activity log</h3>
        <p className={`${fieldHint} m-0`}>Calls, updates, assignments, and other actions you have taken in the CRM.</p>
      </header>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(160px,0.8fr)_minmax(180px,0.9fr)]">
        <FormInput
          value={searchInput}
          placeholder="Search activity"
          aria-label="Search activity"
          allowClear
          onChange={(event) => setSearchInput(event.target.value)}
        />
        <FormSelect
          aria-label="Activity type"
          allowClear={false}
          value={category}
          options={ACTIVITY_CATEGORIES}
          onChange={(value) => setCategory((value as ActivityFeedCategory) || 'all')}
        />
        <FormSelect
          aria-label="Date range"
          allowClear={false}
          value={range}
          options={ACTIVITY_RANGES}
          onChange={(value) => setRange(String(value || '365'))}
        />
      </div>

      {isLoading ? (
        <div className="grid min-h-60 place-items-center">
          <Spin />
        </div>
      ) : isError ? (
        <div className={adminEmpty}>
          <strong>Activity could not be loaded</strong>
          <p>Refresh the page and try again.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className={adminEmpty}>
          <strong>No activity in this period</strong>
          <p>Work you do in the CRM will show up here.</p>
        </div>
      ) : (
        <>
          <p className={`${fieldHint} mb-2`}>
            {data?.counts.all ?? items.length} event{(data?.counts.all ?? items.length) === 1 ? '' : 's'}
            {isFetching ? ' · Updating…' : ''}
          </p>
          <ol className="m-0 grid list-none gap-2 p-0">
            {visible.map((item) => {
              const icon = CATEGORY_ICON[item.category] || Activity01Icon
              const href = relatedHref(item)
              const when = dayjs(item.occurredAt)
              return (
                <li key={item.id} className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-xl border border-border px-3 py-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] text-primary">
                    <HugeiconsIcon icon={icon} size={18} color="currentColor" strokeWidth={1.7} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <strong className="text-sm text-text-strong">{item.action}</strong>
                      <span className="rounded-full bg-input-bg px-2 py-0.5 text-[0.7rem] font-semibold text-text-muted">{item.module}</span>
                      <time
                        className="ms-auto text-xs text-text-muted"
                        dateTime={when.toISOString()}
                        title={when.format('D MMM YYYY, h:mm A')}
                      >
                        {when.fromNow()}
                      </time>
                    </div>
                    <p className="mt-1 mb-0 text-sm text-text">{item.details}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                      <span>{when.format('D MMM YYYY, h:mm A')}</span>
                      {item.relatedName ? (
                        href ? (
                          <Link to={href} className="font-medium text-primary no-underline hover:underline">
                            {item.relatedName}
                          </Link>
                        ) : (
                          <span>{item.relatedName}</span>
                        )
                      ) : null}
                      {item.outcome ? <span>{item.outcome}</span> : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
          {pageCount > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-text-muted">
                Page {safePage} of {pageCount}
              </span>
              <div className="flex gap-2">
                <PrimaryButton variant="outline" disabled={safePage <= 1} label="Previous" onClick={() => setPage(safePage - 1)} />
                <PrimaryButton
                  variant="outline"
                  disabled={safePage >= pageCount}
                  label="Next"
                  onClick={() => setPage(safePage + 1)}
                />
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [changePassword, { isLoading }] = useChangePasswordMutation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isLoading) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isLoading, onClose])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }
    if (newPassword === currentPassword) {
      setError('Choose a password that is different from the current one.')
      return
    }
    try {
      const data = await changePassword({ currentPassword, newPassword }).unwrap()
      toast.success(data?.message || 'Password updated.')
      onClose()
    } catch (err) {
      setError(getApiError(err, 'Unable to update password.'))
    }
  }

  return createPortal(
    <div className={modalBackdrop} onClick={() => { if (!isLoading) onClose() }}>
      <div
        className={`${modalPanel} w-[min(100%,440px)]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] text-primary">
              <HugeiconsIcon icon={Key01Icon} size={18} color="currentColor" strokeWidth={1.7} />
            </span>
            <div>
              <h3 id="change-password-title" className="m-0 text-lg font-semibold text-text-strong">
                Change password
              </h3>
              <p className={`${fieldHint} mt-1`}>Use at least 8 characters. Your other sessions stay signed in.</p>
            </div>
          </div>
          <button type="button" className={modalClose} aria-label="Close" onClick={onClose} disabled={isLoading}>
            <HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.8} />
          </button>
        </header>
        <form className={`${adminForm} gap-3`} onSubmit={onSubmit}>
          <label className={formField}>
            <span className={fieldLabelClass(true)}>Current password</span>
            <FormInput.Password
              value={currentPassword}
              autoComplete="current-password"
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>
          <label className={formField}>
            <span className={fieldLabelClass(true)}>New password</span>
            <FormInput.Password
              value={newPassword}
              autoComplete="new-password"
              minLength={8}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </label>
          <label className={formField}>
            <span className={fieldLabelClass(true)}>Confirm new password</span>
            <FormInput.Password
              value={confirmPassword}
              autoComplete="new-password"
              minLength={8}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="m-0 text-sm text-danger">{error}</p> : null}
          <div className={formActions}>
            <PrimaryButton variant="outline" label="Cancel" onClick={onClose} disabled={isLoading} />
            <PrimaryButton type="submit" disabled={isLoading} label={isLoading ? 'Saving…' : 'Update password'} />
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
