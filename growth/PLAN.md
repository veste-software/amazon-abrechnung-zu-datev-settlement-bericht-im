# Growth plan (prep, written 2026-11-12)

Base URL always comes from `SITE_URL`. Nothing here is live data; there is no Search Console data yet.

## What is in place
- Five content pages plus tool, prices and legal pages; each has a unique title, description, H1 and canonical (see SPEC §8).
- Base layout now adds Open Graph and Twitter tags, and an optional `jsonLd` prop. Only `/` uses it (WebApplication with the three real price points). No ratings, no FAQPage unless the page really holds the FAQ text.
- `robots.txt` is generated from `SITE_URL` and points to `sitemap-index.xml` (from `@astrojs/sitemap`, 404 excluded).
- Analytics: Cloudflare Web Analytics, cookie-free, via `PUBLIC_CF_BEACON_TOKEN`.
- No ads or affiliate links (SPEC §7). Paywall is the download button; the free check view is the trust step.

## Query to page map
| Query cluster | Page | Honest status |
|---|---|---|
| amazon datev export / abrechnung datev / settlement report datev | `/` | Served by the tool itself. |
| datev amazon zahlungsdatenservice (alternative, eingestellt, 2027) | `/datev-zahlungsdatenservice-amazon-alternative/` | Main bet. Guide plus comparison plus cut-over checklist. |
| amazon abrechnungsbericht herunterladen / flat file v2 / v1 eingestellt | `/amazon-abrechnungsbericht-flat-file-v2/` | Menu path unverified until the human checks it; the page says "Bezeichnung kann abweichen". |
| amazon gebühren buchen skr03/skr04, reserve buchen | `/amazon-gebuehren-buchen-datev/` | Reference table from the tool's mapping JSON. |
| steuerberater amazon datev, amazon mandanten datev | `/steuerkanzlei/` | Kontenprofil workflow. |
Not served: generic "amazon buchhaltung" (too broad, suites own it). No extra pages.

## 30-day plan
Week 1 (launch): set SITE_URL, deploy, submit sitemap in Google Search Console and Bing Webmaster Tools (IndexNow via Bing). Check that every page is indexed by hand with a site: query. Fix anything flagged.
Week 2: after a tax firm has test-imported one file, add one sentence to `/` and `/steuerkanzlei/` saying so, with the firm's permission, and only then. Add one fixture-based worked example page section ("Beispiel: eine Abrechnung mit Reserve") to the fees page, using synthetic data labelled as such.
Week 3: possible new page, only if Search Console shows demand: "Amazon Reserve und Rücklage buchen" or "Amazon Auszahlung im OP ausgleichen". Not before data.
Week 4: review impressions/clicks per page; rewrite titles for queries with impressions and no clicks.

## Distribution (legitimate fits)
- Amazon Seller Central forum thread "Amazon hat Datevschnittstelle für 2027 gekündigt - Alternativen?" (url in SPEC §3): one factual reply, disclose that you built it, state the privacy and price facts. Read forum rules first; skip if self-promotion is barred.
- Seller and bookkeeping communities (e.g. German e-commerce Facebook groups, Reddit r/Amazon_Seller_DE-style or r/Steuern if rules allow): answer questions, mention the tool only where it fits and disclose.
- Steuerberater-facing: a short note to the author of the Wirsching page and similar firms who write about the switch, offering a free licence for a test import and feedback. One personal mail each, no mass sending.
- Directories: AlternativeTo (listed as alternative to DATEV Zahlungsdatenservice), Product Hunt only if the owner wants it. Software directories for Steuerberater (check their listing terms).
- Outreach worth trying: ask for corrections on the DATEV EXTF details from DATEV-user forums; a useful correction is a reason for a link.
- Self-host: not offered; do not promise it on pages.

## Conversion notes
Key steps to track as names-only events (Cloudflare beacon records page views only; custom events need a different tool, so use page views of `/preise/` and the checkout return page as proxies): file dropped (not tracked, to avoid any file signal), plans dialog opened, checkout started. If custom events are wanted, that needs a privacy decision by the owner.
