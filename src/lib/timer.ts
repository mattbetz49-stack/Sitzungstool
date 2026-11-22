import type { Ergebnis } from './types'

export type TimerColor = 'gruen' | 'gelb' | 'rot'

export function itemTimer(
  item: { minuten: number; verlaengerung_min: number; gestartet_am: string | null }, now: Date,
): { restSek: number; color: TimerColor } {
  const budget = (item.minuten + item.verlaengerung_min) * 60
  const elapsed = item.gestartet_am ? Math.max(0, Math.floor((now.getTime() - new Date(item.gestartet_am).getTime()) / 1000)) : 0
  const restSek = budget - elapsed
  return { restSek, color: restSek <= 0 ? 'rot' : restSek <= 60 ? 'gelb' : 'gruen' }
}

interface EndItem { minuten: number; verlaengerung_min: number; status: string; tatsaechliche_sekunden: number | null; gestartet_am: string | null }

/** Voraussichtliches Sitzungsende. `items` in Reihenfolge; `startISO` = tatsächlicher (sonst geplanter) Beginn. */
export function projectedEnd(startISO: string, items: EndItem[], now: Date): Date {
  let sek = 0
  for (const i of items) {
    const budget = (i.minuten + i.verlaengerung_min) * 60
    if (i.status === 'erledigt') sek += i.tatsaechliche_sekunden ?? budget
    else if (i.status === 'geplant') {
      if (i.gestartet_am) {
        const elapsed = Math.max(0, Math.floor((now.getTime() - new Date(i.gestartet_am).getTime()) / 1000))
        sek += Math.max(elapsed, budget)
      } else sek += budget
    }
  }
  return new Date(new Date(startISO).getTime() + sek * 1000)
}

export function canFinish(ergebnis: Ergebnis | null, text: string): boolean {
  if (!ergebnis) return false
  if (ergebnis === 'kenntnis') return true
  return text.trim().length > 0
}
