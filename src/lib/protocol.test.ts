import { describe, it, expect } from 'vitest'
import { buildProtocol } from './protocol'
import type { Item, Meeting, Profile, Task, Top } from './types'

const meeting: Meeting = { id: 'S', datum: '2026-12-10', beginn: '19:00', geplante_dauer_min: 90, einreichfrist_tage: 2, status: 'beendet',
  tatsaechlich_start: '2026-12-10T18:00:00.000Z', tatsaechlich_ende: '2026-12-10T19:25:00.000Z' }
const tops: Top[] = [{ id: 't2', sitzung_id: 'S', titel: 'Fußball', position: 2 }, { id: 't1', sitzung_id: 'S', titel: 'Veranstaltungen', position: 1 }]
const mk = (id: string, top: string, pos: number, ergebnis: Item['ergebnis'], text = ''): Item => ({
  id, sitzung_id: 'S', top_id: top, titel: id, beschreibung: '', minuten: 5, ziel: 'info', status: 'erledigt', ergebnis, ergebnistext: text,
  eingereicht_von: null, uebernommen_aus: null, position: pos, verlaengerung_min: 0, gestartet_am: null, tatsaechliche_sekunden: 300 })
const prof = (id: string, name: string): Profile => ({ id, name, email: id + '@x.de', role: 'mitglied', aktiv: true })
const base = { sitzung: meeting, tops, mitglieder: [prof('u1', 'Anna'), prof('u2', 'Ben'), prof('u3', 'Cem')], anwesend: ['u1', 'u3'], aufgaben: [] as Task[] }

describe('buildProtocol', () => {
  it('Titel, Datum, nur Anwesende', () => {
    const p = buildProtocol({ ...base, items: [] })
    expect(p.datum).toBe('10.12.2026'); expect(p.titel).toContain('10.12.2026'); expect(p.anwesende).toEqual(['Anna', 'Cem'])
  })
  it('Dauer aus Start/Ende; null wenn Sitzung nicht beendet', () => {
    expect(buildProtocol({ ...base, items: [] }).dauerMin).toBe(85)
    expect(buildProtocol({ ...base, sitzung: { ...meeting, tatsaechlich_ende: null }, items: [] }).dauerMin).toBeNull()
  })
  it('Beschlüsse nach TOP-Reihenfolge', () => {
    const p = buildProtocol({ ...base, items: [mk('F1', 't2', 1, 'beschlossen', 'Trikots kaufen'), mk('V1', 't1', 1, 'beschlossen', 'Fest am 5.7.')] })
    expect(p.beschluesse.map(b => [b.top, b.titel, b.text])).toEqual([['Veranstaltungen', 'V1', 'Fest am 5.7.'], ['Fußball', 'F1', 'Trikots kaufen']])
  })
  it('vertagte Punkte mit Grund, Kenntnisnahmen als Titel', () => {
    const p = buildProtocol({ ...base, items: [mk('A', 't1', 1, 'vertagt', 'Angebote fehlen'), mk('B', 't1', 2, 'kenntnis')] })
    expect(p.vertagt).toEqual([{ titel: 'A', grund: 'Angebote fehlen' }]); expect(p.kenntnis).toEqual(['B'])
  })
  it('Aufgaben dieser Sitzung inkl. weitergewanderter, ohne von früher übernommene', () => {
    const t = (id: string, sitz: string, urspr: string | null): Task => ({ id, sitzung_id: sitz, unterpunkt_id: null, verantwortlicher: 'u2', was: id, bis_wann: '2026-12-20', erledigt: false, urspruenglich_sitzung_id: urspr })
    const p = buildProtocol({ ...base, items: [], aufgaben: [t('neu', 'S', null), t('weiter', 'S2', 'S'), t('alt', 'S', 'S0')] })
    expect(p.aufgaben).toEqual([{ wer: 'Ben', was: 'neu', bis: '20.12.2026' }, { wer: 'Ben', was: 'weiter', bis: '20.12.2026' }])
  })
})
