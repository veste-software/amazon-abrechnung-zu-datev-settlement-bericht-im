// DATEV EXTF constants for the Buchungsstapel.
// Source: DATEV Developer Portal, "DATEV-Format" (https://developer.datev.de/datev/platform/en/dtvf).
// The portal's format-version table lists Buchungsstapel = 13; DATEV's interface requirements accept 12 as
// the minimum. The Builder has no web access: the column list below follows the published Formatbeschreibung
// from memory of its structure (125 fields) and MUST be compared with the portal by a human before going live.
// A test import into DATEV by a tax firm is listed in SPEC §11.

export const EXTF_HEADER_VERSION = 700;
export const EXTF_CATEGORY = 21;
export const EXTF_FORMAT_NAME = 'Buchungsstapel';
export const EXTF_FORMAT_VERSION = 13;
export const EXTF_HEADER_FIELD_COUNT = 31;
export const MAX_LINES_PER_FILE = 99997;

const beleginfo = Array.from({ length: 8 }, (_, i) => [`Beleginfo - Art ${i + 1}`, `Beleginfo - Inhalt ${i + 1}`]).flat();
const zusatz = Array.from({ length: 20 }, (_, i) => [`Zusatzinformation - Art ${i + 1}`, `Zusatzinformation- Inhalt ${i + 1}`]).flat();

export const BUCHUNGSSTAPEL_COLUMNS: readonly string[] = [
  'Umsatz (ohne Soll/Haben-Kz)', 'Soll/Haben-Kennzeichen', 'WKZ Umsatz', 'Kurs', 'Basis-Umsatz', 'WKZ Basis-Umsatz',
  'Konto', 'Gegenkonto (ohne BU-Schlüssel)', 'BU-Schlüssel', 'Belegdatum', 'Belegfeld 1', 'Belegfeld 2', 'Skonto',
  'Buchungstext', 'Postensperre', 'Diverse Adressnummer', 'Geschäftspartnerbank', 'Sachverhalt', 'Zinssperre',
  'Beleglink', ...beleginfo,
  'KOST1 - Kostenstelle', 'KOST2 - Kostenstelle', 'Kost-Menge', 'EU-Land u. UStID (Bestimmung)',
  'EU-Steuersatz (Bestimmung)', 'Abw. Versteuerungsart', 'Sachverhalt L+L', 'Funktionsergänzung L+L',
  'BU 49 Hauptfunktionstyp', 'BU 49 Hauptfunktionsnummer', 'BU 49 Funktionsergänzung', ...zusatz,
  'Stück', 'Gewicht', 'Zahlweise', 'Forderungsart', 'Veranlagungsjahr', 'Zugeordnete Fälligkeit', 'Skontotyp',
  'Auftragsnummer', 'Buchungstyp', 'USt-Schlüssel (Anzahlungen)', 'EU-Mitgliedstaat (Anzahlungen)',
  'Sachverhalt L+L (Anzahlungen)', 'EU-Steuersatz (Anzahlungen)', 'Erlöskonto (Anzahlungen)', 'Herkunft-Kz',
  'Leerfeld', 'KOST-Datum', 'SEPA-Mandatsreferenz', 'Skontosperre', 'Gesellschaftername', 'Beteiligtennummer',
  'Identifikationsnummer', 'Zeichnernummer', 'Postensperre bis', 'Bezeichnung SoBil-Sachverhalt',
  'Kennzeichen SoBil-Buchung', 'Festschreibung', 'Leistungsdatum', 'Datum Zuord.Steuerperiode', 'Fälligkeit',
  'Generalumkehr (GU)', 'Steuersatz', 'Land', 'Abrechnungsreferenz', 'BVV-Position',
  'EU-Mitgliedstaat u. UStID (Ursprung)', 'EU-Steuersatz (Ursprung)', 'Abw. Skontokonto',
];

export const COLUMN_INDEX = {
  umsatz: 0,
  sh: 1,
  wkz: 2,
  konto: 6,
  gegenkonto: 7,
  bu: 8,
  belegdatum: 9,
  belegfeld1: 10,
  text: 13,
} as const;
