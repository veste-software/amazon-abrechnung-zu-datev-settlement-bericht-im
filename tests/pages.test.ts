import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dist = new URL('../dist/', import.meta.url);
const have = existsSync(new URL('index.html', dist));
if (!have) console.warn('tests/pages.test.ts: dist/ fehlt, Seitenprüfung übersprungen (erst `npm run build`).');

const read = (p: string) => readFileSync(new URL(p, dist), 'utf8');
const strip = (h: string) => h.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ');
const words = (h: string) => strip(h).split(/\s+/).filter(Boolean).length;

const content = [
  'index.html',
  'datev-zahlungsdatenservice-amazon-alternative/index.html',
  'amazon-abrechnungsbericht-flat-file-v2/index.html',
  'amazon-gebuehren-buchen-datev/index.html',
  'steuerkanzlei/index.html',
];
const all = [...content, 'preise/index.html', 'impressum/index.html', 'datenschutz/index.html', 'agb/index.html', '404.html'];
const SLUGS = ['', 'datev-zahlungsdatenservice-amazon-alternative/', 'amazon-abrechnungsbericht-flat-file-v2/', 'amazon-gebuehren-buchen-datev/', 'steuerkanzlei/', 'preise/', 'impressum/', 'datenschutz/', 'agb/'];

describe.skipIf(!have)('built pages', () => {
  it('AC20: unique title, description and H1; at least 600 words; link to the tool', () => {
    const seen = { t: new Set<string>(), d: new Set<string>(), h: new Set<string>() };
    for (const p of content) {
      const h = read(p);
      const title = /<title>([^<]+)<\/title>/.exec(h)?.[1];
      const desc = /<meta name="description" content="([^"]+)"/.exec(h)?.[1];
      const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(h)?.[1];
      expect(title, p).toBeTruthy();
      expect(desc, p).toBeTruthy();
      expect(h1, p).toBeTruthy();
      expect(seen.t.has(title!), `title ${p}`).toBe(false);
      expect(seen.d.has(desc!), `desc ${p}`).toBe(false);
      expect(seen.h.has(h1!), `h1 ${p}`).toBe(false);
      seen.t.add(title!);
      seen.d.add(desc!);
      seen.h.add(h1!);
      if (p !== 'index.html') {
        expect(words(h), `${p} words`).toBeGreaterThanOrEqual(600);
        expect(/href="\/(preview\/)?"/.test(h), `${p} tool link`).toBe(true);
      }
    }
  });
  it('AC20: sitemap lists exactly the pages of SPEC §8', () => {
    const urls = [...read('sitemap-0.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/^\//, ''));
    // A sub-path build (build:preview) prefixes every URL with the base; strip it.
    const base = /^preview\//.test(urls[0] ?? '') && urls.every((u) => /^preview\/?/.test(u)) ? /^preview\/?/ : null;
    if (base) urls.forEach((u, i) => (urls[i] = u.replace(base, '')));
    expect(urls.sort()).toEqual([...SLUGS].sort());
  });
  it('AC20/21: footer links Impressum and Datenschutz and carries the disclaimer on every page', () => {
    for (const p of all) {
      const h = read(p);
      expect(h, p).toMatch(/href="[^"]*impressum\/?"/);
      expect(h, p).toMatch(/href="[^"]*datenschutz\/?"/);
      expect(h, p).toContain('Nicht mit Amazon oder DATEV verbunden. Amazon und DATEV sind Marken ihrer jeweiligen Inhaber.');
    }
  });
  it('AC21: no ratings, testimonials or countdowns', () => {
    for (const p of all) {
      const text = strip(read(p));
      for (const bad of ['Bewertung', 'Kundenstimmen', 'vertrauen uns', 'Countdown']) expect(text, `${p}: ${bad}`).not.toContain(bad);
    }
  });
  it('every mapping key appears in the Gebühren page', () => {
    const h = read('amazon-gebuehren-buchen-datev/index.html');
    const json = JSON.parse(readFileSync(new URL('../src/data/profiles/skr03.json', import.meta.url), 'utf8')) as { rows: { key: string }[] };
    for (const r of json.rows) expect(h).toContain(r.key.replace(/&/g, '&amp;'));
  });
});
