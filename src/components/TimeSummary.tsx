import { planSummary, type PlanItem } from '../lib/planning'
import { formatTime } from '../lib/format'

export default function TimeSummary({ items, gesamtMin, start }: { items: PlanItem[]; gesamtMin: number; start: Date }) {
  const s = planSummary(items, gesamtMin)
  const ende = new Date(start.getTime() + s.summeMin * 60_000)
  return (
    <div className="card">
      <strong>{s.summeMin} von {gesamtMin} Minuten verplant</strong>
      <span className="muted"> · geplantes Ende {formatTime(ende)} Uhr</span>
      {s.ueberplant && <p className="danger">Achtung: Die Tagesordnung ist um {s.ueberMin} Minuten überplant. Bitte Zeiten kürzen oder Punkte streichen.</p>}
      {!s.ueberplant && gesamtMin > 0 && s.restMin >= 30 && <p className="warn">Noch {s.restMin} Minuten frei.</p>}
    </div>
  )
}
