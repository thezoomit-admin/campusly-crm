import { Navigate, Outlet, useOutletContext } from 'react-router-dom'
import { hasPermission } from '../lib/access'
import type { AuthSession } from '../types'

type PermissionRouteProps = {
  permission: string | string[]
  deniedTitle?: string
  deniedMessage?: string
}

/**
 * Guards nested routes by permission. When access is withdrawn (e.g. live
 * socket permission refresh), redirect to dashboard instead of a dead-end page.
 */
export default function PermissionRoute({
  permission,
}: PermissionRouteProps) {
  const auth = useOutletContext<AuthSession>()

  if (!hasPermission(auth, permission)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet context={auth} />
}
