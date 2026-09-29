import { adminCard, adminPage } from '../styles/admin'
import { Outlet, useOutletContext } from 'react-router-dom'
import { PageHeader } from '@/components/common/Navigation'
import { PageMeta } from '@/components/common/Meta'
import { hasPermission } from '../lib/access'
import type { AuthSession } from '../types'

type PermissionRouteProps = {
  permission: string | string[]
  deniedTitle?: string
  deniedMessage?: string
}

export default function PermissionRoute({
  permission,
  deniedTitle = 'Access denied',
  deniedMessage = 'You do not have permission to perform this action.',
}: PermissionRouteProps) {
  const auth = useOutletContext<AuthSession>()

  if (!hasPermission(auth, permission)) {
    return (
      <div className={`${adminPage}`}>
        <PageMeta
          title="Access Denied"
          description={deniedMessage}
        />
        <PageHeader
          title={deniedTitle}
          subtitle={deniedMessage}
          breadcrumbs={[{ title: 'Dashboard', path: '/dashboard' }, { title: deniedTitle }]}
        />
        <div className={`${adminCard}`}>
          <p>Contact an administrator if you believe you should have access to this area.</p>
        </div>
      </div>
    )
  }

  return <Outlet context={auth} />
}
