import { createClient } from '@supabase/supabase-js';

// Fallback prevents build crash during SSR prerendering when env vars aren't set yet.
// All DB calls will gracefully fail (return empty data) until Supabase is configured.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
