import { adminEmpty, adminPage } from '../../../styles/admin'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { Spin } from 'antd'
import { toast } from 'react-toastify'
import { HugeiconsIcon } from '@hugeicons/react'
import { PencilEdit02Icon } from '@hugeicons/core-free-icons'
import {
  useAdminPasswordResetMutation,
  useForceLogoutUserMutation,
  useLazyGetUserQuery,
  useLazyListUserActivityQuery,
  useLazyListUserSessionsQuery,
  useRevokeUserSessionMutation,
  useSetUserScopesMutation,
} from '@/redux/features/users/usersApi'
import { useLazyListRoleOptionsQuery } from '@/redux/features/roles/rolesApi'
import { useLazyListDepartmentsQuery } from '@/redux/features/masterData/masterDataApi'
import { getApiError, isGloballyToastedApiError } from '@/lib/api'
import { PrimaryButton } from '@/components/ui'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { hasPermission } from '../../../lib/access'
import type {
  AdminUser,
  AuthSession,
  Department,
  RoleOption,
  ScopeMap,
  UserActivity,
  UserSession,
} from '../../../types'
import {
  formFromUser,
  UserViewLayout,
  type UserForm,
  type ViewTab,
} from '../components/UserViewLayout'

const DEFAULT_SCOPES: ScopeMap = { lead: 'OWN', document: 'OWN', employee_performance: 'OWN' }
const VIEW_TAB_IDS: ViewTab[] = ['overview', 'permissions', 'leads', 'applications', 'documents', 'performance']

function showApiError(err: unknown, fallback: string) {
  if (isGloballyToastedApiError(err)) {
    return
  }
  toast.error(getApiError(err, fallback))
}

function parseViewTab(value: string | null): ViewTab {
  if (value && VIEW_TAB_IDS.includes(value as ViewTab)) {
    return value as ViewTab
  }
  return 'overview'
}

export default function UserDetailsPage() {
  const { id } = useParams()
  const auth = useOutletContext<AuthSession>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const canEdit = hasPermission(auth, 'user:edit')
  const canConfigure = hasPermission(auth, 'user:configure')
  const canOverride = hasPermission(auth, 'permission:configure')

  const viewTab = useMemo(() => parseViewTab(searchParams.get('tab')), [searchParams])
  const [form, setForm] = useState<UserForm | null>(null)
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [activity, setActivity] = useState<UserActivity[]>([])
  const [scopeDraft, setScopeDraft] = useState<ScopeMap>(DEFAULT_SCOPES)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(true)
  const [error, setError] = useState('')

  const [getUser] = useLazyGetUserQuery()
  const [listUserSessions] = useLazyListUserSessionsQuery()
  const [listUserActivity] = useLazyListUserActivityQuery()
  const [listRoleOptions] = useLazyListRoleOptionsQuery()
  const [listDepartments] = useLazyListDepartmentsQuery()
  const [setUserScopes] = useSetUserScopesMutation()
  const [revokeUserSession] = useRevokeUserSessionMutation()
  const [forceLogoutUser] = useForceLogoutUserMutation()
  const [adminPasswordReset] = useAdminPasswordResetMutation()

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
    let cancelled = false

    async function load() {
      if (!id) {
        setError('User not found.')
        setLoading(false)
        setDetailLoading(false)
        return
      }

      setLoading(true)
      setDetailLoading(true)
      try {
        const [detailData, sessionData, activityData] = await Promise.all([
          getUser(id).unwrap(),
          listUserSessions(id).unwrap().catch(() => ({ sessions: [] })),
          listUserActivity(id).unwrap().catch(() => ({ activity: [] })),
        ])
        if (cancelled) {
          return
        }

        const detail = detailData.user
        setSelected(detail)
        setForm(formFromUser(detail))
        setScopeDraft({
          lead: detail.dataScopes?.lead || 'OWN',
          document: detail.dataScopes?.document || detail.dataScopes?.lead || 'OWN',
          employee_performance: detail.dataScopes?.employee_performance || detail.dataScopes?.lead || 'OWN',
        })
        setSessions(sessionData.sessions)
        setActivity(activityData.activity)
        setError('')
      } catch (err) {
        if (cancelled) {
          return
        }
        setSelected(null)
        setForm(null)
        setError(getApiError(err, 'Unable to load user.'))
      } finally {
        if (!cancelled) {
          setLoading(false)
          setDetailLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [id, getUser, listUserSessions, listUserActivity])

  function onTabChange(tab: ViewTab) {
    const next = new URLSearchParams(searchParams)
    if (tab === 'overview') {
      next.delete('tab')
    } else {
      next.set('tab', tab)
    }
    setSearchParams(next, { replace: true })
  }

  async function saveScopes() {
    if (!selected) {
      return
    }
    try {
      const data = await setUserScopes({ id: selected.id, scopes: scopeDraft }).unwrap()
      toast.success('Data scope saved.')
      setSelected(data.user)
      setForm(formFromUser(data.user))
    } catch (err) {
      showApiError(err, 'Unable to save data scope.')
    }
  }

  if (!loading && (error || !selected || !form)) {
    return (
      <div className={`${adminPage}`}>
        <PageMeta
          title="User Not Found"
          description="This user profile could not be loaded. Return to the users list to continue."
        />
        <PageHeader
          title="User Details"
          subtitle={error || 'This user could not be found.'}
          breadcrumbs={[
            { title: 'Dashboard', path: '/dashboard' },
            { title: 'Users', path: '/users' },
            { title: 'Details' },
          ]}
          extra={<PrimaryButton variant="outline" onClick={() => navigate('/users')} label="Back to Users" />}
        />
        <div className={`${adminEmpty}`}>
          <strong>User profile unavailable</strong>
          <p>{error || 'This user could not be found.'}</p>
          <PrimaryButton variant="outline" onClick={() => navigate('/users')} label="Back to Users" />
        </div>
      </div>
    )
  }

  return (
    <div className={`${adminPage}`}>
      <PageMeta
        title={selected?.fullName ? `${selected.fullName} — User` : 'User Details'}
        description={
          selected
            ? `View profile, permissions, sessions, and activity for ${selected.fullName}.`
            : 'View CRM user details.'
        }
      />
      <PageHeader
        title={selected?.fullName || 'User Details'}
        subtitle="User profile, access scope, and account activity."
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'Users', path: '/users' },
          { title: selected?.fullName || 'Details' },
        ]}
        extra={
          <>
            <PrimaryButton variant="outline" onClick={() => navigate('/users')} label="Back to Users" />
            {canEdit && selected ? (
              <PrimaryButton
                label="Edit User"
                icon={<HugeiconsIcon icon={PencilEdit02Icon} size={16} color="currentColor" strokeWidth={1.6} />}
                onClick={() => navigate('/users', { state: { editUserId: selected.id } })}
              />
            ) : null}
          </>
        }
      />

      <Spin spinning={loading}>
        {form && selected ? (
          <UserViewLayout
            form={form}
            selected={selected}
            roles={roles}
            departments={departments}
            activity={activity}
            sessions={sessions}
            scopeDraft={scopeDraft}
            viewTab={viewTab}
            detailLoading={detailLoading}
            canConfigure={canConfigure}
            canOverride={canOverride}
            onTabChange={onTabChange}
            onRevokeSession={async (sessionId) => {
              try {
                await revokeUserSession({ userId: selected.id, sessionId }).unwrap()
                toast.success('Session terminated.')
                const refreshed = await listUserSessions(selected.id).unwrap()
                setSessions(refreshed.sessions)
              } catch (err) {
                showApiError(err, 'Unable to terminate the selected session.')
              }
            }}
            onForceLogout={async () => {
              try {
                await forceLogoutUser(selected.id).unwrap()
                toast.success('All sessions terminated.')
                const refreshed = await listUserSessions(selected.id).unwrap()
                setSessions(refreshed.sessions)
              } catch (err) {
                showApiError(err, 'Unable to terminate the selected session.')
              }
            }}
            onPasswordReset={async () => {
              try {
                const data = await adminPasswordReset(selected.id).unwrap()
                const isInvite = selected.status === 'INVITED' || data.inviteSent
                toast.success(
                  data.devResetPath
                    ? `${isInvite ? 'Invite resent' : 'Reset created'}. Dev link: ${data.devResetPath}`
                    : data.message || (isInvite ? 'Invite email resent.' : 'Password reset email sent.'),
                )
              } catch (err) {
                showApiError(
                  err,
                  selected.status === 'INVITED' ? 'Unable to resend invite.' : 'Unable to start password reset.',
                )
              }
            }}
            onScopeChange={(resource, value) => setScopeDraft((current) => ({ ...current, [resource]: value }))}
            onSaveScopes={() => void saveScopes()}
          />
        ) : null}
      </Spin>
    </div>
  )
}
