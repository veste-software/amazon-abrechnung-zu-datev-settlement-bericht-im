/** Minimal KV interface (Cloudflare KV namespaces satisfy it). */
export interface KV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export type Plan = 'haendler' | 'kanzlei';
export const PLAN_LIMITS: Record<Plan, number> = { haendler: 1, kanzlei: 25 };

export interface LicenceRecord {
  plan: Plan;
  customer: string;
  subscription: string;
  status: 'active' | 'cancelled';
  /** SHA-256 hashes of Beraternummer:Mandantennummer seen for this key */
  hashes: string[];
}

export type CheckAnswer = { ok: true } | { ok: false; reason: 'invalid' | 'unknown' | 'cancelled' | 'limit' };

export const licenceKeyName = (key: string) => `licence:${key}`;

export async function getLicence(kv: KV, key: string): Promise<LicenceRecord | null> {
  const raw = await kv.get(licenceKeyName(key));
  return raw ? (JSON.parse(raw) as LicenceRecord) : null;
}

export async function checkLicence(kv: KV, key: string, hash: string): Promise<CheckAnswer> {
  if (!/^[A-Za-z0-9]{32}$/.test(key) || !/^[0-9a-f]{64}$/.test(hash)) return { ok: false, reason: 'invalid' };
  const rec = await getLicence(kv, key);
  if (!rec) return { ok: false, reason: 'unknown' };
  if (rec.status !== 'active') return { ok: false, reason: 'cancelled' };
  if (rec.hashes.includes(hash)) return { ok: true };
  if (rec.hashes.length >= PLAN_LIMITS[rec.plan]) return { ok: false, reason: 'limit' };
  rec.hashes.push(hash);
  await kv.put(licenceKeyName(key), JSON.stringify(rec));
  return { ok: true };
}
