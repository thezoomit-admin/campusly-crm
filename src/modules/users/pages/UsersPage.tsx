import {
  adminCard,
  adminFilters,
  adminForm,
  adminFormFields,
  adminFormSpan,
  adminPage,
  adminTable,
  fieldHint,
  fieldLabelClass,
  formActions,
  modalBackdrop,
  modalClose,
  modalHeader,
  modalPanel,
  muted,
  photoCameraBadge,
  photoPicker,
  photoPickerButton,
  photoPreviewFrame,
  photoUpload,
  rowActions,
  statusConfirmCopy,
  statusConfirmMeta,
  statusConfirmPanel,
  tableWrap,
  userStatusPillClass,
  adminTableRowStatusUpdated,
} from '../../../styles/admin'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  useAdminPasswordResetMutation,
  useCreateUserMutation,
  useLazyGetUserQuery,
  useLazyListUsersQuery,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  type UserPayload,
} from '@/redux/features/users/usersApi'
import { useLazyListRoleOptionsQuery } from '@/redux/features/roles/rolesApi'
import { useLazyListDepartmentsQuery } from '@/redux/features/masterData/masterDataApi'
import { getApiError, isGloballyToastedApiError, toQuery } from '@/lib/api'
import { patchCurrentAuthUser } from '@/lib/auth'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Camera01Icon,
  Cancel01Icon,
  InformationCircleIcon,
  Mail01Icon,
  PauseIcon,
  PencilEdit02Icon,
  UserBlock01Icon,
  UserCheck01Icon,
  UserIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { Spin, Tooltip } from 'antd'
import { PrimaryButton } from '@/components/ui'
import { FormInput, FormSelect, FormSwitch } from '@/components/common/Forms'
import { PageHeader } from '@/components/common/Navigation'
import ExportActions from '@/components/common/Export/ExportActions'
import { PageMeta } from '@/components/common/Meta'
import { RowActionMenu, type RowActionItem } from '@/components/common/Dropdowns'
import {
  UserAvatar,
  formFromUser,
  formatPrettyDate,
  statusLabel,
  userPhotoSrc,
  type UserForm,
} from '../components/UserViewLayout'
import { hasPermission } from '../../../lib/access'
import { readUrlSearchQuery } from '@/lib/url'
import type {
  AdminUser,
  AuthSession,
  Department,
  RoleOption,
  UserStatus,
} from '../../../types'

function showApiError(err: unknown, fallback: string) {
  if (isGloballyToastedApiError(err)) {
    return
  }
  toast.error(getApiError(err, fallback))
}

function ActionIcon({ icon }: { icon: IconSvgElement }) {
  return <HugeiconsIcon icon={icon} size={16} color="currentColor" strokeWidth={1.5} />
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className={fieldLabelClass(required)}>{children}</span>
  )
}


const EMPTY_FORM: UserForm = {
  fullName: '',
  email: '',
  mobile: '',
  username: '',
  password: '',
  roleId: '',
  departmentId: '',
  teamId: '',
  status: 'ACTIVE',
}

function statusChangeCopy(user: AdminUser, status: UserStatus) {
  const name = user.fullName
  if (status === 'ACTIVE') {
    return {
      title: 'Activate user',
      body: `Activate ${name}? They will be able to log in and work in the CRM again.`,
      confirm: 'Activate',
      success: `${name} is now Active.`,
    }
  }
  if (status === 'INACTIVE') {
    return {
      title: 'Deactivate user',
      body: `Deactivate ${name}? They will not be able to log in until you activate them again.`,
      confirm: 'Deactivate',
      success: `${name} is now Inactive.`,
    }
  }
  return {
    title: 'Suspend user',
    body: `Suspend ${name}? Access will be blocked immediately and their active sessions will be signed out.`,
    confirm: 'Suspend',
    success: `${name} is now Suspended.`,
  }
}

function asSelectString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function userPayloadForm(body: UserPayload, photo?: File | null) {
  const form = new FormData()
  form.set('fullName', body.fullName)
  form.set('email', body.email)
  form.set('mobile', body.mobile)
  form.set('username', body.username)
  form.set('roleId', body.roleId)
  form.set('status', body.status)
  form.set('departmentId', body.departmentId || '')
  form.set('teamId', body.teamId || '')
  if (body.password) {
    form.set('password', body.password)
  }
  if (photo) {
    form.set('photo', photo)
  }
  return form
}

export default function UsersPage() {
  const auth = useOutletContext<AuthSession>()
  const location = useLocation()
  const navigate = useNavigate()
  const canCreate = hasPermission(auth, 'user:create')
  const canEdit = hasPermission(auth, 'user:edit')

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loadedFilters, setLoadedFilters] = useState({
    search: '',
    roleId: '',
    departmentId: '',
    teamId: '',
    status: '',
  })
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [filters, setFilters] = useState({
    search: readUrlSearchQuery(location.search),
    roleId: '',
    departmentId: '',
    teamId: '',
    status: '',
  })
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<UserForm>(EMPTY_FORM)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const photoPreviewUrl = useRef('')
  const detailRequestId = useRef(0)
  const syncedSearch = useRef(false)
  const pendingEditId = useRef<string | null>(null)
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [formSaving, setFormSaving] = useState(false)
  const [statusPrompt, setStatusPrompt] = useState<{ user: AdminUser; nextStatus: UserStatus } | null>(null)
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [statusFlashId, setStatusFlashId] = useState<string | null>(null)
  const statusFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [listUsers] = useLazyListUsersQuery()
  const [getUser] = useLazyGetUserQuery()
  const [createUser] = useCreateUserMutation()
  const [updateUser] = useUpdateUserMutation()
  const [updateUserStatus] = useUpdateUserStatusMutation()
  const [adminPasswordReset] = useAdminPasswordResetMutation()
  const [listRoleOptions] = useLazyListRoleOptionsQuery()
  const [listDepartments] = useLazyListDepartmentsQuery()

  const filterTeams = useMemo(() => {
    if (filters.departmentId) {
      return departments.find((item) => item.id === filters.departmentId)?.teams ?? []
    }
    return departments.flatMap((item) => item.teams)
  }, [departments, filters.departmentId])

  const formTeams = useMemo(
    () => departments.find((item) => item.id === form.departmentId)?.teams ?? [],
    [departments, form.departmentId],
  )

  function clearPhotoPreview() {
    if (photoPreviewUrl.current.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreviewUrl.current)
    }
    photoPreviewUrl.current = ''
    setPhotoPreview('')
    setPhotoFile(null)
  }

  function applyPhotoPreview(url: string) {
    if (photoPreviewUrl.current.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreviewUrl.current)
    }
    photoPreviewUrl.current = url
    setPhotoPreview(url)
  }

  function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null
    event.target.value = ''
    if (!file) {
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile photo must be 5 MB or smaller.')
      return
    }
    setPhotoFile(file)
    applyPhotoPreview(URL.createObjectURL(file))
  }

  async function loadList(options?: { silent?: boolean; fromSearch?: boolean; search?: string }) {
    if (!options?.silent) {
      setLoading(true)
    }
    if (options?.fromSearch) {
      setSearching(true)
    }
    const query = {
      search: (options?.search ?? filters.search).trim(),
      roleId: filters.roleId,
      departmentId: filters.departmentId,
      teamId: filters.teamId,
      status: filters.status,
    }
    try {
      const data = await listUsers({
        search: query.search || undefined,
        roleId: query.roleId || undefined,
        departmentId: query.departmentId || undefined,
        teamId: query.teamId || undefined,
        status: query.status || undefined,
      }).unwrap()
      setUsers(data.users)
      setLoadedFilters(query)
    } catch (err) {
      showApiError(err, 'Unable to load users.')
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
      if (options?.fromSearch) {
        setSearching(false)
      }
    }
  }

  useEffect(() => {
    void listRoleOptions()
      .unwrap()
      .then((data) => setRoles(data.roles))
      .catch(() => undefined)
    void listDepartments()
      .unwrap()
      .then((data) => setDepartments(data.departments))
      .catch(() => undefined)
  }, [listRoleOptions, listDepartments])

  useEffect(() => {
    void loadList(readUrlSearchQuery(location.search) ? { fromSearch: true, search: readUrlSearchQuery(location.search) } : undefined)
  }, [filters.roleId, filters.departmentId, filters.teamId, filters.status])

  useEffect(() => {
    const next = readUrlSearchQuery(location.search)
    setFilters((current) => (current.search === next ? current : { ...current, search: next }))
    if (syncedSearch.current) {
      void loadList({ fromSearch: Boolean(next), search: next })
    }
    syncedSearch.current = true
  }, [location.search])

  useEffect(
    () => () => {
      if (statusFlashTimer.current) {
        clearTimeout(statusFlashTimer.current)
      }
      if (photoPreviewUrl.current.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreviewUrl.current)
      }
    },
    [],
  )

  async function openCreate() {
    setEditingId(null)
    setSelected(null)
    setForm({ ...EMPTY_FORM, roleId: roles.find((role) => role.status === 'ACTIVE')?.id || '', username: '', password: '' })
    clearPhotoPreview()
    setFormSaving(false)
    setFormOpen(true)
  }

  async function openUser(user: AdminUser) {
    const requestId = detailRequestId.current + 1
    detailRequestId.current = requestId
    setEditingId(user.id)
    setForm(formFromUser(user))
    setSelected(user)
    setFormOpen(true)
    setPhotoFile(null)
    applyPhotoPreview(userPhotoSrc(user.photoUrl))

    try {
      const detailData = await getUser(user.id).unwrap()
      if (detailRequestId.current !== requestId) {
        return
      }

      const detail = detailData.user
      setForm(formFromUser(detail))
      setSelected(detail)
      if (!photoPreviewUrl.current.startsWith('blob:')) {
        applyPhotoPreview(userPhotoSrc(detail.photoUrl))
      }
    } catch (err) {
      if (detailRequestId.current !== requestId) {
        return
      }
      showApiError(err, 'Unable to load user.')
    }
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (formSaving) {
      return
    }
    if (!form.roleId) {
      toast.error('Please select a role.')
      return
    }
    const payload: UserPayload = {
      fullName: form.fullName,
      email: form.email,
      mobile: form.mobile,
      username: form.username,
      roleId: form.roleId,
      departmentId: form.departmentId || null,
      teamId: form.teamId || null,
      status: form.status,
    }
    if (!editingId && form.password) {
      payload.password = form.password
    }

    setFormSaving(true)
    try {
      const body = photoFile ? userPayloadForm(payload, photoFile) : payload
      const data = editingId
        ? await updateUser({ id: editingId, body }).unwrap()
        : await createUser({ body }).unwrap()

      if (data.reset?.inviteSent) {
        const email = data.reset.email || form.email
        const extra = data.reset.devResetPath ? ` Dev setup link: ${data.reset.devResetPath}` : ''
        toast.success(
          editingId
            ? `User updated. Setup invite sent to ${email}.${extra}`
            : `User created. Setup invite sent to ${email}.${extra}`,
        )
      } else if (!editingId && data.reset?.devResetPath) {
        toast.success(`User created. Dev setup link: ${data.reset.devResetPath}`)
      } else {
        toast.success(editingId ? 'User updated.' : 'User created.')
      }
      if (editingId === auth.user.id && data.user) {
        const saved = data.user
        patchCurrentAuthUser({
          fullName: saved.fullName,
          email: saved.email,
          username: saved.username,
          mobile: saved.mobile,
          photoUrl: saved.photoUrl
            ? `${saved.photoUrl}${saved.photoUrl.includes('?') ? '&' : '?'}v=${Date.now()}`
            : null,
          status: saved.status,
        })
      }
      await loadList()
      setFormSaving(false)
      closeForm()
    } catch (err) {
      setFormSaving(false)
      showApiError(err, 'Unable to save user.')
    }
  }

  function flashStatusRow(userId: string) {
    setStatusFlashId(userId)
    if (statusFlashTimer.current) {
      clearTimeout(statusFlashTimer.current)
    }
    statusFlashTimer.current = setTimeout(() => setStatusFlashId(null), 1600)
  }

  async function changeStatus(user: AdminUser, status: UserStatus) {
    if (statusSaving || statusUpdatingId) {
      return
    }
    setStatusSaving(true)
    setStatusUpdatingId(user.id)
    try {
      const data = await updateUserStatus({ id: user.id, status }).unwrap()
      const updated = data.user
      const nextStatus = updated?.status || status
      setUsers((current) =>
        current.map((item) => (item.id === user.id ? { ...item, ...(updated || {}), status: nextStatus } : item)),
      )
      if (selected?.id === user.id) {
        setSelected(updated || { ...selected, status: nextStatus })
        setForm((current) => ({ ...current, status: nextStatus }))
      }

      const copy = statusChangeCopy(user, nextStatus)
      const hiddenByFilter = Boolean(filters.status && filters.status !== nextStatus)
      toast.success(hiddenByFilter ? `${copy.success} Hidden by the current status filter.` : copy.success)
      flashStatusRow(user.id)
      setStatusPrompt(null)
      await loadList({ silent: true })
    } catch (err) {
      showApiError(err, 'Unable to update status.')
    }
    setStatusSaving(false)
    setStatusUpdatingId(null)
  }

  function closeForm() {
    detailRequestId.current += 1
    setFormOpen(false)
    clearPhotoPreview()
  }

  useEffect(() => {
    const editUserId = (location.state as { editUserId?: string } | null)?.editUserId
    if (!editUserId) {
      return
    }
    pendingEditId.current = editUserId
    navigate(`${location.pathname}${location.search}`, { replace: true, state: {} })
  }, [location.state, location.pathname, location.search, navigate])

  useEffect(() => {
    const editUserId = pendingEditId.current
    if (!editUserId || loading || users.length === 0) {
      return
    }
    const user = users.find((item) => item.id === editUserId)
    pendingEditId.current = null
    if (user && canEdit) {
      void openUser(user)
    }
  }, [users, loading, canEdit])

  return (
    <div className={`${adminPage}`}>
      <PageMeta
        title="Users"
        description="Create CRM users, assign roles, control login access, and manage account status."
      />
      <PageHeader
        title="Users"
        subtitle="Create users, assign roles, and control login access."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Users' }]}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <ExportActions
              title="Users"
              path={`/users/export${toQuery({
                search: loadedFilters.search.trim() || undefined,
                roleId: loadedFilters.roleId || undefined,
                departmentId: loadedFilters.departmentId || undefined,
                teamId: loadedFilters.teamId || undefined,
                status: loadedFilters.status || undefined,
              })}`}
            />
            {canCreate ? <PrimaryButton onClick={() => void openCreate()} label="Create User" /> : null}
          </div>
        }
      />

      <section className={`${adminFilters}`}>
        <FormInput.Search
          allowClear
          enterButton="Search"
          loading={searching}
          placeholder="Search name, email, username"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          onSearch={() => {
            void loadList({ fromSearch: true })
          }}
        />
        <FormSelect
          allowClear
          placeholder="All roles"
          value={filters.roleId || undefined}
          options={roles
            .filter((role) => role.status === 'ACTIVE' || role.id === filters.roleId)
            .map((role) => ({ value: role.id, label: role.name }))}
          onChange={(value) => setFilters((current) => ({ ...current, roleId: asSelectString(value) }))}
        />
        <FormSelect
          allowClear
          placeholder="All departments"
          value={filters.departmentId || undefined}
          options={departments.map((item) => ({ value: item.id, label: item.name }))}
          onChange={(value) =>
            setFilters((current) => ({ ...current, departmentId: asSelectString(value), teamId: '' }))
          }
        />
        <FormSelect
          allowClear
          disabled={!filters.departmentId}
          placeholder={filters.departmentId ? 'All teams' : 'Select department first'}
          value={filters.teamId || undefined}
          options={filterTeams.map((item) => ({ value: item.id, label: item.name }))}
          onChange={(value) => setFilters((current) => ({ ...current, teamId: asSelectString(value) }))}
        />
        <FormSelect
          allowClear
          placeholder="All statuses"
          value={filters.status || undefined}
          options={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INVITED', label: 'Invited' },
            { value: 'INACTIVE', label: 'Inactive' },
            { value: 'SUSPENDED', label: 'Suspended' },
          ]}
          onChange={(value) => setFilters((current) => ({ ...current, status: asSelectString(value) }))}
        />
      </section>

      <section className={`${adminCard} ${tableWrap}`}>
        <Spin spinning={loading}>
          <table className={`${adminTable}`}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Team</th>
                <th>Status</th>
                <th>Created at</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7}>No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className={statusFlashId === user.id ? adminTableRowStatusUpdated : undefined}
                    onClick={() => {
                      navigate(`/users/${user.id}`)
                    }}
                  >
                    <td>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <UserAvatar name={user.fullName} photoUrl={user.photoUrl} className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-[0.72rem] font-bold text-on-primary [&_img]:h-full [&_img]:w-full [&_img]:object-cover" />
                        <div>
                          <strong>{user.fullName}</strong>
                          <div className={`${muted}`}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.role?.name || '—'}</td>
                    <td>{user.department?.name || '—'}</td>
                    <td>{user.team?.name || '—'}</td>
                    <td onClick={(event) => event.stopPropagation()}>
                      {user.status === 'INVITED' ? (
                        <span className={userStatusPillClass(user.status)}>{statusLabel(user.status)}</span>
                      ) : (
                        <FormSwitch
                          checked={user.status === 'ACTIVE'}
                          checkedChildren="Active"
                          unCheckedChildren={user.status === 'SUSPENDED' ? 'Suspended' : 'Inactive'}
                          disabled={!canEdit}
                          loading={statusUpdatingId === user.id}
                          onChange={(checked) => {
                            void changeStatus(user, checked ? 'ACTIVE' : 'INACTIVE')
                          }}
                        />
                      )}
                    </td>
                    <td>{formatPrettyDate(user.createdAt)}</td>
                    <td className={`${rowActions}`} onClick={(event) => event.stopPropagation()}>
                      <RowActionMenu
                        items={(
                          [
                            {
                              key: 'view',
                              label: 'View',
                              icon: <ActionIcon icon={ViewIcon} />,
                              onSelect: () => {
                                navigate(`/users/${user.id}`)
                              },
                            },
                            canEdit
                              ? {
                                  key: 'edit',
                                  label: 'Edit',
                                  icon: <ActionIcon icon={PencilEdit02Icon} />,
                                  onSelect: () => {
                                    void openUser(user)
                                  },
                                }
                              : null,
                            canEdit && user.status === 'INVITED'
                              ? {
                                  key: 'resend-invite',
                                  label: 'Resend invite',
                                  icon: <ActionIcon icon={Mail01Icon} />,
                                  onSelect: () => {
                                    void (async () => {
                                      try {
                                        const data = await adminPasswordReset(user.id).unwrap()
                                        toast.success(
                                          data.devResetPath
                                            ? `Invite resent. Dev link: ${data.devResetPath}`
                                            : data.message || 'Invite email resent.',
                                        )
                                      } catch (err) {
                                        showApiError(err, 'Unable to resend invite.')
                                      }
                                    })()
                                  },
                                }
                              : null,
                            canEdit && user.status !== 'ACTIVE' && user.status !== 'INVITED'
                              ? {
                                  key: 'activate',
                                  label: 'Activate User',
                                  icon: <ActionIcon icon={UserCheck01Icon} />,
                                  onSelect: () => {
                                    setStatusPrompt({ user, nextStatus: 'ACTIVE' })
                                  },
                                }
                              : null,
                            canEdit && user.status === 'ACTIVE'
                              ? {
                                  key: 'deactivate',
                                  label: 'Deactivate',
                                  icon: <ActionIcon icon={UserBlock01Icon} />,
                                  onSelect: () => {
                                    setStatusPrompt({ user, nextStatus: 'INACTIVE' })
                                  },
                                }
                              : null,
                            canEdit && user.status !== 'SUSPENDED'
                              ? {
                                  key: 'suspend',
                                  label: 'Suspend',
                                  icon: <ActionIcon icon={PauseIcon} />,
                                  danger: true,
                                  onSelect: () => {
                                    setStatusPrompt({ user, nextStatus: 'SUSPENDED' })
                                  },
                                }
                              : null,
                          ] satisfies Array<RowActionItem | null>
                        ).filter((item) => item !== null)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Spin>
      </section>

      {formOpen
        ? createPortal(
            <div className={`${modalBackdrop}`} onClick={closeForm}>
              <div
                className={modalPanel}
                role="dialog"
                aria-modal="true"
                aria-labelledby="user-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className={`${modalHeader}`}>
                  <h3 id="user-modal-title">{editingId ? 'Edit User' : 'Create User'}</h3>
                  <PrimaryButton type="button" className={`${modalClose}`} aria-label="Close" onClick={closeForm} icon={<HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />} />
                </div>
                <form
                  className={`${adminForm}`}
                  autoComplete="off"
                  onSubmit={(event) => {
                    void saveUser(event)
                  }}
                >
                  {editingId ? null : (
                    <div className="sr-only" aria-hidden>
                      <input type="text" name="username" autoComplete="username" tabIndex={-1} defaultValue="" />
                      <input type="password" name="password" autoComplete="current-password" tabIndex={-1} defaultValue="" />
                    </div>
                  )}
                  <fieldset className={`${adminFormFields}`} disabled={formSaving}>
              <div className={`${photoUpload} ${adminFormSpan}`}>
                <div className={`${photoPicker}`}>
                  <input
                    id="user-photo"
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onPhotoChange}
                  />
                  <label htmlFor="user-photo" className={`${photoPickerButton}`}>
                    <span className={photoPreviewFrame}>
                      {photoPreview ? (
                        <img src={photoPreview} alt="" />
                      ) : (
                        <HugeiconsIcon icon={UserIcon} size={52} color="currentColor" strokeWidth={1.5} />
                      )}
                    </span>
                    <span className={`${photoCameraBadge}`} aria-hidden>
                      <HugeiconsIcon icon={Camera01Icon} size={16} color="currentColor" strokeWidth={1.8} />
                    </span>
                    <span className="sr-only">Upload profile image</span>
                  </label>
                </div>
                <p className={`${fieldHint}`}>Profile image · JPG, PNG, or WEBP. Max 5 MB.</p>
              </div>
              <label>
                <FieldLabel required>Full Name</FieldLabel>
                <FormInput
                  value={form.fullName}
                  autoComplete="off"
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </label>
              <label>
                <span className="inline-flex items-center gap-1.5">
                  <FieldLabel required>Email</FieldLabel>
                  {editingId && form.status !== 'INVITED' ? (
                    <Tooltip title="Email cannot be changed after the account is enabled.">
                      <span
                        className="inline-flex text-[#8b97a8]"
                        onClick={(event) => event.preventDefault()}
                      >
                        <HugeiconsIcon
                          icon={InformationCircleIcon}
                          size={14}
                          color="currentColor"
                          strokeWidth={1.8}
                        />
                      </span>
                    </Tooltip>
                  ) : null}
                </span>
                <FormInput
                  type="email"
                  value={form.email}
                  autoComplete="off"
                  disabled={Boolean(editingId) && form.status !== 'INVITED'}
                  readOnly={Boolean(editingId) && form.status !== 'INVITED'}
                  onChange={(event) => {
                    if (editingId && form.status !== 'INVITED') {
                      return
                    }
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }}
                  required
                />
                {editingId && form.status === 'INVITED' ? (
                  <p className={`${fieldHint}`}>
                    While invited, changing email sends a new setup invite to the new address.
                  </p>
                ) : null}
              </label>
              <label>
                <FieldLabel required>Mobile</FieldLabel>
                <FormInput
                  value={form.mobile}
                  autoComplete="off"
                  onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))}
                  required
                />
              </label>
              <label>
                <FieldLabel required>Username</FieldLabel>
                <FormInput
                  value={form.username}
                  autoComplete="off"
                  readOnly={!editingId}
                  onFocus={(event) => {
                    event.currentTarget.readOnly = false
                  }}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  required
                />
              </label>
              {editingId ? null : (
                <label>
                  <FieldLabel>Password (optional)</FieldLabel>
                  <FormInput.Password
                    value={form.password}
                    autoComplete="new-password"
                    readOnly
                    onFocus={(event) => {
                      event.currentTarget.readOnly = false
                    }}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Leave blank to email a secure setup invite"
                  />
                  <p className={`${fieldHint}`}>
                    Leave blank for the industrial invite flow. The user starts as Invited and sets their own password.
                  </p>
                </label>
              )}
              <label>
                <FieldLabel required>Role</FieldLabel>
                <FormSelect
                  placeholder="Select role"
                  value={form.roleId || undefined}
                  options={roles
                    .filter((role) => role.status === 'ACTIVE' || role.id === form.roleId)
                    .map((role) => ({ value: role.id, label: role.name }))}
                  onChange={(value) => setForm((current) => ({ ...current, roleId: asSelectString(value) }))}
                />
              </label>
              <label>
                <FieldLabel>Department</FieldLabel>
                <FormSelect
                  allowClear
                  placeholder="None"
                  value={form.departmentId || undefined}
                  options={departments.map((item) => ({ value: item.id, label: item.name }))}
                  onChange={(value) => setForm((current) => ({ ...current, departmentId: asSelectString(value), teamId: '' }))}
                />
              </label>
              <label>
                <FieldLabel>Team</FieldLabel>
                <FormSelect
                  allowClear
                  disabled={!form.departmentId}
                  placeholder={form.departmentId ? 'None' : 'Select department first'}
                  value={form.teamId || undefined}
                  options={formTeams.map((item) => ({ value: item.id, label: item.name }))}
                  onChange={(value) => setForm((current) => ({ ...current, teamId: asSelectString(value) }))}
                />
              </label>
              <label>
                <FieldLabel required>Status</FieldLabel>
                <FormSelect
                  value={form.status}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' },
                    { value: 'SUSPENDED', label: 'Suspended' },
                  ]}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, status: (asSelectString(value) || 'ACTIVE') as UserStatus }))
                  }
                />
              </label>
              </fieldset>
              <div className={`${formActions}`}>
                <PrimaryButton type="submit" loading={formSaving} label={editingId ? 'Save User' : 'Create User'} />
                <PrimaryButton type="button" variant="outline" onClick={closeForm} disabled={formSaving} label="Cancel" />
              </div>
            </form>
              </div>
            </div>,
            document.body,
          )
        : null}

      {statusPrompt
        ? createPortal(
            <div
              className={`${modalBackdrop}`}
              onClick={() => {
                if (!statusSaving) {
                  setStatusPrompt(null)
                }
              }}
            >
              <div
                className={`${modalPanel} ${statusConfirmPanel}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="status-confirm-title"
                onClick={(event) => event.stopPropagation()}
              >
                {(() => {
                  const copy = statusChangeCopy(statusPrompt.user, statusPrompt.nextStatus)
                  return (
                    <>
                      <div className={`${modalHeader}`}>
                        <h3 id="status-confirm-title">{copy.title}</h3>
                        <PrimaryButton
                          type="button"
                          className={`${modalClose}`}
                          aria-label="Close"
                          disabled={statusSaving}
                          onClick={() => setStatusPrompt(null)} icon={<HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />} />
                      </div>
                      <p className={`${statusConfirmCopy}`}>{copy.body}</p>
                      <p className={`${statusConfirmMeta}`}>
                        Current status: <strong>{statusLabel(statusPrompt.user.status)}</strong>
                        {' → '}
                        New status: <strong>{statusLabel(statusPrompt.nextStatus)}</strong>
                      </p>
                      <div className={`${formActions}`}>
                        <PrimaryButton
                          loading={statusSaving}
                          className={statusPrompt.nextStatus === 'SUSPENDED' ? 'ui-btn-danger' : undefined}
                          onClick={() => void changeStatus(statusPrompt.user, statusPrompt.nextStatus)} label={copy.confirm} />
                        <PrimaryButton
                          type="button"
                          variant="outline"
                          disabled={statusSaving}
                          onClick={() => setStatusPrompt(null)} label="Cancel" />
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>,
            document.body,
          )
        : null}

    </div>
  )
}
