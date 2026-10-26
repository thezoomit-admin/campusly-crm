import { baseApi } from '@/redux/api/baseApi'

export type IntegrationState = 'live' | 'mock' | 'off'

export type WorkspaceSettingsResponse = {
  canConfigure: boolean
  workspace: {
    name: string
    supportEmail: string
    timezone: string
    currency: string
    dateFormat: string
    updatedAt: string
  }
  leads: {
    defaultFollowUpDays: number
    leadCodePrefix: string
    duplicateCheckEnabled: boolean
    updatedAt: string
  }
  options: {
    timezones: string[]
    currencies: string[]
    dateFormats: string[]
  }
  integrations: {
    email: { state: IntegrationState; fromAddress: string; imap: boolean; detail: string }
    whatsapp: { state: IntegrationState; defaultTemplate: string; detail: string }
    meta: { state: 'live' | 'mock'; webhookPath: string; detail: string }
  }
}

export type WorkspaceBrand = {
  name: string
  supportEmail: string
  timezone: string
  currency: string
  dateFormat: string
}

export type UserPreferences = {
  compactTables: boolean
  updatedAt: string | null
}

const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkspaceSettings: builder.query<WorkspaceSettingsResponse, void>({
      query: () => '/settings',
      providesTags: ['WorkspaceSettings'],
    }),
    getWorkspaceBrand: builder.query<WorkspaceBrand, void>({
      query: () => '/settings/brand',
      providesTags: ['WorkspaceBrand'],
    }),
    updateWorkspaceSettings: builder.mutation<
      WorkspaceSettingsResponse,
      WorkspaceSettingsResponse['workspace']
    >({
      query: (body) => ({ url: '/settings/workspace', method: 'PATCH', body }),
      invalidatesTags: ['WorkspaceSettings', 'WorkspaceBrand'],
    }),
    updateLeadSettings: builder.mutation<WorkspaceSettingsResponse, WorkspaceSettingsResponse['leads']>({
      query: (body) => ({ url: '/settings/leads', method: 'PATCH', body }),
      invalidatesTags: ['WorkspaceSettings'],
    }),
    getMyPreferences: builder.query<UserPreferences, void>({
      query: () => '/settings/preferences',
      providesTags: ['UserPreferences'],
    }),
    updateMyPreferences: builder.mutation<UserPreferences, { compactTables: boolean }>({
      query: (body) => ({ url: '/settings/preferences', method: 'PATCH', body }),
      invalidatesTags: ['UserPreferences'],
    }),
  }),
})

export const {
  useGetWorkspaceSettingsQuery,
  useGetWorkspaceBrandQuery,
  useUpdateWorkspaceSettingsMutation,
  useUpdateLeadSettingsMutation,
  useGetMyPreferencesQuery,
  useUpdateMyPreferencesMutation,
} = settingsApi
