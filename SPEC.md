# SPEC: Amazon-Abrechnung zu DATEV (working name "Abrechnung2DATEV")

The Amazon settlement report (Flat File V2) goes in and a checked DATEV booking batch (EXTF Buchungsstapel) comes out. Everything runs in the browser. There is no Amazon connection and no file upload to a server.

Status: one-day prototype, picked as the day's best candidate. Product lead decision: **build**, narrowed as below.

---

## 1. Problem and users

German Amazon sellers whose books are kept in DATEV (by their tax firm, or in-house with DATEV Unternehmen online) used **DATEV Zahlungsdatenservice für Amazon** (Art.-Nr. 20496, from 1.36 EUR a month). That service fed the Amazon account into DATEV like a bank account and matched open items (OP-Ausgleich) by order ID. DATEV ends development, maintenance and service on **2027-08-15**. DATEV already warns of "Saldendifferenzen, veraltete Daten und fehlende Daten". Every affected seller and tax firm has to pick a replacement before then.

The replacements available today are suites that connect to the Amazon account (Amainvoice, pathway, Taxdoo, fybu, AccountOne, CountX) and cost 25 to 599+ EUR a month, or DATEV's generic ISWL Zahlungsdaten-Konverter (from 25 EUR a month, templates must be set up). Nothing does just this one job: take the settlement file the seller can already download and turn it into a DATEV batch that reconciles to the payout, at a price close to the old service.

**Primary users (payers):**
1. **Small and mid-size Amazon sellers (DE/AT, EUR marketplaces)** with roughly 30 to 2,000 orders a month whose bookkeeping is in DATEV. Someone in the business, or the bookkeeper, downloads the settlement report every 14 days and needs a file the tax firm accepts.
2. **Tax firms and freelance bookkeepers** (Steuerkanzleien, Buchhaltungsbüros) with a handful of Amazon clients who were on the DATEV service. They want a batch they can import without a new cloud vendor, without a data processing agreement and without asking each client to grant API access.

## 2. Why now

- **Trigger (confirmed):** DATEV lists "DATEV Zahlungsdatenservice für Amazon (zum 15.08.2027)" under Produktkündigungen. The product page states the end date and the data-quality warning. Tax firms cite the reason: the Amazon interface behind the service is only available until August 2027.
- **Second, fresh trigger (confirmed):** Amazon retired the old settlement report types, the Flat File (`GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE`) and XML, as of **2026-11-11**. Only **Flat File V2** remains. Home-made spreadsheets and macros built on the old flat file stop working now.
- **Window:** from now until about Q3 2027, sellers and firms are actively switching. After 2027-08-15 the need continues as a standing one (every settlement, every 14 days), but the switching searches drop off.
- **What keeps the gap open:** every competitor is a connected suite (API access, Amazon app audit, monthly minimums of 25 to 39 EUR or more). A no-connection converter is too small a business for them to build.
- **Ship by:** prototype live by **2026-11-20**, all five content pages indexed by **2026-12-15**, before January's year-end bookkeeping (Jahresabschluss) and Q4 booking.

## 3. Evidence (opened and confirmed by the Product lead on 2026-11-12)

| What | Source | Finding |
|---|---|---|
| DATEV service ends | https://www.datev.de/web/de/marktplatz/datev-zahlungsdatenservice-fuer-amazon | "Ab 1,36 Euro/Monat". End of development, maintenance and service 15.08.2027. Warning: "Saldendifferenzen, veraltete Daten und fehlende Daten". No successor named. |
| DATEV discontinuation list | https://www.datev.de/web/de/berufsgruppenuebergreifend/nachrichten/rund-um-die-datev-programme/kuendigungen-und-leistungsaenderungen-von-produkten/ | Listed as "DATEV Zahlungsdatenservice für Amazon (zum 15.08.2027)" under Produktkündigungen. The letter date is not shown for this entry. |
| Live demand | https://sellercentral.amazon.de/seller-forums/discussions/t/f4072247-fe19-4916-b057-abb1d0d25a0b | Seller thread "Amazon hat Datevschnittstelle für 2027 gekündigt - Alternativen?", posted about 3 months ago, latest reply about 3 weeks ago. DATEV replied recommending the ISWL Zahlungsdaten-Konverter. Others suggest AccountOne or the Finances API ("Viele Firmen scheitern am Audit von Amazon"). |
| Tax firms are moving clients | https://steuerkanzlei-wirsching.de/amainvoice | The firm says the Amazon interface is only available until August 2027 and that it moves clients to Amainvoice. |
| Vendors already target the switch | https://fybu.de/blog/einstellung-datev-amazon-api/ | Blog post on the discontinuation. Sales pitch is "Demo anfordern", no public price. |
| DATEV's suggested replacement and its price | DATEV shop, ISWL Zahlungsdaten-Konverter Art.-Nr. 45098 (https://www.datev.de/web/de/shop/produkt-details/datev-iswl-zahlungsdaten-konverter-45098, price seen in search result: "monatlich ab 25,00 €"). Guide page: https://www.datev.de/web/de/steuerberatung/loesungen/rechnungswesen/buchfuehrung-erstellen/automatisierungsservices-rechnungswesen/datev-iswl-zahlungsdaten-konverter-anleitungen-informationen | Generic payment-file converter with an Amazon schema download. Aimed at tax firms. Field templates must be mapped. |
| DATEV's new 2026 service | https://www.datev.de/web/de/berufsgruppenuebergreifend/presse/presseinformationen/meldungen-2026/zahlungsstroeme-einfach-in-die-buchfuehrung-bringen- and https://www.datev.de/web/de/marktplatz/datev-datenservice-zahlungsdienstleister-fuer-amazon-payments-europe | Press release dated 2026-04-07 for "Datenservice Zahlungsdienstleister" covering Amazon Pay, eBay, Klarna, Mollie, Shopify and Stripe. The Amazon Payments Europe variant costs "Ab 10,00 Euro/Monat". Neither page says it covers Amazon **marketplace** settlements or replaces 20496. **Not confirmed as a successor. This is the main open risk (see section 9).** |
| Amazon format change | https://developer-docs.amazon/sp-api/changelog/update-deprecation-of-two-payment-settlement-report-types | The XML and Flat File settlement reports are "unavailable for sellers as of November 11, 2026". Flat File V2 remains. |
| V2 columns | https://developer-docs.amazon/sp-api/docs/settlement-reports-attributes | 24 attributes (listed in section 5), tab-delimited. No sample rows, no date format given. |
| V2 value examples | https://help.intentwise.com/amazon-settlement-report-v1-to-v2-mapping-guide | amount-type values: ItemPrice, ItemFees, Promotion, Other-Transaction, Shipment-Fees. amount-description values include Principal, Shipping, GiftWrap, Goodwill, RestockingFee, Commission, FBAPerUnitFulfillmentFee, FBAWeightBasedFee, VariableClosingFee, RefundCommission, ShippingChargeback, GiftwrapChargeback, Storage Fee, Current Reserve Amount, Previous Reserve Amount Balance, Refund Reimbursal, FBATransportationFee. |
| Paid alternative price and size | https://www.amainvoice.de/en/datev-amazon-integration | "Prices start at 39€ for up to 200 documents ... up to ... 599€". Claims "2,700 +" sellers. 14-day trial. |
| Paid alternative | https://www.pathway-solutions.de/amazon-zu-datev | Connected by API. Claims "Über 4.000 Händler und Steuerberatungen". Add-on "DATEV Buchungsdatenservice" 25 EUR. Enterprise from 2,000 EUR a month. |
| Free or cheap alternatives | https://www.countx.com/amazon-connex and https://apps.shopify.com/accountone?locale=de | CountX Amazon conneX: "free beta", connects the Amazon account (read-only). AccountOne Shopify listing: "Kostenlos" connection, 2 reviews, average 2.7, 1-star review from March 2025 says "nothing works". |

**Not verified:** search volumes; the exact date and number format of a Flat File V2 **downloaded by hand from Seller Central DE** (the API docs give none; a forum reply shows ISO dates with dot decimals for the old report); the exact Seller Central menu path; whether DATEV's Datenservice Zahlungsdienstleister will add marketplace settlements.

## 4. Positioning

**The gap in one sentence:** the only Amazon-to-DATEV route that needs no Amazon connection, no cloud upload and no data processing agreement. You drop in the settlement file you already download and get a reconciled DATEV batch for 9 EUR a month instead of 25 to 39 EUR.

| Alternative | URL | What it lacks for this payer |
|---|---|---|
| DATEV Zahlungsdatenservice für Amazon | https://www.datev.de/web/de/marktplatz/datev-zahlungsdatenservice-fuer-amazon | Ends 2027-08-15, and DATEV already warns of balance differences and missing data. |
| DATEV ISWL Zahlungsdaten-Konverter | https://www.datev.de/web/de/shop/produkt-details/datev-iswl-zahlungsdaten-konverter-45098 | From 25 EUR a month. Generic: someone has to build the Amazon template, and it has no Amazon-specific reconciliation check. Aimed at tax firms. |
| Amainvoice | https://www.amainvoice.de/en/datev-amazon-integration | Full suite (invoices, OSS) connected to Seller Central, from 39 EUR a month. Too much for a seller who paid 1.36 EUR. |
| pathway | https://www.pathway-solutions.de/amazon-zu-datev | API-connected platform with onboarding fees and paid support packages. |
| Taxdoo | https://www.taxdoo.com/en/features/accounting-software-ecommerce/ | E-commerce VAT and accounting suite. Price not public on the page checked. |
| CountX Amazon conneX | https://www.countx.com/amazon-connex | Free beta but connects the Amazon account. Pricing after the beta is unknown. |
| AccountOne | https://apps.shopify.com/accountone?locale=de | Connected integration with weak public reviews (2.7 from 2). |
| fybu | https://fybu.de/blog/einstellung-datev-amazon-api/ | Sold through demos, no public price. |

**What this product does that none of them do:**
1. **Nothing is connected or uploaded.** No SP-API, no Seller Central login, no Amazon app audit. The file is parsed in the browser tab and the page says so in one plain sentence. For tax firms this also means no AVV (data processing agreement) with yet another cloud vendor.
2. **The reconciliation check comes first.** Before any download, a check shows the sum of all lines against the `total-amount` Amazon paid out, and the bank-side payout booking, with a green "Saldo stimmt" or a red "Differenz x,xx €" listing the lines that cause it.
3. **The tax firm sets up the accounts once.** The account and BU-key mapping is a small JSON "Kontenprofil". The firm sets it once and sends it to the client, and the client imports it, so the client cannot pick wrong accounts.
4. **It reads the current Flat File V2** and rejects the retired V1 file with a clear explanation.
5. **Public price close to the old one:** 9 EUR a month for a seller, 29 EUR a month for a firm with up to 25 clients.

## 5. MVP scope

### In

**A. File intake (browser only)**
- Drag-and-drop or a file picker for one or more `.txt`/`.tsv`/`.csv` files. Nothing is sent over the network. The only network call in the whole tool is the licence check in section 7, which sends a key and a hash and never file content.
- Parses **Amazon Settlement Flat File V2**: tab-delimited, header row with the 24 documented columns: `settlement-id, settlement-start-date, settlement-end-date, deposit-date, total-amount, currency, transaction-type, order-id, merchant-order-id, adjustment-id, shipment-id, marketplace-name, amount-type, amount-description, amount, fulfillment-id, posted-date, posted-date-time, order-item-code, merchant-order-item-id, merchant-adjustment-item-id, sku, quantity-purchased, promotion-id`. Columns are matched **by header name, not position**. Unknown extra columns are ignored with a notice.
- The **summary row** is the row where `total-amount` is filled and `transaction-type` is empty. It supplies settlement-id, period, deposit-date, total-amount and currency.
- Number parsing accepts `1234.56`, `1234,56`, `1.234,56` and `-12,30`. Date parsing accepts ISO `2026-10-03T16:00:00+00:00`, `2026-10-03 16:00:00 UTC` and German `03.10.2026 16:00:00 UTC` / `03.10.2026`. Any other format stops the run with a message naming the row and value.
- File decoding: try UTF-8 first (strip a BOM), then fall back to Windows-1252.
- **V1 and XML detection:** if the header contains `price-type` / `item-related-fee-type`, or the file is XML, show: "Das ist der alte Abrechnungsbericht (Flat File V1/XML), den Amazon seit 11.11.2026 nicht mehr liefert. Bitte laden Sie im Seller Central den Bericht als 'Flat File V2' herunter."
- **Currencies:** EUR only. A settlement in another currency (GBP, PLN, SEK and so on) is refused with a plain message. It is not converted.

**B. Mapping (Kontenprofil)**
- Settings: Beraternummer (number, 4 to 7 digits), Mandantennummer (1 to 5 digits), start of the fiscal year (default 01.01.), account length (Sachkontenlänge, default 4), chart (SKR03 or SKR04, used for suggestions only), and the **Amazon-Verrechnungskonto** (the money account that stands in for the Amazon balance).
- A mapping table: one row per `amount-type` + `amount-description` pair, with columns account, BU-Schlüssel (optional), Buchungstext prefix, and "zusammenfassen pro Bestellung" (yes/no). Two special targets:
  - **Sales receipts** (ItemPrice/Principal, Shipping, GiftWrap, Tax lines, Promotion): default target **Sammeldebitor** (user-set, for example 10000) with `order-id` in Belegfeld 1 so DATEV's OP-Ausgleich can match, as the old DATEV service did. The user may map them to any other account instead.
  - **Payout:** one booking per settlement, Amazon-Verrechnungskonto against a Geldtransit account (user-set), dated `deposit-date`, amount `total-amount`. The direction flips if the total is negative.
- **Suggested profiles** for SKR03 and SKR04 ship as JSON files. Every suggested account has to be checked by the Builder against DATEV's published standard charts (SKR03/SKR04 Kontenrahmen PDFs on datev.de), with that source cited in a comment. Any account that cannot be verified is left **empty**. **BU-Schlüssel are left empty in the suggestions**, with a fixed note: "Amazon-Gebühren werden von Amazon EU S.à r.l. (Luxemburg) berechnet und unterliegen in der Regel dem Reverse-Charge-Verfahren. Den passenden BU-Schlüssel legt Ihre Steuerkanzlei fest." Before the first download the user must tick "Kontenzuordnung mit meiner Steuerkanzlei abgestimmt".
- **Kontenprofil export/import:** a JSON file (schema version, chart, all mapping rows, settings except Berater- and Mandantennummer). A firm can send it to a client. The profile is kept in `localStorage`.
- **Unknown descriptions:** any `amount-type` + `amount-description` pair without a mapping is listed under "Nicht zugeordnet" with its count and sum. Download stays blocked until each one is mapped.

**C. Booking generation**
- One booking line per (order-id or adjustment-id, mapped account, BU-Schlüssel, posted-date) when "zusammenfassen" is on (the default), otherwise one per source row. Lines without an order-id (storage fees, subscription, reserve, advertising) are grouped per (amount-description, posted-date).
- Each booking: Umsatz is the absolute amount with Soll/Haben-Kennzeichen from the sign, seen from the Amazon-Verrechnungskonto (the Amazon balance going up means Soll on the Verrechnungskonto). Konto = Amazon-Verrechnungskonto, Gegenkonto = mapped account, BU-Schlüssel = mapped key, Belegdatum = posted-date (TTMM), Belegfeld 1 = order-id (or settlement-id for lines without an order), Buchungstext = prefix + amount-description, cut to 60 characters, with no line breaks or semicolons. If the profile has no Sammeldebitor setting, Belegfeld 1 holds the settlement-id for all lines.
- **Fiscal year split:** bookings whose posted-date falls in a different fiscal year (by the configured start of the fiscal year) go into a **separate file**. The header of each file carries its own fiscal year start and date range.
- **Line limit:** split into several files if one would exceed 99,997 booking lines.
- **Duplicate warning:** rows identical in every column are flagged in the check view. They are counted but **not** removed automatically.

**D. Check view (free, no licence)**
- Summary card: settlement-id, period, deposit date, Amazon total, sum of all lines, difference, and the number of bookings and files.
- Totals per mapped account, and a list of the 20 largest single bookings.
- Status stamp: **"Saldo stimmt"** if |sum of lines − total-amount| < 0.005 EUR. Otherwise **"Differenz"** with the amount, and the download is blocked until the user ticks "Trotzdem exportieren (Differenz wird als Buchung auf Konto ____ ausgewiesen)". That creates one explicit difference booking to a user-set clearing account. Nothing is ever hidden.
- A preview table of the **first 25 booking lines** exactly as they will appear in the file.

**E. Export (licensed)**
- Writes DATEV-Format **EXTF Buchungsstapel**, header version 700, format category 21, format name "Buchungsstapel", format version 13. Before shipping, the Builder must confirm against the official Formatbeschreibung at https://developer.datev.de/datev/platform/en/dtvf whether 12 or 13 is current, because DATEV's own pages disagree. The column list goes in one constants file that cites its source URL.
- Encoding Windows-1252, CRLF line endings, semicolons as separators, text fields in double quotes (inner quotes doubled), decimal comma, no thousands separator. File name `EXTF_Buchungsstapel_Amazon_<settlement-id>_<YYYYMMDD-YYYYMMDD>.csv`. Header: Beraternummer, Mandantennummer, WJ-Beginn, Sachkontenlänge, Datum vom/bis = the dates covered by that file, Bezeichnung "Amazon <settlement-id>", Buchungstyp 1 (Finanzbuchführung), WKZ "EUR", Festschreibung 0.
- When several settlement files are dropped at once, each settlement produces its own file(s), and a ZIP is offered when there are 2 or more.

**F. Licence and payments (Stripe test mode)**
- Plans: **Händler** 9 EUR a month or 89 EUR a year (1 Mandantennummer). **Kanzlei** 29 EUR a month or 290 EUR a year (up to 25 Mandantennummern). Prices net plus VAT. Self-serve card payment through Stripe Checkout, with cancellation in the Stripe Customer Portal.
- After checkout, a webhook creates a random licence key and saves it in KV. The success page shows the key, and the webhook writes it into the subscription's invoice custom field "Lizenzschlüssel" so every Stripe invoice email carries it. That lets customers recover the key without any email system on our side.
- At download time the browser sends `{licenceKey, sha256(Beraternummer + ":" + Mandantennummer)}` to `/api/licence/check`. The function answers ok or refused. It stores the set of hashes per key and refuses a new hash once the plan's limit is reached. No file content and no plain client numbers ever leave the browser.

**G. Pages:** the tool (start page), 4 content pages and the legal pages, listed in section 8.

### Out (explicitly not in the MVP)
- Any Amazon API, Seller Central login or automatic fetching.
- VAT determination, OSS, VAT Transaction Report (VCS) processing, invoice creation.
- Revenue booking per country or tax rate. Sales are booked to the Sammeldebitor for OP-Ausgleich, or to one account the user picks.
- Non-EUR marketplaces (UK, PL, SE), Amazon Pay, Vendor Central, eBay, Kaufland, Etsy (later candidates only).
- DATEV Buchungsdatenservice API upload, DATEV Marketplace certification.
- User accounts, team management, server-side storage of files or profiles, email sending.
- Debitor master data (Stammdaten) export.
- An AI chat, ads, affiliate links.

## 6. Acceptance criteria (QA checks these without any live account)

All fixtures are **synthetic**. They follow Amazon's documented V2 columns and are stored in `fixtures/` with a `README` stating they are synthetic. QA must **not** wait for a real Amazon file or a DATEV installation; those are human tasks.

1. **Fixtures exist:** `fixtures/` holds at least (a) `normal.tsv`: about 40 rows covering orders, a refund, Commission, FBAPerUnitFulfillmentFee, Storage Fee, Current Reserve Amount, Previous Reserve Amount Balance, Shipping and a Promotion, with a summary row whose total equals the sum; (b) `yearend.tsv`: posted dates 28.12.2026 to 08.01.2027; (c) `unknown.tsv`: contains amount-description `FooBarFee`; (d) `gbp.tsv`: currency GBP; (e) `negative.tsv`: negative total; (f) `german-format.tsv`: comma decimals and `dd.mm.yyyy hh:mm:ss UTC` dates; (g) `v1.tsv`: old V1 header; (h) `difference.tsv`: the summary total is off by 1.00. A test runs over all of them.
2. **Parsing:** unit tests show `normal.tsv` and `german-format.tsv` (the same data in two notations) give identical bookings.
3. **V1 rejected:** `v1.tsv` gives the V1 message quoted in 5.A and no bookings.
4. **Currency:** `gbp.tsv` is refused with a message that names GBP.
5. **Reconciliation:** `normal.tsv` shows "Saldo stimmt" and a difference of 0,00. `difference.tsv` shows "Differenz 1,00 €", the download button is disabled until the override is ticked, and with the override the file contains exactly one extra booking of 1,00 to the clearing account.
6. **Sum invariant (test):** for every fixture that converts, the signed sum of all booking amounts on the Amazon-Verrechnungskonto, payout booking included, is 0,00 (± 0,005). Without the payout booking it equals `total-amount`.
7. **Unknown mapping:** `unknown.tsv` lists `FooBarFee` under "Nicht zugeordnet" with its count and sum. Download stays blocked until it is mapped. After it is mapped, the file contains it.
8. **Fiscal year split:** `yearend.tsv` with WJ-Beginn 01.01. produces two files whose headers carry WJ-Beginn 20260101 and 20270101 and matching Datum vom/bis. No booking falls outside its file's range.
9. **Negative total:** `negative.tsv` produces a payout booking in the reverse direction, and criterion 6 holds.
10. **EXTF structure (test):** the generated file is valid Windows-1252 with CRLF line endings. Line 1 starts `"EXTF";700;21;"Buchungsstapel";` and has the header field count the official spec requires. Line 2 is the column header line from the constants file, character for character. Every data line has the same number of fields as line 2. Amounts use a decimal comma. Belegdatum is 4 digits (TTMM). Buchungstext is ≤ 60 characters. Belegfeld 1 is ≤ 36 characters and holds the order-id for order lines.
11. **Encoding:** a fixture with `Müller Gebühr` in a Buchungstext prefix comes out as the Windows-1252 bytes for ü (0xFC).
12. **Line limit (test):** a generated set of 100,000 bookings is split into 2 files, each ≤ 99,997 data lines.
13. **Duplicates:** a fixture with one row repeated shows a duplicate warning with count 1. The row is still booked twice.
14. **No file data leaves the browser:** a test (or code inspection documented in the QA report) shows that the only `fetch` in client code is to `/api/licence/check`, and that its body contains only `licenceKey` and a 64-character hex hash.
15. **Licence function (tests with a mocked KV and mocked Stripe):** a valid key with a new hash returns ok. The Händler plan refuses a second distinct hash. The Kanzlei plan accepts 25 and refuses the 26th. An unknown key is refused. A cancelled subscription is refused. The webhook handler for `checkout.session.completed` creates a key and stores the plan, verified against a Stripe test-mode signature built with a test secret.
16. **Free preview without a licence:** with no key, the check view and the 25-line preview work fully, and the download button opens the plans dialog.
17. **Kontenprofil:** export, then clearing `localStorage`, then import restores an identical mapping (deep-equal test). Importing a malformed JSON shows an error and changes nothing.
18. **Confirmation gate:** download stays disabled until "Kontenzuordnung mit meiner Steuerkanzlei abgestimmt" is ticked, and that state is remembered per profile.
19. **Suggested profiles:** every non-empty account in the SKR03/SKR04 suggestion files has a source comment, and every BU-Schlüssel in them is empty.
20. **Pages:** all pages in section 8 build. Each content page has a unique title, meta description and H1, has at least 600 words of substantive text, and links to the tool. The sitemap lists exactly these pages. Impressum and Datenschutz are linked from every page footer.
21. **Honesty:** no page shows ratings, reviews, testimonials, customer counts, "trusted by" logos or countdowns. Every page carries the footer line "Nicht mit Amazon oder DATEV verbunden. Amazon und DATEV sind Marken ihrer jeweiligen Inhaber."
22. `npm test` and `npm run build` pass and exit on their own.

## 7. Monetisation

- **Model:** subscription, self-serve card payment through Stripe Checkout (test mode during the build; going live is a human step).
- **Free:** the whole check view and the 25-line preview, as many times as wanted. Visitors see their own numbers reconcile within seconds, which is the trust step.
- **Paid (the paywall is the download button):**
  - **Händler:** 9 EUR a month or 89 EUR a year, for 1 Mandantennummer, unlimited settlements.
  - **Kanzlei:** 29 EUR a month or 290 EUR a year, for up to 25 Mandantennummern, unlimited settlements, Kontenprofil sharing.
- **Why these prices:** the payer used to pay 1.36 EUR a month and is now offered 25 EUR a month (DATEV ISWL converter) or 39 EUR a month and up (Amainvoice). 9 EUR sits well below every connected alternative and still means real money per account. The Kanzlei plan undercuts one ISWL licence while covering many clients.
- **No ads, no affiliate links.**

**Expected profit (first 12 months after launch), with the working:**
- **Channel reach (bottom-up):** search only. With no volume data, assume **1,500 visits** in 12 months: about 30 a month in months 1 to 3 while indexing, rising to about 150 to 200 a month around the 2027-08-15 cutoff. Conversion from visit to paid: **2% (assumed**; no comparable rate verified) gives **30 payers**. Average year-one revenue per payer is about 60 EUR (a mix of monthly payers staying about 5 months, yearly Händler plans and a few Kanzlei plans), so about **1,800 EUR revenue**. Costs are about 20 EUR for the domain, 0 EUR hosting (Cloudflare free tier) and about 5% payment fees (about 90 EUR), leaving about 1,690 EUR. With a haircut for the trust barrier (an unknown vendor touching bookkeeping), the **expected figure is 1,200 EUR**.
- **5,000 EUR a year needs** about 56 yearly Händler plans or about 17 Kanzlei plans. The channel reaches that only in the upside case: a top-3 ranking for "datev amazon zahlungsdatenservice alternative" during the migration months, about 6,000 visits at 3%, about 180 payers, about 12,000 EUR.
- **Cross-check:** no revenue figure for a comparable small converter could be verified. Amainvoice's claimed 2,700+ sellers at 39 EUR a month or more, and pathway's claimed 4,000+ sellers and firms, show that this job is paid for at volume, but they are funded suites with sales teams and partner channels, so they are a market floor and not a comparable. Following the rule, the lower bottom-up figure is used.

## 8. Target queries and page plan

Five real pages, no generated page sets (see the studio's lesson about the procurement directory).

| Page (path) | Target queries | What it is |
|---|---|---|
| `/` | amazon datev export, amazon abrechnung datev, amazon settlement report datev, amazon abrechnungsbericht datev importieren, amazon datev schnittstelle | **The tool itself** above the fold (drop zone, check view, preview, plans). Below it: how it works in 3 steps, what goes into the batch, the privacy sentence ("Die Datei wird ausschließlich in Ihrem Browser verarbeitet und nicht hochgeladen"), and a FAQ. |
| `/datev-zahlungsdatenservice-amazon-alternative/` | datev amazon zahlungsdatenservice, datev amazon zahlungsdatenservice alternative, datev amazon eingestellt, zahlungsdatenservice amazon 2027 | A substantive migration guide: what ends on 15.08.2027 (with links to DATEV's pages), what DATEV recommends, an honest comparison table of all alternatives in section 4 with public prices, and a **cut-over checklist** (the last settlement booked by the old service, the first by the file, how to avoid double OP-Ausgleich, and a Saldenabgleich of the Verrechnungskonto at the switch date). |
| `/amazon-abrechnungsbericht-flat-file-v2/` | amazon abrechnungsbericht herunterladen, amazon settlement report flat file v2, amazon zahlungsbericht v2, amazon abrechnungsbericht v1 eingestellt | How to download the V2 settlement report by hand, what changed on 11.11.2026, and what each of the 24 columns means. The menu path must be verified by the human (section 11) before publishing. Until then, describe it as "Zahlungen → Berichte-Archiv / Payments → Reports Repository (Bezeichnung kann abweichen)". |
| `/amazon-gebuehren-buchen-datev/` | datev amazon buchen, amazon gebühren buchen skr03, amazon fba gebühren buchen skr04, amazon reserve buchen | A reference of every `amount-type`/`amount-description` the tool knows: what it is, which group it belongs to (sales, fee, reserve, payout), and the suggested SKR03/SKR04 account group with the reverse-charge note. This is the human-readable version of the tool's mapping table, generated from the same JSON so they never drift apart. |
| `/steuerkanzlei/` | amazon mandanten datev, steuerberater amazon datev, amazon buchhaltung steuerberater datev | For tax firms: no client API access needed and no AVV, because data stays in the browser. Shows the Kontenprofil workflow (the firm sets it, the client imports it) and the Kanzlei plan. |
| `/preise/`, `/impressum/`, `/datenschutz/`, `/agb/` | — | Prices, and legal drafts (B2B terms with a liability limit and the note that the tool produces booking suggestions which the user or their firm must check). |

## 9. Success metrics and kill criteria

- **Go signal:** at least 3 licence checks from distinct paid keys by 2027-02-28.
- **Kill or park if:**
  - fewer than **150 organic clicks** in total (Search Console) by **2027-03-31**;
  - fewer than **5 paying licences** by **2027-06-30**, which is the peak switching period before the cutoff;
  - fewer than **15 paying licences** by **2027-09-30**, after which only keep it running if revenue exceeds the running cost;
  - **DATEV announces a drop-in successor** for marketplace settlements at 10 EUR a month or less: review within 2 weeks, re-price or park;
  - any **confirmed wrong booking** that the reconciliation check did not catch: stop sales (disable checkout) until it is fixed and a regression fixture is added.

## 10. Legal and platform notes

- **No terms-of-service problem:** sellers download their own report through Seller Central and process it locally. There is no scraping, no Amazon API and no automated login.
- **Trademarks:** "Amazon" and "DATEV" are used only descriptively ("für DATEV", "DATEV-Format", "Amazon-Abrechnungsbericht"). No logos, no implied partnership, and the disclaimer footer in criterion 21. "EXTF" is DATEV's documented identifier for third-party exports, and no DATEV certification is needed to write the file.
- **Data protection:** settlement files contain order IDs and SKUs but no buyer names or addresses in V2. They never leave the browser. The server stores only licence keys, plan, Stripe customer ID and SHA-256 hashes of Berater- and Mandantennummer. Cookie-free: no analytics cookies, and if analytics are used at all, Cloudflare Web Analytics (cookie-free). `localStorage` is used only for the Kontenprofil and the licence key the user enters; this is stated in Datenschutz.
- **Bookkeeping liability:** the tool produces booking suggestions from a user-controlled mapping. Suggested accounts are labelled as suggestions, BU-Schlüssel are left to the firm, and the confirmation gate (criterion 18) is mandatory. The B2B terms (AGB) limit liability. Tax law (StBerG): mechanical booking tools are common, but the lawyer review should confirm the wording.
- **Payments:** Stripe test mode only. VAT on subscriptions (B2B within the EU, reverse charge for foreign firms) is a human setup step (Stripe Tax or manual).
- **Legal pages:** Impressum, Datenschutz and AGB are written as **drafts** and must be reviewed by a lawyer.

## 11. Human tasks

1. Download one real Amazon.de Settlement **Flat File V2** from Seller Central, anonymise order IDs and SKUs, and drop it into `fixtures/real/`. Confirm the menu path and the date and number format. This is **not** a QA gate; do it before going live.
2. Have a tax firm (or a DATEV user) test-import one generated `EXTF_*.csv` into DATEV Kanzlei-Rechnungswesen or DATEV Unternehmen online and confirm it imports without format errors and that the OP-Ausgleich by order ID works.
3. Create a Stripe account, create the 4 prices (9 EUR/month, 89 EUR/year, 29 EUR/month, 290 EUR/year), and put the keys in `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `STRIPE_PRICE_*` (names in `.env.example`). Enable invoice emails and the Customer Portal. Set up VAT handling. Go live only after tasks 1 and 2.
4. Register the domain, connect Cloudflare Pages, create the KV namespace, and submit the sitemap in Google Search Console.
5. Fill in the Impressum details, and have a lawyer review Impressum, Datenschutz and AGB, including the StBerG wording.
6. Every 3 months, check DATEV's discontinuation page and Amazon's SP-API changelog for settlement format changes (a 10-minute check).

## 12. Look and feel

The visitor is a bookkeeper at a small tax firm or the person who does the books in a five-person Amazon business. They arrive slightly worried: a DATEV letter says the Amazon feed ends, their balances already don't match, and they want proof before trusting anything new. The product's real-world cousin is the **green-barred continuous-form ledger printout** (Tabellierpapier, Endlospapier) of an old DATEV journal, combined with the accountant's **rubber stamp "abgestimmt"**. Use pale green bands behind table rows, carbon-grey monospaced figures aligned on the decimal comma, perforation marks down the margins, and one stamp-red or stamp-green status mark. The mood is quiet, exact and slightly old-fashioned, like a ledger that balances: no gradients, no illustrations of people, no rounded "SaaS cards". The number that matters (the difference to the payout) is the biggest thing on the screen.
