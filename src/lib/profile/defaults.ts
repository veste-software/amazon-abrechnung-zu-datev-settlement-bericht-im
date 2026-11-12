import { mappingKey, type Kontenprofil, type MappingRow } from './schema';

/**
 * Pairs the tool knows. Value: [amount-type, amount-description, group].
 * Sources: Amazon settlement attribute docs and the Intentwise V1->V2 mapping guide (SPEC §3).
 * Keys not seen in a real Amazon.de file yet; the human task in SPEC §11 checks them.
 */
export const KNOWN_PAIRS: ReadonlyArray<readonly [string, string, 'sales' | 'fee' | 'reserve' | 'other']> = [
  ['ItemPrice', 'Principal', 'sales'],
  ['ItemPrice', 'Shipping', 'sales'],
  ['ItemPrice', 'GiftWrap', 'sales'],
  ['ItemPrice', 'Tax', 'sales'],
  ['ItemPrice', 'ShippingTax', 'sales'],
  ['ItemPrice', 'GiftWrapTax', 'sales'],
  ['ItemPrice', 'Goodwill', 'sales'],
  ['ItemPrice', 'RestockingFee', 'sales'],
  ['Promotion', 'Principal', 'sales'],
  ['Promotion', 'Shipping', 'sales'],
  ['ItemFees', 'Commission', 'fee'],
  ['ItemFees', 'RefundCommission', 'fee'],
  ['ItemFees', 'FBAPerUnitFulfillmentFee', 'fee'],
  ['ItemFees', 'FBAWeightBasedFee', 'fee'],
  ['ItemFees', 'VariableClosingFee', 'fee'],
  ['ItemFees', 'ShippingChargeback', 'fee'],
  ['ItemFees', 'GiftwrapChargeback', 'fee'],
  ['Other-Transaction', 'Storage Fee', 'fee'],
  ['Other-Transaction', 'FBATransportationFee', 'fee'],
  ['Other-Transaction', 'Refund Reimbursal', 'other'],
  ['Other-Transaction', 'Current Reserve Amount', 'reserve'],
  ['Other-Transaction', 'Previous Reserve Amount Balance', 'reserve'],
];

function rows(fill: (type: string, desc: string, group: string) => Partial<MappingRow>): MappingRow[] {
  return KNOWN_PAIRS.map(([type, desc, group]) => ({
    key: mappingKey(type, desc),
    account: '',
    bu: '',
    prefix: '',
    sammel: false,
    zusammenfassen: true,
    ...fill(type, desc, group),
  }));
}

/** Empty profile: sales go to the Sammeldebitor, every account the user must fill is empty. */
export function defaultProfile(): Kontenprofil {
  return {
    schemaVersion: 1,
    chart: 'SKR03',
    settings: {
      wjStartMonth: 1,
      sachkontenlaenge: 4,
      verrechnungskonto: '',
      geldtransit: '',
      sammeldebitor: '',
      differenzkonto: '',
    },
    mapping: rows((_t, _d, group) => (group === 'sales' ? { sammel: true } : {})),
  };
}

/**
 * DEMO profile with made-up account numbers. Only for tests and for trying the tool out:
 * it is NOT a booking recommendation. The accounts must be agreed with the tax firm.
 */
export function demoProfile(): Kontenprofil {
  const p = defaultProfile();
  p.settings = {
    wjStartMonth: 1,
    sachkontenlaenge: 4,
    verrechnungskonto: '1800',
    geldtransit: '1360',
    sammeldebitor: '10000',
    differenzkonto: '1990',
  };
  p.mapping = rows((_t, _d, group) => {
    if (group === 'sales') return { sammel: true };
    if (group === 'fee') return { account: '6770' };
    if (group === 'reserve') return { account: '1595' };
    return { account: '1596' };
  });
  return p;
}
