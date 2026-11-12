import { describe, expect, it } from 'vitest';
import { KNOWN_PAIRS, defaultProfile } from './defaults';
import { applySuggestion, suggestions } from './suggest';

describe('suggested profiles (AC19)', () => {
  for (const chart of ['SKR03', 'SKR04'] as const) {
    it(`${chart}: every non-empty account has a source, every BU is empty, every known pair is listed`, () => {
      const s = suggestions[chart];
      expect(s.reverseChargeNote).toContain('Reverse-Charge');
      for (const r of s.rows) {
        if (r.account) expect(r.source, r.key).not.toBe('');
        expect(r.bu, r.key).toBe('');
      }
      expect(s.rows.map((r) => r.key).sort()).toEqual(KNOWN_PAIRS.map(([t, d]) => `${t}|${d}`).sort());
    });
  }
  it('fills only empty cells', () => {
    const p = defaultProfile();
    p.mapping[11].account = '1234';
    expect(applySuggestion(p).mapping[11].account).toBe('1234');
  });
});
