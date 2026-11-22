import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import AgendaEditor from '../components/AgendaEditor'
import { canFinish, itemTimer, projectedEnd } from '../lib/timer'
import { closeOpenItems } from '../lib/carryover'
import { formatTime, meetingStart, mmss } from '../lib/format'
import type { Ergebnis, Item, Meeting, Profile, Top } from '../lib/types'

function useNow() {
  const [n, setN] = useState(new Date())
  useEffect(() => { const h = setInterval(() => setN(new Date()), 1000); return () => clearInterval(h) }, [])
  return n
}

export default function RunMeeting() {
  const { id } = useParams(); const nav = useNavigate(); const { isAdmin } = useAuth(); const now = useNow()
  const [m, setM] = useState<Meeting | null>(null)
  const [tops, setTops] = useState<Top[]>([]); const [items, setItems] = useState<Item[]>([])
  const [members, setMembers] = useState<Profile[]>([]); const [present, setPresent] = useState<Set<string>>(new Set())
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null); const [text, setText] = useState('')
  const [edit, setEdit] = useState(false); const [task, setTask] = useState({ wer: '', was: '', bis: '' })
  const [msg, setMsg] = useState<string | null>(null)
  const started = useRef<string | null>(null)

  const load = useCallback(async () => {
    const [s, t, i, p, a] = await Promise.all([
      supabase.from('sitzungen').select('*').eq('id', id!).single(),
      supabase.from('tops').select('*').eq('sitzung_id', id!).order('position'),
      supabase.from('unterpunkte').select('*').eq('sitzung_id', id!).order('position'),
      supabase.from('profiles').select('*').eq('aktiv', true).order('name'),
      supabase.from('anwesenheit').select('*').eq('sitzung_id', id!),
    ])
    setM(s.data as Meeting); setTops((t.data ?? []) as Top[]); setItems((i.data ?? []) as Item[]); setMembers((p.data ?? []) as Profile[])
    if (a.data?.length) setPresent(new Set(a.data.filter(x => x.anwesend).map(x => x.mitglied_id)))
  }, [id])
  useEffect(() => { load() }, [load])

  const ordered = tops.flatMap(t => items.filter(i => i.top_id === t.id && (i.status === 'geplant' || i.status === 'erledigt')))
  const current = ordered.find(i => i.status === 'geplant')

  // aktuellen Punkt automatisch starten (Zeitstempel gespeichert, übersteht Neuladen)
  useEffect(() => {
    if (m?.status === 'laeuft' && current && !current.gestartet_am && started.current !== current.id) {
      started.current = current.id
      supabase.from('unterpunkte').update({ gestartet_am: new Date().toISOString() }).eq('id', current.id).then(load)
    }
  }, [m?.status, current?.id, current?.gestartet_am]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setErgebnis(null); setText('') }, [current?.id])

  if (!isAdmin) return <Navigate to={`/sitzungen/${id}`} replace />
  if (!m) return <p>Lädt …</p>

  async function begin() {
    await supabase.from('anwesenheit').upsert(members.map(p => ({ sitzung_id: m!.id, mitglied_id: p.id, anwesend: present.has(p.id) })))
    await supabase.from('sitzungen').update({ status: 'laeuft', tatsaechlich_start: new Date().toISOString() }).eq('id', m!.id)
    load()
  }
  async function extend(min: number) {
    if (!current) return
    await supabase.from('unterpunkte').update({ verlaengerung_min: current.verlaengerung_min + min }).eq('id', current.id); load()
  }
  async function finish() {
    if (!current || !canFinish(ergebnis, text)) return
    const elapsed = current.gestartet_am ? Math.floor((Date.now() - new Date(current.gestartet_am).getTime()) / 1000) : 0
    await supabase.from('unterpunkte').update({ status: 'erledigt', ergebnis, ergebnistext: ergebnis === 'kenntnis' ? '' : text.trim(), tatsaechliche_sekunden: elapsed }).eq('id', current.id)
    load()
  }
  async function strike() {
    if (!current || !confirm(`„${current.titel}“ streichen?`)) return
    await supabase.from('unterpunkte').update({ status: 'gestrichen' }).eq('id', current.id); load()
  }
  async function addTask() {
    if (!task.wer || !task.was.trim() || !current) return
    const { error } = await supabase.from('aufgaben').insert({ sitzung_id: m!.id, unterpunkt_id: current.id, verantwortlicher: task.wer, was: task.was.trim(), bis_wann: task.bis || null })
    if (error) { setMsg('Aufgabe konnte nicht gespeichert werden.'); return }
    setMsg('Aufgabe gespeichert.'); setTask({ wer: '', was: '', bis: '' })
  }
  async function endMeeting() {
    if (current && !confirm('Es gibt noch offene Punkte. Sie werden als „vertagt“ in die nächste Sitzung übernommen. Sitzung beenden?')) return
    await Promise.all(closeOpenItems(items).map(c => supabase.from('unterpunkte').update(c.patch).eq('id', c.id)))
    await supabase.from('sitzungen').update({ status: 'beendet', tatsaechlich_ende: new Date().toISOString() }).eq('id', m!.id)
    nav(`/sitzungen/${m!.id}/protokoll`)
  }

  if (m.status === 'entwurf' || m.status === 'beendet') return <main><p>Diese Sitzung kann nicht gestartet werden.</p><Link to={`/sitzungen/${m.id}`}>Zurück</Link></main>

  if (m.status === 'veroeffentlicht') return (
    <main>
      <h1>Sitzung starten</h1>
      <div className="card"><h3>Wer ist anwesend?</h3>
        <button className="small" onClick={() => setPresent(new Set(members.map(x => x.id)))}>Alle</button>
        {members.map(p => <label key={p.id} style={{ fontWeight: 400 }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={present.has(p.id)} onChange={e => { const n = new Set(present); e.target.checked ? n.add(p.id) : n.delete(p.id); setPresent(n) }} /> {p.name}
        </label>)}
      </div>
      <button className="primary" onClick={begin}>Sitzung beginnen</button> <Link className="btn" to={`/sitzungen/${m.id}`}>Zurück</Link>
    </main>
  )

  // laufende Sitzung
  const planStart = meetingStart(m)
  const start = m.tatsaechlich_start ?? planStart.toISOString()
  const plannedEnd = new Date(planStart.getTime() + m.geplante_dauer_min * 60_000)
  const endProj = projectedEnd(start, ordered, now)
  const diffMin = Math.round((endProj.getTime() - plannedEnd.getTime()) / 60_000)
  const sessionElapsed = Math.floor((now.getTime() - new Date(start).getTime()) / 1000)
  const tm = current ? itemTimer(current, now) : null
  const topTitle = current ? tops.find(t => t.id === current.top_id)?.titel : ''
  const pendingAfter = ordered.filter(i => i.status === 'geplant' && i.id !== current?.id)

  return (
    <div className="run">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>Gesamt: <strong>{mmss(sessionElapsed)}</strong> von {m.geplante_dauer_min} min · geplantes Ende {formatTime(plannedEnd)}</div>
        <div style={{ color: diffMin > 0 ? '#ff5252' : '#66bb6a', fontWeight: 700 }}>Voraussichtliches Ende {formatTime(endProj)} ({diffMin > 0 ? '+' : ''}{diffMin} min)</div>
        <Link className="btn" to={`/sitzungen/${m.id}`}>Übersicht</Link>
      </div>
      {current && tm ? <>
        <p className="muted" style={{ color: '#bbb' }}>{topTitle}</p>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', margin: '0 0 .5rem' }}>{current.titel}</h1>
        {current.beschreibung && <p style={{ fontSize: '1.4rem' }}>{current.beschreibung}</p>}
        <span className="badge">{current.ziel === 'entscheidung' ? 'Entscheidung nötig' : 'Nur Info'}</span>
        <div className={'timer ' + tm.color} aria-live="off">{mmss(tm.restSek)}</div>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button onClick={() => extend(2)}>+2 min</button><button onClick={() => extend(5)}>+5 min</button>
          <span style={{ color: '#bbb' }}>Sitzungsende jetzt ca. {formatTime(endProj)} Uhr ({diffMin >= 0 ? '+' : ''}{diffMin} min)</span>
        </div>
        <div className="card" style={{ background: '#1b1b1b', borderColor: '#444' }}>
          <h3 style={{ marginTop: 0 }}>Ergebnis</h3>
          <div className="row">
            {(['beschlossen', 'vertagt', 'kenntnis'] as Ergebnis[]).map(e => (
              <button key={e} className={ergebnis === e ? 'primary' : ''} onClick={() => setErgebnis(e)}>
                {e === 'beschlossen' ? 'Beschlossen' : e === 'vertagt' ? 'Vertagt' : 'Zur Kenntnis genommen'}</button>))}
          </div>
          {(ergebnis === 'beschlossen' || ergebnis === 'vertagt') &&
            <label style={{ color: '#fff' }}>{ergebnis === 'beschlossen' ? 'Beschlusstext' : 'Grund der Vertagung'}
              <textarea rows={2} value={text} onChange={e => setText(e.target.value)} style={{ background: '#fff' }} /></label>}
          <button className="primary" disabled={!canFinish(ergebnis, text)} onClick={finish}>Punkt abschließen und weiter</button>{' '}
          <button onClick={strike}>Punkt streichen</button>
        </div>
        <details className="card" style={{ background: '#1b1b1b', borderColor: '#444' }}>
          <summary>Aufgabe zu diesem Punkt (Wer, Was, Bis wann)</summary>
          <div className="row">
            <select style={{ width: 'auto' }} value={task.wer} onChange={e => setTask({ ...task, wer: e.target.value })}><option value="">Wer?</option>{members.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <input className="grow" placeholder="Was?" value={task.was} onChange={e => setTask({ ...task, was: e.target.value })} />
            <input type="date" style={{ width: 'auto' }} value={task.bis} onChange={e => setTask({ ...task, bis: e.target.value })} />
            <button onClick={addTask}>Speichern</button>
          </div>{msg && <p>{msg}</p>}
        </details>
      </> : <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <h1>Alle Punkte abgeschlossen</h1>
      </div>}
      {pendingAfter.length > 0 && <p style={{ color: '#bbb' }}>Als Nächstes: {pendingAfter.slice(0, 3).map(i => i.titel).join(' · ')}</p>}
      <div className="row">
        <button onClick={() => setEdit(!edit)}>{edit ? 'Tagesordnung schließen' : 'Tagesordnung bearbeiten'}</button>
        <button className="primary" onClick={endMeeting}>Sitzung beenden</button>
      </div>
      {edit && <div style={{ background: '#fff', color: '#222', padding: '1rem', borderRadius: 12, marginTop: '1rem' }}>
        <AgendaEditor sitzungId={m.id} onChange={() => load()} />
      </div>}
    </div>
  )
}
