import { afterEach, describe, expect, it } from 'vitest';
import { EVENTS, track, type TrackEvent } from './track';

type G = { __a2dTrack?: (...args: unknown[]) => void };

afterEach(() => {
  delete (globalThis as G).__a2dTrack;
});

describe('track', () => {
  it('is a no-op without a beacon', () => {
    expect(() => track('download')).not.toThrow();
  });
  it('passes exactly the event name, nothing else', () => {
    const calls: unknown[][] = [];
    (globalThis as G).__a2dTrack = (...a) => void calls.push(a);
    for (const e of EVENTS) track(e);
    expect(calls).toEqual(EVENTS.map((e) => [e]));
    track('12,34 €' as TrackEvent);
    expect(calls).toHaveLength(EVENTS.length);
  });
});
