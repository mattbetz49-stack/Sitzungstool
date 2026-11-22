import { describe, it, expect } from 'vitest'
import { toCsv, buildExport } from './exportData'

describe('toCsv', () => {
  it('Semikolon, BOM, Kopfzeile', () => {
    expect(toCsv([{ a: 1, b: 'x' }])).toBe('﻿a;b\r\n1;x')
  })
  it('maskiert Semikolon, Anführungszeichen, Zeilenumbruch', () => {
    const c = toCsv([{ t: 'a;b', u: 'sagt "hi"', v: 'z1\nz2' }])
    expect(c).toBe('﻿t;u;v\r\n"a;b";"sagt ""hi""";"z1\nz2"')
  })
  it('null/undefined leer, leere Liste nur BOM', () => {
    expect(toCsv([{ a: null, b: undefined }])).toBe('﻿a;b\r\n;')
    expect(toCsv([])).toBe('﻿')
  })
})
describe('buildExport', () => {
  it('JSON und je Tabelle eine CSV', () => {
    const e = buildExport({ sitzungen: [{ id: 1 }], aufgaben: [] })
    expect(JSON.parse(e.json).sitzungen).toEqual([{ id: 1 }]); expect(Object.keys(e.csv).sort()).toEqual(['aufgaben', 'sitzungen'])
  })
})
