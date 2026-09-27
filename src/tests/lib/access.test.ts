import { describe, expect, it } from 'vitest'
import { dataScope, hasPermission } from '@/lib/access'
import type { AuthSession } from '@/types'

function session(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    user: {
      id: 'u1',
      fullName: 'Ada Lovelace',
      email: 'ada@campusly.test',
      username: 'ada',
      mobile: '01700000000',
      status: 'ACTIVE',
      departmentId: null,
      teamId: null,
      primaryRoleId: 'r1',
    },
    role: { id: 'r1', key: 'admin', name: 'Admin' },
    roles: ['admin'],
    permissions: ['lead:view', 'user:view'],
    dataScopes: { lead: 'TEAM' },
    dataScope: { lead: 'OWN' },
    ...overrides,
  }
}

describe('hasPermission', () => {
  it('returns false when session is missing', () => {
    expect(hasPermission(null, 'lead:view')).toBe(false)
  })

  it('matches a single required permission', () => {
    expect(hasPermission(session(), 'lead:view')).toBe(true)
    expect(hasPermission(session(), 'lead:create')).toBe(false)
  })

  it('matches any permission from a list', () => {
    expect(hasPermission(session(), ['lead:create', 'user:view'])).toBe(true)
  })
})

describe('dataScope', () => {
  it('prefers dataScopes over dataScope and defaults to OWN', () => {
    expect(dataScope(session(), 'lead')).toBe('TEAM')
    expect(dataScope(session(), 'payment')).toBe('OWN')
    expect(dataScope(null)).toBe('OWN')
  })
})
