import type { Profile, Role } from './types'

/** false, wenn nach der Änderung kein aktiver Admin mehr übrig wäre. */
export function canChangeAdmin(members: Profile[], targetId: string, change: { role?: Role; aktiv?: boolean }): boolean {
  const after = members.map(m => (m.id === targetId ? { ...m, ...change } : m))
  return after.some(m => m.role === 'admin' && m.aktiv)
}
