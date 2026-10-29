import { baseApi } from '../../api/baseApi'
import { toQuery } from '@/lib/api'
import type { ActivityFeedResponse, AuthRole, AuthSession, PermissionRecord, ScopeMap } from '@/types'

export type MyPermissionsResponse = {
  role: AuthRole
  dataScopes: ScopeMap
  permissions: PermissionRecord[]
}

export type MyActivityParams = {
  from?: string
  to?: string
  search?: string
  category?: string
}

export type LoginBody = {
  identifier: string
  password: string
  rememberMe: boolean
}

export type ForgotPasswordBody = {
  identifier: string
}

export type ResetPasswordBody = {
  token: string
  password: string
}

export type ChangePasswordBody = {
  currentPassword: string
  newPassword: string
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<AuthSession, void>({
      query: () => '/me',
      providesTags: ['Auth'],
    }),
    login: builder.mutation<AuthSession, LoginBody>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
    logout: builder.mutation<null, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),
    forgotPassword: builder.mutation<
      { message?: string; devResetPath?: string; setupPath?: string; inviteSent?: boolean },
      ForgotPasswordBody
    >({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: builder.mutation<{ message?: string; activated?: boolean }, ResetPasswordBody>({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),
    changePassword: builder.mutation<{ message?: string }, ChangePasswordBody>({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'POST',
        body,
      }),
    }),
    updateMyProfile: builder.mutation<AuthSession, FormData | Record<string, string>>({
      query: (body) => ({
        url: '/me',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Auth', 'Users', 'User'],
    }),
    getMyPermissions: builder.query<MyPermissionsResponse, void>({
      query: () => '/me/permissions',
    }),
    listMyActivity: builder.query<ActivityFeedResponse, MyActivityParams | void>({
      query: (params) => `/me/activity${toQuery({ ...(params || {}) })}`,
    }),
  }),
})

export const {
  useGetMeQuery,
  useLazyGetMeQuery,
  useLoginMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useUpdateMyProfileMutation,
  useGetMyPermissionsQuery,
  useListMyActivityQuery,
} = authApi
