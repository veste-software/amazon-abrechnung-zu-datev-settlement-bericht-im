import { generateBookings, type Booking } from './booking/generate';
import { splitBookings } from './booking/split';
import { checkSettlement, type CheckResult } from './check';
import { writeExtf, type ExtfFile } from './datev/extf';
import { validateMandant, validateProfile, type Kontenprofil, type Mandant } from './profile/schema';
import type { Settlement } from './settlement/types';

export interface ConvertOptions {
  overrideDifference: boolean;
  /** YYYYMMDDHHMMSSmmm */
  erzeugtAm: string;
}

export interface Conversion {
  check: CheckResult;
  bookings: Booking[];
  files: ExtfFile[];
  /** why the download is not possible yet; empty = ready */
  blockers: string[];
}

export function convertSettlement(
  settlement: Settlement,
  profile: Kontenprofil,
  mandant: Mandant,
  opts: ConvertOptions,
): Conversion {
  const check = checkSettlement(settlement, profile);
  const blockers: string[] = [...validateProfile(profile), ...validateMandant(mandant)];
  if (check.unmapped.length) blockers.push(`${check.unmapped.length} Position(en) sind nicht zugeordnet.`);
  if (!check.balanced && !opts.overrideDifference) blockers.push('Die Abrechnung hat eine Differenz. Export nur mit der Option »Trotzdem exportieren«.');
  if (!check.balanced && opts.overrideDifference && !profile.settings.differenzkonto) {
    blockers.push('Für die Differenzbuchung fehlt das Differenzkonto.');
  }
  const bookings = generateBookings(settlement, profile, { payout: true, overrideDifference: opts.overrideDifference });
  const chunks = splitBookings(bookings, profile.settings.wjStartMonth);
  const used = new Set<string>();
  const files = chunks.map((c) => {
    const f = writeExtf(c.bookings, {
      beraternummer: mandant.beraternummer,
      mandantennummer: mandant.mandantennummer,
      wjBeginn: c.wjBeginn,
      sachkontenlaenge: profile.settings.sachkontenlaenge,
      settlementId: settlement.settlementId,
      chart: profile.chart,
      erzeugtAm: opts.erzeugtAm,
    });
    let name = f.fileName;
    for (let n = 2; used.has(name); n++) name = f.fileName.replace(/\.csv$/, `_Teil${n}.csv`);
    used.add(name);
    return { ...f, fileName: name };
  });
  return { check, bookings, files, blockers };
}
