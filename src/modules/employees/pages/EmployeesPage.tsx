import {
  adminBanner,
  adminCard,
  adminEmpty,
  adminFilters,
  adminFiltersEmployees,
  adminForm,
  adminPage,
  adminTable,
  appToastClass,
  crmAccessPillClass,
  employeeAvatar,
  employeeAvatarLg,
  employeeAvatarSm,
  fieldLabelClass,
  formActions,
  linkBtn,
  modalBackdrop,
  modalClose,
  modalHeader,
  modalPanel,
  muted,
  rowActions,
  statusConfirmCopy,
  statusConfirmMeta,
  statusConfirmPanel,
  tableWrap,
  adminTableRowStatusUpdated,
} from '../../../styles/admin'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import {
  useLazyListEmployeeOptionsQuery,
  useLazyListEmployeesQuery,
  useUpdateEmployeeStatusMutation,
} from '@/redux/features/employees/employeesApi'
import { getApiError } from '@/lib/api'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Cancel01Icon,
  File01Icon,
  PencilEdit02Icon,
  UserCheck01Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { Spin } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { PrimaryButton } from '@/components/ui'
import { FormDatePicker, FormInput, FormSelect, FormSwitch, FormTextArea } from '@/components/common/Forms'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { RowActionMenu, type RowActionItem } from '@/components/common/Dropdowns'
import { hasPermission } from '../../../lib/access'
import { readUrlSearchQuery } from '@/lib/url'
import type {
  AuthSession,
  EmployeeCrmAccess,
  EmployeeOptions,
  EmployeeRecord,
} from '../../../types'
type ToastState = { text: string; type: 'success' | 'error' }

type Filters = {
  search: string
  departmentId: string
  teamId: string
  designationId: string
  roleId: string
  employmentTypeId: string
  employmentStatusId: string
  reportingManagerId: string
  joiningFrom: string
  joiningTo: string
}

const EMPTY_FILTERS: Filters = {
  search: '',
  departmentId: '',
  teamId: '',
  designationId: '',
  roleId: '',
  employmentTypeId: '',
  employmentStatusId: '',
  reportingManagerId: '',
  joiningFrom: '',
  joiningTo: '',
}

const EMPTY_OPTIONS: EmployeeOptions = {
  departments: [],
  designations: [],
  employmentTypes: [],
  employmentStatuses: [],
  roles: [],
  managers: [],
}

function ActionIcon({ icon }: { icon: IconSvgElement }) {
  return <HugeiconsIcon icon={icon} size={16} color="currentColor" strokeWidth={1.5} />
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return <span className={fieldLabelClass(required)}>{children}</span>
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

function employeeInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return 'E'
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function formatJoiningDate(value?: string | null) {
  if (!value) {
    return '—'
  }
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) {
    return '—'
  }
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function crmAccessLabel(access: EmployeeCrmAccess) {
  if (access === 'ENABLED') {
    return 'Enabled'
  }
  if (access === 'INVITED') {
    return 'Invited'
  }
  if (access === 'DISABLED') {
    return 'Disabled'
  }
  return 'No access'
}

function employeePhotoSrc(employeeId: string, photoUrl?: string | null) {
  if (!photoUrl) {
    return ''
  }
  if (photoUrl.startsWith('http') || photoUrl.startsWith('/')) {
    return photoUrl
  }
  return `/api/employees/${employeeId}/photo`
}

function EmployeeAvatar({
  name,
  employeeId,
  photoUrl,
  size = 'sm',
}: {
  name: string
  employeeId: string
  photoUrl?: string | null
  size?: 'sm' | 'lg'
}) {
  const src = employeePhotoSrc(employeeId, photoUrl)
  if (src) {
    return <img className={`${employeeAvatar} ${size === 'lg' ? employeeAvatarLg : employeeAvatarSm}`} src={src} alt="" />
  }
  return (
    <span className={`${employeeAvatar} ${size === 'lg' ? employeeAvatarLg : employeeAvatarSm}`}>
      {employeeInitials(name)}
    </span>
  )
}

export default function EmployeesPage() {
  const auth = useOutletContext<AuthSession>()
  const navigate = useNavigate()
  const location = useLocation()
  const canCreate = hasPermission(auth, 'employee:create')
  const canEdit = hasPermission(auth, 'employee:edit')
  const canManageEmployeeDocs = hasPermission(auth, 'employee_document:manage')

  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [options, setOptions] = useState<EmployeeOptions>(EMPTY_OPTIONS)
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    search: readUrlSearchQuery(location.search),
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  type StatusPrompt = {
    employee: EmployeeRecord
    nextStatusId: string
    resignationDate: string
    terminationDate: string
    terminationReason: string
    terminationRemarks: string
    rejoiningDate: string
  }
  const [statusPrompt, setStatusPrompt] = useState<StatusPrompt | null>(null)
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [statusFlashId, setStatusFlashId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const statusFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncedSearch = useRef(false)
  const [listEmployeeOptions] = useLazyListEmployeeOptionsQuery()
  const [listEmployees] = useLazyListEmployeesQuery()
  const [updateEmployeeStatus] = useUpdateEmployeeStatusMutation()

  const filterTeams = useMemo(() => {
    if (filters.departmentId) {
      return options.departments.find((item) => item.id === filters.departmentId)?.teams ?? []
    }
    return options.departments.flatMap((item) => item.teams)
  }, [filters.departmentId, options.departments])
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => key !== 'search' && Boolean(value)) || Boolean(filters.search.trim())
  const filterSignature = [
    filters.departmentId,
    filters.teamId,
    filters.designationId,
    filters.roleId,
    filters.employmentTypeId,
    filters.employmentStatusId,
    filters.reportingManagerId,
    filters.joiningFrom,
    filters.joiningTo,
  ].join('|')

  function showToast(text: string, type: ToastState['type'] = 'success') {
    setToast({ text, type })
    if (toastTimer.current) {
      clearTimeout(toastTimer.current)
    }
    toastTimer.current = setTimeout(() => setToast(null), 2800)
  }

  useEffect(() => {
    const text = (location.state as { toast?: string } | null)?.toast
    if (!text) {
      return
    }
    showToast(text)
    navigate('.', { replace: true, state: {} })
  }, [location.state, navigate])

  function flashStatusRow(id: string) {
    setStatusFlashId(id)
    if (statusFlashTimer.current) {
      clearTimeout(statusFlashTimer.current)
    }
    statusFlashTimer.current = setTimeout(() => setStatusFlashId(null), 1200)
  }

  async function loadOptions() {
    try {
      const data = await listEmployeeOptions().unwrap()
      setOptions(data)
    } catch {
      // keep previous options
    }
  }

  async function loadList(opts?: { silent?: boolean; search?: string }) {
    if (!opts?.silent) {
      setLoading(true)
    }
    try {
      const data = await listEmployees({
        search: (opts?.search ?? filters.search).trim() || undefined,
        departmentId: filters.departmentId || undefined,
        teamId: filters.teamId || undefined,
        designationId: filters.designationId || undefined,
        roleId: filters.roleId || undefined,
        employmentTypeId: filters.employmentTypeId || undefined,
        employmentStatusId: filters.employmentStatusId || undefined,
        reportingManagerId: filters.reportingManagerId || undefined,
        joiningFrom: filters.joiningFrom || undefined,
        joiningTo: filters.joiningTo || undefined,
      }).unwrap()
      setEmployees(data.employees)
      setError('')
    } catch (err) {
      setError(getApiError(err, 'Unable to load employees.'))
    }
    if (!opts?.silent) {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOptions()
  }, [])

  useEffect(() => {
    void loadList()
  }, [filterSignature])

  useEffect(() => {
    const next = readUrlSearchQuery(location.search)
    setFilters((current) => (current.search === next ? current : { ...current, search: next }))
    if (syncedSearch.current) {
      void loadList({ search: next })
    }
    syncedSearch.current = true
  }, [location.search])

  useEffect(
    () => () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current)
      }
      if (statusFlashTimer.current) {
        clearTimeout(statusFlashTimer.current)
      }
    },
    [],
  )

  function openCreate() {
    navigate('/employees/new')
  }

  function openEmployee(employee: EmployeeRecord) {
    navigate(`/employees/${employee.id}`)
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
  }

  function openStatusPrompt(employee: EmployeeRecord, nextStatusId?: string) {
    setStatusPrompt({
      employee,
      nextStatusId:
        nextStatusId ||
        options.employmentStatuses.find((item) => item.id !== employee.employmentStatus?.id)?.id ||
        employee.employmentStatus?.id ||
        '',
      resignationDate: employee.resignationDate || dayjs().format('YYYY-MM-DD'),
      terminationDate: employee.terminationDate || dayjs().format('YYYY-MM-DD'),
      terminationReason: employee.terminationReason || '',
      terminationRemarks: employee.terminationRemarks || '',
      rejoiningDate: employee.rejoiningDate || dayjs().format('YYYY-MM-DD'),
    })
  }

  async function toggleEmploymentStatus(employee: EmployeeRecord, next: 'ACTIVE' | 'INACTIVE') {
    if (statusUpdatingId || statusSaving) {
      return
    }
    const previousCode = employee.employmentStatus?.code || ''
    if (next === 'ACTIVE' && ['RESIGNED', 'TERMINATED', 'INACTIVE'].includes(previousCode)) {
      const activeId = options.employmentStatuses.find((item) => item.code === 'ACTIVE')?.id
      openStatusPrompt(employee, activeId)
      return
    }
    setStatusUpdatingId(employee.id)
    try {
      const data = await updateEmployeeStatus({ id: employee.id, body: { status: next } }).unwrap()
      const nextName = data.employee.employmentStatus?.name || (next === 'ACTIVE' ? 'Active' : 'Inactive')
      showToast(`${employee.fullName} is now ${nextName}.`)
      flashStatusRow(employee.id)
      await Promise.all([loadList({ silent: true }), loadOptions()])
    } catch (err) {
      showToast(getApiError(err, 'Unable to change status.'), 'error')
    }
    setStatusUpdatingId(null)
  }

  async function changeStatus() {
    if (!statusPrompt) {
      return
    }
    setStatusSaving(true)
    try {
      const data = await updateEmployeeStatus({
        id: statusPrompt.employee.id,
        body: {
          employmentStatusId: statusPrompt.nextStatusId,
          resignationDate: statusPrompt.resignationDate || undefined,
          terminationDate: statusPrompt.terminationDate || undefined,
          terminationReason: statusPrompt.terminationReason || undefined,
          terminationRemarks: statusPrompt.terminationRemarks || undefined,
          rejoiningDate: statusPrompt.rejoiningDate || undefined,
        },
      }).unwrap()
      const nextName = data.employee.employmentStatus?.name || 'updated'
      showToast(`${statusPrompt.employee.fullName} is now ${nextName}.`)
      flashStatusRow(statusPrompt.employee.id)
      setStatusPrompt(null)
      await Promise.all([loadList({ silent: true }), loadOptions()])
    } catch (err) {
      showToast(getApiError(err, 'Unable to change status.'), 'error')
    }
    setStatusSaving(false)
  }

  const promptStatus = statusPrompt
    ? options.employmentStatuses.find((item) => item.id === statusPrompt.nextStatusId)
    : null
  const promptPreviousCode = statusPrompt?.employee.employmentStatus?.code || ''
  const promptIsRejoining =
    Boolean(promptStatus) &&
    ['RESIGNED', 'TERMINATED', 'INACTIVE'].includes(promptPreviousCode) &&
    ['ACTIVE', 'PROBATION'].includes(promptStatus?.code || '')

  return (
    <div className={`${adminPage}`}>
      <PageMeta
        title="Employees"
        description="Manage employee profiles, designations, departments, CRM access, and employment status."
      />
      <PageHeader
        title="Employees"
        subtitle="Manage employee records, assignments, and employment status."
        breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: 'Employees' }]}
        extra={canCreate ? <PrimaryButton onClick={openCreate} label="Create Employee" /> : undefined}
      />

      <section className={`${adminFilters} ${adminFiltersEmployees}`}>
        <FormInput.Search
          allowClear
          enterButton="Search"
          loading={loading}
          placeholder="Search ID, name, mobile, email, designation, department, team, or role"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          onSearch={() => {
            void loadList()
          }}
        />
        <FormSelect
          allowClear
          placeholder="All departments"
          value={filters.departmentId || undefined}
          options={options.departments.map((item) => ({ value: item.id, label: item.name }))}
          onChange={(value) =>
            setFilters((current) => ({ ...current, departmentId: asSelectString(value), teamId: '' }))
          }
        />
        <FormSelect
          allowClear
          placeholder="All teams"
          value={filters.teamId || undefined}
          options={filterTeams.map((item) => ({ value: item.id, label: item.name }))}
          onChange={(value) => setFilters((current) => ({ ...current, teamId: asSelectString(value) }))}
        />
        <FormSelect
          allowClear
          placeholder="All designations"
          value={filters.designationId || undefined}
          options={options.designations.map((item) => ({ value: item.id, label: item.name }))}
          onChange={(value) => setFilters((current) => ({ ...current, designationId: asSelectString(value) }))}
        />
        <FormSelect
          allowClear
          placeholder="All roles"
          value={filters.roleId || undefined}
          options={options.roles.map((item) => ({ value: item.id, label: item.name }))}
          onChange={(value) => setFilters((current) => ({ ...current, roleId: asSelectString(value) }))}
        />
        <FormSelect
          allowClear
          placeholder="All employment types"
          value={filters.employmentTypeId || undefined}
          options={options.employmentTypes.map((item) => ({ value: item.id, label: item.name }))}
          onChange={(value) => setFilters((current) => ({ ...current, employmentTypeId: asSelectString(value) }))}
        />
        <FormSelect
          allowClear
          placeholder="All statuses"
          value={filters.employmentStatusId || undefined}
          options={options.employmentStatuses.map((item) => ({ value: item.id, label: item.name }))}
          onChange={(value) => setFilters((current) => ({ ...current, employmentStatusId: asSelectString(value) }))}
        />
        <FormDatePicker
          allowClear
          placeholder="Joined from"
          aria-label="Joining date from"
          value={toDayjs(filters.joiningFrom)}
          disabledDate={(current) => Boolean(filters.joiningTo && current.isAfter(dayjs(filters.joiningTo), 'day'))}
          onChange={(value) => setFilters((current) => ({ ...current, joiningFrom: toDateString(value) }))}
        />
        <FormDatePicker
          allowClear
          placeholder="Joined to"
          aria-label="Joining date to"
          value={toDayjs(filters.joiningTo)}
          disabledDate={(current) => Boolean(filters.joiningFrom && current.isBefore(dayjs(filters.joiningFrom), 'day'))}
          onChange={(value) => setFilters((current) => ({ ...current, joiningTo: toDateString(value) }))}
        />
        <FormSelect
          allowClear
          placeholder="All managers"
          value={filters.reportingManagerId || undefined}
          options={options.managers.map((item) => ({
            value: item.id,
            label: `${item.fullName} (${item.employeeCode})`,
          }))}
          onChange={(value) => setFilters((current) => ({ ...current, reportingManagerId: asSelectString(value) }))}
        />
        <PrimaryButton variant="outline" disabled={!hasActiveFilters} onClick={clearFilters} label="Clear filters" />
      </section>

      {error ? (
        <p className={`${adminBanner}`}>
          {error}{' '}
          <PrimaryButton type="button" className={`${linkBtn}`} onClick={() => void loadList()} label="Retry" />
        </p>
      ) : null}

      <section className={`${adminCard} ${tableWrap}`}>
        <Spin spinning={loading}>
          {!loading && employees.length === 0 ? (
            <div className={`${adminEmpty}`}>
              <strong>
                {error ? 'Unable to load employees' : hasActiveFilters ? 'No matching employees' : 'No employees yet'}
              </strong>
              <p>
                {error
                  ? error
                  : hasActiveFilters
                    ? 'Try a different search or clear the current filters.'
                    : 'Create an employee record to start managing staff in the CRM.'}
              </p>
              {error ? (
                <PrimaryButton variant="outline" onClick={() => void loadList()} label="Retry" />
              ) : hasActiveFilters ? (
                <PrimaryButton variant="outline" onClick={clearFilters} label="Clear filters" />
              ) : canCreate ? (
                <PrimaryButton onClick={openCreate} label="Create Employee" />
              ) : null}
            </div>
          ) : (
            <table className={`${adminTable} [&_th]:align-middle [&_th]:whitespace-nowrap [&_td]:align-middle [&_td]:whitespace-nowrap`}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Team</th>
                  <th>Employment Type</th>
                  <th>Reporting Manager</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th>CRM Access</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr
                    key={employee.id}
                    className={statusFlashId === employee.id ? adminTableRowStatusUpdated : undefined}
                    onClick={() => openEmployee(employee)}
                  >
                    <td>
                      <div className="flex min-w-[180px] items-center gap-2.5">
                        <EmployeeAvatar name={employee.fullName} employeeId={employee.id} photoUrl={employee.photoUrl} />
                        <div>
                          <div className="font-[650]">{employee.fullName}</div>
                          <div className={`${muted}`}>{employee.officialEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td>{employee.employeeCode}</td>
                    <td>{employee.designation?.name || '—'}</td>
                    <td>{employee.department?.name || '—'}</td>
                    <td>{employee.team?.name || '—'}</td>
                    <td>{employee.employmentType?.name || '—'}</td>
                    <td>
                      {employee.reportingManager ? (
                        <Link
                          className="font-[650] text-inherit no-underline hover:text-primary hover:underline"
                          to={`/employees/${employee.reportingManager.id}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {employee.reportingManager.fullName}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{formatJoiningDate(employee.joiningDate)}</td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <FormSwitch
                        checked={employee.employmentStatus?.code === 'ACTIVE'}
                        checkedChildren="Active"
                        unCheckedChildren={
                          employee.employmentStatus?.code === 'ACTIVE'
                            ? 'Inactive'
                            : employee.employmentStatus?.name || 'Inactive'
                        }
                        disabled={!canEdit}
                        loading={statusUpdatingId === employee.id}
                        onChange={(checked) => {
                          void toggleEmploymentStatus(employee, checked ? 'ACTIVE' : 'INACTIVE')
                        }}
                      />
                    </td>
                    <td>
                      <span className={crmAccessPillClass(employee.crmAccess.toLowerCase())}>
                        {crmAccessLabel(employee.crmAccess)}
                      </span>
                    </td>
                    <td className={`${rowActions}`} onClick={(event) => event.stopPropagation()}>
                      <RowActionMenu
                        items={(
                          [
                            {
                              key: 'view',
                              label: 'View',
                              icon: <ActionIcon icon={ViewIcon} />,
                              onSelect: () => {
                                openEmployee(employee)
                              },
                            },
                            canEdit
                              ? {
                                  key: 'edit',
                                  label: 'Edit',
                                  icon: <ActionIcon icon={PencilEdit02Icon} />,
                                  onSelect: () => {
                                    navigate(`/employees/${employee.id}/edit`)
                                  },
                                }
                              : null,
                            canEdit
                              ? {
                                  key: 'status',
                                  label: 'Change Status',
                                  icon: <ActionIcon icon={UserCheck01Icon} />,
                                  onSelect: () => openStatusPrompt(employee),
                                }
                              : null,
                            canManageEmployeeDocs
                              ? {
                                  key: 'documents',
                                  label: 'Manage Documents',
                                  icon: <ActionIcon icon={File01Icon} />,
                                  onSelect: () => {
                                    navigate(`/employees/${employee.id}/edit`)
                                  },
                                }
                              : null,
                          ] satisfies Array<RowActionItem | null>
                        ).filter((item) => item !== null)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Spin>
      </section>

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
                aria-labelledby="employee-status-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className={`${modalHeader}`}>
                  <h3 id="employee-status-title">Change Status</h3>
                  <PrimaryButton
                    type="button"
                    className={`${modalClose}`}
                    aria-label="Close"
                    disabled={statusSaving}
                    onClick={() => setStatusPrompt(null)} icon={<HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />} />
                </div>
                <p className={`${statusConfirmCopy}`}>
                  Update employment status for <strong>{statusPrompt.employee.fullName}</strong>.
                </p>
                <label className={`${adminForm}`}>
                  <FieldLabel required>New status</FieldLabel>
                  <FormSelect
                    value={statusPrompt.nextStatusId || undefined}
                    options={options.employmentStatuses.map((item) => ({ value: item.id, label: item.name }))}
                    onChange={(value) =>
                      setStatusPrompt((current) =>
                        current ? { ...current, nextStatusId: asSelectString(value) } : current,
                      )
                    }
                  />
                </label>
                {promptStatus?.code === 'RESIGNED' ? (
                  <label className={`${adminForm}`}>
                    <FieldLabel required>Resignation date</FieldLabel>
                    <FormDatePicker
                      value={toDayjs(statusPrompt.resignationDate)}
                      onChange={(value) =>
                        setStatusPrompt((current) =>
                          current ? { ...current, resignationDate: toDateString(value) } : current,
                        )
                      }
                    />
                  </label>
                ) : null}
                {promptStatus?.code === 'TERMINATED' ? (
                  <>
                    <label className={`${adminForm}`}>
                      <FieldLabel required>Termination date</FieldLabel>
                      <FormDatePicker
                        value={toDayjs(statusPrompt.terminationDate)}
                        onChange={(value) =>
                          setStatusPrompt((current) =>
                            current ? { ...current, terminationDate: toDateString(value) } : current,
                          )
                        }
                      />
                    </label>
                    <label className={`${adminForm}`}>
                      <FieldLabel required>Termination reason</FieldLabel>
                      <FormInput
                        value={statusPrompt.terminationReason}
                        onChange={(event) =>
                          setStatusPrompt((current) =>
                            current ? { ...current, terminationReason: event.target.value } : current,
                          )
                        }
                      />
                    </label>
                    <label className={`${adminForm}`}>
                      <FieldLabel>Remarks</FieldLabel>
                      <FormTextArea
                        rows={3}
                        value={statusPrompt.terminationRemarks}
                        onChange={(event) =>
                          setStatusPrompt((current) =>
                            current ? { ...current, terminationRemarks: event.target.value } : current,
                          )
                        }
                      />
                    </label>
                  </>
                ) : null}
                {promptIsRejoining ? (
                  <label className={`${adminForm}`}>
                    <FieldLabel required>Rejoining date</FieldLabel>
                    <FormDatePicker
                      value={toDayjs(statusPrompt.rejoiningDate)}
                      onChange={(value) =>
                        setStatusPrompt((current) =>
                          current ? { ...current, rejoiningDate: toDateString(value) } : current,
                        )
                      }
                    />
                  </label>
                ) : null}
                <p className={`${statusConfirmMeta}`}>
                  Current status: <strong>{statusPrompt.employee.employmentStatus?.name || '—'}</strong>
                  {promptStatus ? (
                    <>
                      {' → '}
                      New status: <strong>{promptStatus.name}</strong>
                    </>
                  ) : null}
                  {['INACTIVE', 'RESIGNED', 'TERMINATED'].includes(promptStatus?.code || '')
                    ? ' · Linked CRM login will be disabled.'
                    : null}
                  {promptIsRejoining ? ' · Employee ID stays the same. CRM login may be restored.' : null}
                </p>
                <div className={`${formActions}`}>
                  <PrimaryButton loading={statusSaving} disabled={!statusPrompt.nextStatusId} onClick={() => void changeStatus()} label="Change Status" />
                  <PrimaryButton type="button" variant="outline" disabled={statusSaving} onClick={() => setStatusPrompt(null)} label="Cancel" />
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
