import { meetingStart } from './format'
import type { Meeting } from './types'

type M = Pick<Meeting, 'datum' | 'beginn' | 'einreichfrist_tage' | 'status'>

export function deadlineDate(m: M): Date {
  const d = meetingStart(m)
  d.setDate(d.getDate() - m.einreichfrist_tage)
  return d
}
export function isProposalOpen(m: M, now: Date): boolean {
  return m.status !== 'beendet' && now.getTime() < deadlineDate(m).getTime()
}
