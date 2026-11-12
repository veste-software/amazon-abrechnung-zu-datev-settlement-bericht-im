# QA report, round 2

Verdict: **passed**. No blockers. The round-1 blocker (gradients in `.paper`) is gone: the brand kit replaced the styles and `node scripts/design-check.mjs` reports "nothing found in 16 files".

## Checked this round
- `npm test`: 7 files, 58 tests pass. `npm run build` (astro check + build, 10 pages) passes. `npm run build:preview` passes.
- Preview build: no `href`, `src`, `action` or `content` attribute points to a root path without `/preview/`. CSS font URLs, canonical, sitemap entries and the `Sitemap:` line in `robots.txt` all start with `/preview/`. The island builds its image and API URLs through `withBase`.
- Sitemap lists exactly the 9 pages of SPEC §8. Every page has a title, meta description, canonical URL and one H1.
- The home page HTML already contains the H1, the drop zone markup (`dropzone`, art, title, meta text), the placeholder-account warning and the disclaimer footer, so the main content does not need JavaScript. The island is server-rendered.
- Drop area (visual rounds 1 and 2): the native file input is visually hidden and not in the tab order. A labelled drop area with the title "Abrechnungsbericht hier ablegen", the example "12345678901.txt (Flat File V2, EUR)" and a real button "Abrechnung auswählen" opens the picker. The button is keyboard-reachable.
- `npm audit --omit=dev`: 0 vulnerabilities. JS 27.0 KB gzip (budget 90), CSS 5.0 KB gzip. Fonts are self-hosted.
- The only client network code is the licence check (`licence-client.ts`). No other `fetch`, XHR or `sendBeacon` in `src`. The only external URL in client code is the Cloudflare beacon, loaded only when the token is set.
- No secrets in the repo (only `whsec_test_secret` in a test). No filler words, emoji, lorem or TODO in `src`.
- Design: gradients are absent from the CSS and the SVGs. Radii, thick borders and shadows come only from the `brand.css` tokens (2 px ink borders, flat zero-blur "Durchschlag" offset). Archivo with IBM Plex Mono, one green accent, red only for differences and focus. The first screen is intro beside art, with the working tool directly below, so it is not the stock hero with three icon cards.

## Warnings
- Cancel path: `preise.astro` and `agb.astro` promise cancellation in the "Stripe-Kundenportal", but no page links to a portal and no portal session is created. It only works if the owner enables the Customer Portal and customers use the link in Stripe's emails. Add the support e-mail as a fallback on `/preise/`, or add a portal-session function later.
- The paywall is enforced in the browser only (the file is made client-side), so a determined user can bypass it. This is inherent to the "nothing leaves the browser" design.
- `handleStripeEvent` does not check `payment_status` on `checkout.session.completed`. It is cheap to add.
- `tests/pages.test.ts` skips when `dist/` is missing. Run `npm run build` before `npm test` in CI.
- I could not view the pages in a real browser (none available), so layout, contrast, the 360 px view and the print view are judged from the CSS only.
- The DATEV column list (125 fields) and the 31 header fields were written from memory and are not verified against DATEV's format description. Account numbers in the SKR03/SKR04 suggestion files are all empty, and the demo accounts are placeholders. The UI says so.
- Stripe webhook, KV and checkout were only tested with mocks, not a live Stripe test account.

## Not verifiable here (human)
- A real Amazon V2 file, the menu path and number/date formats, and a real DATEV test import (SPEC §11 tasks 1 and 2).
- Stripe account, prices, portal, VAT setup; domain, Cloudflare Pages and KV namespace.
- Impressum details and lawyer review of the legal pages.

## Round 2: blockers

- (high) Automated check failed after QA: npm test --if-present
ly equal [ '', 'agb/', …(7) ][39m

[32m- Expected[39m
[31m+ Received[39m

[2m  [[22m
[32m-   "",[39m
[32m-   "agb/",[39m
[32m-   "amazon-abrechnungsbericht-flat-file-v2/",[39m
[32m-   "amazon-gebuehren-buchen-datev/",[39m
[32m-   "datenschutz/",[39m
[32m-   "datev-zahlungsdatenservice-amazon-alternative/",[39m
[32m-   "impressum/",[39m
[32m-   "preise/",[39m
[32m-   "steuerkanzlei/",[39m
[31m+   "preview/",[39m
[31m+   "preview/agb/",[39m
[31m+   "preview/amazon-abrechnungsbericht-flat-file-v2/",[39m
[31m+   "preview/amazon-gebuehren-buchen-datev/",[39m
[31m+   "preview/datenschutz/",[39m
[31m+   "preview/datev-zahlungsdatenservice-amazon-alternative/",[39m
[31m+   "preview/impressum/",[39m
[31m+   "preview/preise/",[39m
[31m+   "preview/steuerkanzlei/",[39m
[2m  ][22m

[36m [2m❯[22m tests/pages.test.ts:[2m47:25[22m[39m
    [90m 45|[39m   [34mit[39m([32m'AC20: sitemap lists exactly the pages of SPEC §8'[39m[33m,[39m () [33m=>[39m {
    [90m 46|[39m     const urls = [...read('sitemap-0.xml').matchAll(/<loc>([^<]+)<\/lo…
    [90m 47|[39m     [34mexpect[39m(urls[33m.[39m[34msort[39m())[33m.[39m[34mtoEqual[39m([[33m...[39m[33mSLUGS[39m][33m.[39m[34msort[39m())[33m;[39m
    [90m   |[39m                         [31m^[39m
    [90m 48|[39m   })[33m;[39m
    [90m 49|[39m   it('AC20/21: footer links Impressum and Datenschutz and carries the …

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯[22m[39m [repo]
