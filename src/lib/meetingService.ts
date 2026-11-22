import { supabase } from './supabase'
import { collectCarryover } from './carryover'
import type { Item, Task } from './types'

export interface NewMeeting { datum: string; beginn: string; geplante_dauer_min: number; einreichfrist_tage: number }

/** Legt eine Sitzung an und kopiert die Standardvorlage hinein. Gibt die neue Sitzungs-ID zurück. */
export async function createMeeting(p: NewMeeting): Promise<string> {
  const { data: s, error } = await supabase.from('sitzungen').insert(p).select().single()
  if (error || !s) throw new Error('Sitzung konnte nicht angelegt werden.')
  const [t, u] = await Promise.all([
    supabase.from('vorlage_top').select('*').order('position'),
    supabase.from('vorlage_unterpunkt').select('*').order('position'),
  ])
  const idMap = new Map<string, string>()
  for (const vt of t.data ?? []) {
    const { data: nt } = await supabase.from('tops').insert({ sitzung_id: s.id, titel: vt.titel, position: vt.position }).select().single()
    if (nt) idMap.set(vt.id, nt.id)
  }
  const rows = (u.data ?? []).filter(x => idMap.has(x.top_id)).map(x => ({
    sitzung_id: s.id, top_id: idMap.get(x.top_id)!, titel: x.titel, minuten: x.minuten, position: x.position, status: 'geplant', ziel: 'info',
  }))
  if (rows.length) await supabase.from('unterpunkte').insert(rows)
  await applyCarryover(s.id as string)
  return s.id as string
}

/** Übernimmt vertagte Punkte und offene Aufgaben der letzten beendeten Sitzung. */
async function applyCarryover(newId: string) {
  const { data: last } = await supabase.from('sitzungen').select('id').eq('status', 'beendet')
    .order('datum', { ascending: false }).order('beginn', { ascending: false }).limit(1).maybeSingle()
  if (!last) return
  const [u, a, oldTops, newTops] = await Promise.all([
    supabase.from('unterpunkte').select('*').eq('sitzung_id', last.id),
    supabase.from('aufgaben').select('*').eq('sitzung_id', last.id),
    supabase.from('tops').select('id,titel').eq('sitzung_id', last.id),
    supabase.from('tops').select('id,titel').eq('sitzung_id', newId).order('position'),
  ])
  const { items, tasks } = collectCarryover({ unterpunkte: (u.data ?? []) as Item[], aufgaben: (a.data ?? []) as Task[] })
  const nt = newTops.data ?? []
  const fallback = nt.find(x => x.titel === 'Sonstiges') ?? nt[nt.length - 1]
  const oldTitle = new Map((oldTops.data ?? []).map(x => [x.id, x.titel]))
  if (items.length && fallback) {
    await supabase.from('unterpunkte').insert(items.map((i, n) => {
      const match = nt.find(x => x.titel === oldTitle.get(i.top_id ?? ''))
      return { sitzung_id: newId, top_id: (match ?? fallback).id, titel: i.titel, beschreibung: i.beschreibung, minuten: i.minuten,
        ziel: i.ziel, status: 'geplant', eingereicht_von: i.eingereicht_von, uebernommen_aus: i.uebernommen_aus, position: 900 + n }
    }))
  }
  for (const t of tasks) {
    await supabase.from('aufgaben').update({ sitzung_id: newId, urspruenglich_sitzung_id: t.sitzung_id }).eq('id', t.id)
  }
}
