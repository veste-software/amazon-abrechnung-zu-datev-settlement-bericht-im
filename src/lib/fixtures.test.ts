import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generateBookings } from './booking/generate';
import { splitBookings } from './booking/split';
import { checkSettlement } from './check';
import { convertSettlement } from './convert';
import { BUCHUNGSSTAPEL_COLUMNS, EXTF_HEADER_FIELD_COUNT, MAX_LINES_PER_FILE } from './datev/columns';
import { encodeCp1252 } from './datev/cp1252';
import { formatCentsPlain } from './money';
import { defaultProfile, demoProfile } from './profile/defaults';
import { validateProfile } from './profile/schema';
import { decodeSettlement } from './settlement/decode';
import { parseAmountToCents, parseDate, parseSettlement } from './settlement/parse';
import { V1_MESSAGE, V2_COLUMNS, type Settlement } from './settlement/types';

const read = (n: string) => readFileSync(new URL(`../../fixtures/${n}`, import.meta.url));
const load = (n: string): Settlement => {
  const r = parseSettlement(decodeSettlement(read(n)));
  if (!r.ok) throw new Error(r.error);
  return r.settlement;
};
const mandant = { beraternummer: '12345', mandantennummer: '678' };
const opts = { overrideDifference: false, erzeugtAm: '20261112120000000' };

describe('fixtures', () => {
  it('normal.tsv has 24 columns and a summary equal to the line sum', () => {
    const lines = read('normal.tsv').toString('utf8').split('\n');
    expect(lines[0].split('\t')).toEqual([...V2_COLUMNS]);
    const s = load('normal.tsv');
    expect(s.rows.reduce((a, r) => a + r.amountCents, 0)).toBe(s.totalCents);
  });
});

describe('parsing', () => {
  it('number table', () => {
    const t: Array<[string, number | null]> = [
      ['1234.56', 123456], ['1234,56', 123456], ['1.234,56', 123456], ['-12,30', -1230], ['12', 1200],
      ['0.5', 50], ['1.234', null], ['abc', null], ['', null], ['1,234,567.89', 123456789],
    ];
    for (const [i, o] of t) expect(parseAmountToCents(i), i).toBe(o);
  });
  it('date table', () => {
    const t: Array<[string, string | null]> = [
      ['2026-10-03T16:00:00+00:00', '2026-10-03'], ['2026-10-03 16:00:00 UTC', '2026-10-03'],
      ['03.10.2026 16:00:00 UTC', '2026-10-03'], ['03.10.2026', '2026-10-03'], ['2026/10/03', null], ['31.02.2026', null],
    ];
    for (const [i, o] of t) expect(parseDate(i), i).toBe(o);
  });
  it('AC2: normal and german notation give identical rows', () => {
    expect(load('german-format.tsv')).toEqual(load('normal.tsv'));
  });
  it('error names row and value', () => {
    const text = read('normal.tsv').toString('utf8').replace('\t19.99', '\t1x9').replace('\t19.99', '\t1x9');
    const bad = read('normal.tsv').toString('utf8').replace('2026-10-05\t', '2026/10/05\t');
    const r = parseSettlement(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Zeile 3: Datum »2026\/10\/05«/);
    expect(text.length).toBeGreaterThan(0);
  });
  it('decodes windows-1252 and BOM', () => {
    expect(decodeSettlement(Uint8Array.from([0xef, 0xbb, 0xbf, 0x61]))).toBe('a');
    expect(decodeSettlement(Uint8Array.from([0x4d, 0xfc]))).toBe('Mü');
  });
  it('AC3: V1 and XML are rejected with the V1 message', () => {
    for (const f of ['v1.tsv', 'v1.xml']) {
      const r = parseSettlement(decodeSettlement(read(f)));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe(V1_MESSAGE);
    }
  });
  it('AC4: GBP is refused and named', () => {
    const r = parseSettlement(decodeSettlement(read('gbp.tsv')));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('GBP');
  });
});

describe('profile', () => {
  it('demo profile is valid, default misses the Verrechnungskonto', () => {
    expect(validateProfile(demoProfile())).toEqual([]);
    expect(validateProfile(defaultProfile()).join(' ')).toMatch(/Verrechnungskonto/);
  });
});

describe('every fixture through parse, check, generate', () => {
  const converting = ['normal.tsv', 'german-format.tsv', 'yearend.tsv', 'negative.tsv', 'difference.tsv', 'duplicate.tsv'];
  for (const f of converting) {
    it(`AC6 sum invariant: ${f}`, () => {
      const s = load(f);
      const p = demoProfile();
      const lines = generateBookings(s, p, { payout: false, overrideDifference: false });
      const withPayout = generateBookings(s, p, { payout: true, overrideDifference: false });
      const sumLines = lines.reduce((a, b) => a + b.signedCents, 0);
      const sumAll = withPayout.reduce((a, b) => a + b.signedCents, 0);
      const diff = checkSettlement(s, p).differenceCents;
      expect(sumLines).toBe(s.totalCents + diff); // lines sum equals the line sum
      if (diff === 0) {
        expect(sumLines).toBe(s.totalCents);
        expect(sumAll).toBe(0);
      }
      for (const b of withPayout) {
        expect(b.text.length).toBeLessThanOrEqual(60);
        expect(b.belegfeld1.length).toBeLessThanOrEqual(36);
        expect(b.text).not.toMatch(/[;\r\n]/);
      }
    });
  }
  it('order lines carry the order-id in Belegfeld 1', () => {
    const b = generateBookings(load('normal.tsv'), demoProfile(), { payout: true, overrideDifference: false });
    expect(b.filter((x) => x.belegfeld1.startsWith('028-')).length).toBeGreaterThan(10);
  });
  it('normal.tsv: Saldo stimmt', () => {
    const c = checkSettlement(load('normal.tsv'), demoProfile());
    expect(c.differenceCents).toBe(0);
    expect(c.balanced).toBe(true);
    expect(c.unmapped).toEqual([]);
  });
  it('AC9 negative total flips the payout', () => {
    const s = load('negative.tsv');
    expect(s.totalCents).toBeLessThan(0);
    const payout = generateBookings(s, demoProfile(), { payout: true, overrideDifference: false }).find((b) => b.kind === 'payout')!;
    expect(payout.sh).toBe('S');
    const normal = generateBookings(load('normal.tsv'), demoProfile(), { payout: true, overrideDifference: false }).find((b) => b.kind === 'payout')!;
    expect(normal.sh).toBe('H');
  });
  it('AC5 difference: blocked, then exactly one extra booking of 1,00', () => {
    const s = load('difference.tsv');
    const p = demoProfile();
    expect(checkSettlement(s, p).differenceCents).toBe(-100);
    const blocked = convertSettlement(s, p, mandant, opts);
    expect(blocked.blockers.join(' ')).toMatch(/Differenz/);
    const ok = convertSettlement(s, p, mandant, { ...opts, overrideDifference: true });
    expect(ok.blockers).toEqual([]);
    const d = ok.bookings.filter((b) => b.kind === 'difference');
    expect(d).toHaveLength(1);
    expect(d[0].umsatzCents).toBe(100);
    expect(d[0].gegenkonto).toBe(p.settings.differenzkonto);
    expect(ok.bookings.reduce((a, b) => a + b.signedCents, 0)).toBe(0);
  });
  it('AC7 unknown pair blocks until it is mapped, then appears in the file', () => {
    const s = load('unknown.tsv');
    const p = demoProfile();
    const c = convertSettlement(s, p, mandant, opts);
    expect(c.check.unmapped).toEqual([{ key: 'ItemFees|FooBarFee', count: 1, sumCents: -250 }]);
    expect(c.blockers.join(' ')).toMatch(/nicht zugeordnet/);
    p.mapping.push({ key: 'ItemFees|FooBarFee', account: '6780', bu: '', prefix: '', sammel: false, zusammenfassen: true });
    const c2 = convertSettlement(s, p, mandant, opts);
    expect(c2.blockers).toEqual([]);
    expect(c2.files[0].text).toContain('FooBarFee');
  });
  it('AC13 duplicates are counted and still booked', () => {
    const s = load('duplicate.tsv');
    expect(checkSettlement(s, demoProfile()).duplicateCount).toBe(1);
    expect(s.rows.length).toBe(load('normal.tsv').rows.length + 1);
  });
  it('AC8 fiscal year split on yearend.tsv', () => {
    const c = convertSettlement(load('yearend.tsv'), demoProfile(), mandant, opts);
    expect(c.files).toHaveLength(2);
    const heads = c.files.map((f) => f.text.split('\r\n')[0].split(';'));
    expect(heads.map((h) => h[12])).toEqual(['20260101', '20270101']);
    c.files.forEach((f, i) => {
      const [, , , , , , , , , , , , wj, , von, bis] = heads[i];
      expect(Number(von)).toBeGreaterThanOrEqual(Number(wj));
      expect(f.datumVon).toBe(von);
      expect(f.datumBis).toBe(bis);
    });
  });
  it('AC12 line limit', () => {
    const base = generateBookings(load('normal.tsv'), demoProfile(), { payout: false, overrideDifference: false })[0];
    const many = Array.from({ length: 100000 }, () => base);
    const chunks = splitBookings(many, 1);
    expect(chunks).toHaveLength(2);
    chunks.forEach((c) => expect(c.bookings.length).toBeLessThanOrEqual(MAX_LINES_PER_FILE));
  });
});

describe('EXTF', () => {
  const conv = () => convertSettlement(load('normal.tsv'), demoProfile(), mandant, opts);
  it('AC10 structure', () => {
    const f = conv().files[0];
    const lines = f.text.split('\r\n');
    expect(lines.at(-1)).toBe('');
    expect(lines[0].startsWith('"EXTF";700;21;"Buchungsstapel";13;')).toBe(true);
    expect(lines[0].split(';')).toHaveLength(EXTF_HEADER_FIELD_COUNT);
    expect(lines[1]).toBe(BUCHUNGSSTAPEL_COLUMNS.join(';'));
    expect(BUCHUNGSSTAPEL_COLUMNS).toHaveLength(125);
    for (const l of lines.slice(2, -1)) {
      expect(l.split(';')).toHaveLength(125);
      expect(l.split(';')[9]).toMatch(/^\d{4}$/);
    }
    expect(f.text).not.toMatch(/[^\r]\n/);
    expect(f.fileName).toBe('EXTF_Buchungsstapel_Amazon_12345678901_20261005-20261020.csv');
  });
  it('decimal comma, no thousands separator', () => {
    expect(formatCentsPlain(123456)).toBe('1234,56');
    expect(conv().files[0].dataLines[0].split(';')[0]).toMatch(/^\d+,\d{2}$/);
  });
  it('AC11 encodes ü as 0xFC', () => {
    const p = demoProfile();
    p.mapping.find((m) => m.key === 'ItemFees|Commission')!.prefix = 'Müller Gebühr';
    const f = convertSettlement(load('normal.tsv'), p, mandant, opts).files[0];
    expect(f.replaced).toEqual([]);
    const i = f.bytes.findIndex((b, k) => b === 0x4d && f.bytes[k + 1] === 0xfc);
    expect(i).toBeGreaterThan(0);
    expect(encodeCp1252('€ ☃').replaced).toEqual(['☃']);
  });
});
