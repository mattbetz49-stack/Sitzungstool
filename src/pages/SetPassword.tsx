import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { validatePassword } from '../lib/password'

export default function SetPassword() {
  const { passwordSet } = useAuth()
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [err, setErr] = useState<string | null>(null)
  async function submit(e: FormEvent) {
    e.preventDefault()
    const bad = validatePassword(pw, pw2)
    if (bad) { setErr(bad); return }
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) setErr('Passwort konnte nicht gespeichert werden.'); else passwordSet()
  }
  return (
    <div className="login">
      <img src="./wappen.jpg" alt="" width={80} /><h1>Passwort festlegen</h1>
      <form onSubmit={submit} className="card">
        <label>Neues Passwort<input type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" required /></label>
        <label>Wiederholen<input type="password" value={pw2} onChange={e => setPw2(e.target.value)} autoComplete="new-password" required /></label>
        {err && <p className="error">{err}</p>}<button className="primary">Speichern</button>
      </form>
    </div>
  )
}
