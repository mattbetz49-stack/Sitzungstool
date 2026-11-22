import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import TaskList from '../components/TaskList'
import { deadlineDate, isProposalOpen } from '../lib/deadline'
import { formatDate, formatTime } from '../lib/format'
import type { Meeting, Profile, Task } from '../lib/types'

export default function Start() {
  const { profile, isAdmin } = useAuth()
  const [next, setNext] = useState<Meeting | null>(null); const [tasks, setTasks] = useState<Task[]>([]); const [names, setNames] = useState<Record<string, string>>({})
  const load = useCallback(async () => {
    const [m, t, p] = await Promise.all([
      supabase.from('sitzungen').select('*').neq('status', 'beendet').order('datum').order('beginn').limit(1).maybeSingle(),
      supabase.from('aufgaben').select('*').eq('verantwortlicher', profile!.id).eq('erledigt', false).order('bis_wann', { nullsFirst: false }),
      supabase.from('profiles').select('id,name'),
    ])
    setNext(m.data as Meeting | null); setTasks((t.data ?? []) as Task[])
    setNames(Object.fromEntries(((p.data ?? []) as Profile[]).map(x => [x.id, x.name])))
  }, [profile])
  useEffect(() => { load(); const h = setInterval(load, 30_000); return () => clearInterval(h) }, [load])

  return (<>
    <h1>Hallo {profile?.name}</h1>
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Nächste Sitzung</h3>
      {next ? <>
        <p><strong>{formatDate(next.datum)}, {next.beginn.slice(0, 5)} Uhr</strong></p>
        {next.status === 'entwurf' && isProposalOpen(next, new Date()) && <p className="muted">Punkte vorschlagen bis {formatDate(deadlineDate(next))}, {formatTime(deadlineDate(next))} Uhr.</p>}
        <Link className="btn primary" to={`/sitzungen/${next.id}`}>{next.status === 'entwurf' && !isAdmin ? 'Punkt vorschlagen' : 'Tagesordnung ansehen'}</Link>
      </> : <p className="muted">Noch keine Sitzung geplant.</p>}
    </div>
    <h2>Meine offenen Aufgaben</h2>
    <TaskList tasks={tasks} names={names} userId={profile!.id} isAdmin={isAdmin} onChanged={load} />
  </>)
}
