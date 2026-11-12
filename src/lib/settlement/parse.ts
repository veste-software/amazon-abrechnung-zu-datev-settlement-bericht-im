import { V1_MESSAGE, V2_COLUMNS, type ParseResult, type SettlementRow } from './types';

class RowError extends Error {}

/** `1234.56`, `1234,56`, `1.234,56`, `-12,30` -> integer cents; null if unreadable. */
export function parseAmountToCents(input: string): number | null {
  let s = input.trim().replace(/\s/g, '');
  if (!s) return null;
  let sign = 1;
  if (s.startsWith('-')) {
    sign = -1;
    s = s.slice(1);
  } else if (s.startsWith('+')) s = s.slice(1);
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  let intPart: string;
  let frac = '';
  if (lastComma >= 0 && lastDot >= 0) {
    const dec = Math.max(lastComma, lastDot);
    intPart = s.slice(0, dec).replace(/[.,]/g, '');
    frac = s.slice(dec + 1);
  } else if (lastComma >= 0 || lastDot >= 0) {
    const sep = lastComma >= 0 ? ',' : '.';
    const parts = s.split(sep);
    if (parts.length > 2) {
      // several separators: thousands grouping only
      if (!parts.slice(1).every((p) => p.length === 3)) return null;
      intPart = parts.join('');
    } else {
      intPart = parts[0];
      frac = parts[1];
      if (frac.length > 2) return null; // "1.234" is ambiguous: refuse instead of guessing
    }
  } else {
    intPart = s;
  }
  if (!/^\d*$/.test(intPart) || !/^\d{0,2}$/.test(frac)) return null;
  if (intPart === '' && frac === '') return null;
  return sign * (Number(intPart || '0') * 100 + Number(frac.padEnd(2, '0') || '0'));
}

function validDate(y: number, m: number, d: number): boolean {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** ISO (with offset / space / UTC) and German dates -> YYYY-MM-DD; null if unreadable. */
export function parseDate(input: string): string | null {
  const s = input.trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?\s*(?:Z|UTC|[+-]\d{2}:?\d{2})?)?$/.exec(s);
  if (m && validDate(+m[1], +m[2], +m[3])) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{2})\.(\d{2})\.(\d{4})(?:\s+\d{2}:\d{2}(?::\d{2})?\s*(?:UTC)?)?$/.exec(s);
  if (m && validDate(+m[3], +m[2], +m[1])) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

export function parseSettlement(text: string): ParseResult {
  if (text.trimStart().startsWith('<')) return { ok: false, kind: 'v1', error: V1_MESSAGE };
  const lines = text.split(/\r\n|\n|\r/);
  if (!lines[0] || !lines[0].trim()) return { ok: false, kind: 'empty', error: 'Die Datei ist leer.' };
  const header = lines[0].split('\t').map((h) => h.trim().toLowerCase());
  if (header.includes('price-type') || header.includes('item-related-fee-type')) {
    return { ok: false, kind: 'v1', error: V1_MESSAGE };
  }
  const idx: Record<string, number> = {};
  header.forEach((h, i) => {
    if (!(h in idx)) idx[h] = i;
  });
  const essential = ['settlement-id', 'total-amount', 'currency', 'transaction-type', 'amount-type', 'amount-description', 'amount', 'posted-date'];
  const missingEssential = essential.filter((c) => !(c in idx));
  if (missingEssential.length) {
    return {
      ok: false,
      kind: 'format',
      error: `Zeile 1: Spalte »${missingEssential[0]}« fehlt. Das ist kein Abrechnungsbericht im Format Flat File V2.`,
    };
  }
  const notices: string[] = [];
  const unknown = header.filter((h) => h && !(V2_COLUMNS as readonly string[]).includes(h));
  if (unknown.length) notices.push(`Unbekannte Spalten werden ignoriert: ${unknown.join(', ')}.`);
  const missing = V2_COLUMNS.filter((c) => !(c in idx));
  if (missing.length) notices.push(`Spalten fehlen und bleiben leer: ${missing.join(', ')}.`);

  const cell = (cells: string[], name: string) => (name in idx ? (cells[idx[name]] ?? '').trim() : '');
  const dateOf = (v: string, line: number, name: string): string => {
    const d = parseDate(v);
    if (d === null) throw new RowError(`Zeile ${line}: Datum »${v}« in Spalte ${name} nicht erkannt.`);
    return d;
  };

  try {
    let summary: { id: string; start: string; end: string; deposit: string; total: number; currency: string } | null = null;
    const rows: SettlementRow[] = [];
    let noPostedDate = 0;
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const line = i + 1;
      const c = lines[i].split('\t');
      const total = cell(c, 'total-amount');
      const ttype = cell(c, 'transaction-type');
      if (total && !ttype) {
        const t = parseAmountToCents(total);
        if (t === null) throw new RowError(`Zeile ${line}: Betrag »${total}« in Spalte total-amount nicht erkannt.`);
        if (summary) throw new RowError(`Zeile ${line}: Die Datei enthält mehr als eine Abrechnung (zweite Summenzeile).`);
        summary = {
          id: cell(c, 'settlement-id'),
          start: dateOf(cell(c, 'settlement-start-date'), line, 'settlement-start-date'),
          end: dateOf(cell(c, 'settlement-end-date'), line, 'settlement-end-date'),
          deposit: dateOf(cell(c, 'deposit-date'), line, 'deposit-date'),
          total: t,
          currency: cell(c, 'currency'),
        };
        continue;
      }
      const amountRaw = cell(c, 'amount');
      const amount = parseAmountToCents(amountRaw);
      if (amount === null) throw new RowError(`Zeile ${line}: Betrag »${amountRaw}« in Spalte amount nicht erkannt.`);
      const postedRaw = cell(c, 'posted-date') || cell(c, 'posted-date-time');
      let posted = '';
      if (postedRaw) posted = dateOf(postedRaw, line, 'posted-date');
      else noPostedDate++;
      const row: SettlementRow = {
        line,
        transactionType: ttype,
        orderId: cell(c, 'order-id'),
        merchantOrderId: cell(c, 'merchant-order-id'),
        adjustmentId: cell(c, 'adjustment-id'),
        shipmentId: cell(c, 'shipment-id'),
        marketplace: cell(c, 'marketplace-name'),
        amountType: cell(c, 'amount-type'),
        amountDescription: cell(c, 'amount-description'),
        amountCents: amount,
        fulfillmentId: cell(c, 'fulfillment-id'),
        postedDate: posted,
        sku: cell(c, 'sku'),
        quantity: cell(c, 'quantity-purchased'),
        promotionId: cell(c, 'promotion-id'),
        dupKey: '',
      };
      row.dupKey = [
        cell(c, 'settlement-id'), ttype, row.orderId, row.merchantOrderId, row.adjustmentId, row.shipmentId,
        row.marketplace, row.amountType, row.amountDescription, String(amount), row.fulfillmentId, posted,
        cell(c, 'order-item-code'), cell(c, 'merchant-order-item-id'), cell(c, 'merchant-adjustment-item-id'),
        row.sku, row.quantity, row.promotionId,
      ].join('\u001f');
      rows.push(row);
    }
    if (!summary) {
      return { ok: false, kind: 'format', error: 'Keine Summenzeile gefunden (Zeile mit total-amount und leerem transaction-type).' };
    }
    if (summary.currency !== 'EUR') {
      return {
        ok: false,
        kind: 'currency',
        error: `Diese Abrechnung ist in ${summary.currency || 'unbekannter Währung'}. Es werden nur Abrechnungen in EUR verarbeitet; es wird nichts umgerechnet.`,
      };
    }
    for (const r of rows) if (!r.postedDate) r.postedDate = summary.end;
    if (noPostedDate) notices.push(`${noPostedDate} Zeile(n) ohne posted-date werden mit dem Abrechnungsende ${summary.end} gebucht.`);
    return {
      ok: true,
      settlement: {
        settlementId: summary.id,
        startDate: summary.start,
        endDate: summary.end,
        depositDate: summary.deposit,
        totalCents: summary.total,
        currency: summary.currency,
        rows,
        notices,
      },
    };
  } catch (e) {
    if (e instanceof RowError) return { ok: false, kind: 'format', error: e.message };
    throw e;
  }
}
