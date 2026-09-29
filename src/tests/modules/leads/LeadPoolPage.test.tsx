import { render, screen } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { LeadPoolPage } from '@/modules/leads'
import { store } from '@/redux/features/store'

vi.mock('react-toastify', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/redux/features/masterData/masterDataApi', () => ({
  useListMasterDataOptionsQuery: () => ({ data: { items: [] }, isFetching: false }),
}))

vi.mock('@/modules/leads/api/leadsApi', () => ({
  useListLeadPoolQuery: () => ({
    data: {
      items: [
        {
          id: '1',
          code: 'L-1001',
          name: 'Aisha Rahman',
          phone: '01711',
          country: 'UK',
          source: 'Web',
          createdAt: '2026-09-28T10:24:00.000Z',
          waitingTime: '2 Hours',
        },
      ],
      total: 1,
    },
    isFetching: false,
    isError: false,
  }),
  useAssignLeadMutation: () => [vi.fn(), { isLoading: false }],
  useListLeadAssigneesQuery: () => ({ data: { items: [] }, isFetching: false }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useOutletContext: () => ({ permissions: ['lead:assign', 'lead:reassign'] }),
  }
})

describe('LeadPoolPage', () => {
  it('renders the lead pool heading, filters, and assign action', () => {
    render(
      <Provider store={store}>
        <HelmetProvider>
          <MemoryRouter>
            <LeadPoolPage />
          </MemoryRouter>
        </HelmetProvider>
      </Provider>,
    )

    expect(screen.getAllByText('Lead Pool').length).toBeGreaterThan(0)
    expect(screen.getByPlaceholderText(/lead id, student name, or phone/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /^search$/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^reset$/i })).toBeTruthy()
    expect(screen.getByText('Aisha Rahman')).toBeTruthy()
    expect(screen.getByRole('button', { name: /assign lead/i })).toBeTruthy()
  })
})
