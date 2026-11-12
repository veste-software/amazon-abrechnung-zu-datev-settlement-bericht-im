export interface SettlementRow {
  /** 1-based line number in the file (header = line 1), for error messages */
  line: number;
  transactionType: string;
  orderId: string;
  merchantOrderId: string;
  adjustmentId: string;
  shipmentId: string;
  marketplace: string;
  amountType: string;
  amountDescription: string;
  amountCents: number;
  fulfillmentId: string;
  /** YYYY-MM-DD */
  postedDate: string;
  sku: string;
  quantity: string;
  promotionId: string;
  /** all columns, normalised; rows with the same key are duplicates */
  dupKey: string;
}

export interface Settlement {
  settlementId: string;
  startDate: string;
  endDate: string;
  depositDate: string;
  totalCents: number;
  currency: string;
  rows: SettlementRow[];
  notices: string[];
}

export type ParseResult =
  | { ok: true; settlement: Settlement }
  | { ok: false; kind: 'v1' | 'currency' | 'format' | 'empty'; error: string };

export const V1_MESSAGE =
  "Das ist der alte Abrechnungsbericht (Flat File V1/XML), den Amazon seit 11.11.2026 nicht mehr liefert. Bitte laden Sie im Seller Central den Bericht als 'Flat File V2' herunter.";

export const V2_COLUMNS = [
  'settlement-id', 'settlement-start-date', 'settlement-end-date', 'deposit-date', 'total-amount', 'currency',
  'transaction-type', 'order-id', 'merchant-order-id', 'adjustment-id', 'shipment-id', 'marketplace-name',
  'amount-type', 'amount-description', 'amount', 'fulfillment-id', 'posted-date', 'posted-date-time',
  'order-item-code', 'merchant-order-item-id', 'merchant-adjustment-item-id', 'sku', 'quantity-purchased',
  'promotion-id',
] as const;
