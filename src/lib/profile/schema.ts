export type Chart = 'SKR03' | 'SKR04';

export interface MappingRow {
  /** `amount-type|amount-description` */
  key: string;
  /** target account; '' = not mapped */
  account: string;
  /** BU-Schlüssel, optional */
  bu: string;
  /** prefix put in front of the Buchungstext */
  prefix: string;
  /** book to the Sammeldebitor (OP-Ausgleich by order-id) instead of `account` */
  sammel: boolean;
  /** one booking per order instead of per source row */
  zusammenfassen: boolean;
}

export interface ProfileSettings {
  /** first month of the fiscal year, 1-12 */
  wjStartMonth: number;
  sachkontenlaenge: number;
  verrechnungskonto: string;
  geldtransit: string;
  sammeldebitor: string;
  differenzkonto: string;
}

export interface Kontenprofil {
  schemaVersion: 1;
  chart: Chart;
  settings: ProfileSettings;
  mapping: MappingRow[];
}

/** Not part of the exported profile: these identify the client. */
export interface Mandant {
  beraternummer: string;
  mandantennummer: string;
}

export const mappingKey = (amountType: string, amountDescription: string) => `${amountType}|${amountDescription}`;

export function validateProfile(p: Kontenprofil): string[] {
  const errors: string[] = [];
  const s = p.settings;
  const isAccount = (v: string) => /^\d{1,9}$/.test(v);
  if (!isAccount(s.verrechnungskonto)) errors.push('Amazon-Verrechnungskonto fehlt oder ist keine Kontonummer.');
  if (!isAccount(s.geldtransit)) errors.push('Geldtransit-Konto fehlt oder ist keine Kontonummer.');
  if (p.mapping.some((m) => m.sammel) && !isAccount(s.sammeldebitor)) {
    errors.push('Sammeldebitor fehlt, wird aber in der Kontenzuordnung verwendet.');
  }
  if (!Number.isInteger(s.sachkontenlaenge) || s.sachkontenlaenge < 4 || s.sachkontenlaenge > 8) {
    errors.push('Sachkontenlänge muss zwischen 4 und 8 liegen.');
  }
  if (!Number.isInteger(s.wjStartMonth) || s.wjStartMonth < 1 || s.wjStartMonth > 12) {
    errors.push('Beginn des Wirtschaftsjahres: Monat muss zwischen 1 und 12 liegen.');
  }
  for (const m of p.mapping) {
    if (m.account && !isAccount(m.account)) errors.push(`Zuordnung ${m.key}: »${m.account}« ist keine Kontonummer.`);
    if (m.bu && !/^\d{1,3}$/.test(m.bu)) errors.push(`Zuordnung ${m.key}: BU-Schlüssel »${m.bu}« ist ungültig.`);
  }
  return errors;
}

export function validateMandant(m: Mandant): string[] {
  const errors: string[] = [];
  if (!/^\d{4,7}$/.test(m.beraternummer)) errors.push('Beraternummer: 4 bis 7 Ziffern.');
  if (!/^\d{1,5}$/.test(m.mandantennummer)) errors.push('Mandantennummer: 1 bis 5 Ziffern.');
  return errors;
}
