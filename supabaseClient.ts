import { createClient } from '@supabase/supabase-js';
const SURL = import.meta.env.VITE_SUPABASE_URL as string;
const SKEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const supabase = (SURL && SKEY) ? createClient(SURL, SKEY) : null;
export const SUPA_OK = !!(SURL && SKEY);

export async function saveOverride(cargoId:number, field:string, value:string) {
  if (!supabase) return new Error('Supabase not configured');
  const {error} = await supabase.from('overrides').upsert({
    cargo_id:cargoId, field, value, updated_at:new Date().toISOString()
  });
  return error;
}
