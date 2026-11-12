/** Named funnel steps only. Never a file name, amount, order id or any other value. */
export const EVENTS = ['file_parsed', 'check_ok', 'check_difference', 'plans_opened', 'download'] as const;
export type TrackEvent = (typeof EVENTS)[number];

interface Beacon {
  (name: string): void;
}

/**
 * Cloudflare Web Analytics has no custom-event API; the hook below is a no-op unless a page-level
 * `window.__a2dTrack` exists (it does not by default). The function accepts the event name and nothing else.
 */
export function track(name: TrackEvent): void {
  if (!(EVENTS as readonly string[]).includes(name)) return;
  const sink = (globalThis as { __a2dTrack?: Beacon }).__a2dTrack;
  if (typeof sink === 'function') sink(name);
}
