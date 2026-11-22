import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr(await signIn(email, pw)); setBusy(false)
  }
  async function reset() {
    if (!email.trim()) { setErr('Bitte zuerst oben die E-Mail eintragen.'); return }
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + window.location.pathname })
    setErr('Falls die E-Mail bekannt ist, wurde ein Link zum Zurücksetzen verschickt.')
  }
  return (
    <div className="login">
      <img src="./wappen.jpg" alt="ASV Steinach Wappen" width={96} />
      <h1>Sitzungstool</h1>
      <p className="muted">ASV Steinach 1947 – Vorstandschaft</p>
      <form onSubmit={submit} className="card">
        <label>E-Mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" /></label>
        <label>Passwort<input type="password" value={pw} onChange={e => setPw(e.target.value)} required autoComplete="current-password" /></label>
        {err && <p className="error">{err}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Anmelden …' : 'Anmelden'}</button>
        <p><button type="button" className="small" onClick={reset}>Passwort vergessen?</button></p>
      </form>
    </div>
  )
}
