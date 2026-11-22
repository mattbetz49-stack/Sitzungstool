export interface PlanItem { id: string; minuten: number; status: string }

const counts = (s: string) => s === 'geplant' || s === 'erledigt'

export function planSummary(items: PlanItem[], gesamtMin: number) {
  const summeMin = items.filter(i => counts(i.status)).reduce((a, i) => a + i.minuten, 0)
  const restMin = gesamtMin - summeMin
  return { summeMin, restMin, ueberplant: restMin < 0, ueberMin: Math.max(0, -restMin) }
}

export function scheduleItems(startISO: string, items: PlanItem[]): { id: string; von: Date; bis: Date }[] {
  let t = new Date(startISO).getTime()
  return items.filter(i => counts(i.status)).map(i => {
    const von = new Date(t); t += i.minuten * 60_000
    return { id: i.id, von, bis: new Date(t) }
  })
}

export function reorder<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const copy = list.slice()
  const [moved] = copy.splice(fromIndex, 1)
  copy.splice(toIndex, 0, moved)
  return copy
}
