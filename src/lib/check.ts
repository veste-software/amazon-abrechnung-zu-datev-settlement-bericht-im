import { generateBookings, mappingFor, targetAccount, type Booking } from './booking/generate';
import type { Kontenprofil } from './profile/schema';
import type { Settlement } from './settlement/types';

export interface UnmappedPair {
  key: string;
  count: number;
  sumCents: number;
}

export interface CheckResult {
  totalCents: number;
  /** sum of all source lines */
  sumCents: number;
  /** line sum minus Amazon total; 0 = "Saldo stimmt" */
  differenceCents: number;
  balanced: boolean;
  perAccount: Array<{ account: string; sumCents: number }>;
  largest: Booking[];
  unmapped: UnmappedPair[];
  /** rows that repeat an earlier row in every column (counted, not removed) */
  duplicateCount: number;
  lineBookings: Booking[];
}

export function checkSettlement(settlement: Settlement, profile: Kontenprofil): CheckResult {
  const sumCents = settlement.rows.reduce((a, r) => a + r.amountCents, 0);
  const differenceCents = sumCents - settlement.totalCents;
  const lineBookings = generateBookings(settlement, profile, { payout: false, overrideDifference: false });

  const perAcc = new Map<string, number>();
  for (const b of lineBookings) perAcc.set(b.gegenkonto, (perAcc.get(b.gegenkonto) ?? 0) + b.signedCents);

  const unmappedMap = new Map<string, UnmappedPair>();
  const seen = new Set<string>();
  let duplicateCount = 0;
  for (const r of settlement.rows) {
    if (targetAccount(profile, mappingFor(profile, r)) === null) {
      const key = `${r.amountType}|${r.amountDescription}`;
      const u = unmappedMap.get(key) ?? { key, count: 0, sumCents: 0 };
      u.count++;
      u.sumCents += r.amountCents;
      unmappedMap.set(key, u);
    }
    if (seen.has(r.dupKey)) duplicateCount++;
    else seen.add(r.dupKey);
  }

  return {
    totalCents: settlement.totalCents,
    sumCents,
    differenceCents,
    balanced: differenceCents === 0,
    perAccount: [...perAcc].map(([account, c]) => ({ account, sumCents: c })).sort((a, b) => a.account.localeCompare(b.account)),
    largest: [...lineBookings].sort((a, b) => b.umsatzCents - a.umsatzCents).slice(0, 20),
    unmapped: [...unmappedMap.values()],
    duplicateCount,
    lineBookings,
  };
}
