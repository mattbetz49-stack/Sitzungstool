import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/format'
import type { Task } from '../lib/types'

const today = () => new Date().toISOString().slice(0, 10)

export default function TaskList({ tasks, names, userId, isAdmin, onChanged }: {
  tasks: Task[]; names: Record<string, string>; userId: string; isAdmin: boolean; onChanged: () => void
}) {
  async function toggle(t: Task) {
    await supabase.from('aufgaben').update({ erledigt: !t.erledigt }).eq('id', t.id); onChanged()
  }
  async function del(t: Task) { if (confirm('Aufgabe löschen?')) { await supabase.from('aufgaben').delete().eq('id', t.id); onChanged() } }
  if (!tasks.length) return <p className="muted">Keine Aufgaben.</p>
  return <>{tasks.map(t => {
    const overdue = !t.erledigt && t.bis_wann && t.bis_wann < today()
    const can = isAdmin || t.verantwortlicher === userId
    return (
      <div className="item" key={t.id}>
        <input type="checkbox" style={{ width: 24, height: 24 }} checked={t.erledigt} disabled={!can} onChange={() => toggle(t)} aria-label="Erledigt" />
        <span className="grow" style={{ textDecoration: t.erledigt ? 'line-through' : 'none' }}>
          <strong>{t.was}</strong> <span className="muted">· {names[t.verantwortlicher] ?? '?'}</span>
        </span>
        <span className={overdue ? 'error' : 'muted'}>{t.bis_wann ? 'bis ' + formatDate(t.bis_wann) : 'ohne Termin'}{overdue ? ' (überfällig)' : ''}</span>
        {isAdmin && <button className="small" onClick={() => del(t)}>✕</button>}
      </div>
    )
  })}</>
}
