import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import TaskList from '../components/TaskList'
import type { Profile, Task } from '../lib/types'

export default function Tasks() {
  const { profile, isAdmin } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([]); const [people, setPeople] = useState<Profile[]>([])
  const [filter, setFilter] = useState<'meine' | 'offen' | 'alle'>('offen')
  const [f, setF] = useState({ wer: '', was: '', bis: '' }); const [err, setErr] = useState<string | null>(null)
  const load = useCallback(async () => {
    const [t, p] = await Promise.all([supabase.from('aufgaben').select('*').order('bis_wann', { nullsFirst: false }), supabase.from('profiles').select('*').order('name')])
    setTasks((t.data ?? []) as Task[]); setPeople((p.data ?? []) as Profile[])
  }, [])
  useEffect(() => { load() }, [load])
  const names = Object.fromEntries(people.map(p => [p.id, p.name]))
  const shown = tasks.filter(t => filter === 'alle' || (filter === 'offen' ? !t.erledigt : t.verantwortlicher === profile!.id && !t.erledigt))

  async function add(e: FormEvent) {
    e.preventDefault(); setErr(null)
    const { data: s } = await supabase.from('sitzungen').select('id').neq('status', 'beendet').order('datum').limit(1).maybeSingle()
    const sid = s?.id ?? (await supabase.from('sitzungen').select('id').order('datum', { ascending: false }).limit(1).maybeSingle()).data?.id
    if (!sid) { setErr('Lege zuerst eine Sitzung an.'); return }
    const { error } = await supabase.from('aufgaben').insert({ sitzung_id: sid, verantwortlicher: f.wer, was: f.was.trim(), bis_wann: f.bis || null })
    if (error) { setErr('Speichern nicht möglich.'); return }
    setF({ wer: '', was: '', bis: '' }); load()
  }
  return (<>
    <h1>Aufgaben</h1>
    <div className="row">
      {(['offen', 'meine', 'alle'] as const).map(k => <button key={k} className={filter === k ? 'primary' : ''} onClick={() => setFilter(k)}>{k === 'offen' ? 'Alle offenen' : k === 'meine' ? 'Meine offenen' : 'Alle (inkl. erledigt)'}</button>)}
    </div>
    <TaskList tasks={shown} names={names} userId={profile!.id} isAdmin={isAdmin} onChanged={load} />
    {isAdmin && <form className="card" onSubmit={add}>
      <h3>Aufgabe anlegen</h3>
      <div className="row">
        <label className="grow">Wer<select required value={f.wer} onChange={e => setF({ ...f, wer: e.target.value })}><option value="">–</option>{people.filter(p => p.aktiv).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="grow">Was<input required value={f.was} onChange={e => setF({ ...f, was: e.target.value })} /></label>
        <label>Bis wann<input type="date" value={f.bis} onChange={e => setF({ ...f, bis: e.target.value })} /></label>
      </div>
      {err && <p className="danger">{err}</p>}<button className="primary">Speichern</button>
    </form>}
  </>)
}
