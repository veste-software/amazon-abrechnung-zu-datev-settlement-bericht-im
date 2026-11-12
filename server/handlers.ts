import { checkLicence, type KV } from './licence';
import { handleStripeEvent, sessionKeyName, verifyStripeSignature, type StripeEvent } from './stripe';

export interface Env {
  LICENCES: KV;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_HAENDLER_MONTH: string;
  STRIPE_PRICE_HAENDLER_YEAR: string;
  STRIPE_PRICE_KANZLEI_MONTH: string;
  STRIPE_PRICE_KANZLEI_YEAR: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export async function handleCheck(request: Request, kv: KV): Promise<Response> {
  let body: { licenceKey?: unknown; hash?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, reason: 'invalid' }, 400);
  }
  if (typeof body.licenceKey !== 'string' || typeof body.hash !== 'string' || !/^[0-9a-f]{64}$/.test(body.hash)) {
    return json({ ok: false, reason: 'invalid' }, 400);
  }
  const answer = await checkLicence(kv, body.licenceKey, body.hash);
  return json(answer, answer.ok ? 200 : 403);
}

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

const form = (data: Record<string, string>) => new URLSearchParams(data).toString();
const stripeHeaders = (secret: string) => ({
  authorization: `Bearer ${secret}`,
  'content-type': 'application/x-www-form-urlencoded',
});

export async function handleWebhook(
  request: Request,
  env: Pick<Env, 'LICENCES' | 'STRIPE_SECRET_KEY' | 'STRIPE_WEBHOOK_SECRET'>,
  fetchImpl: FetchLike = fetch,
  nowSeconds?: number,
): Promise<Response> {
  const payload = await request.text();
  const ok = await verifyStripeSignature(payload, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET, nowSeconds);
  if (!ok) return json({ error: 'signature' }, 400);
  const event = JSON.parse(payload) as StripeEvent;
  const handled = await handleStripeEvent(env.LICENCES, event);
  if (handled.created?.customer) {
    // the key goes onto every Stripe invoice, so customers can find it again without an email system of ours
    await fetchImpl(`https://api.stripe.com/v1/customers/${encodeURIComponent(handled.created.customer)}`, {
      method: 'POST',
      headers: stripeHeaders(env.STRIPE_SECRET_KEY),
      body: form({
        'invoice_settings[custom_fields][0][name]': 'Lizenzschlüssel',
        'invoice_settings[custom_fields][0][value]': handled.created.key,
      }),
    });
  }
  return json({ received: true });
}

const PLANS: Record<string, { plan: 'haendler' | 'kanzlei'; env: keyof Env }> = {
  'haendler-month': { plan: 'haendler', env: 'STRIPE_PRICE_HAENDLER_MONTH' },
  'haendler-year': { plan: 'haendler', env: 'STRIPE_PRICE_HAENDLER_YEAR' },
  'kanzlei-month': { plan: 'kanzlei', env: 'STRIPE_PRICE_KANZLEI_MONTH' },
  'kanzlei-year': { plan: 'kanzlei', env: 'STRIPE_PRICE_KANZLEI_YEAR' },
};

export async function handleCheckout(request: Request, env: Env, fetchImpl: FetchLike = fetch): Promise<Response> {
  const data = await request.formData();
  const chosen = PLANS[String(data.get('plan') ?? '')];
  if (!chosen) return new Response('Unbekannter Tarif.', { status: 400 });
  const price = env[chosen.env] as string;
  if (!price) return new Response('Dieser Tarif ist nicht eingerichtet.', { status: 503 });
  const origin = new URL(request.url).origin;
  const res = await fetchImpl('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: stripeHeaders(env.STRIPE_SECRET_KEY),
    body: form({
      mode: 'subscription',
      'line_items[0][price]': price,
      'line_items[0][quantity]': '1',
      success_url: `${origin}/api/licence/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      'metadata[plan]': chosen.plan,
      'subscription_data[metadata][plan]': chosen.plan,
    }),
  });
  const session = (await res.json().catch(() => ({}))) as { url?: string };
  if (!res.ok || !session.url) return new Response('Die Zahlung konnte nicht gestartet werden.', { status: 502 });
  return Response.redirect(session.url, 303);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function handleSuccess(request: Request, kv: KV): Promise<Response> {
  const id = new URL(request.url).searchParams.get('session_id') ?? '';
  const key = /^cs_[A-Za-z0-9_]+$/.test(id) ? await kv.get(sessionKeyName(id)) : null;
  const body = key
    ? `<p>Ihr Lizenzschlüssel:</p><p class="key">${esc(key)}</p>
       <p>Tragen Sie ihn im Konverter im Feld »Lizenzschlüssel« ein. Er steht auch auf jeder Stripe-Rechnung unter »Lizenzschlüssel«.</p>`
    : `<p>Die Zahlung wird noch verarbeitet. Laden Sie diese Seite in einigen Sekunden neu. Der Schlüssel steht außerdem auf Ihrer Stripe-Rechnung.</p>`;
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Lizenzschlüssel</title>
<style>body{margin:0;background:#f6f3ea;color:#24292b;font:17px/1.55 'Archivo Variable',Archivo,Arial,sans-serif;padding:2rem 1.75rem}
main{max-width:40rem}h1{font-size:2rem;letter-spacing:-.02em;border-bottom:2px solid #24292b;padding-bottom:.5rem}
.key{font:600 1.375rem 'IBM Plex Mono',ui-monospace,monospace;background:#e2edDC;padding:.5rem 1rem;overflow-wrap:anywhere}
a{color:#b0281f}</style></head><body><main><h1>Lizenzschlüssel</h1>${body}<p><a href="/">Zurück zum Konverter</a></p></main></body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
