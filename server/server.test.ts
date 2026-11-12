import { describe, expect, it } from 'vitest';
import { handleCheck, handleCheckout, handleSuccess, handleWebhook } from './handlers';
import { checkLicence, getLicence, PLAN_LIMITS, type KV } from './licence';
import { generateLicenceKey, handleStripeEvent, signStripePayload, verifyStripeSignature } from './stripe';

const memKv = (): KV & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, get: async (k) => data.get(k) ?? null, put: async (k, v) => void data.set(k, v) };
};
const hash = (n: number) => n.toString(16).padStart(64, '0');
const SECRET = 'whsec_test_secret';

async function newLicence(kv: KV, plan: 'haendler' | 'kanzlei', sub = 'sub_1') {
  const event = {
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_test_1', customer: 'cus_1', subscription: sub, metadata: { plan } } },
  };
  const r = await handleStripeEvent(kv, event);
  return r.created!.key;
}

describe('licence (AC15)', () => {
  it('valid key with new hash is ok, repeated hash stays ok', async () => {
    const kv = memKv();
    const key = await newLicence(kv, 'haendler');
    expect(await checkLicence(kv, key, hash(1))).toEqual({ ok: true });
    expect(await checkLicence(kv, key, hash(1))).toEqual({ ok: true });
  });
  it('Händler refuses a second distinct hash', async () => {
    const kv = memKv();
    const key = await newLicence(kv, 'haendler');
    await checkLicence(kv, key, hash(1));
    expect(await checkLicence(kv, key, hash(2))).toEqual({ ok: false, reason: 'limit' });
  });
  it('Kanzlei accepts 25 and refuses the 26th', async () => {
    const kv = memKv();
    const key = await newLicence(kv, 'kanzlei');
    for (let i = 1; i <= PLAN_LIMITS.kanzlei; i++) expect((await checkLicence(kv, key, hash(i))).ok).toBe(true);
    expect(await checkLicence(kv, key, hash(26))).toEqual({ ok: false, reason: 'limit' });
  });
  it('unknown key and bad input are refused', async () => {
    const kv = memKv();
    expect(await checkLicence(kv, 'A'.repeat(32), hash(1))).toEqual({ ok: false, reason: 'unknown' });
    expect(await checkLicence(kv, 'short', hash(1))).toEqual({ ok: false, reason: 'invalid' });
    expect(await checkLicence(kv, 'A'.repeat(32), 'xyz')).toEqual({ ok: false, reason: 'invalid' });
  });
  it('cancelled subscription is refused', async () => {
    const kv = memKv();
    const key = await newLicence(kv, 'haendler', 'sub_9');
    await handleStripeEvent(kv, { type: 'customer.subscription.deleted', data: { object: { id: 'sub_9' } } });
    expect((await getLicence(kv, key))!.status).toBe('cancelled');
    expect(await checkLicence(kv, key, hash(1))).toEqual({ ok: false, reason: 'cancelled' });
    await handleStripeEvent(kv, { type: 'customer.subscription.updated', data: { object: { id: 'sub_9', status: 'active' } } });
    expect((await checkLicence(kv, key, hash(1))).ok).toBe(true);
  });
  it('keys are 32 characters and differ', () => {
    const a = generateLicenceKey();
    expect(a).toMatch(/^[A-Z2-9]{32}$/);
    expect(generateLicenceKey()).not.toBe(a);
  });
});

describe('stripe signature', () => {
  const payload = JSON.stringify({ id: 'evt_1' });
  it('accepts a valid signature and refuses tampering, old timestamps and missing header', async () => {
    const t = 1_800_000_000;
    const header = await signStripePayload(payload, SECRET, t);
    expect(await verifyStripeSignature(payload, header, SECRET, t + 10)).toBe(true);
    expect(await verifyStripeSignature(payload + ' ', header, SECRET, t + 10)).toBe(false);
    expect(await verifyStripeSignature(payload, header, 'other', t + 10)).toBe(false);
    expect(await verifyStripeSignature(payload, header, SECRET, t + 301)).toBe(false);
    expect(await verifyStripeSignature(payload, null, SECRET, t)).toBe(false);
  });
});

describe('http handlers', () => {
  const post = (body: unknown) => new Request('https://x.test/api/licence/check', { method: 'POST', body: JSON.stringify(body) });
  it('check answers ok / refused / 400', async () => {
    const kv = memKv();
    const key = await newLicence(kv, 'haendler');
    const ok = await handleCheck(post({ licenceKey: key, hash: hash(1) }), kv);
    expect(await ok.json()).toEqual({ ok: true });
    expect((await handleCheck(post({ licenceKey: 'A'.repeat(32), hash: hash(1) }), kv)).status).toBe(403);
    expect((await handleCheck(post({ licenceKey: key, hash: 'nothex' }), kv)).status).toBe(400);
    expect((await handleCheck(new Request('https://x.test', { method: 'POST', body: 'nojson' }), kv)).status).toBe(400);
  });
  it('webhook verifies the signature, stores the licence and writes the key to the customer', async () => {
    const kv = memKv();
    const body = JSON.stringify({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_77', customer: 'cus_77', subscription: 'sub_77', metadata: { plan: 'kanzlei' } } },
    });
    const t = Math.floor(Date.now() / 1000);
    const calls: Array<{ url: string; body: string }> = [];
    const fetchMock = async (url: string, init: RequestInit) => {
      calls.push({ url, body: String(init.body) });
      return new Response('{}');
    };
    const env = { LICENCES: kv, STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: SECRET };
    const bad = await handleWebhook(new Request('https://x.test', { method: 'POST', body, headers: { 'stripe-signature': 't=1,v1=00' } }), env, fetchMock);
    expect(bad.status).toBe(400);
    const sig = await signStripePayload(body, SECRET, t);
    const res = await handleWebhook(new Request('https://x.test', { method: 'POST', body, headers: { 'stripe-signature': sig } }), env, fetchMock);
    expect(res.status).toBe(200);
    const key = await kv.get('session:cs_test_77');
    expect(key).toMatch(/^[A-Z2-9]{32}$/);
    expect((await getLicence(kv, key!))!.plan).toBe('kanzlei');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.stripe.com/v1/customers/cus_77');
    expect(decodeURIComponent(calls[0].body.replace(/\+/g, ' '))).toContain(key!);
    const page = await handleSuccess(new Request('https://x.test/api/licence/success?session_id=cs_test_77'), kv);
    expect(await page.text()).toContain(key!);
  });
  it('checkout redirects with 303 and refuses unknown plans', async () => {
    const env = {
      LICENCES: memKv(), STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: SECRET, STRIPE_PRICE_HAENDLER_MONTH: 'price_h_m',
      STRIPE_PRICE_HAENDLER_YEAR: '', STRIPE_PRICE_KANZLEI_MONTH: '', STRIPE_PRICE_KANZLEI_YEAR: '',
    };
    const form = (plan: string) => {
      const f = new FormData();
      f.set('plan', plan);
      return new Request('https://x.test/api/checkout', { method: 'POST', body: f });
    };
    let sent = '';
    const fetchMock = async (_u: string, init: RequestInit) => {
      sent = String(init.body);
      return new Response(JSON.stringify({ url: 'https://checkout.stripe.com/c/pay/cs_test' }));
    };
    const res = await handleCheckout(form('haendler-month'), env, fetchMock);
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('https://checkout.stripe.com/c/pay/cs_test');
    expect(sent).toContain('price_h_m');
    expect((await handleCheckout(form('evil'), env, fetchMock)).status).toBe(400);
    expect((await handleCheckout(form('kanzlei-year'), env, fetchMock)).status).toBe(503);
  });
});
