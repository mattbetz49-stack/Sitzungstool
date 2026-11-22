import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { deadlineDate, isProposalOpen } from '../lib/deadline'
import { formatDate, formatTime } from '../lib/format'
import type { Item, Meeting, Profile, Top, Ziel } from '../lib/types'

const zielText: Record<Ziel, string> = { entscheidung: 'Entscheidung nötig', info: 'Nur Info' }

/** Mitglieder: eigene Vorschläge einreichen/bearbeiten bis zur Frist. */
export function ProposalForm({ m, userId }: { m: Meeting; userId: string }) {
  const [mine, setMine] = useState<Item[]>([])
  const [f, setF] = useState({ titel: '', beschreibung: '', minuten: 5, ziel: 'info' as Ziel })
  const [err, setErr] = useState<string | null>(null)
  const open = isProposalOpen(m, new Date())
  const dl = deadlineDate(m)

  const load = useCallback(async () => {
    const { data } = await supabase.from('unterpunkte').select('*').eq('sitzung_id', m.id).eq('eingereicht_von', userId).order('position')
    setMine((data ?? []) as Item[])
  }, [m.id, userId])
  useEffect(() => { load() }, [load])

  async function submit(e: FormEvent) {
    e.preventDefault(); setErr(null)
    const { error } = await supabase.from('unterpunkte').insert({ sitzung_id: m.id, titel: f.titel.trim(), beschreibung: f.beschreibung.trim(), minuten: f.minuten, ziel: f.ziel, status: 'vorschlag', eingereicht_von: userId })
    if (error) { setErr('Einreichen nicht möglich (Frist abgelaufen?).'); return }
    setF({ titel: '', beschreibung: '', minuten: 5, ziel: 'info' }); load()
  }
  async function del(i: Item) { if (confirm('Vorschlag löschen?')) { await supabase.from('unterpunkte').delete().eq('id', i.id); load() } }

  return (
    <div className="card">
      <h3>Punkt vorschlagen</h3>
      <p className="muted">Einreichfrist: {formatDate(dl)}, {formatTime(dl)} Uhr</p>
      {open ? (
        <form onSubmit={submit}>
          <label>Titel<input required value={f.titel} onChange={e => setF({ ...f, titel: e.target.value })} /></label>
          <label>Kurzbeschreibung<textarea rows={3} value={f.beschreibung} onChange={e => setF({ ...f, beschreibung: e.target.value })} /></label>
          <div className="row">
            <label>Gewünschte Dauer (min)<input type="number" min={1} value={f.minuten} onChange={e => setF({ ...f, minuten: +e.target.value })} /></label>
            <label>Ziel<select value={f.ziel} onChange={e => setF({ ...f, ziel: e.target.value as Ziel })}>
              <option value="info">Nur Info</option><option value="entscheidung">Entscheidung nötig</option></select></label>
          </div>
          {err && <p className="danger">{err}</p>}
          <button className="primary">Vorschlag einreichen</button>
        </form>
      ) : <p className="warn">Die Einreichfrist ist abgelaufen. Bitte wende dich an einen Admin.</p>}
      {mine.length > 0 && <><h4>Meine Vorschläge</h4>
        {mine.map(i => <div className="item" key={i.id}>
          <span className="grow"><strong>{i.titel}</strong> · {i.minuten} min · {zielText[i.ziel]} {i.status !== 'vorschlag' && <span className="badge">{i.status === 'gestrichen' ? 'abgelehnt' : 'in der Tagesordnung'}</span>}</span>
          {open && i.status === 'vorschlag' && <button className="small" onClick={() => del(i)}>Löschen</button>}
        </div>)}</>}
    </div>
  )
}

/** Admin: Vorschläge den TOPs zuordnen oder ablehnen. */
export function ProposalInbox({ sitzungId, onChanged }: { sitzungId: string; onChanged: () => void }) {
  const [list, setList] = useState<Item[]>([]); const [tops, setTops] = useState<Top[]>([]); const [who, setWho] = useState<Record<string, string>>({})
  const [sel, setSel] = useState<Record<string, string>>({})
  const load = useCallback(async () => {
    const [i, t, p] = await Promise.all([
      supabase.from('unterpunkte').select('*').eq('sitzung_id', sitzungId).eq('status', 'vorschlag'),
      supabase.from('tops').select('*').eq('sitzung_id', sitzungId).order('position'),
      supabase.from('profiles').select('id,name'),
    ])
    setList((i.data ?? []) as Item[]); setTops((t.data ?? []) as Top[])
    setWho(Object.fromEntries(((p.data ?? []) as Profile[]).map(x => [x.id, x.name])))
  }, [sitzungId])
  useEffect(() => { load() }, [load])
  if (!list.length) return null

  async function assign(i: Item) {
    const top = sel[i.id] || tops[tops.length - 1]?.id; if (!top) return
    await supabase.from('unterpunkte').update({ top_id: top, status: 'geplant', position: 999 }).eq('id', i.id)
    await load(); onChanged()
  }
  async function reject(i: Item) { await supabase.from('unterpunkte').update({ status: 'gestrichen' }).eq('id', i.id); await load() }

  return (
    <div className="card">
      <h3>Eingereichte Vorschläge ({list.length})</h3>
      {list.map(i => (
        <div key={i.id} className="item" style={{ flexWrap: 'wrap' }}>
          <div className="grow"><strong>{i.titel}</strong> · {i.minuten} min · {zielText[i.ziel]} <span className="muted">von {who[i.eingereicht_von ?? ''] ?? '?'}</span>
            {i.beschreibung && <div className="muted">{i.beschreibung}</div>}</div>
          <select style={{ width: 'auto' }} value={sel[i.id] ?? tops[tops.length - 1]?.id ?? ''} onChange={e => setSel({ ...sel, [i.id]: e.target.value })}>
            {tops.map(t => <option key={t.id} value={t.id}>{t.titel}</option>)}
          </select>
          <button className="small primary" onClick={() => assign(i)}>Übernehmen</button>
          <button className="small" onClick={() => reject(i)}>Ablehnen</button>
        </div>
      ))}
    </div>
  )
}
