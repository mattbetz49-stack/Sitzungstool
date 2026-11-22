const esc = (v: unknown): string => {
  const s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)
  return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

/** CSV für Excel: Semikolon, UTF-8 mit BOM. */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '﻿'
  const keys = Array.from(new Set(rows.flatMap(r => Object.keys(r))))
  return '﻿' + [keys.join(';'), ...rows.map(r => keys.map(k => esc(r[k])).join(';'))].join('\r\n')
}

export function buildExport(tables: Record<string, unknown[]>): { json: string; csv: Record<string, string> } {
  return {
    json: JSON.stringify(tables, null, 2),
    csv: Object.fromEntries(Object.entries(tables).map(([k, rows]) => [k, toCsv(rows as Record<string, unknown>[])])),
  }
}

export function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
}
