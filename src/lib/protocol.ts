import { formatDate } from './format'
import type { Item, Meeting, Profile, Task, Top } from './types'

export interface Protocol {
  titel: string; datum: string; anwesende: string[]; dauerMin: number | null
  beschluesse: { top: string; titel: string; text: string }[]
  vertagt: { titel: string; grund: string }[]
  kenntnis: string[]
  aufgaben: { wer: string; was: string; bis: string }[]
}

export function buildProtocol(input: {
  sitzung: Meeting; tops: Top[]; items: Item[]; aufgaben: Task[]; anwesend: string[]; mitglieder: Profile[]
}): Protocol {
  const { sitzung, tops, items, aufgaben, anwesend, mitglieder } = input
  const topsSorted = tops.slice().sort((a, b) => a.position - b.position)
  const ordered = topsSorted.flatMap(t => items.filter(i => i.top_id === t.id && i.status === 'erledigt').sort((a, b) => a.position - b.position)
    .map(i => ({ i, top: t.titel })))
  const name = (id: string) => mitglieder.find(m => m.id === id)?.name ?? 'Unbekannt'
  const dauerMin = sitzung.tatsaechlich_start && sitzung.tatsaechlich_ende
    ? Math.round((new Date(sitzung.tatsaechlich_ende).getTime() - new Date(sitzung.tatsaechlich_start).getTime()) / 60000) : null
  return {
    titel: `Protokoll der Vorstandssitzung vom ${formatDate(sitzung.datum)}`,
    datum: formatDate(sitzung.datum),
    anwesende: mitglieder.filter(m => anwesend.includes(m.id)).map(m => m.name),
    dauerMin,
    beschluesse: ordered.filter(x => x.i.ergebnis === 'beschlossen').map(x => ({ top: x.top, titel: x.i.titel, text: x.i.ergebnistext })),
    vertagt: ordered.filter(x => x.i.ergebnis === 'vertagt').map(x => ({ titel: x.i.titel, grund: x.i.ergebnistext })),
    kenntnis: ordered.filter(x => x.i.ergebnis === 'kenntnis').map(x => x.i.titel),
    aufgaben: aufgaben.filter(t => (t.urspruenglich_sitzung_id ?? t.sitzung_id) === sitzung.id)
      .map(t => ({ wer: name(t.verantwortlicher), was: t.was, bis: t.bis_wann ? formatDate(t.bis_wann) : 'ohne Termin' })),
  }
}
