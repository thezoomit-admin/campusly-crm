import { AUTH_PERSIST_KEY } from '@/constants'
import { config } from '@/config'
import type { AuthSession, AuthUser } from '@/types'

export const AUTH_USER_PATCH_EVENT = 'crm:auth-user-patch'

/** redux-persist storage key for the auth slice (`persist:crm-auth`). */
export const AUTH_PERSIST_STORAGE_KEY = `persist:${AUTH_PERSIST_KEY}`

export function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') {
    return false
  }

  const session = value as Partial<AuthSession>
  return Boolean(session.user && typeof session.user === 'object' && session.user.id)
}

export function patchCurrentAuthUser(patch: Partial<AuthUser>) {
  window.dispatchEvent(new CustomEvent(AUTH_USER_PATCH_EVENT, { detail: patch }))
}

/** Instantly wipe persisted auth from localStorage (campus-transfer style). */
export function clearAuthPersistStorage(): void {
  try {
    localStorage.removeItem(AUTH_PERSIST_STORAGE_KEY)
  } catch {
    /* private mode / quota */
  }
}

/**
 * Fire-and-forget server logout. Uses raw fetch so RTK Query
 * `resetApiState()` cannot abort the request.
 */
export function notifyServerLogout(): void {
  void fetch(`${config.api}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  }).catch(() => {
    /* still clear local session */
  })
}
