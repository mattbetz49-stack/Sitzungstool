import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { scheduleItems } from '../lib/planning'
import { formatTime, meetingStart } from '../lib/format'
import type { Item, Meeting, Top } from '../lib/types'

export default function AgendaView({ m }: { m: Meeting }) {
  const [tops, setTops] = useState<Top[]>([]); const [items, setItems] = useState<Item[]>([])
  useEffect(() => {
    const load = async () => {
      const [t, i] = await Promise.all([
        supabase.from('tops').select('*').eq('sitzung_id', m.id).order('position'),
        supabase.from('unterpunkte').select('*').eq('sitzung_id', m.id).order('position'),
      ])
      setTops((t.data ?? []) as Top[]); setItems((i.data ?? []) as Item[])
    }
    load(); const h = setInterval(load, 30_000); return () => clearInterval(h)
  }, [m.id])

  const ordered = tops.flatMap(t => items.filter(i => i.top_id === t.id))
  const times = new Map(scheduleItems(meetingStart(m).toISOString(), ordered).map(x => [x.id, x]))
  return (<>
    {tops.map((t, ti) => (
      <div className="card" key={t.id}>
        <h3 style={{ margin: 0 }}>TOP {ti + 1} · {t.titel}</h3>
        {items.filter(i => i.top_id === t.id && times.has(i.id)).map((i, ii) => {
          const tm = times.get(i.id)!
          return <div className="item" key={i.id}>
            <span className="muted" style={{ minWidth: 110 }}>{formatTime(tm.von)}–{formatTime(tm.bis)}</span>
            <span className="grow">{ti + 1}.{ii + 1} <strong>{i.titel}</strong>{i.beschreibung && <div className="muted">{i.beschreibung}</div>}
              {i.uebernommen_aus && <span className="badge">übernommen</span>}</span>
            <span className="badge">{i.ziel === 'entscheidung' ? 'Entscheidung' : 'Info'}</span>
            <span className="muted">{i.minuten} min</span>
          </div>
        })}
      </div>
    ))}
  </>)
}
