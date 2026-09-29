import { render, screen } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { MyLeadsPage } from '@/modules/leads'
import { store } from '@/redux/features/store'

vi.mock('react-toastify', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/redux/features/masterData/masterDataApi', () => ({
  useListMasterDataOptionsQuery: () => ({ data: { items: [] }, isFetching: false }),
}))

vi.mock('@/modules/leads/api/leadsApi', () => ({
  useListMyLeadsQuery: () => ({
    data: {
      items: [
        {
          id: '1',
          code: 'L-1001',
          name: 'Aisha Rahman',
          phone: '01711',
          country: 'UK',
          status: 'Contacted',
          score: 72,
          priority: 'High',
          nextFollowUpAt: '2026-09-28T10:00:00.000Z',
          lastActivity: 'Call logged',
          lastActivityAt: '2026-09-27T09:00:00.000Z',
          assignedAt: '2026-09-26T08:00:00.000Z',
        },
      ],
      total: 1,
      summary: {
        totalAssigned: 1,
        highPriority: 1,
        pendingFollowUps: 1,
        todayFollowUps: 1,
        overdueFollowUps: 0,
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
    useOutletContext: () => ({ permissions: ['lead:view'] }),
  }
})

describe('MyLeadsPage', () => {
  it('renders assigned leads, workload summary, and search controls', () => {
    render(
      <Provider store={store}>
        <HelmetProvider>
          <MemoryRouter>
            <MyLeadsPage />
          </MemoryRouter>
        </HelmetProvider>
      </Provider>,
    )

    expect(screen.getAllByText('My Leads').length).toBeGreaterThan(0)
    expect(screen.getByPlaceholderText(/lead id, student name, or phone/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /^search$/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^reset$/i })).toBeTruthy()
    expect(screen.getByText('Total Assigned Leads')).toBeTruthy()
    expect(screen.getByText('High Priority Leads')).toBeTruthy()
    expect(screen.getByText('Pending Follow-ups')).toBeTruthy()
    expect(screen.getByText("Today's Follow-ups")).toBeTruthy()
    expect(screen.getByText('Overdue Follow-ups')).toBeTruthy()
    expect(screen.getByText('Aisha Rahman')).toBeTruthy()
    expect(screen.getByText('L-1001')).toBeTruthy()
    expect(screen.getByRole('button', { name: /open lead details/i })).toBeTruthy()
  })
})
