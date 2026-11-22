import { createClient } from '@supabase/supabase-js'
/** URL-Hash vor dem Start von supabase-js merken: erkennt Einladungs-/Reset-Links (type=invite|recovery). */
export const initialHash = typeof window !== 'undefined' ? window.location.hash : ''
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const configured = Boolean(url && key)
export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing')
