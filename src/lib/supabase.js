import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY

export const configManquante = !url || !cle

export const supabase = configManquante ? null : createClient(url, cle)