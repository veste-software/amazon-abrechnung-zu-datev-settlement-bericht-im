import type { KeyValueStorage } from './profile/storage';
import type { Kontenprofil } from './profile/schema';

export const BU_NOTE =
  'Amazon-Gebühren werden von Amazon EU S.à r.l. (Luxemburg) berechnet und unterliegen in der Regel dem Reverse-Charge-Verfahren. Den passenden BU-Schlüssel legt Ihre Steuerkanzlei fest.';

/** Small deterministic hash (FNV-1a, 32 bit) of everything that decides where money is booked. */
export function mappingHash(p: Kontenprofil): string {
  const text = JSON.stringify([p.chart, p.settings, p.mapping]);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

const ackKey = (p: Kontenprofil) => `a2d:ack:${mappingHash(p)}`;

/** The confirmation is remembered per mapping; any change to the mapping makes the hash, and so the box, new. */
export function isAcknowledged(storage: KeyValueStorage, p: Kontenprofil): boolean {
  return storage.getItem(ackKey(p)) === '1';
}

export function setAcknowledged(storage: KeyValueStorage, p: Kontenprofil, value: boolean): void {
  if (value) storage.setItem(ackKey(p), '1');
  else storage.removeItem(ackKey(p));
}

export type DownloadAction = 'disabled' | 'plans' | 'download';

export interface DownloadState {
  action: DownloadAction;
  /** one line under the button */
  reason: string;
}

/** Order matters: problems with the data first, then the confirmation, then the licence. */
export function downloadState(input: { blockers: string[]; acknowledged: boolean; hasLicenceKey: boolean }): DownloadState {
  if (input.blockers.length) return { action: 'disabled', reason: input.blockers[0] };
  if (!input.acknowledged) return { action: 'disabled', reason: 'Erst Kontenzuordnung bestätigen' };
  if (!input.hasLicenceKey) return { action: 'plans', reason: 'Für den Download brauchen Sie einen Lizenzschlüssel.' };
  return { action: 'download', reason: '' };
}
