import type { Booking } from '../booking/generate';
import { formatCentsPlain } from '../money';
import type { Chart } from '../profile/schema';
import { encodeCp1252 } from './cp1252';
import {
  BUCHUNGSSTAPEL_COLUMNS, COLUMN_INDEX, EXTF_CATEGORY, EXTF_FORMAT_NAME, EXTF_FORMAT_VERSION, EXTF_HEADER_VERSION,
} from './columns';

export interface ExtfOptions {
  beraternummer: string;
  mandantennummer: string;
  /** YYYYMMDD */
  wjBeginn: string;
  sachkontenlaenge: number;
  settlementId: string;
  chart: Chart;
  /** YYYYMMDDHHMMSSmmm; a parameter so tests are deterministic */
  erzeugtAm: string;
}

export interface ExtfFile {
  fileName: string;
  bytes: Uint8Array;
  text: string;
  /** characters outside Windows-1252 that became `?` */
  replaced: string[];
  /** data lines only (no header lines), as written */
  dataLines: string[];
  datumVon: string;
  datumBis: string;
}

const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
const compact = (iso: string) => iso.replace(/-/g, '');

export function dataLine(b: Booking): string {
  const f: string[] = new Array(BUCHUNGSSTAPEL_COLUMNS.length).fill('');
  f[COLUMN_INDEX.umsatz] = formatCentsPlain(b.umsatzCents);
  f[COLUMN_INDEX.sh] = q(b.sh);
  f[COLUMN_INDEX.wkz] = q('EUR');
  f[COLUMN_INDEX.konto] = b.konto;
  f[COLUMN_INDEX.gegenkonto] = b.gegenkonto;
  f[COLUMN_INDEX.bu] = b.bu;
  f[COLUMN_INDEX.belegdatum] = b.belegdatum.slice(8, 10) + b.belegdatum.slice(5, 7);
  f[COLUMN_INDEX.belegfeld1] = q(b.belegfeld1);
  f[COLUMN_INDEX.text] = q(b.text);
  return f.join(';');
}

export function headerLine(o: ExtfOptions, datumVon: string, datumBis: string): string {
  const skr = o.chart === 'SKR04' ? '04' : '03';
  const f = [
    q('EXTF'), String(EXTF_HEADER_VERSION), String(EXTF_CATEGORY), q(EXTF_FORMAT_NAME), String(EXTF_FORMAT_VERSION),
    o.erzeugtAm, '', q('XX'), q(''), q(''), o.beraternummer, o.mandantennummer, o.wjBeginn,
    String(o.sachkontenlaenge), datumVon, datumBis, q(`Amazon ${o.settlementId}`), q(''), '1', '0', '0', q('EUR'),
    '', q(''), '', '', q(skr), '', '', q(''), '',
  ];
  return f.join(';');
}

export function extfFileName(settlementId: string, datumVon: string, datumBis: string): string {
  return `EXTF_Buchungsstapel_Amazon_${settlementId.replace(/[^\w-]/g, '')}_${datumVon}-${datumBis}.csv`;
}

export function writeExtf(bookings: Booking[], o: ExtfOptions): ExtfFile {
  const dates = bookings.map((b) => compact(b.belegdatum)).sort();
  const datumVon = dates[0] ?? o.wjBeginn;
  const datumBis = dates[dates.length - 1] ?? o.wjBeginn;
  const dataLines = bookings.map(dataLine);
  const text = [headerLine(o, datumVon, datumBis), BUCHUNGSSTAPEL_COLUMNS.join(';'), ...dataLines].join('\r\n') + '\r\n';
  const { bytes, replaced } = encodeCp1252(text);
  return { fileName: extfFileName(o.settlementId, datumVon, datumBis), bytes, text, replaced, dataLines, datumVon, datumBis };
}
