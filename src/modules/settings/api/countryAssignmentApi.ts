import { baseApi } from '@/redux/api/baseApi'
import { toQuery } from '@/lib/api'

export type CountryAssignmentRule = {
  id: string
  countryCode: string
  countryName: string | null
  teamId: string
  teamName: string
  teamKey: string
  defaultOwnerId: string | null
  defaultOwnerName: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CountryAssignmentFormOptions = {
  countries: Array<{ value: string; label: string }>
  teams: Array<{ value: string; label: string; key: string; departmentName: string }>
  owners: Array<{ value: string; label: string; role: string | null }>
}

export type CountryAssignmentPayload = {
  countryCode: string
  teamId: string
  defaultOwnerId?: string | null
  isActive?: boolean
}

const countryAssignmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCountryAssignmentRules: builder.query<
      { items: CountryAssignmentRule[] },
      { search?: string; isActive?: string } | void
    >({
      query: (params) =>
        `/country-assignment-rules${toQuery({
          search: params?.search,
          isActive: params?.isActive,
        })}`,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: 'CountryAssignmentRules' as const,
                id: item.id,
              })),
              { type: 'CountryAssignmentRules', id: 'LIST' },
            ]
          : [{ type: 'CountryAssignmentRules', id: 'LIST' }],
    }),
    getCountryAssignmentFormOptions: builder.query<
      CountryAssignmentFormOptions,
      { teamId?: string } | void
    >({
      query: (params) =>
        `/country-assignment-rules/form-options${toQuery({ teamId: params?.teamId })}`,
      providesTags: ['CountryAssignmentFormOptions'],
    }),
    createCountryAssignmentRule: builder.mutation<
      { rule: CountryAssignmentRule; message: string },
      CountryAssignmentPayload
    >({
      query: (body) => ({
        url: '/country-assignment-rules',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'CountryAssignmentRules', id: 'LIST' },
        'CountryAssignmentFormOptions',
      ],
    }),
    updateCountryAssignmentRule: builder.mutation<
      { rule: CountryAssignmentRule; message: string },
      { id: string; body: Partial<CountryAssignmentPayload> }
    >({
      query: ({ id, body }) => ({
        url: `/country-assignment-rules/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'CountryAssignmentRules', id },
        { type: 'CountryAssignmentRules', id: 'LIST' },
        'CountryAssignmentFormOptions',
      ],
    }),
    deactivateCountryAssignmentRule: builder.mutation<
      { rule: CountryAssignmentRule; message: string },
      string
    >({
      query: (id) => ({
        url: `/country-assignment-rules/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'CountryAssignmentRules', id },
        { type: 'CountryAssignmentRules', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useListCountryAssignmentRulesQuery,
  useGetCountryAssignmentFormOptionsQuery,
  useCreateCountryAssignmentRuleMutation,
  useUpdateCountryAssignmentRuleMutation,
  useDeactivateCountryAssignmentRuleMutation,
} = countryAssignmentApi

export default countryAssignmentApi
