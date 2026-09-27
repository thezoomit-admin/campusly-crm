import { configureStore } from '@reduxjs/toolkit'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { describe, expect, it } from 'vitest'
import { useAuth } from '@/hooks/useAuth'
import { baseApi } from '@/redux/api/baseApi'
import authReducer, { setSession } from '@/redux/features/auth/authSlice'
import sidebarReducer from '@/redux/features/sidebar/sidebarSlice'
import type { AuthSession } from '@/types'

const session: AuthSession = {
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
  role: { id: 'r1', key: 'counselor', name: 'Counselor' },
  roles: ['counselor'],
  permissions: ['lead:view'],
  dataScopes: { lead: 'OWN' },
  dataScope: { lead: 'OWN' },
}

function createStore() {
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      auth: authReducer,
      sidebar: sidebarReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  })
}

describe('useAuth', () => {
  it('exposes session helpers and permission checks', () => {
    const store = createStore()
    store.dispatch(setSession(session))

    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.fullName).toBe('Ada Lovelace')
    expect(result.current.can('lead:view')).toBe(true)
    expect(result.current.can('user:view')).toBe(false)
  })
})
