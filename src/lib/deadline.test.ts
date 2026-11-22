import { describe, it, expect } from 'vitest'
import { isProposalOpen, deadlineDate } from './deadline'
import type { MeetingStatus } from './types'

const m = (status: MeetingStatus = 'entwurf') => ({ datum: '2026-12-10', beginn: '19:00', einreichfrist_tage: 2, status })

describe('deadline', () => {
  it('Frist = Beginn minus Frist-Tage', () => {
    expect(deadlineDate(m()).getTime()).toBe(new Date('2026-12-08T19:00:00').getTime())
  })
  it('offen vor der Frist', () => {
    expect(isProposalOpen(m(), new Date('2026-12-08T18:59:00'))).toBe(true)
  })
  it('geschlossen nach der Frist', () => {
    expect(isProposalOpen(m(), new Date('2026-12-09T10:00:00'))).toBe(false)
  })
  it('geschlossen genau zur Fristzeit', () => {
    expect(isProposalOpen(m(), new Date('2026-12-08T19:00:00'))).toBe(false)
  })
  it('geschlossen bei beendeter Sitzung', () => {
    expect(isProposalOpen(m('beendet'), new Date('2026-12-01T10:00:00'))).toBe(false)
  })
})
