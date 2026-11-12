import { licenceKeyName, type KV, type LicenceRecord, type Plan } from './licence';

const enc = new TextEncoder();

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Stripe-Signature: `t=...,v1=...`, HMAC-SHA256 over `${t}.${payload}`, 5 minute tolerance. */
export async function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
): Promise<boolean> {
  if (!header || !secret) return false;
  const parts = header.split(',').map((p) => p.trim().split('='));
  const t = parts.find(([k]) => k === 't')?.[1];
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || !/^\d+$/.test(t) || !sigs.length) return false;
  if (Math.abs(nowSeconds - Number(t)) > toleranceSeconds) return false;
  const expected = await hmacHex(secret, `${t}.${payload}`);
  return sigs.some((s) => safeEqual(s, expected));
}

/** Test helper and reference for how Stripe builds the header. */
export async function signStripePayload(payload: string, secret: string, t: number): Promise<string> {
  return `t=${t},v1=${await hmacHex(secret, `${t}.${payload}`)}`;
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 symbols, so bytes map without bias

export function generateLicenceKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => ALPHABET[b % 32]).join('');
}

export interface StripeEvent {
  type: string;
  data: { object: Record<string, unknown> };
}

export interface HandledEvent {
  /** set when a new licence was created */
  created?: { key: string; customer: string };
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

export const sessionKeyName = (sessionId: string) => `session:${sessionId}`;
export const subscriptionKeyName = (subId: string) => `sub:${subId}`;

export async function handleStripeEvent(kv: KV, event: StripeEvent): Promise<HandledEvent> {
  const obj = event.data.object;
  if (event.type === 'checkout.session.completed') {
    const meta = (obj.metadata ?? {}) as Record<string, unknown>;
    const plan = str(meta.plan) as Plan;
    if (plan !== 'haendler' && plan !== 'kanzlei') return {};
    const key = generateLicenceKey();
    const rec: LicenceRecord = {
      plan,
      customer: str(obj.customer),
      subscription: str(obj.subscription),
      status: 'active',
      hashes: [],
    };
    await kv.put(licenceKeyName(key), JSON.stringify(rec));
    if (rec.subscription) await kv.put(subscriptionKeyName(rec.subscription), key);
    await kv.put(sessionKeyName(str(obj.id)), key);
    return { created: { key, customer: rec.customer } };
  }
  if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
    const subId = str(obj.id);
    const key = await kv.get(subscriptionKeyName(subId));
    if (!key) return {};
    const raw = await kv.get(licenceKeyName(key));
    if (!raw) return {};
    const rec = JSON.parse(raw) as LicenceRecord;
    const dead = ['canceled', 'unpaid', 'incomplete_expired'];
    const cancelled = event.type === 'customer.subscription.deleted' || dead.includes(str(obj.status));
    rec.status = cancelled ? 'cancelled' : 'active';
    await kv.put(licenceKeyName(key), JSON.stringify(rec));
  }
  return {};
}
