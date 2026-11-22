import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { buildExport, download } from '../lib/exportData'

const TABLES = ['profiles', 'vorlage_top', 'vorlage_unterpunkt', 'sitzungen', 'tops', 'unterpunkte', 'aufgaben', 'anwesenheit']

export default function AdminExport() {
  const [msg, setMsg] = useState<string | null>(null)
  const today = new Date().toISOString().slice(0, 10)
  async function run(kind: 'json' | 'csv') {
    setMsg(null)
    const tables: Record<string, unknown[]> = {}
    for (const t of TABLES) {
      const { data, error } = await supabase.from(t).select('*')
      if (error) { setMsg(`Export fehlgeschlagen bei „${t}“.`); return }
      tables[t] = data ?? []
    }
    const e = buildExport(tables)
    if (kind === 'json') download(`sitzungstool-backup-${today}.json`, e.json, 'application/json')
    else for (const [name, csv] of Object.entries(e.csv)) download(`sitzungstool-${name}-${today}.csv`, csv, 'text/csv;charset=utf-8')
    setMsg('Export fertig. Bitte die Dateien sicher aufbewahren.')
  }
  return (<>
    <h2>Datensicherung</h2>
    <p>Lädt alle Vereinsdaten herunter. Empfehlung: einmal im Monat.</p>
    <div className="row"><button className="primary" onClick={() => run('json')}>Komplett-Backup (JSON)</button><button onClick={() => run('csv')}>Tabellen für Excel (CSV)</button></div>
    {msg && <p className="ok">{msg}</p>}
  </>)
}
