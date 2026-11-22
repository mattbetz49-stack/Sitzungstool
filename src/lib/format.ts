import type { Meeting } from './types'
const pad = (n: number) => String(n).padStart(2, '0')

export function formatDate(d: Date | string): string {
  const x = typeof d === 'string' ? new Date(d.length === 10 ? d + 'T00:00:00' : d) : d
  return `${pad(x.getDate())}.${pad(x.getMonth() + 1)}.${x.getFullYear()}`
}
export function formatTime(d: Date): string { return `${pad(d.getHours())}:${pad(d.getMinutes())}` }

/** Sitzungsbeginn in der Zeit des Browsers (Verein sitzt in Bayern). */
export function meetingStart(m: Pick<Meeting, 'datum' | 'beginn'>): Date {
  return new Date(`${m.datum}T${m.beginn.slice(0, 5)}:00`)
}
export function mmss(totalSek: number): string {
  const neg = totalSek < 0; const a = Math.abs(Math.round(totalSek))
  return `${neg ? '−' : ''}${pad(Math.floor(a / 60))}:${pad(a % 60)}`
}
