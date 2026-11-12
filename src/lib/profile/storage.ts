import { defaultProfile } from './defaults';
import type { Kontenprofil, MappingRow } from './schema';

/** The subset of the Web Storage API we use; tests inject a Map-backed one. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function memoryStorage(): KeyValueStorage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

const PROFILE_KEY = 'a2d:profile';

export function saveProfile(storage: KeyValueStorage, p: Kontenprofil): void {
  storage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function loadProfile(storage: KeyValueStorage): Kontenprofil | null {
  const raw = storage.getItem(PROFILE_KEY);
  if (!raw) return null;
  const r = importProfile(raw);
  return r.ok ? r.profile : null;
}

/** Export file: schema version, chart, settings and mapping. Berater-/Mandantennummer are never part of it. */
export function exportProfile(p: Kontenprofil): string {
  return JSON.stringify({ schemaVersion: p.schemaVersion, chart: p.chart, settings: p.settings, mapping: p.mapping }, null, 2);
}

export type ImportResult = { ok: true; profile: Kontenprofil } | { ok: false; error: string };

const isStr = (v: unknown): v is string => typeof v === 'string';

export function importProfile(json: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Die Datei ist kein gültiges JSON.' };
  }
  const d = data as Partial<Kontenprofil> | null;
  if (!d || typeof d !== 'object') return { ok: false, error: 'Die Datei enthält kein Kontenprofil.' };
  if (d.schemaVersion !== 1) return { ok: false, error: `Schemaversion »${String(d.schemaVersion)}« wird nicht unterstützt.` };
  if (d.chart !== 'SKR03' && d.chart !== 'SKR04') return { ok: false, error: 'Kontenrahmen fehlt oder ist unbekannt.' };
  const s = d.settings;
  if (
    !s || !isStr(s.verrechnungskonto) || !isStr(s.geldtransit) || !isStr(s.sammeldebitor) || !isStr(s.differenzkonto) ||
    !Number.isInteger(s.sachkontenlaenge) || !Number.isInteger(s.wjStartMonth)
  ) {
    return { ok: false, error: 'Die Einstellungen im Kontenprofil sind unvollständig.' };
  }
  if (!Array.isArray(d.mapping)) return { ok: false, error: 'Die Kontenzuordnung fehlt.' };
  const mapping: MappingRow[] = [];
  for (const [i, m] of (d.mapping as Partial<MappingRow>[]).entries()) {
    if (!m || !isStr(m.key) || !isStr(m.account) || !isStr(m.bu) || !isStr(m.prefix) || typeof m.sammel !== 'boolean' || typeof m.zusammenfassen !== 'boolean') {
      return { ok: false, error: `Zuordnung ${i + 1} ist fehlerhaft.` };
    }
    mapping.push({ key: m.key, account: m.account, bu: m.bu, prefix: m.prefix, sammel: m.sammel, zusammenfassen: m.zusammenfassen });
  }
  return {
    ok: true,
    profile: {
      schemaVersion: 1,
      chart: d.chart,
      settings: {
        wjStartMonth: s.wjStartMonth,
        sachkontenlaenge: s.sachkontenlaenge,
        verrechnungskonto: s.verrechnungskonto,
        geldtransit: s.geldtransit,
        sammeldebitor: s.sammeldebitor,
        differenzkonto: s.differenzkonto,
      },
      mapping,
    },
  };
}

/** Import into storage: on any error the stored profile stays exactly as it was. */
export function importIntoStorage(storage: KeyValueStorage, json: string): ImportResult {
  const r = importProfile(json);
  if (r.ok) saveProfile(storage, r.profile);
  return r;
}

export function loadOrDefault(storage: KeyValueStorage): Kontenprofil {
  return loadProfile(storage) ?? defaultProfile();
}
