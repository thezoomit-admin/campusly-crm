import { render, screen } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { LeadsPage } from '@/modules/leads'
import { store } from '@/redux/features/store'

vi.mock('@/modules/leads/api/leadsApi', () => ({
  useListLeadsQuery: () => ({
    data: {
      items: [{ id: '1', name: 'Aisha Rahman', phone: '01711', country: 'UK', source: 'Web' }],
      total: 1,
    },
    isFetching: false,
    isError: false,
  }),
}))

describe('LeadsPage', () => {
  it('renders the leads heading and list chrome', () => {
    render(
      <Provider store={store}>
        <HelmetProvider>
          <MemoryRouter>
            <LeadsPage />
          </MemoryRouter>
        </HelmetProvider>
      </Provider>,
    )

    expect(screen.getAllByText('Leads').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /add lead/i })).toBeTruthy()
  })
})
