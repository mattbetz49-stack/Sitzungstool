import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { buildProtocol, type Protocol as P } from '../lib/protocol'
import type { Attendance, Item, Meeting, Profile, Task, Top } from '../lib/types'

export default function Protocol() {
  const { id } = useParams()
  const [p, setP] = useState<P | null>(null); const [state, setState] = useState<'laden' | 'offen' | 'fehler'>('laden')
  useEffect(() => {
    (async () => {
      const [s, t, i, a, at, pr] = await Promise.all([
        supabase.from('sitzungen').select('*').eq('id', id!).single(),
        supabase.from('tops').select('*').eq('sitzung_id', id!),
        supabase.from('unterpunkte').select('*').eq('sitzung_id', id!),
        supabase.from('aufgaben').select('*').or(`sitzung_id.eq.${id},urspruenglich_sitzung_id.eq.${id}`),
        supabase.from('anwesenheit').select('*').eq('sitzung_id', id!),
        supabase.from('profiles').select('*').order('name'),
      ])
      if (s.error || !s.data) { setState('fehler'); return }
      const m = s.data as Meeting
      if (m.status !== 'beendet') { setState('offen'); return }
      setP(buildProtocol({ sitzung: m, tops: (t.data ?? []) as Top[], items: (i.data ?? []) as Item[], aufgaben: (a.data ?? []) as Task[],
        anwesend: ((at.data ?? []) as Attendance[]).filter(x => x.anwesend).map(x => x.mitglied_id), mitglieder: (pr.data ?? []) as Profile[] }))
    })()
  }, [id])

  if (state === 'offen') return <p>Das Protokoll liegt vor, sobald die Sitzung beendet ist.</p>
  if (state === 'fehler') return <p className="error">Protokoll konnte nicht geladen werden.</p>
  if (!p) return <p>Lädt …</p>
  return (<>
    <div className="noprint row"><button className="primary" onClick={() => window.print()}>Drucken / Als PDF speichern</button><Link className="btn" to="/archiv">Zum Archiv</Link></div>
    <h1>{p.titel}</h1>
    <p><strong>ASV Steinach 1947</strong> · Dauer: {p.dauerMin === null ? '–' : `${p.dauerMin} Minuten`}</p>
    <h2>Anwesende</h2><p>{p.anwesende.length ? p.anwesende.join(', ') : '–'}</p>
    <h2>Beschlüsse</h2>
    {p.beschluesse.length ? <ol>{p.beschluesse.map((b, n) => <li key={n}><strong>{b.titel}</strong> ({b.top}): {b.text}</li>)}</ol> : <p>Keine.</p>}
    <h2>Aufgaben</h2>
    {p.aufgaben.length ? <table><thead><tr><th>Wer</th><th>Was</th><th>Bis wann</th></tr></thead><tbody>
      {p.aufgaben.map((a, n) => <tr key={n}><td>{a.wer}</td><td>{a.was}</td><td>{a.bis}</td></tr>)}</tbody></table> : <p>Keine.</p>}
    <h2>Vertagte Punkte</h2>
    {p.vertagt.length ? <ul>{p.vertagt.map((v, n) => <li key={n}><strong>{v.titel}</strong> – {v.grund}</li>)}</ul> : <p>Keine.</p>}
    <h2>Zur Kenntnis genommen</h2>
    {p.kenntnis.length ? <ul>{p.kenntnis.map((k, n) => <li key={n}>{k}</li>)}</ul> : <p>Keine.</p>}
  </>)
}
