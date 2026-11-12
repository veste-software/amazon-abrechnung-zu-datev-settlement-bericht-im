import { withBase } from './url';
import type { Mandant } from './profile/schema';

/** sha256(Beraternummer + ":" + Mandantennummer) as 64 hex characters. The plain numbers never leave the browser. */
export async function clientHash(m: Mandant): Promise<string> {
  const data = new TextEncoder().encode(`${m.beraternummer}:${m.mandantennummer}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** The only request body the client ever sends: exactly these two keys. */
export function licenceBody(licenceKey: string, hash: string): { licenceKey: string; hash: string } {
  return { licenceKey, hash };
}

export type LicenceAnswer = 'ok' | 'refused' | 'unavailable';

export async function checkLicence(
  licenceKey: string,
  mandant: Mandant,
  fetchImpl: typeof fetch = fetch,
): Promise<LicenceAnswer> {
  const hash = await clientHash(mandant);
  let res: Response;
  try {
    res = await fetchImpl(withBase('/api/licence/check'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(licenceBody(licenceKey, hash)),
    });
  } catch {
    return 'unavailable';
  }
  if (res.status === 404) return 'unavailable'; // static preview without Functions
  if (!res.ok) return 'refused';
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
  return data.ok === true ? 'ok' : 'refused';
}
