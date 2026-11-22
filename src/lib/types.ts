export type Role = 'admin' | 'mitglied'
export type MeetingStatus = 'entwurf' | 'veroeffentlicht' | 'laeuft' | 'beendet'
export type ItemStatus = 'vorschlag' | 'geplant' | 'erledigt' | 'gestrichen'
export type Ergebnis = 'beschlossen' | 'vertagt' | 'kenntnis'
export type Ziel = 'entscheidung' | 'info'

export interface Profile { id: string; name: string; email: string; role: Role; aktiv: boolean }
export interface Meeting {
  id: string; datum: string; beginn: string; geplante_dauer_min: number; einreichfrist_tage: number
  status: MeetingStatus; tatsaechlich_start: string | null; tatsaechlich_ende: string | null
}
export interface Top { id: string; sitzung_id: string; titel: string; position: number }
export interface Item {
  id: string; sitzung_id: string; top_id: string | null; titel: string; beschreibung: string
  minuten: number; ziel: Ziel; status: ItemStatus; ergebnis: Ergebnis | null; ergebnistext: string
  eingereicht_von: string | null; uebernommen_aus: string | null; position: number
  verlaengerung_min: number; gestartet_am: string | null; tatsaechliche_sekunden: number | null
}
export interface Task {
  id: string; sitzung_id: string; unterpunkt_id: string | null; verantwortlicher: string
  was: string; bis_wann: string | null; erledigt: boolean; urspruenglich_sitzung_id?: string | null
}
export interface Attendance { sitzung_id: string; mitglied_id: string; anwesend: boolean }
