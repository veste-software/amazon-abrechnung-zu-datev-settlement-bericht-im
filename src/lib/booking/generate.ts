import { mappingKey, type Kontenprofil, type MappingRow } from '../profile/schema';
import type { Settlement, SettlementRow } from '../settlement/types';

export interface Booking {
  kind: 'line' | 'payout' | 'difference';
  /** absolute amount in cents */
  umsatzCents: number;
  /** S = Verrechnungskonto debited (balance goes up) */
  sh: 'S' | 'H';
  /** signed amount as seen from the Verrechnungskonto (S positive) */
  signedCents: number;
  konto: string;
  gegenkonto: string;
  bu: string;
  /** YYYY-MM-DD */
  belegdatum: string;
  belegfeld1: string;
  text: string;
}

export interface GenerateOptions {
  /** add the payout booking (Verrechnungskonto against Geldtransit) */
  payout: boolean;
  /** book a difference between Amazon total and line sum to the Differenzkonto */
  overrideDifference: boolean;
}

export function cleanText(s: string, max: number): string {
  return s.replace(/[;\r\n\t"]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max).trim();
}

export function mappingFor(profile: Kontenprofil, row: SettlementRow): MappingRow | undefined {
  const key = mappingKey(row.amountType, row.amountDescription);
  return profile.mapping.find((m) => m.key === key);
}

/** The account a row is booked to, or null when it is not mapped. */
export function targetAccount(profile: Kontenprofil, m: MappingRow | undefined): string | null {
  if (!m) return null;
  if (m.sammel) return profile.settings.sammeldebitor || null;
  return m.account || null;
}

export function sign(cents: number): 'S' | 'H' {
  return cents >= 0 ? 'S' : 'H';
}

export function generateBookings(settlement: Settlement, profile: Kontenprofil, opts: GenerateOptions): Booking[] {
  const s = profile.settings;
  const useOrderRef = s.sammeldebitor !== '';
  interface Group {
    first: SettlementRow;
    account: string;
    bu: string;
    prefix: string;
    cents: number;
  }
  const groups = new Map<string, Group>();
  for (const row of settlement.rows) {
    const m = mappingFor(profile, row);
    const account = targetAccount(profile, m);
    if (!m || account === null) continue; // not mapped: reported by the check, blocks the download
    const orderRef = row.orderId || row.adjustmentId;
    let key: string;
    if (!m.zusammenfassen) key = `row${row.line}`;
    else if (orderRef) key = ['o', orderRef, account, m.bu, row.postedDate].join('\u001f');
    else key = ['n', row.amountDescription, account, m.bu, row.postedDate].join('\u001f');
    const g = groups.get(key);
    if (g) g.cents += row.amountCents;
    else groups.set(key, { first: row, account, bu: m.bu, prefix: m.prefix, cents: row.amountCents });
  }
  const out: Booking[] = [];
  for (const g of groups.values()) {
    if (g.cents === 0) continue;
    const r = g.first;
    const orderRef = r.orderId || r.adjustmentId;
    out.push({
      kind: 'line',
      umsatzCents: Math.abs(g.cents),
      sh: sign(g.cents),
      signedCents: g.cents,
      konto: s.verrechnungskonto,
      gegenkonto: g.account,
      bu: g.bu,
      belegdatum: r.postedDate,
      belegfeld1: cleanText(useOrderRef && orderRef ? orderRef : settlement.settlementId, 36),
      text: cleanText(`${g.prefix ? g.prefix + ' ' : ''}${r.amountDescription}`, 60),
    });
  }
  const sum = out.reduce((a, b) => a + b.signedCents, 0);
  const diff = settlement.totalCents - sum;
  if (opts.overrideDifference && diff !== 0 && s.differenzkonto) {
    out.push({
      kind: 'difference',
      umsatzCents: Math.abs(diff),
      sh: sign(diff),
      signedCents: diff,
      konto: s.verrechnungskonto,
      gegenkonto: s.differenzkonto,
      bu: '',
      belegdatum: settlement.depositDate,
      belegfeld1: cleanText(settlement.settlementId, 36),
      text: cleanText(`Differenz Abrechnung ${settlement.settlementId}`, 60),
    });
  }
  if (opts.payout && settlement.totalCents !== 0) {
    const signed = -settlement.totalCents; // money leaves the Amazon balance towards the bank
    out.push({
      kind: 'payout',
      umsatzCents: Math.abs(signed),
      sh: sign(signed),
      signedCents: signed,
      konto: s.verrechnungskonto,
      gegenkonto: s.geldtransit,
      bu: '',
      belegdatum: settlement.depositDate,
      belegfeld1: cleanText(settlement.settlementId, 36),
      text: cleanText(`Auszahlung Amazon ${settlement.settlementId}`, 60),
    });
  }
  return out;
}
