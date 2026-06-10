import { useState, useEffect } from 'react';
import type { Cargo } from './data';

const PIN = import.meta.env.VITE_ADMIN_PIN || '1234';
const LS_KEY = 'quipu_overrides';

export type Override = { cargo_id: number; field: string; value: string; ts: number };

function loadOverrides(): Override[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}
function saveOverrides(ovs: Override[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(ovs));
}

export function applyOverrides(cargos: Cargo[], overrides: Override[]): Cargo[] {
  if (!overrides.length) return cargos;
  const map = new Map<number, Record<string,string>>();
  overrides.forEach(o => {
    if (!map.has(o.cargo_id)) map.set(o.cargo_id, {});
    map.get(o.cargo_id)![o.field] = o.value;
  });
  return cargos.map(c => {
    const patch = map.get(c.id);
    return patch ? { ...c, ...patch } as Cargo : c;
  });
}

export function useAdmin() {
  const [unlocked, setUnlocked] = useState(false);
  const [overrides, setOverrides] = useState<Override[]>(loadOverrides);

  useEffect(() => { saveOverrides(overrides); }, [overrides]);

  function login(pin: string) {
    if (pin === PIN) { setUnlocked(true); return true; }
    return false;
  }
  function logout() { setUnlocked(false); }

  function setField(cargo_id: number, field: string, value: string) {
    setOverrides(prev => {
      const filtered = prev.filter(o => !(o.cargo_id === cargo_id && o.field === field));
      return [...filtered, { cargo_id, field, value, ts: Date.now() }];
    });
  }

  function clearField(cargo_id: number, field: string) {
    setOverrides(prev => prev.filter(o => !(o.cargo_id === cargo_id && o.field === field)));
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `quipu_overrides_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  }

  function importJSON(text: string) {
    try {
      const data = JSON.parse(text) as Override[];
      if (Array.isArray(data)) setOverrides(data);
    } catch {}
  }

  return { unlocked, overrides, login, logout, setField, clearField, exportJSON, importJSON };
}
