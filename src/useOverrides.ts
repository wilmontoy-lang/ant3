import { useState, useEffect } from 'react';
import { supabase, SUPA_OK } from './supabaseClient';
import type { Cargo } from './data';

export interface Override { cargo_id: number; field: string; value: string; }

export function useOverrides(): Override[] {
  const [overrides, setOverrides] = useState<Override[]>([]);
  useEffect(() => {
    if (!SUPA_OK || !supabase) return;
    supabase.from('overrides').select('cargo_id,field,value')
      .then(({ data }) => { if (data) setOverrides(data); });
  }, []);
  return overrides;
}

export function applyOverrides<T extends { id: number }>(items: T[], overrides: Override[]): T[] {
  if (!overrides.length) return items;
  const map = new Map<number, Record<string, string>>();
  overrides.forEach(o => {
    if (!map.has(o.cargo_id)) map.set(o.cargo_id, {});
    map.get(o.cargo_id)![o.field] = o.value;
  });
  return items.map(item => {
    const patch = map.get(item.id);
    return patch ? { ...item, ...patch } : item;
  });
}
