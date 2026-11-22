import { describe, it, expect } from 'vitest'
import { collectCarryover } from './carryover'
import type { Item, Task } from './types'

const item = (id: string, ergebnis: Item['ergebnis'], status: Item['status'] = 'erledigt'): Item => ({
  id, sitzung_id: 'S1', top_id: 't', titel: id, beschreibung: '', minuten: 5, ziel: 'info', status, ergebnis,
  ergebnistext: ergebnis === 'vertagt' ? 'Grund' : '', eingereicht_von: null, uebernommen_aus: null, position: 1,
  verlaengerung_min: 2, gestartet_am: '2026-01-01T10:00:00Z', tatsaechliche_sekunden: 300,
})
const task = (id: string, erledigt: boolean): Task => ({ id, sitzung_id: 'S1', unterpunkt_id: null, verantwortlicher: 'u', was: id, bis_wann: null, erledigt })

describe('collectCarryover', () => {
  it('übernimmt vertagte Punkte, nicht beschlossene', () => {
    const r = collectCarryover({ unterpunkte: [item('a', 'vertagt'), item('b', 'beschlossen'), item('c', 'kenntnis')], aufgaben: [] })
    expect(r.items.map(i => i.titel)).toEqual(['a'])
  })
  it('setzt Übernahme-Verweis, Status und setzt Ergebnis/Timer zurück', () => {
    const [i] = collectCarryover({ unterpunkte: [item('a', 'vertagt')], aufgaben: [] }).items
    expect(i.uebernommen_aus).toBe('S1'); expect(i.status).toBe('geplant'); expect(i.ergebnis).toBeNull()
    expect(i.verlaengerung_min).toBe(0); expect(i.gestartet_am).toBeNull(); expect(i.tatsaechliche_sekunden).toBeNull()
  })
  it('übernimmt offene Aufgaben, nicht erledigte', () => {
    const r = collectCarryover({ unterpunkte: [], aufgaben: [task('x', false), task('y', true)] })
    expect(r.tasks.map(t => t.was)).toEqual(['x'])
  })
  it('null (erste Sitzung) und leere Sitzung: leer, kein Fehler', () => {
    expect(collectCarryover(null)).toEqual({ items: [], tasks: [] })
    expect(collectCarryover({ unterpunkte: [], aufgaben: [] })).toEqual({ items: [], tasks: [] })
  })
})

import { closeOpenItems } from './carryover'
describe('closeOpenItems', () => {
  it('markiert nicht behandelte Punkte als vertagt, damit sie übernommen werden', () => {
    const patches = closeOpenItems([item('offen', null, 'geplant'), item('fertig', 'beschlossen'), item('weg', null, 'gestrichen')])
    expect(patches).toEqual([{ id: 'offen', patch: { status: 'erledigt', ergebnis: 'vertagt', ergebnistext: 'Zeitlich nicht behandelt' } }])
  })
  it('leer bei nichts Offenem', () => { expect(closeOpenItems([item('f', 'kenntnis')])).toEqual([]) })
})
