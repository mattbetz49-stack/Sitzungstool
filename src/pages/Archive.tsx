import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/format'
import type { Item, Meeting, Task } from '../lib/types'

export default function Archive() {
  const [meetings, setMeetings] = useState<Meeting[]>([]); const [items, setItems] = useState<Item[]>([]); const [tasks, setTasks] = useState<Task[]>([])
  const [q, setQ] = useState(''); const [year, setYear] = useState(''); const [erg, setErg] = useState('')
  useEffect(() => {
    (async () => {
      const m = await supabase.from('sitzungen').select('*').eq('status', 'beendet').order('datum', { ascending: false })
      const ids = (m.data ?? []).map(x => x.id)
      const [i, t] = ids.length ? await Promise.all([
        supabase.from('unterpunkte').select('*').in('sitzung_id', ids).eq('status', 'erledigt'),
        supabase.from('aufgaben').select('*').in('sitzung_id', ids)]) : [{ data: [] }, { data: [] }]
      setMeetings((m.data ?? []) as Meeting[]); setItems((i.data ?? []) as Item[]); setTasks((t.data ?? []) as Task[])
    })()
  }, [])

  const dateOf = useMemo(() => new Map(meetings.map(m => [m.id, m])), [meetings])
  const years = Array.from(new Set(meetings.map(m => m.datum.slice(0, 4))))
  const needle = q.trim().toLowerCase()
  const inYear = (sid: string) => !year || dateOf.get(sid)?.datum.startsWith(year)
  const hitsItems = items.filter(i => inYear(i.sitzung_id) && (!erg || i.ergebnis === erg) &&
    (!needle || [i.titel, i.beschreibung, i.ergebnistext].some(x => x.toLowerCase().includes(needle))))
  const hitsTasks = erg ? [] : tasks.filter(t => inYear(t.sitzung_id) && needle && t.was.toLowerCase().includes(needle))
  const searching = Boolean(needle || erg)
  const label: Record<string, string> = { beschlossen: 'Beschlossen', vertagt: 'Vertagt', kenntnis: 'Zur Kenntnis' }

  return (<>
    <h1>Archiv</h1>
    <div className="row">
      <label className="grow">Suchen<input value={q} onChange={e => setQ(e.target.value)} placeholder="Stichwort in Beschlüssen, Punkten, Aufgaben" /></label>
      <label>Jahr<select value={year} onChange={e => setYear(e.target.value)}><option value="">Alle</option>{years.map(y => <option key={y}>{y}</option>)}</select></label>
      <label>Ergebnis<select value={erg} onChange={e => setErg(e.target.value)}><option value="">Alle</option><option value="beschlossen">Beschlossen</option><option value="vertagt">Vertagt</option><option value="kenntnis">Zur Kenntnis</option></select></label>
    </div>
    {searching ? <>
      {hitsItems.map(i => <Link to={`/sitzungen/${i.sitzung_id}/protokoll`} key={i.id} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        <span className="muted">{formatDate(dateOf.get(i.sitzung_id)!.datum)}</span> <span className="badge">{i.ergebnis ? label[i.ergebnis] : ''}</span>
        <div><strong>{i.titel}</strong></div>{i.ergebnistext && <div>{i.ergebnistext}</div>}</Link>)}
      {hitsTasks.map(t => <Link to={`/sitzungen/${t.sitzung_id}/protokoll`} key={t.id} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        <span className="muted">{formatDate(dateOf.get(t.sitzung_id)!.datum)}</span> <span className="badge">Aufgabe</span><div>{t.was}</div></Link>)}
      {!hitsItems.length && !hitsTasks.length && <p className="muted">Keine Treffer.</p>}
    </> : <>
      {meetings.filter(m => inYear(m.id)).map(m => <Link to={`/sitzungen/${m.id}/protokoll`} key={m.id} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        <strong>Sitzung vom {formatDate(m.datum)}</strong></Link>)}
      {!meetings.length && <p className="muted">Noch keine beendeten Sitzungen.</p>}
    </>}
  </>)
}
