import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, initialHash } from '../lib/supabase'
import type { Profile } from '../lib/types'

interface AuthState {
  profile: Profile | null; isAdmin: boolean; loading: boolean
  needsPassword: boolean; passwordSet: () => void
  signIn: (email: string, pw: string) => Promise<string | null>
  signOut: () => Promise<void>
}
const Ctx = createContext<AuthState>(null as unknown as AuthState)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsPassword, setNeedsPassword] = useState(/type=(invite|recovery)/.test(initialHash))

  async function load() {
    const { data: s } = await supabase.auth.getSession()
    if (!s.session) { setProfile(null); setLoading(false); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', s.session.user.id).maybeSingle()
    if (!data || !data.aktiv) { await supabase.auth.signOut(); setProfile(null) } else setProfile(data as Profile)
    setLoading(false)
  }
  useEffect(() => {
    load()
    const { data: sub } = supabase.auth.onAuthStateChange(() => { load() })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, pw: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw })
    return error ? 'E-Mail oder Passwort stimmt nicht.' : null
  }
  const signOut = async () => { await supabase.auth.signOut(); setProfile(null) }

  return <Ctx.Provider value={{ needsPassword, passwordSet: () => { setNeedsPassword(false); window.location.hash = '#/' }, profile, isAdmin: profile?.role === 'admin', loading, signIn, signOut }}>{children}</Ctx.Provider>
}
