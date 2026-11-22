import type { Item, Task } from './types'

/** Vertagte Punkte und offene Aufgaben der letzten Sitzung. Items sind zurückgesetzt (Ergebnis, Timer); Aufgaben unverändert. */
export function collectCarryover(prev: { unterpunkte: Item[]; aufgaben: Task[] } | null): { items: Item[]; tasks: Task[] } {
  if (!prev) return { items: [], tasks: [] }
  const items = prev.unterpunkte.filter(i => i.ergebnis === 'vertagt').map(i => ({
    ...i, status: 'geplant' as const, ergebnis: null, ergebnistext: '', uebernommen_aus: i.sitzung_id,
    verlaengerung_min: 0, gestartet_am: null, tatsaechliche_sekunden: null,
  }))
  const tasks = prev.aufgaben.filter(t => !t.erledigt)
  return { items, tasks }
}

/** Beim Beenden: noch offene (geplante) Punkte als „vertagt“ abschließen, damit sie in die nächste Sitzung wandern. */
export function closeOpenItems(items: Item[]): { id: string; patch: Pick<Item, 'status' | 'ergebnis' | 'ergebnistext'> }[] {
  return items.filter(i => i.status === 'geplant')
    .map(i => ({ id: i.id, patch: { status: 'erledigt' as const, ergebnis: 'vertagt' as const, ergebnistext: 'Zeitlich nicht behandelt' } }))
}
