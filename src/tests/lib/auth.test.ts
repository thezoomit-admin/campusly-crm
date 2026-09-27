import { describe, expect, it } from 'vitest'
import { AUTH_USER_PATCH_EVENT, isAuthSession, patchCurrentAuthUser } from '@/lib/auth'

describe('isAuthSession', () => {
  it('accepts a session with a user id', () => {
    expect(
      isAuthSession({
        user: { id: 'u1' },
        role: { id: 'r1', key: 'admin', name: 'Admin' },
        roles: [],
        permissions: [],
        dataScopes: {},
        dataScope: {},
      }),
    ).toBe(true)
  })

  it('rejects empty or incomplete values', () => {
    expect(isAuthSession(null)).toBe(false)
    expect(isAuthSession({})).toBe(false)
    expect(isAuthSession({ user: {} })).toBe(false)
  })
})

describe('patchCurrentAuthUser', () => {
  it('dispatches the auth user patch event', () => {
    let detail: { fullName?: string } | undefined
    const onPatch = (event: Event) => {
      detail = (event as CustomEvent<{ fullName?: string }>).detail
    }

    window.addEventListener(AUTH_USER_PATCH_EVENT, onPatch)
    patchCurrentAuthUser({ fullName: 'Grace Hopper' })
    window.removeEventListener(AUTH_USER_PATCH_EVENT, onPatch)

    expect(detail?.fullName).toBe('Grace Hopper')
  })
})
