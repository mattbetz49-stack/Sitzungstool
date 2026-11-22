import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import SortableList from './SortableList'

interface TopRow { id: string; titel: string; position: number }
interface ItemRow { id: string; top_id: string | null; titel: string; minuten: number; position: number; status?: string }

/** Bearbeitet entweder die dauerhafte Vorlage (ohne sitzungId) oder die Tagesordnung einer Sitzung. */
export default function AgendaEditor({ sitzungId, readOnly, onChange }: {
  sitzungId?: string; readOnly?: boolean; onChange?: (items: { id: string; minuten: number; status: string }[]) => void
}) {
  const topT = sitzungId ? 'tops' : 'vorlage_top'
  const itemT = sitzungId ? 'unterpunkte' : 'vorlage_unterpunkt'
  const scope = sitzungId ? { sitzung_id: sitzungId } : {}
  const [tops, setTops] = useState<TopRow[]>([])
  const [items, setItems] = useState<ItemRow[]>([])
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    const a = supabase.from(topT).select('*').order('position')
    const b = supabase.from(itemT).select('*').order('position')
    const [t, i] = await Promise.all([sitzungId ? a.eq('sitzung_id', sitzungId) : a, sitzungId ? b.eq('sitzung_id', sitzungId) : b])
    if (t.error || i.error) { setErr('Laden hat nicht geklappt.'); return }
    const list = ((i.data ?? []) as ItemRow[]).filter(x => !sitzungId || x.status === 'geplant' || x.status === 'erledigt')
    setTops((t.data ?? []) as TopRow[]); setItems(list)
    onChange?.(list.map(x => ({ id: x.id, minuten: x.minuten, status: x.status ?? 'geplant' })))
  }, [sitzungId, topT, itemT]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  const run = async (p: PromiseLike<{ error: unknown }>) => { const r = await p; if (r.error) setErr('Speichern hat nicht geklappt.'); else setErr(null); await load() }
  const savePositions = (table: string, list: { id: string }[]) =>
    Promise.all(list.map((x, idx) => supabase.from(table).update({ position: idx }).eq('id', x.id))).then(() => load())

  const addTop = () => { const t = prompt('Name des neuen TOP:'); if (t?.trim()) run(supabase.from(topT).insert({ titel: t.trim(), position: tops.length + 1, ...scope })) }
  const renameTop = (t: TopRow) => { const n = prompt('Neuer Name:', t.titel); if (n?.trim()) run(supabase.from(topT).update({ titel: n.trim() }).eq('id', t.id)) }
  const delTop = (t: TopRow) => { if (confirm(`TOP „${t.titel}“ mit allen Unterpunkten löschen?`)) run(supabase.from(topT).delete().eq('id', t.id)) }
  const addItem = (t: TopRow) => {
    const n = prompt('Titel des Unterpunkts:'); if (!n?.trim()) return
    const row = items.filter(x => x.top_id === t.id).length + 1
    run(supabase.from(itemT).insert({ top_id: t.id, titel: n.trim(), minuten: 5, position: row, ...scope, ...(sitzungId ? { status: 'geplant' } : {}) }))
  }
  const renameItem = (it: ItemRow) => { const n = prompt('Neuer Titel:', it.titel); if (n?.trim()) run(supabase.from(itemT).update({ titel: n.trim() }).eq('id', it.id)) }
  const delItem = (it: ItemRow) => { if (confirm(`„${it.titel}“ löschen?`)) run(supabase.from(itemT).delete().eq('id', it.id)) }
  const setMin = (it: ItemRow, m: number) => run(supabase.from(itemT).update({ minuten: Math.max(0, m) }).eq('id', it.id))
  const moveItem = (it: ItemRow, topId: string) => run(supabase.from(itemT).update({ top_id: topId, position: 999 }).eq('id', it.id))

  return (
    <div>
      {err && <p className="danger">{err}</p>}
      <SortableList items={tops} onReorder={n => { setTops(n); savePositions(topT, n) }}>
        {(t, handle) => (
          <div className="card">
            <div className="row">
              {!readOnly && handle}
              <h3 style={{ margin: 0 }} className="grow">TOP {tops.findIndex(x => x.id === t.id) + 1} · {t.titel}</h3>
              {!readOnly && <><button className="small" onClick={() => renameTop(t)}>Umbenennen</button>
                <button className="small" onClick={() => delTop(t)}>Löschen</button></>}
            </div>
            <SortableList items={items.filter(x => x.top_id === t.id)} onReorder={n => {
              setItems(prev => [...prev.filter(x => x.top_id !== t.id), ...n]); savePositions(itemT, n)
            }}>
              {(it, h) => (
                <div className="item">
                  {!readOnly && h}
                  <span className="grow">{tops.findIndex(x => x.id === t.id) + 1}.{items.filter(x => x.top_id === t.id).findIndex(x => x.id === it.id) + 1} {it.titel}</span>
                  {readOnly ? <span className="muted">{it.minuten} min</span> : <>
                    <input type="number" min={0} style={{ width: 70 }} value={it.minuten} aria-label="Minuten"
                      onChange={e => setItems(p => p.map(x => x.id === it.id ? { ...x, minuten: +e.target.value } : x))}
                      onBlur={e => setMin(it, +e.target.value)} />
                    <span className="muted">min</span>
                    <select value={t.id} aria-label="TOP wechseln" style={{ width: 'auto' }} onChange={e => moveItem(it, e.target.value)}>
                      {tops.map(o => <option key={o.id} value={o.id}>→ {o.titel}</option>)}
                    </select>
                    <button className="small" onClick={() => renameItem(it)}>✎</button>
                    <button className="small" onClick={() => delItem(it)}>✕</button></>}
                </div>
              )}
            </SortableList>
            {!readOnly && <button className="small" onClick={() => addItem(t)}>+ Unterpunkt</button>}
          </div>
        )}
      </SortableList>
      {!readOnly && <button onClick={addTop}>+ TOP hinzufügen</button>}
    </div>
  )
}
