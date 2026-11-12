import { MAX_LINES_PER_FILE } from '../datev/columns';
import type { Booking } from './generate';

export interface BookingChunk {
  /** YYYYMMDD, start of the fiscal year all bookings of this chunk fall into */
  wjBeginn: string;
  bookings: Booking[];
}

/** First day (YYYYMMDD) of the fiscal year that contains `iso` (YYYY-MM-DD). */
export function fiscalYearStart(iso: string, startMonth: number): string {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  const year = m >= startMonth ? y : y - 1;
  return `${year}${String(startMonth).padStart(2, '0')}01`;
}

/** Split by fiscal year, then into chunks of at most `maxLines` lines. Order is kept. */
export function splitBookings(bookings: Booking[], startMonth: number, maxLines = MAX_LINES_PER_FILE): BookingChunk[] {
  const byYear = new Map<string, Booking[]>();
  for (const b of bookings) {
    const wj = fiscalYearStart(b.belegdatum, startMonth);
    const list = byYear.get(wj);
    if (list) list.push(b);
    else byYear.set(wj, [b]);
  }
  const chunks: BookingChunk[] = [];
  for (const wj of [...byYear.keys()].sort()) {
    const list = byYear.get(wj)!;
    for (let i = 0; i < list.length; i += maxLines) chunks.push({ wjBeginn: wj, bookings: list.slice(i, i + maxLines) });
  }
  return chunks;
}
