import { describe, it, expect } from 'vitest'
import { itemTimer, projectedEnd, canFinish } from './timer'

const T0 = '2026-12-01T19:00:00.000Z'
const at = (min: number, sek = 0) => new Date(new Date(T0).getTime() + (min * 60 + sek) * 1000)
const it0 = (o: Partial<{ minuten: number; verlaengerung_min: number; gestartet_am: string | null }> = {}) =>
  ({ minuten: 5, verlaengerung_min: 0, gestartet_am: T0, ...o })

describe('itemTimer', () => {
  it('grün bei 5 Minuten Rest', () => { expect(itemTimer(it0({ minuten: 10 }), at(5))).toMatchObject({ restSek: 300, color: 'gruen' }) })
  it('vor Start: volles Budget, grün', () => { expect(itemTimer(it0({ gestartet_am: null }), at(0))).toMatchObject({ restSek: 300, color: 'gruen' }) })
  it('gelb bei genau 60 s Rest', () => { expect(itemTimer(it0(), at(4))).toMatchObject({ restSek: 60, color: 'gelb' }) })
  it('rot bei 0 s', () => { expect(itemTimer(it0(), at(5))).toMatchObject({ restSek: 0, color: 'rot' }) })
  it('rot und negativ nach Ablauf', () => { expect(itemTimer(it0(), at(5, 30))).toMatchObject({ restSek: -30, color: 'rot' }) })
  it('Verlängerung +2 min verschiebt gelb/rot', () => {
    expect(itemTimer(it0({ verlaengerung_min: 2 }), at(5))).toMatchObject({ restSek: 120, color: 'gruen' })
    expect(itemTimer(it0({ verlaengerung_min: 2 }), at(6))).toMatchObject({ restSek: 60, color: 'gelb' })
  })
})

describe('projectedEnd', () => {
  const pend = (m: number, v = 0) => ({ minuten: m, verlaengerung_min: v, status: 'geplant', tatsaechliche_sekunden: null, gestartet_am: null })
  it('alles offen: Start + Summe', () => { expect(projectedEnd(T0, [pend(5), pend(5), pend(5)], at(0))).toEqual(at(15)) })
  it('Verlängerung verschiebt das Ende', () => { expect(projectedEnd(T0, [pend(5, 2), pend(5)], at(0))).toEqual(at(12)) })
  it('erledigter Punkt zählt mit tatsächlicher Dauer', () => {
    const done = { ...pend(5), status: 'erledigt', tatsaechliche_sekunden: 480 }
    expect(projectedEnd(T0, [done, pend(5)], at(8))).toEqual(at(13))
  })
  it('laufender Punkt über Budget zählt bisherige Zeit', () => {
    const run = { ...pend(5), gestartet_am: T0 }
    expect(projectedEnd(T0, [run, pend(5)], at(8))).toEqual(at(13))
  })
  it('Vorschläge und gestrichene zählen nicht', () => {
    expect(projectedEnd(T0, [pend(5), { ...pend(9), status: 'gestrichen' }, { ...pend(9), status: 'vorschlag' }], at(0))).toEqual(at(5))
  })
})

describe('canFinish', () => {
  it('beschlossen/vertagt brauchen Text', () => {
    expect(canFinish('beschlossen', 'Beschluss')).toBe(true)
    expect(canFinish('beschlossen', '')).toBe(false)
    expect(canFinish('vertagt', 'Grund')).toBe(true)
    expect(canFinish('vertagt', '')).toBe(false)
  })
  it('nur Leerzeichen/Zeilenumbrüche zählen nicht', () => {
    expect(canFinish('beschlossen', '   \n ')).toBe(false)
    expect(canFinish('vertagt', '\t ')).toBe(false)
  })
  it('kenntnis braucht keinen Text, null nie', () => {
    expect(canFinish('kenntnis', '')).toBe(true)
    expect(canFinish(null, 'x')).toBe(false)
  })
})
