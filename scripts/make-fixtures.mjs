// Writes SYNTHETIC settlement fixtures into fixtures/. Deterministic: no randomness, no clock.
// The files follow the 24 documented Flat File V2 columns, not a real Amazon file.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

const COLUMNS = [
  'settlement-id', 'settlement-start-date', 'settlement-end-date', 'deposit-date', 'total-amount', 'currency',
  'transaction-type', 'order-id', 'merchant-order-id', 'adjustment-id', 'shipment-id', 'marketplace-name',
  'amount-type', 'amount-description', 'amount', 'fulfillment-id', 'posted-date', 'posted-date-time',
  'order-item-code', 'merchant-order-item-id', 'merchant-adjustment-item-id', 'sku', 'quantity-purchased',
  'promotion-id',
];

// amounts in cents
const order = (id, date, sku, price, ship, promo, commission, fba) => ({
  kind: 'Order', id, date, sku,
  lines: [
    ['ItemPrice', 'Principal', price],
    ['ItemPrice', 'Shipping', ship],
    ['Promotion', 'Principal', promo],
    ['ItemFees', 'Commission', commission],
    ['ItemFees', 'FBAPerUnitFulfillmentFee', fba],
  ],
});

function normalOrders(d) {
  // d: [date1, date2, date3, date4, date5]
  return [
    order('028-1000001-1000001', d[0], 'SKU-TASSE-01', 1999, 399, -200, -300, -306),
    order('028-1000002-2000002', d[0], 'SKU-KERZE-02', 2450, 0, 0, -368, -306),
    order('028-1000003-3000003', d[1], 'SKU-LAMPE-03', 5990, 499, -500, -899, -412),
    order('028-1000004-4000004', d[2], 'SKU-TASSE-01', 3998, 399, 0, -600, -450),
    order('028-1000005-5000005', d[3], 'SKU-BUCH-04', 1290, 299, -100, -194, -306),
    order('028-1000006-6000006', d[4], 'SKU-LAMPE-03', 5990, 0, 0, -899, -412),
  ];
}

function refund(id, date, sku) {
  return {
    kind: 'Refund', id, date, sku,
    lines: [
      ['ItemPrice', 'Principal', -1999],
      ['ItemPrice', 'Shipping', -399],
      ['ItemFees', 'Commission', 300],
      ['ItemFees', 'RefundCommission', -60],
    ],
  };
}

function others(date) {
  return [
    ['Other-Transaction', 'Storage Fee', -1234, date],
    ['Other-Transaction', 'Current Reserve Amount', -5000, date],
    ['Other-Transaction', 'Previous Reserve Amount Balance', 4000, date],
  ];
}

const DATES = ['2026-10-05', '2026-10-07', '2026-10-09', '2026-10-12', '2026-10-15'];

function fixture(over = {}) {
  const v = {
    id: '12345678901', start: '2026-10-03', end: '2026-10-17', deposit: '2026-10-20', currency: 'EUR',
    dates: DATES, refundDate: '2026-10-13', otherDate: '2026-10-17', totalOffset: 0, dropOrders: 0,
    extra: [], duplicateFirst: false, orders: null, refunds: null, others: null,
    ...over,
  };
  const orders = v.orders ?? normalOrders(v.dates);
  const refunds = v.refunds ?? [refund('028-1000002-2000002', v.refundDate, 'SKU-KERZE-02')];
  const oth = v.others ?? others(v.otherDate);
  const rows = [];
  for (const o of orders) {
    for (const [type, desc, amount] of o.lines) {
      if (amount === 0) continue;
      rows.push({ tt: 'Order', order: o.id, adj: '', ship: 'S' + o.id.slice(-7), type, desc, amount, date: o.date, sku: o.sku, qty: '1' });
    }
  }
  for (const r of refunds) {
    for (const [type, desc, amount] of r.lines) {
      rows.push({ tt: 'Refund', order: r.id, adj: 'ADJ' + r.id.slice(-7), ship: '', type, desc, amount, date: r.date, sku: r.sku, qty: '1' });
    }
  }
  for (const [type, desc, amount, date] of oth) {
    rows.push({ tt: 'Other-Transaction', order: '', adj: '', ship: '', type, desc, amount, date, sku: '', qty: '' });
  }
  for (const e of v.extra) rows.push({ tt: 'Order', order: '', adj: '', ship: '', sku: '', qty: '', ...e });
  if (v.duplicateFirst) rows.push({ ...rows[0] });
  const sum = rows.reduce((a, r) => a + r.amount, 0);
  return { ...v, rows, total: sum + v.totalOffset };
}

function num(cents, german) {
  const sign = cents < 0 ? '-' : '';
  const a = Math.abs(cents);
  return `${sign}${Math.floor(a / 100)}${german ? ',' : '.'}${String(a % 100).padStart(2, '0')}`;
}
const dt = (iso, german, time) => {
  const [y, m, d] = iso.split('-');
  return german ? `${d}.${m}.${y} ${time} UTC` : `${iso} ${time} UTC`;
};

function render(f, german, header = COLUMNS) {
  const out = [header.join('\t')];
  const summary = {
    'settlement-id': f.id,
    'settlement-start-date': dt(f.start, german, '16:00:00'),
    'settlement-end-date': dt(f.end, german, '15:59:59'),
    'deposit-date': dt(f.deposit, german, '16:00:00'),
    'total-amount': num(f.total, german),
    currency: f.currency,
  };
  out.push(header.map((c) => summary[c] ?? '').join('\t'));
  for (const r of f.rows) {
    const [y, m, d] = r.date.split('-');
    const cells = {
      'settlement-id': f.id,
      'transaction-type': r.tt,
      'order-id': r.order,
      'adjustment-id': r.adj,
      'shipment-id': r.ship,
      'marketplace-name': r.order ? 'Amazon.de' : '',
      'amount-type': r.type,
      'amount-description': r.desc,
      amount: num(r.amount, german),
      'fulfillment-id': r.order ? 'AFN' : '',
      'posted-date': german ? `${d}.${m}.${y}` : r.date,
      'posted-date-time': german ? `${d}.${m}.${y} 10:15:00 UTC` : `${r.date}T10:15:00+00:00`,
      'order-item-code': r.order ? '1' + r.order.slice(-6) : '',
      sku: r.sku,
      'quantity-purchased': r.qty,
    };
    out.push(header.map((c) => cells[c] ?? '').join('\t'));
  }
  return out.join('\n') + '\n';
}

const write = (name, text) => writeFileSync(join(outDir, name), text);
mkdirSync(outDir, { recursive: true });

const normal = fixture();
write('normal.tsv', render(normal, false));
write('german-format.tsv', render(normal, true));

// posted 28.12.2026 .. 08.01.2027, crosses the fiscal year
write('yearend.tsv', render(fixture({
  id: '12345678902', start: '2026-12-27', end: '2027-01-09', deposit: '2027-01-12',
  dates: ['2026-12-28', '2026-12-30', '2027-01-02', '2027-01-05', '2027-01-08'],
  refundDate: '2027-01-04', otherDate: '2027-01-08',
}), false));

write('unknown.tsv', render(fixture({
  id: '12345678903',
  extra: [{ order: '028-1000007-7000007', type: 'ItemFees', desc: 'FooBarFee', amount: -250, date: '2026-10-10' }],
}), false));

write('gbp.tsv', render(fixture({ id: '12345678904', currency: 'GBP' }), false));

// small sale, large refund and storage fee: the payout is negative
write('negative.tsv', render(fixture({
  id: '12345678905',
  orders: [order('028-2000001-1000001', '2026-10-05', 'SKU-TASSE-01', 1999, 0, 0, -300, -306)],
  refunds: [{ kind: 'Refund', id: '028-2000009-9000009', date: '2026-10-08', sku: 'SKU-LAMPE-03', lines: [
    ['ItemPrice', 'Principal', -5990], ['ItemFees', 'Commission', 899],
  ] }],
  others: [['Other-Transaction', 'Storage Fee', -4500, '2026-10-17']],
}), false));

const v1Header = COLUMNS.map((c) => (c === 'amount-type' ? 'price-type' : c === 'amount-description' ? 'item-related-fee-type' : c));
write('v1.tsv', render(normal, false, v1Header));
write('v1.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<AmazonEnvelope><Header><DocumentVersion>1.02</DocumentVersion></Header><MessageType>SettlementReport</MessageType></AmazonEnvelope>\n');

write('difference.tsv', render(fixture({ id: '12345678906', totalOffset: 100 }), false));
write('duplicate.tsv', render(fixture({ id: '12345678907', duplicateFirst: true }), false));

console.log('fixtures written to', outDir);
