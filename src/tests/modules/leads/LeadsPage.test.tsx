import { render, screen } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { LeadsPage } from '@/modules/leads'
import { store } from '@/redux/features/store'

vi.mock('react-toastify', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/redux/features/masterData/masterDataApi', () => ({
  useListMasterDataOptionsQuery: () => ({ data: { items: [] }, isFetching: false }),
}))

vi.mock('@/modules/leads/api/leadsApi', () => ({
  useListLeadsQuery: () => ({
    data: {
      items: [{ id: '1', code: 'L-1001', name: 'Aisha Rahman', phone: '01711', email: 'aisha@example.com', subtitle: 'IELTS 6.5 | BSc Computer Science', country: 'UK', source: 'Web', owner: 'Sarah', status: 'New', priority: 'High', updated: '1h ago', createdAt: '2026-04-28T10:24:00.000Z' }],
      total: 1,
      summary: {
        total: 1,
        change: 12,
        statuses: [
          { key: 'new', label: 'New', count: 1, change: 8 },
          { key: 'contacted', label: 'Contacted', count: 0, change: 0 },
          { key: 'interested', label: 'Interested', count: 0, change: 0 },
          { key: 'counselling', label: 'Counselling', count: 0, change: 0 },
          { key: 'offer-sent', label: 'Offer Sent', count: 0, change: 0 },
          { key: 'converted', label: 'Converted', count: 0, change: 0 },
        ],
      },
    },
    isFetching: false,
    isError: false,
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useOutletContext: () => ({ permissions: ['lead:view', 'lead:create', 'lead:edit'] }),
  }
})

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
    expect(screen.getByRole('button', { name: /add new lead/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /import/i })).toBeTruthy()
    expect(screen.getByText(/all leads/i)).toBeTruthy()
    expect(screen.getByPlaceholderText(/search by name, phone, email/i)).toBeTruthy()
  })
})
