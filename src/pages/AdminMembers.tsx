import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { canChangeAdmin } from '../lib/members'
import { validatePassword } from '../lib/password'
import type { Profile, Role } from '../lib/types'

export default function AdminMembers() {
  const [members, setMembers] = useState<Profile[]>([])
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [role, setRole] = useState<Role>('mitglied'); const [pw, setPw] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('name')
    setMembers((data ?? []) as Profile[])
  }
  useEffect(() => { load() }, [])

  async function call(body: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke('invite-member', { body })
    if (error || data?.error) { setMsg({ ok: false, text: data?.error ?? 'Das hat nicht geklappt.' }); return false }
    return true
  }
  async function create(e: FormEvent) {
    e.preventDefault()
    const bad = validatePassword(pw)
    if (bad) { setMsg({ ok: false, text: bad }); return }
    const ok = await call({ action: 'create', name, email, role, password: pw })
    if (ok) { setMsg({ ok: true, text: `${name} wurde angelegt. Gib die E-Mail und das Startpasswort persönlich weiter; ändern kann die Person es unter „Passwort ändern“.` }); setName(''); setEmail(''); setPw(''); load() }
  }
  async function change(m: Profile, c: { role?: Role; aktiv?: boolean }) {
    if (!canChangeAdmin(members, m.id, c)) { setMsg({ ok: false, text: 'Es muss mindestens ein Admin bleiben.' }); return }
    if (await call({ action: 'update', id: m.id, ...c })) { setMsg(null); load() }
  }

  return (
    <>
      <h2>Mitglieder</h2>
      {msg && <p className={msg.ok ? 'ok' : 'danger'}>{msg.text}</p>}
      <table>
        <thead><tr><th>Name</th><th>E-Mail</th><th>Rolle</th><th>Status</th></tr></thead>
        <tbody>
          {members.map(m => (
            <tr key={m.id}>
              <td>{m.name}</td><td>{m.email}</td>
              <td><select value={m.role} onChange={e => change(m, { role: e.target.value as Role })}>
                <option value="mitglied">Mitglied</option><option value="admin">Admin</option></select></td>
              <td><button className="small" onClick={() => change(m, { aktiv: !m.aktiv })}>{m.aktiv ? 'Deaktivieren' : 'Aktivieren'}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={create} className="card">
        <h3>Mitglied anlegen</h3>
        <div className="row">
          <label className="grow">Name<input value={name} onChange={e => setName(e.target.value)} required /></label>
          <label className="grow">E-Mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="off" /></label>
          <label>Rolle<select value={role} onChange={e => setRole(e.target.value as Role)}><option value="mitglied">Mitglied</option><option value="admin">Admin</option></select></label>
          <label className="grow">Startpasswort (mind. 10 Zeichen)<input type="text" value={pw} onChange={e => setPw(e.target.value)} required autoComplete="off" /></label>
        </div>
        <button className="primary">Mitglied anlegen</button>
      </form>
    </>
  )
}
