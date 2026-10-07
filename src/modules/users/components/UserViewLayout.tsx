import {
  formActions,
  muted,
  scopeGrid,
  scopeSkeleton,
  sessionRow,
  userStatusPillClass,
  userViewActivity,
  userViewActivityIcon,
  userViewActivityIconAdd,
  userViewNavBtn,
  userViewNavBtnActive,
  userViewNavBtnIdle,
  userViewScopeBase,
  userViewScopeTone,
} from '../../../styles/admin'
import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon,
  AnalyticsUpIcon,
  Building03Icon,
  Calendar03Icon,
  ChartIncreaseIcon,
  Clock01Icon,
  Contact01Icon,
  DashboardSquare01Icon,
  DocumentAttachmentIcon,
  File01Icon,
  InformationCircleIcon,
  LicenseIcon,
  PencilEdit02Icon,
  Shield01Icon,
  Task01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { Skeleton } from 'antd'
import { PrimaryButton } from '@/components/ui'
import { FormSelect } from '@/components/common/Forms'
import type {
  AdminUser,
  DataScopeLevel,
  Department,
  RoleOption,
  ScopeMap,
  UserActivity,
  UserSession,
  UserStatus,
} from '../../../types'

export type UserForm = {
  fullName: string
  email: string
  mobile: string
  username: string
  password: string
  roleId: string
  departmentId: string
  teamId: string
  status: UserStatus
}

export type ViewTab = 'overview' | 'permissions' | 'leads' | 'applications' | 'documents' | 'performance'

export const SCOPE_RESOURCES = ['lead', 'document', 'employee_performance'] as const

export const VIEW_TABS: Array<{ id: ViewTab; label: string; icon: IconSvgElement }> = [
  { id: 'overview', label: 'Overview', icon: DashboardSquare01Icon },
  { id: 'permissions', label: 'Permissions', icon: Shield01Icon },
  { id: 'leads', label: 'Assigned Leads', icon: UserGroupIcon },
  { id: 'applications', label: 'Applications', icon: LicenseIcon },
  { id: 'documents', label: 'Documents', icon: File01Icon },
  { id: 'performance', label: 'Performance', icon: AnalyticsUpIcon },
]

export function formFromUser(user: AdminUser): UserForm {
  return {
    fullName: user.fullName || '',
    email: user.email || '',
    mobile: user.mobile || '',
    username: user.username || '',
    password: '',
    roleId: user.role?.id || '',
    departmentId: user.department?.id || '',
    teamId: user.team?.id || '',
    status: user.status || 'ACTIVE',
  }
}

export function formatDate(value?: string | Date | null) {
  if (!value) {
    return '—'
  }
  return new Date(value).toLocaleString()
}

export function formatPrettyDate(value?: string | Date | null) {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${day} • ${time}`
}

export function userPhotoSrc(photoUrl?: string | null) {
  if (!photoUrl) {
    return ''
  }
  if (photoUrl.startsWith('http') || photoUrl.startsWith('/')) {
    return photoUrl
  }
  return ''
}

function userInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return 'U'
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

export function UserAvatar({
  name,
  photoUrl,
  className,
}: {
  name: string
  photoUrl?: string | null
  className: string
}) {
  const src = userPhotoSrc(photoUrl)
  const [failed, setFailed] = useState(false)

  return (
    <div className={className}>
      {src && !failed ? (
        <img key={src} src={src} alt="" onError={() => setFailed(true)} />
      ) : (
        userInitials(name)
      )}
    </div>
  )
}

function scopeLabel(level?: DataScopeLevel) {
  if (level === 'ALL') {
    return 'All'
  }
  if (level === 'DEPARTMENT') {
    return 'Department'
  }
  if (level === 'TEAM') {
    return 'Team'
  }
  return 'Own'
}

function scopeCopy(resource: string, level?: DataScopeLevel) {
  const subject =
    resource === 'lead'
      ? 'leads'
      : resource === 'document'
        ? 'documents'
        : 'employee performance data'
  if (level === 'ALL') {
    return `Can view and manage all ${subject} across the organization.`
  }
  if (level === 'DEPARTMENT') {
    return `Access is limited to ${subject} in this department.`
  }
  if (level === 'TEAM') {
    return `Access is limited to ${subject} in this team.`
  }
  return `Access is limited to their own ${subject}.`
}

function activityCopy(action: string) {
  if (action === 'USER_CREATED') {
    return { title: 'User Created', detail: 'New user account created' }
  }
  if (action === 'USER_UPDATED') {
    return { title: 'User Updated', detail: 'Profile information updated by admin' }
  }
  if (action === 'USER_STATUS_CHANGED') {
    return { title: 'Status Updated', detail: 'User status was changed' }
  }
  if (action === 'USER_ROLE_CHANGED') {
    return { title: 'Role Updated', detail: 'Assigned role was changed' }
  }
  if (action === 'USER_DATA_SCOPE_CHANGED') {
    return { title: 'Access Scope Updated', detail: 'CRM data scope was changed' }
  }
  if (action === 'USER_PERMISSION_OVERRIDE_CHANGED') {
    return { title: 'Permissions Updated', detail: 'Permission overrides were changed' }
  }
  return { title: action.replaceAll('_', ' '), detail: 'Account activity recorded' }
}

export function statusLabel(status: UserStatus) {
  if (status === 'INACTIVE') {
    return 'Inactive'
  }
  if (status === 'SUSPENDED') {
    return 'Suspended'
  }
  if (status === 'INVITED') {
    return 'Invited'
  }
  return 'Active'
}

function asSelectString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function ScopePreviewCard({
  tone,
  icon,
  title,
  level,
  copy,
}: {
  tone: 'blue' | 'purple' | 'green'
  icon: IconSvgElement
  title: string
  level?: DataScopeLevel
  copy: string
}) {
  return (
    <div className={`${userViewScopeBase} ${userViewScopeTone[tone]}`}>
      <div className="mb-2 flex items-center gap-2 [&_span]:inline-flex [&_span]:h-7 [&_span]:w-7 [&_span]:items-center [&_span]:justify-center [&_span]:rounded-lg [&_span]:bg-white [&_b]:flex-1 [&_b]:text-[0.88rem] [&_b]:text-[#24324d] dark:[&_b]:text-text-strong [&_em]:rounded-full [&_em]:bg-white [&_em]:px-2 [&_em]:py-0.5 [&_em]:text-[0.72rem] [&_em]:font-bold [&_em]:not-italic [&_em]:text-[#4f5de4]">
        <span className="user-view-scope-icon">
          <HugeiconsIcon icon={icon} size={16} color="currentColor" strokeWidth={1.7} />
        </span>
        <b>{title}</b>
        <em>{scopeLabel(level)}</em>
      </div>
      <p>{copy}</p>
    </div>
  )
}

export function UserViewLayout({
  form,
  selected,
  roles,
  departments,
  activity,
  sessions,
  scopeDraft,
  viewTab,
  detailLoading,
  canConfigure,
  canOverride,
  onTabChange,
  onRevokeSession,
  onForceLogout,
  onPasswordReset,
  onScopeChange,
  onSaveScopes,
}: {
  form: UserForm
  selected: AdminUser | null
  roles: RoleOption[]
  departments: Department[]
  activity: UserActivity[]
  sessions: UserSession[]
  scopeDraft: ScopeMap
  viewTab: ViewTab
  detailLoading: boolean
  canConfigure: boolean
  canOverride: boolean
  onTabChange: (tab: ViewTab) => void
  onRevokeSession: (sessionId: string) => Promise<void>
  onForceLogout: () => Promise<void>
  onPasswordReset: () => Promise<void>
  onScopeChange: (resource: (typeof SCOPE_RESOURCES)[number], value: DataScopeLevel) => void
  onSaveScopes: () => void
}) {
  const displayName = form.fullName || selected?.fullName || 'User'
  const roleName =
    selected?.role?.name || roles.find((role) => role.id === form.roleId)?.name || '—'
  const departmentName =
    selected?.department?.name || departments.find((item) => item.id === form.departmentId)?.name || '—'
  const teamName =
    selected?.team?.name ||
    departments.flatMap((item) => item.teams).find((item) => item.id === form.teamId)?.name ||
    '—'
  const monthActivity = activity.filter((item) => {
    const date = new Date(item.createdAt)
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="grid grid-cols-1 rounded-2xl border border-[#e8edf6] bg-[#f7f8fd] shadow-soft dark:border-border dark:bg-[#151b22] min-[961px]:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-[18px] border-b border-border bg-[radial-gradient(circle_at_0_100%,rgba(91,103,232,0.08),transparent_46%),#fff] px-4 pt-[22px] pb-[18px] min-[961px]:sticky min-[961px]:top-0 min-[961px]:self-start min-[961px]:border-r min-[961px]:border-b-0 dark:border-border dark:bg-surface">
        <div className="grid justify-items-center gap-2.5 text-center">
          <UserAvatar
            name={displayName}
            photoUrl={selected?.photoUrl}
            className="grid h-[74px] w-[74px] place-items-center overflow-hidden rounded-full bg-primary text-[1.2rem] font-bold text-on-primary shadow-[0_10px_20px_color-mix(in_srgb,var(--color-primary)_28%,transparent)] [&_img]:h-full [&_img]:w-full [&_img]:object-cover"
          />
          <div className="[&_strong]:block [&_strong]:text-[1.02rem] [&_strong]:text-[#24324d] dark:[&_strong]:text-text-strong [&_p]:my-0.5 [&_p]:mb-2 [&_p]:text-[0.82rem] [&_p]:text-[#7b8498]">
            <strong>{displayName}</strong>
            <p>
              {roleName || '—'}
              {departmentName !== '—' ? ` • ${departmentName}` : ''}
            </p>
            <span className={userStatusPillClass(form.status.toLowerCase())}>{statusLabel(form.status)}</span>
          </div>
        </div>

        <nav className="grid gap-1" aria-label="User sections">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${userViewNavBtn} ${viewTab === tab.id ? userViewNavBtnActive : userViewNavBtnIdle}`}
              aria-current={viewTab === tab.id ? 'true' : undefined}
              onClick={() => onTabChange(tab.id)}
            >
              <HugeiconsIcon icon={tab.icon} size={16} color="currentColor" strokeWidth={1.7} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex gap-2 rounded-[14px] bg-[#eef4ff] p-3 text-[#5b67e8] dark:bg-[rgba(91,103,232,0.16)] [&_strong]:mb-1 [&_strong]:block [&_strong]:text-[0.82rem] [&_p]:m-0 [&_p]:text-[0.75rem] [&_p]:leading-snug [&_p]:text-[#6b7690]">
          <HugeiconsIcon icon={InformationCircleIcon} size={16} color="currentColor" strokeWidth={1.7} />
          <div>
            <strong>User Information</strong>
            <p>This user can manage leads, applications and documents according to their assigned role and scope.</p>
          </div>
        </div>
      </aside>

      <section className="min-w-0">
        <div className="grid content-start gap-3.5 px-[18px] pt-4 pb-4">
          {viewTab === 'overview' ? (
            <>
              <div className="grid grid-cols-1 gap-3.5 max-[960px]:grid-cols-1 min-[961px]:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
                <article className="rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong">
                  <header>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5b67e8]">
                      <HugeiconsIcon icon={Contact01Icon} size={16} color="currentColor" strokeWidth={1.7} />
                    </span>
                    <h4>Contact Information</h4>
                  </header>
                  <dl className="m-0 grid gap-2.5 [&>div]:grid [&>div]:grid-cols-1 [&>div]:items-center [&>div]:gap-2.5 max-[960px]:[&>div]:grid-cols-1 min-[961px]:[&>div]:grid-cols-[110px_minmax(0,1fr)] [&_dt]:text-[0.84rem] [&_dt]:text-[#7b8498] [&_dt]:after:content-[':'] [&_dd]:m-0 [&_dd]:text-[0.9rem] [&_dd]:font-semibold [&_dd]:text-[#24324d] dark:[&_dd]:text-text-strong">
                    <div>
                      <dt>Full Name</dt>
                      <dd>{form.fullName || '—'}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{form.email || '—'}</dd>
                    </div>
                    <div>
                      <dt>Mobile</dt>
                      <dd>{form.mobile || '—'}</dd>
                    </div>
                    <div>
                      <dt>Username</dt>
                      <dd>{form.username || '—'}</dd>
                    </div>
                  </dl>
                </article>

                <div className="grid content-start gap-3">
                  <div className="grid grid-cols-1 gap-2.5 max-[960px]:grid-cols-1 min-[961px]:grid-cols-2">
                    <div className="flex items-start gap-2 rounded-[14px] border border-[#e8edf6] bg-white px-3 py-2.5 text-[#7b8498] dark:border-border dark:bg-surface [&_span]:block [&_span]:text-[0.72rem] [&_strong]:mt-0.5 [&_strong]:block [&_strong]:text-[0.78rem] [&_strong]:text-[#24324d] dark:[&_strong]:text-text-strong">
                      <HugeiconsIcon icon={Calendar03Icon} size={15} color="currentColor" strokeWidth={1.7} />
                      <div>
                        <span>Account created</span>
                        <strong>{formatPrettyDate(selected?.createdAt)}</strong>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 rounded-[14px] border border-[#e8edf6] bg-white px-3 py-2.5 text-[#7b8498] dark:border-border dark:bg-surface [&_span]:block [&_span]:text-[0.72rem] [&_strong]:mt-0.5 [&_strong]:block [&_strong]:text-[0.78rem] [&_strong]:text-[#24324d] dark:[&_strong]:text-text-strong">
                      <HugeiconsIcon icon={Clock01Icon} size={15} color="currentColor" strokeWidth={1.7} />
                      <div>
                        <span>Last updated</span>
                        <strong>{formatPrettyDate(selected?.updatedAt)}</strong>
                      </div>
                    </div>
                  </div>
                  <article className="rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong">
                    <header>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5b67e8]">
                        <HugeiconsIcon icon={Building03Icon} size={16} color="currentColor" strokeWidth={1.7} />
                      </span>
                      <h4>Organization</h4>
                    </header>
                    <dl className="m-0 grid gap-2.5 [&>div]:grid [&>div]:grid-cols-1 [&>div]:items-center [&>div]:gap-2.5 max-[960px]:[&>div]:grid-cols-1 min-[961px]:[&>div]:grid-cols-[110px_minmax(0,1fr)] [&_dt]:text-[0.84rem] [&_dt]:text-[#7b8498] [&_dt]:after:content-[':'] [&_dd]:m-0 [&_dd]:text-[0.9rem] [&_dd]:font-semibold [&_dd]:text-[#24324d] dark:[&_dd]:text-text-strong">
                      <div>
                        <dt>Role</dt>
                        <dd>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.75rem] font-bold bg-[#eef1ff] text-[#4f5de4]">
                            {roleName || '—'}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt>Department</dt>
                        <dd>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.75rem] font-bold bg-[#e9f8ef] text-[#17824b]">
                            {departmentName}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt>Team</dt>
                        <dd>{teamName}</dd>
                      </div>
                    </dl>
                  </article>
                </div>
              </div>

              <article className="rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong">
                <header>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5b67e8]">
                    <HugeiconsIcon icon={Shield01Icon} size={16} color="currentColor" strokeWidth={1.7} />
                  </span>
                  <h4>CRM Access & Scope</h4>
                </header>
                <div className="grid grid-cols-1 gap-3 max-[960px]:grid-cols-1 min-[961px]:grid-cols-3">
                  <ScopePreviewCard
                    tone="blue"
                    icon={UserGroupIcon}
                    title="Leads"
                    level={scopeDraft.lead}
                    copy={scopeCopy('lead', scopeDraft.lead)}
                  />
                  <ScopePreviewCard
                    tone="purple"
                    icon={File01Icon}
                    title="Documents"
                    level={scopeDraft.document}
                    copy={scopeCopy('document', scopeDraft.document)}
                  />
                  <ScopePreviewCard
                    tone="green"
                    icon={ChartIncreaseIcon}
                    title="Employee Performance"
                    level={scopeDraft.employee_performance}
                    copy={scopeCopy('employee_performance', scopeDraft.employee_performance)}
                  />
                </div>
              </article>

              <article className="rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong">
                <header>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#e8f8ef] text-[#1f9d5d]">
                    <HugeiconsIcon icon={AnalyticsUpIcon} size={16} color="currentColor" strokeWidth={1.7} />
                  </span>
                  <h4>Activity / Summary</h4>
                </header>
                <div className="grid grid-cols-1 gap-3 max-[960px]:grid-cols-1 min-[961px]:grid-cols-4">
                  <div className="rounded-2xl p-3.5 text-left bg-[#eef1ff] text-[#5b67e8]">
                    <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-white">
                      <HugeiconsIcon icon={UserGroupIcon} size={18} color="currentColor" strokeWidth={1.7} />
                    </span>
                    <strong>0</strong>
                    <b>Assigned Leads</b>
                    <p>Total leads assigned</p>
                  </div>
                  <div className="rounded-2xl p-3.5 text-left bg-[#f3efff] text-[#6d4ee8] dark:bg-[rgba(122,90,248,0.14)]">
                    <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-white">
                      <HugeiconsIcon icon={LicenseIcon} size={18} color="currentColor" strokeWidth={1.7} />
                    </span>
                    <strong>0</strong>
                    <b>Active Applications</b>
                    <p>In progress applications</p>
                  </div>
                  <div className="rounded-2xl p-3.5 text-left bg-[#fff3e8] text-[#d46b08] dark:bg-[rgba(212,107,8,0.16)]">
                    <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-white">
                      <HugeiconsIcon icon={DocumentAttachmentIcon} size={18} color="currentColor" strokeWidth={1.7} />
                    </span>
                    <strong>0</strong>
                    <b>Pending Documents</b>
                    <p>Awaiting approval</p>
                  </div>
                  <div className="rounded-2xl p-3.5 text-left bg-[#e8f8ef] text-[#1f9d5d]">
                    <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-white">
                      <HugeiconsIcon icon={Task01Icon} size={18} color="currentColor" strokeWidth={1.7} />
                    </span>
                    <strong>{monthActivity}</strong>
                    <b>This Month Activity</b>
                    <p>Total activities</p>
                  </div>
                </div>
              </article>

              <article className="rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong">
                <header>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5b67e8]">
                    <HugeiconsIcon icon={Clock01Icon} size={16} color="currentColor" strokeWidth={1.7} />
                  </span>
                  <h4>Recent Activity</h4>
                </header>
                {detailLoading ? (
                  <Skeleton active paragraph={{ rows: 3 }} />
                ) : activity.length === 0 ? (
                  <p className={`${muted}`}>No recent activity yet.</p>
                ) : (
                  <ul className={userViewActivity}>
                    {activity.slice(0, 8).map((item) => {
                      const copy = activityCopy(item.action)
                      return (
                        <li key={item.id}>
                          <span
                            className={`${userViewActivityIcon} ${item.action === 'USER_CREATED' ? userViewActivityIconAdd : ''}`}
                          >
                            <HugeiconsIcon
                              icon={item.action === 'USER_CREATED' ? Add01Icon : PencilEdit02Icon}
                              size={14}
                              color="currentColor"
                              strokeWidth={1.8}
                            />
                          </span>
                          <div>
                            <strong>{copy.title}</strong>
                            <p>{copy.detail}</p>
                          </div>
                          <time>{formatPrettyDate(item.createdAt)}</time>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </article>
            </>
          ) : null}

          {viewTab === 'permissions' ? (
            <div className="grid gap-3.5">
              {canOverride ? (
                <article className="rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong">
                  <header>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5b67e8]">
                      <HugeiconsIcon icon={Shield01Icon} size={16} color="currentColor" strokeWidth={1.7} />
                    </span>
                    <h4>Data scope</h4>
                  </header>
                  <div className={`${scopeGrid}`}>
                    {SCOPE_RESOURCES.map((resource) => (
                      <label key={resource}>
                        {resource.replaceAll('_', ' ')}
                        {detailLoading ? (
                          <Skeleton.Input active block className={`${scopeSkeleton}`} />
                        ) : (
                          <FormSelect
                            value={scopeDraft[resource]}
                            options={[
                              { value: 'OWN', label: 'Own' },
                              { value: 'TEAM', label: 'Team' },
                              { value: 'DEPARTMENT', label: 'Department' },
                              { value: 'ALL', label: 'All' },
                            ]}
                            onChange={(value) =>
                              onScopeChange(resource, (asSelectString(value) || 'OWN') as DataScopeLevel)
                            }
                          />
                        )}
                      </label>
                    ))}
                  </div>
                  <div className={`${formActions}`}>
                    <PrimaryButton size="sm" onClick={onSaveScopes} disabled={detailLoading} label="Save scopes" />
                  </div>
                </article>
              ) : (
                <article className="rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong">
                  <header>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5b67e8]">
                      <HugeiconsIcon icon={Shield01Icon} size={16} color="currentColor" strokeWidth={1.7} />
                    </span>
                    <h4>CRM Access & Scope</h4>
                  </header>
                  <div className="grid grid-cols-1 gap-3 max-[960px]:grid-cols-1 min-[961px]:grid-cols-3">
                    <ScopePreviewCard
                      tone="blue"
                      icon={UserGroupIcon}
                      title="Leads"
                      level={scopeDraft.lead}
                      copy={scopeCopy('lead', scopeDraft.lead)}
                    />
                    <ScopePreviewCard
                      tone="purple"
                      icon={File01Icon}
                      title="Documents"
                      level={scopeDraft.document}
                      copy={scopeCopy('document', scopeDraft.document)}
                    />
                    <ScopePreviewCard
                      tone="green"
                      icon={ChartIncreaseIcon}
                      title="Employee Performance"
                      level={scopeDraft.employee_performance}
                      copy={scopeCopy('employee_performance', scopeDraft.employee_performance)}
                    />
                  </div>
                </article>
              )}

              {canConfigure ? (
                <article className="rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong">
                  <header>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5b67e8]">
                      <HugeiconsIcon icon={Shield01Icon} size={16} color="currentColor" strokeWidth={1.7} />
                    </span>
                    <h4>Sessions</h4>
                  </header>
                  {sessions.map((session) => (
                    <div key={session.id} className={`${sessionRow}`}>
                      <div>
                        <strong>{session.userAgent || 'Unknown device'}</strong>
                        <div className={`${muted}`}>
                          Login: {formatDate(session.createdAt)} · Last active: {formatDate(session.lastActiveAt)}
                        </div>
                      </div>
                      {session.active ? (
                        <PrimaryButton
                          size="sm"
                          variant="outline"
                          onClick={() => void onRevokeSession(session.id)}
                          label="Logout Session"
                        />
                      ) : (
                        <span className={`${muted}`}>{session.revokedAt ? 'Revoked' : 'Expired'}</span>
                      )}
                    </div>
                  ))}
                  <div className={`${formActions}`}>
                    <PrimaryButton size="sm" variant="outline" onClick={() => void onForceLogout()} label="Force Logout" />
                    <PrimaryButton
                      size="sm"
                      variant="outline"
                      onClick={() => void onPasswordReset()}
                      label={selected?.status === 'INVITED' ? 'Resend invite' : 'Send password reset'}
                    />
                  </div>
                </article>
              ) : null}
            </div>
          ) : null}

          {viewTab === 'leads' ||
          viewTab === 'applications' ||
          viewTab === 'documents' ||
          viewTab === 'performance' ? (
            <article className="rounded-[18px] border border-[#e8edf6] bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(36,50,77,0.04)] dark:border-border dark:bg-surface [&_header]:mb-3.5 [&_header]:flex [&_header]:items-center [&_header]:gap-2 [&_h4]:m-0 [&_h4]:text-[0.95rem] [&_h4]:text-[#24324d] dark:[&_h4]:text-text-strong min-h-[180px]">
              <header>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef1ff] text-[#5b67e8]">
                  <HugeiconsIcon
                    icon={
                      viewTab === 'leads'
                        ? UserGroupIcon
                        : viewTab === 'applications'
                          ? LicenseIcon
                          : viewTab === 'documents'
                            ? File01Icon
                            : AnalyticsUpIcon
                    }
                    size={16}
                    color="currentColor"
                    strokeWidth={1.7}
                  />
                </span>
                <h4>
                  {viewTab === 'leads'
                    ? 'Assigned Leads'
                    : viewTab === 'applications'
                      ? 'Applications'
                      : viewTab === 'documents'
                        ? 'Documents'
                        : 'Performance'}
                </h4>
              </header>
              <p className={`${muted}`}>
                {viewTab === 'leads'
                  ? `No assigned lead records to show yet. Inactive owner leads: ${selected?.inactiveOwnerLeadCount ?? 0}.`
                  : 'No records available for this section yet.'}
              </p>
            </article>
          ) : null}
        </div>
      </section>
    </div>
  )
}
