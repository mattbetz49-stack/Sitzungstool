// Supabase Edge Function (Deno). Einladen und Ändern von Mitgliedern – nur für aktive Admins.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // Aufrufer prüfen
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: u } = await admin.auth.getUser(token)
  if (!u?.user) return json({ error: 'Nicht angemeldet.' }, 401)
  const { data: me } = await admin.from('profiles').select('role,aktiv').eq('id', u.user.id).maybeSingle()
  if (!me || !me.aktiv || me.role !== 'admin') return json({ error: 'Nur Admins dürfen das.' }, 403)

  const body = await req.json()

  if (body.action === 'invite') {
    const name = String(body.name ?? '').trim(); const email = String(body.email ?? '').trim().toLowerCase()
    const role = body.role === 'admin' ? 'admin' : 'mitglied'
    if (!name || !email) return json({ error: 'Name und E-Mail sind nötig.' }, 400)
    const redirectTo = typeof body.redirectTo === 'string' ? body.redirectTo : undefined
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo })
    if (error || !data.user) return json({ error: error?.message ?? 'Einladung fehlgeschlagen.' }, 400)
    const { error: e2 } = await admin.from('profiles').upsert({ id: data.user.id, name, email, role, aktiv: true })
    if (e2) return json({ error: e2.message }, 400)
    return json({ ok: true })
  }

  if (body.action === 'update') {
    const { data: all } = await admin.from('profiles').select('id,role,aktiv')
    const change: { role?: string; aktiv?: boolean } = {}
    if (body.role) change.role = body.role === 'admin' ? 'admin' : 'mitglied'
    if (typeof body.aktiv === 'boolean') change.aktiv = body.aktiv
    const after = (all ?? []).map((m) => (m.id === body.id ? { ...m, ...change } : m))
    if (!after.some((m) => m.role === 'admin' && m.aktiv)) return json({ error: 'Es muss mindestens ein Admin bleiben.' }, 400)
    const { error } = await admin.from('profiles').update(change).eq('id', body.id)
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  }

  return json({ error: 'Unbekannte Aktion.' }, 400)
})
