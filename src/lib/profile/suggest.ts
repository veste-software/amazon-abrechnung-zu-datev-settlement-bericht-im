import skr03 from '../../data/profiles/skr03.json';
import skr04 from '../../data/profiles/skr04.json';
import type { Chart, Kontenprofil } from './schema';

export interface SuggestionFile {
  chart: Chart;
  reverseChargeNote: string;
  notes: string;
  rows: Array<{ key: string; group: string; account: string; source: string; bu: string }>;
}

export const suggestions: Record<Chart, SuggestionFile> = { SKR03: skr03 as SuggestionFile, SKR04: skr04 as SuggestionFile };

/** Fills only empty account cells of non-Sammeldebitor rows; never overwrites what the user typed. */
export function applySuggestion(profile: Kontenprofil, chart: Chart = profile.chart): Kontenprofil {
  const sugg = suggestions[chart];
  return {
    ...profile,
    mapping: profile.mapping.map((m) => {
      const s = sugg.rows.find((r) => r.key === m.key);
      if (!s || m.sammel || m.account || !s.account) return m;
      return { ...m, account: s.account };
    }),
  };
}
