import { zipSync } from 'fflate';
import type { ExtfFile } from './datev/extf';

/** One ZIP with every EXTF file under its own name (store only: CSV files are small). */
export function zipFiles(files: Pick<ExtfFile, 'fileName' | 'bytes'>[]): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  for (const f of files) entries[f.fileName] = f.bytes;
  return zipSync(entries, { level: 6 });
}
