import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { validatePassword } from '../lib/password'

export default function ChangePassword() {
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  async function submit(e: FormEvent) {
    e.preventDefault()
    const bad = validatePassword(pw, pw2)
    if (bad) { setMsg({ ok: false, text: bad }); return }
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) setMsg({ ok: false, text: 'Passwort konnte nicht gespeichert werden. Bitte melde dich neu an und versuche es noch einmal.' })
    else { setMsg({ ok: true, text: 'Dein Passwort wurde geändert.' }); setPw(''); setPw2('') }
  }
  return (<>
    <h1>Passwort ändern</h1>
    <form onSubmit={submit} className="card" style={{ maxWidth: 420 }}>
      <label>Neues Passwort (mind. 10 Zeichen)<input type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" required /></label>
      <label>Wiederholen<input type="password" value={pw2} onChange={e => setPw2(e.target.value)} autoComplete="new-password" required /></label>
      {msg && <p className={msg.ok ? 'ok' : 'danger'}>{msg.text}</p>}
      <button className="primary">Speichern</button>
    </form>
  </>)
}
