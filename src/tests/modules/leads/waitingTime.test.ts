import { describe, expect, it } from 'vitest'
import { formatWaitingTime } from '@/modules/leads/utils/waitingTime'

describe('formatWaitingTime', () => {
  const now = new Date('2026-09-28T12:00:00.000Z').getTime()

  it('shows minutes, hours, and days from createdAt', () => {
    expect(formatWaitingTime('2026-09-28T11:59:20.000Z', now)).toBe('1 Minute')
    expect(formatWaitingTime('2026-09-28T11:35:00.000Z', now)).toBe('25 Minutes')
    expect(formatWaitingTime('2026-09-28T10:00:00.000Z', now)).toBe('2 Hours')
    expect(formatWaitingTime('2026-09-27T12:00:00.000Z', now)).toBe('1 Day')
    expect(formatWaitingTime('2026-09-25T12:00:00.000Z', now)).toBe('3 Days')
  })
})
