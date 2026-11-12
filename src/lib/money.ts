// Money is integer cents everywhere; text only at the edges.
export function formatCents(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100);
  const rest = String(abs % 100).padStart(2, '0');
  return `${sign}${String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${rest}`;
}

/** EXTF notation: decimal comma, no thousands separator, no sign. */
export function formatCentsPlain(cents: number): string {
  const abs = Math.abs(cents);
  return `${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`;
}

/** 2026-10-03 -> 03.10.2026 */
export function formatDateDe(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}
