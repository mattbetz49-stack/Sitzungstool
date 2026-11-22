import { describe, it, expect } from 'vitest'
import { canChangeAdmin } from './members'
import type { Profile } from './types'

const p = (id: string, role: 'admin' | 'mitglied', aktiv = true): Profile => ({ id, name: id, email: id + '@x.de', role, aktiv })

describe('canChangeAdmin', () => {
  it('verbietet Herabstufen des einzigen aktiven Admins', () => {
    expect(canChangeAdmin([p('a', 'admin'), p('b', 'mitglied')], 'a', { role: 'mitglied' })).toBe(false)
  })
  it('verbietet Deaktivieren des einzigen aktiven Admins', () => {
    expect(canChangeAdmin([p('a', 'admin'), p('b', 'mitglied')], 'a', { aktiv: false })).toBe(false)
  })
  it('zählt inaktive Admins nicht mit', () => {
    expect(canChangeAdmin([p('a', 'admin'), p('c', 'admin', false)], 'a', { role: 'mitglied' })).toBe(false)
  })
  it('erlaubt es bei zwei aktiven Admins', () => {
    expect(canChangeAdmin([p('a', 'admin'), p('c', 'admin')], 'a', { role: 'mitglied' })).toBe(true)
  })
  it('erlaubt Änderungen an Mitgliedern und Beförderung', () => {
    const m = [p('a', 'admin'), p('b', 'mitglied')]
    expect(canChangeAdmin(m, 'b', { aktiv: false })).toBe(true)
    expect(canChangeAdmin(m, 'b', { role: 'admin' })).toBe(true)
  })
})
