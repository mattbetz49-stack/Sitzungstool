import { describe, it, expect } from 'vitest'
import { planSummary, scheduleItems, reorder, type PlanItem } from './planning'

const items = (n: number, min = 5, status = 'geplant'): PlanItem[] =>
  Array.from({ length: n }, (_, i) => ({ id: 'i' + i, minuten: min, status }))

describe('planSummary', () => {
  it('Summe genau gleich Gesamtdauer: nicht überplant', () => {
    expect(planSummary(items(18), 90)).toEqual({ summeMin: 90, restMin: 0, ueberplant: false, ueberMin: 0 })
  })
  it('5 Minuten zu viel: überplant', () => {
    const s = planSummary([...items(18), ...items(1).map(i => ({ ...i, id: 'x' }))], 90)
    expect(s.ueberplant).toBe(true); expect(s.ueberMin).toBe(5); expect(s.restMin).toBe(-5)
  })
  it('leere Liste: Rest = Gesamtdauer', () => {
    expect(planSummary([], 90)).toEqual({ summeMin: 0, restMin: 90, ueberplant: false, ueberMin: 0 })
  })
  it('Gesamtdauer 0 mit Punkten: überplant, ohne Fehler', () => {
    expect(planSummary(items(2), 0).ueberplant).toBe(true)
    expect(planSummary([], 0).ueberplant).toBe(false)
  })
  it('Vorschläge und gestrichene Punkte zählen nicht', () => {
    expect(planSummary([...items(2), ...items(3, 5, 'vorschlag'), ...items(1, 5, 'gestrichen')], 90).summeMin).toBe(10)
  })
  it('erledigte zählen mit', () => {
    expect(planSummary(items(2, 5, 'erledigt'), 90).summeMin).toBe(10)
  })
})

describe('scheduleItems', () => {
  it('liefert fortlaufende Zeiten ab Start', () => {
    const r = scheduleItems('2026-12-01T19:00:00.000Z', [{ id: 'a', minuten: 5, status: 'geplant' }, { id: 'b', minuten: 10, status: 'geplant' }])
    expect(r[0].von.toISOString()).toBe('2026-12-01T19:00:00.000Z')
    expect(r[0].bis.toISOString()).toBe('2026-12-01T19:05:00.000Z')
    expect(r[1].von.toISOString()).toBe('2026-12-01T19:05:00.000Z')
    expect(r[1].bis.toISOString()).toBe('2026-12-01T19:15:00.000Z')
  })
  it('überspringt Vorschläge und gestrichene', () => {
    const r = scheduleItems('2026-12-01T19:00:00.000Z', [{ id: 'a', minuten: 5, status: 'vorschlag' }, { id: 'b', minuten: 5, status: 'geplant' }])
    expect(r.map(x => x.id)).toEqual(['b'])
  })
})

describe('reorder', () => {
  it('verschiebt und ändert Original nicht', () => {
    const o = ['a', 'b', 'c', 'd']
    expect(reorder(o, 0, 2)).toEqual(['b', 'c', 'a', 'd'])
    expect(o).toEqual(['a', 'b', 'c', 'd'])
  })
})
