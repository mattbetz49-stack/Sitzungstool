import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import AgendaEditor from '../components/AgendaEditor'
import AgendaView from '../components/AgendaView'
import TimeSummary from '../components/TimeSummary'
import { ProposalForm, ProposalInbox } from '../components/ProposalForm'
import { formatDate, meetingStart } from '../lib/format'
import type { Meeting } from '../lib/types'
import type { PlanItem } from '../lib/planning'

export default function MeetingDetail() {
  const { id } = useParams(); const { isAdmin, profile } = useAuth()
  const [m, setM] = useState<Meeting | null>(null)
  const [plan, setPlan] = useState<PlanItem[]>([])
  const [rev, setRev] = useState(0)
  const nav = useNavigate()
  const load = () => supabase.from('sitzungen').select('*').eq('id', id!).single().then(r => setM(r.data as Meeting))
  useEffect(() => { load() }, [id])
  if (!m) return <p>Lädt …</p>
  const upd = async (patch: Partial<Meeting>) => { await supabase.from('sitzungen').update(patch).eq('id', m.id); load() }
  const showAgenda = m.status !== 'entwurf'
  async function remove() {
    const warn = m!.status === 'beendet'
      ? 'Diese Sitzung ist beendet. Beim Löschen verschwinden auch Protokoll, Beschlüsse und alle Aufgaben, die zu dieser Sitzung gehören (auch aus früheren Sitzungen übernommene). Das kann nicht rückgängig gemacht werden. Wirklich löschen?'
      : 'Sitzung mit Tagesordnung, Vorschlägen und Aufgaben löschen? Das kann nicht rückgängig gemacht werden.'
    if (!confirm(warn)) return
    const { error } = await supabase.from('sitzungen').delete().eq('id', m!.id)
    if (error) { alert('Löschen hat nicht geklappt.'); return }
    nav('/sitzungen')
  }

  return (<>
    <h1>Sitzung am {formatDate(m.datum)}, {m.beginn.slice(0, 5)} Uhr</h1>
    {isAdmin && <>
      <div className="card row">
        <label>Datum<input type="date" value={m.datum} onChange={e => upd({ datum: e.target.value })} /></label>
        <label>Beginn<input type="time" value={m.beginn.slice(0, 5)} onChange={e => upd({ beginn: e.target.value })} /></label>
        <label>Dauer (min)<input type="number" min={0} value={m.geplante_dauer_min} onChange={e => upd({ geplante_dauer_min: +e.target.value })} /></label>
        <label>Frist (Tage)<input type="number" min={0} value={m.einreichfrist_tage} onChange={e => upd({ einreichfrist_tage: +e.target.value })} /></label>
      </div>
      <div className="row">
        {m.status === 'entwurf' && <button className="primary" onClick={() => upd({ status: 'veroeffentlicht' })}>Tagesordnung veröffentlichen</button>}
        {m.status === 'veroeffentlicht' && <button onClick={() => upd({ status: 'entwurf' })}>Zurück in Entwurf</button>}
        {(m.status === 'veroeffentlicht' || m.status === 'laeuft') && <Link className="btn primary" to={`/sitzungen/${m.id}/live`}>{m.status === 'laeuft' ? 'Sitzung fortsetzen' : 'Sitzung starten'}</Link>}
        {m.status === 'beendet' && <Link className="btn primary" to={`/sitzungen/${m.id}/protokoll`}>Protokoll</Link>}
      </div>
      <ProposalInbox sitzungId={m.id} onChanged={() => setRev(rev + 1)} />
      <TimeSummary items={plan} gesamtMin={m.geplante_dauer_min} start={meetingStart(m)} />
      <AgendaEditor key={rev} sitzungId={m.id} readOnly={m.status === 'beendet'} onChange={setPlan} />
      <hr />
      <button onClick={remove}>Sitzung löschen</button>
    </>}
    {!isAdmin && <>
      {m.status === 'beendet' && <Link className="btn primary" to={`/sitzungen/${m.id}/protokoll`}>Protokoll ansehen</Link>}
      {m.status !== 'beendet' && profile && <ProposalForm m={m} userId={profile.id} />}
      {showAgenda ? <><h2>Tagesordnung</h2><AgendaView m={m} /></> : <p className="muted">Die Tagesordnung wird nach der Einreichfrist veröffentlicht.</p>}
    </>}
  </>)
}
