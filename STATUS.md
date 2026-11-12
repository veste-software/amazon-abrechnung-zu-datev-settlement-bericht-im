# Amazon-Abrechnung zu DATEV: Settlement-Bericht im Browser in einen DATEV-Buchungsstapel umwandeln

**Stage:** building · **Platform:** web · **Score:** 3/5 · **Spend:** $10.59

For German Amazon sellers whose tax advisor books in DATEV and who rely on DATEV's Zahlungsdatenservice für Amazon (end 2027-08-15, known data gaps): upload the Amazon settlement report and download a checked DATEV EXTF booking batch (sales, fees, refunds, payout reconciliation) without granting API access. If it takes off it becomes the settlement-to-DATEV converter for every marketplace (eBay, Kaufland, Etsy) that tax advisors recommend to their clients.

**Why now:** DATEV stops development, maintenance and service of its Zahlungsdatenservice für Amazon (Art.-Nr. 20496) on 2027-08-15 (end date; announcement date not shown) and already warns of balance differences, outdated and missing data (2027-08-15). Window: Users of the DATEV service must move before 2027-08-15. Pages that rank for 'datev amazon zahlungsdatenservice' in early 2027 catch the migration. After that it is a standing need that Amainvoice and Taxdoo also serve.

## Needs you

- [ ] [task 1] Download one real Amazon.de settlement Flat File V2 from Seller Central, anonymise it, put it in fixtures/real/ and confirm the menu path and the date and number formats (before going live, not a QA gate)
- [ ] [task 2] Have a tax firm or DATEV user test-import one generated EXTF_*.csv into DATEV and confirm it imports and that OP-Ausgleich by order ID works
- [ ] [task 3] Create a Stripe account, create the 4 prices, add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and STRIPE_PRICE_* as env vars, enable invoice emails and the Customer Portal, and set up VAT handling; go live only after the two checks above
- [ ] [task 4] Register the domain, connect Cloudflare Pages, create the KV namespace and submit the sitemap in Google Search Console
- [ ] [task 5] Fill in the Impressum details and have a lawyer review the legal pages (Impressum, Datenschutz, AGB, StBerG wording)
- [ ] [task 6] Every quarter, check DATEV's discontinuation page and Amazon's SP-API changelog for settlement format changes
- [ ] [task 7] Download one real Amazon.de Settlement Flat File V2, anonymise order IDs and SKUs, put it in fixtures/real/, and confirm the menu path plus the date and number format
- [ ] [task 8] Check the EXTF Buchungsstapel format version (12 or 13) and the full column list in src/lib/datev/columns.ts against DATEV's official Formatbeschreibung
- [ ] [task 9] Have a tax firm or DATEV user test-import one generated EXTF_*.csv into DATEV and confirm that it imports and that the OP-Ausgleich by order ID works
- [ ] [task 10] Check every suggested account in src/data/profiles/skr03.json and skr04.json against DATEV's SKR03/SKR04 Kontenrahmen PDFs and fill in the ones left empty
- [ ] [task 11] Create a Stripe account (test mode), create the 4 prices, set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and STRIPE_PRICE_* in Cloudflare Pages, enable invoice emails, the Customer Portal and VAT handling
- [ ] [task 12] Register the domain, connect Cloudflare Pages (build output dist, SITE_URL set to the domain), create the KV namespace LICENCES and put its id in wrangler.toml
- [ ] [task 13] Optionally enable Cloudflare Web Analytics and set PUBLIC_CF_BEACON_TOKEN
- [ ] [task 14] Fill in the Impressum details and have a lawyer review Impressum, Datenschutz and AGB, including the StBerG wording
- [ ] [task 15] Submit the sitemap in Google Search Console
- [ ] [task 16] Run npm run build and npm test (not run in this session) and fix anything they report, including whether sitemap-index.xml is the generated sitemap file name
- [ ] [task 17] Set SITE_URL to the production domain in the Cloudflare Pages build settings
- [ ] [task 18] Submit the sitemap in Google Search Console and Bing Webmaster Tools (Bing also gives IndexNow)
- [ ] [task 19] Set PUBLIC_CF_BEACON_TOKEN for cookie-free Cloudflare Web Analytics
- [ ] [task 20] Verify the Seller Central menu path for the V2 report and update the Flat File V2 page
- [ ] [task 21] Have a tax firm test-import one generated EXTF file; add that to the pages only with their permission
- [ ] [task 22] Post one disclosed, factual reply in the Seller Central forum thread and list the tool on AlternativeTo, after checking each site's rules
- [ ] [task 23] Have a lawyer review the legal pages (Impressum, Datenschutz, AGB)
- [ ] [task 24] Create a Stripe account, create the four prices in test mode and set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and STRIPE_PRICE_HAENDLER_MONTH/YEAR and STRIPE_PRICE_KANZLEI_MONTH/YEAR in the Cloudflare Pages project
- [ ] [task 25] Activate the Stripe customer portal (cancellation) and add a link or login-link to the Preise page, so the cancel path described in the AGB works
- [ ] [task 26] Create the Cloudflare KV namespace and bind it as LICENCES
- [ ] [task 27] Verify the Amazon report menu path and test an export with a real settlement file and a real DATEV import (SPEC section 11)
- [ ] [task 28] Have a lawyer review the legal pages (Impressum, Datenschutz, AGB drafts)
- [ ] [task 29] Download one real Amazon.de Settlement Flat File V2, anonymise it, put it in fixtures/real/ and confirm menu path, date and number format.
- [ ] [task 30] Have a tax firm or DATEV user test-import a generated EXTF_*.csv into DATEV and confirm it imports and OP-Ausgleich by order ID works; compare the column list in src/lib/datev/columns.ts with https://developer.datev.de/datev/platform/en/dtvf.
- [ ] [task 31] Create a Stripe account, the 4 prices, set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and STRIPE_PRICE_* (names in .env.example), enable invoice emails and the Customer Portal, and set up VAT handling. Stay in test mode until the DATEV import is confirmed.
- [ ] [task 32] Register the domain, connect Cloudflare Pages, create the LICENCES KV namespace and put its id in wrangler.toml, set PUBLIC_CF_BEACON_TOKEN, and submit the sitemap in Search Console.
- [ ] [task 33] Fill in the Impressum details and have a lawyer review the legal pages (Impressum, Datenschutz, AGB), including the StBerG wording.
- [ ] [task 34] Have a tax firm confirm and fill the SKR03/SKR04 suggestion accounts with sources.

## Recommendation

None yet. The Growth role gives one after launch.

## Metrics

No real numbers yet. Fill in `metrics.json` (Search Console, analytics, Stripe); agents never invent them.

## Monetisation

subscription (Händler 9 EUR/month or 89 EUR/year (1 Mandantennummer); Kanzlei 29 EUR/month or 290 EUR/year (up to 25 Mandantennummern); prices net plus VAT)

## Target queries

- amazon datev export
- datev amazon zahlungsdatenservice
- datev amazon zahlungsdatenservice alternative
- amazon datev schnittstelle
- datev amazon buchen
- amazon abrechnung datev
- amazon settlement report datev
- amazon abrechnungsbericht flat file v2
- amazon gebühren buchen skr03
- steuerberater amazon datev

## Alternatives found

- Amainvoice (solid): A full Amazon accounting suite (invoices, OSS, Intrastat) from 39 EUR a month for 200 documents. Too dear for small sellers who paid DATEV 1.36 EUR a month.
- Taxdoo (solid): E-commerce accounting and VAT suite, not a small single-job converter. Price not checked.
- DATEV Datenservice Zahlungsdienstleister (Amazon Payments Europe) (partial): Seen only in search results. It may be DATEV's own successor. Not opened or checked.
- DATEV Zahlungsdatenservice für Amazon (abandoned): Discontinued from 2027-08-15. DATEV already warns of wrong or missing data.

## Kill criteria

- Fewer than 150 organic clicks in total by 2027-03-31
- Fewer than 5 paying licences by 2027-06-30
- Fewer than 15 paying licences by 2027-09-30 (after that, keep running only if revenue exceeds cost)
- DATEV announces a drop-in successor for marketplace settlements at 10 EUR a month or less: review within 2 weeks, re-price or park
- Any confirmed wrong booking that the reconciliation check missed: disable checkout until fixed

## Links

- Repo: https://github.com/veste-software/amazon-abrechnung-zu-datev-settlement-bericht-im
- Preview (GitHub Pages, builds from main): https://veste-software.github.io/amazon-abrechnung-zu-datev-settlement-bericht-im/

## History

- 2026-11-12 21:25 · specced · spec written
- 2026-11-12 21:38 · planned · scaffold and plan written
- 2026-11-12 21:56 · building · build started
- 2026-11-12 21:56 · seo · all planned tasks done
- 2026-11-12 22:02 · qa · seo and conversion foundations written
- 2026-11-12 22:09 · building · QA round 1 found 1 blocker(s)
- 2026-11-12 22:26 · qa · all planned tasks done
- 2026-11-12 22:32 · building · visual review round 1: 1 problem(s) found by code on the front page
- 2026-11-12 22:37 · qa · all planned tasks done
- 2026-11-12 22:43 · building · visual review round 2: 1 problem(s) found by code on the front page
- 2026-11-12 22:49 · qa · all planned tasks done
- 2026-11-12 22:55 · building · QA round 2 found 1 blocker(s)
