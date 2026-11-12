import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { unzipSync } from 'fflate';
import { convertSettlement } from './convert';
import { downloadState, isAcknowledged, mappingHash, setAcknowledged } from './gate';
import { checkLicence, clientHash, licenceBody } from './licence-client';
import { demoProfile } from './profile/defaults';
import { exportProfile, importIntoStorage, loadProfile, memoryStorage, saveProfile } from './profile/storage';
import { decodeSettlement } from './settlement/decode';
import { parseSettlement } from './settlement/parse';
import { zipFiles } from './zip';

const load = (n: string) => {
  const r = parseSettlement(decodeSettlement(readFileSync(new URL(`../../fixtures/${n}`, import.meta.url))));
  if (!r.ok) throw new Error(r.error);
  return r.settlement;
};

describe('Kontenprofil storage (AC17)', () => {
  it('export, clear storage, import gives an identical profile and no client numbers', () => {
    const p = demoProfile();
    p.mapping[3].account = '4711';
    const json = exportProfile(p);
    expect(json).not.toMatch(/beraternummer|mandantennummer/i);
    const store = memoryStorage();
    saveProfile(store, p);
    store.removeItem('a2d:profile');
    expect(loadProfile(store)).toBeNull();
    const r = importIntoStorage(store, json);
    expect(r.ok).toBe(true);
    expect(loadProfile(store)).toEqual(p);
  });
  it('malformed import changes nothing', () => {
    const store = memoryStorage();
    const p = demoProfile();
    saveProfile(store, p);
    for (const bad of ['{nope', '[]', JSON.stringify({ schemaVersion: 2 }), JSON.stringify({ ...p, mapping: [{ key: 1 }] })]) {
      const r = importIntoStorage(store, bad);
      expect(r.ok).toBe(false);
    }
    expect(loadProfile(store)).toEqual(p);
  });
});

describe('confirmation gate (AC18) and paywall gate (AC16)', () => {
  it('is remembered per mapping and resets when the mapping changes', () => {
    const store = memoryStorage();
    const p = demoProfile();
    expect(isAcknowledged(store, p)).toBe(false);
    setAcknowledged(store, p, true);
    expect(isAcknowledged(store, p)).toBe(true);
    const q = demoProfile();
    q.mapping[0].account = '9999';
    expect(mappingHash(q)).not.toBe(mappingHash(p));
    expect(isAcknowledged(store, q)).toBe(false);
    setAcknowledged(store, p, false);
    expect(isAcknowledged(store, p)).toBe(false);
  });
  it('download state order: blockers, confirmation, licence', () => {
    expect(downloadState({ blockers: ['x'], acknowledged: true, hasLicenceKey: true }).action).toBe('disabled');
    expect(downloadState({ blockers: [], acknowledged: false, hasLicenceKey: true })).toEqual({
      action: 'disabled',
      reason: 'Erst Kontenzuordnung bestätigen',
    });
    expect(downloadState({ blockers: [], acknowledged: true, hasLicenceKey: false }).action).toBe('plans');
    expect(downloadState({ blockers: [], acknowledged: true, hasLicenceKey: true }).action).toBe('download');
  });
  it('the check view works without any key', () => {
    const c = convertSettlement(load('normal.tsv'), demoProfile(), { beraternummer: '', mandantennummer: '' }, { overrideDifference: false, erzeugtAm: '0' });
    expect(c.check.balanced).toBe(true);
    expect(c.files[0].dataLines.length).toBeGreaterThan(10);
  });
});

describe('ZIP', () => {
  it('two settlements give two files and a ZIP with their names', () => {
    const m = { beraternummer: '12345', mandantennummer: '1' };
    const o = { overrideDifference: false, erzeugtAm: '0' };
    const a = convertSettlement(load('normal.tsv'), demoProfile(), m, o).files;
    const b = convertSettlement(load('negative.tsv'), demoProfile(), m, o).files;
    const all = [...a, ...b];
    expect(all).toHaveLength(2);
    expect(Object.keys(unzipSync(zipFiles(all))).sort()).toEqual(all.map((f) => f.fileName).sort());
  });
});

describe('no file data leaves the browser (AC14)', () => {
  function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
  }
  it('the only fetch in client code is the licence check', () => {
    const root = new URL('..', import.meta.url).pathname;
    const files = walk(root).filter((f) => /\.(ts|tsx|astro)$/.test(f) && !f.endsWith('.test.ts'));
    const hits = files.filter((f) => /\bfetch(Impl)?\s*\(|XMLHttpRequest|sendBeacon/.test(readFileSync(f, 'utf8')));
    expect(hits.map((f) => f.replace(root, ''))).toEqual(['lib/licence-client.ts']);
    const src = readFileSync(join(root, 'lib/licence-client.ts'), 'utf8');
    expect([...src.matchAll(/fetchImpl\(\s*withBase\('([^']+)'\)/g)].map((m) => m[1])).toEqual(['/api/licence/check']);
  });
  it('the body has exactly two keys and a 64-hex hash; the plain numbers are not in it', async () => {
    const h = await clientHash({ beraternummer: '12345', mandantennummer: '678' });
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    const body = licenceBody('K'.repeat(32), h);
    expect(Object.keys(body).sort()).toEqual(['hash', 'licenceKey']);
    let sent = '';
    const answer = await checkLicence('K'.repeat(32), { beraternummer: '12345', mandantennummer: '678' }, (async (_u: unknown, init?: RequestInit) => {
      sent = String(init?.body);
      return new Response(JSON.stringify({ ok: true }));
    }) as typeof fetch);
    expect(answer).toBe('ok');
    expect(Object.keys(JSON.parse(sent)).sort()).toEqual(['hash', 'licenceKey']);
    expect(sent).not.toContain('12345');
  });
  it('a 404 (static preview) is reported as unavailable', async () => {
    const a = await checkLicence('K'.repeat(32), { beraternummer: '1234', mandantennummer: '1' }, (async () => new Response('', { status: 404 })) as typeof fetch);
    expect(a).toBe('unavailable');
  });
});
