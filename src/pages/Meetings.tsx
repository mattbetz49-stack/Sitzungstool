import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { createMeeting } from '../lib/meetingService'
import { formatDate } from '../lib/format'
import type { Meeting } from '../lib/types'

const label: Record<string, string> = { entwurf: 'Entwurf', veroeffentlicht: 'Veröffentlicht', laeuft: 'Läuft', beendet: 'Beendet' }

export default function Meetings() {
  const { isAdmin } = useAuth(); const nav = useNavigate()
  const [list, setList] = useState<Meeting[]>([])
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ datum: '', beginn: '19:00', dauer: 90, frist: 2 })
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => { supabase.from('sitzungen').select('*').order('datum', { ascending: false }).then(r => setList((r.data ?? []) as Meeting[])) }, [])
  const visible = list

  async function create(e: FormEvent) {
    e.preventDefault()
    try { nav('/sitzungen/' + await createMeeting({ datum: f.datum, beginn: f.beginn, geplante_dauer_min: f.dauer, einreichfrist_tage: f.frist })) }
    catch (x) { setErr((x as Error).message) }
  }
  return (<>
    <h1>Sitzungen</h1>
    {isAdmin && !open && <button className="primary" onClick={() => setOpen(true)}>+ Neue Sitzung</button>}
    {open && <form onSubmit={create} className="card">
      <h3>Neue Sitzung</h3>
      <div className="row">
        <label>Datum<input type="date" required value={f.datum} onChange={e => setF({ ...f, datum: e.target.value })} /></label>
        <label>Beginn<input type="time" required value={f.beginn} onChange={e => setF({ ...f, beginn: e.target.value })} /></label>
        <label>Dauer (min)<input type="number" min={0} value={f.dauer} onChange={e => setF({ ...f, dauer: +e.target.value })} /></label>
        <label>Frist (Tage vorher)<input type="number" min={0} value={f.frist} onChange={e => setF({ ...f, frist: +e.target.value })} /></label>
      </div>
      {err && <p className="danger">{err}</p>}
      <button className="primary">Anlegen</button> <button type="button" onClick={() => setOpen(false)}>Abbrechen</button>
    </form>}
    {visible.map(m => (
      <Link key={m.id} to={'/sitzungen/' + m.id} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        <strong>{formatDate(m.datum)}, {m.beginn.slice(0, 5)} Uhr</strong> <span className="badge">{label[m.status]}</span>
      </Link>
    ))}
    {!visible.length && <p className="muted">Noch keine Sitzungen.</p>}
  </>)
}
