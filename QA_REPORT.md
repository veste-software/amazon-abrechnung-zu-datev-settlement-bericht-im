# QA report, round 1

Verdict: **not passed**. One blocker: `node scripts/design-check.mjs` fails.

## Checked and fine
- `npm test`: 7 files, 58 tests pass. They cover fixtures, parsing, V1/GBP refusal, reconciliation, sum invariant, fiscal-year split, line limit, EXTF structure, cp1252, duplicates, profile import/export, confirmation gate, licence server with mocked KV and a Stripe signature, and page checks.
- `npm run build:preview`: 10 pages. No `href`, `src` or `action` points to a root path without `/preview/`. Canonical, island script URLs, sitemap and robots sitemap all start with `/preview/`.
- Sitemap lists exactly the 9 pages of SPEC §8. Each page has a canonical URL. The home page carries WebApplication JSON-LD.
- `npm audit --omit=dev`: 0 vulnerabilities.
- JS is 26.6 KB gzip, CSS 3.4 KB gzip. Fonts are self-hosted.
- The only client `fetch` is `POST /api/licence/check`. Its body has `licenceKey` and a SHA-256 hash (64 hex characters).
- Prices match SPEC. Stripe is only called with `STRIPE_*` env names, and tests use `sk_test_x`. No secrets in the repo.
- No filler words, emoji, TODO or lorem found in `src`, `server` or `functions`.
- The design follows DESIGN.md: Archivo with IBM Plex Mono, ledger-paper motif, no rounded cards, no coloured side borders, no shadows. The home page is not a stock hero with three icon cards.

## Blocker
1. `src/styles/global.css:141`: `.paper::before/::after` use `radial-gradient(...)` for the sprocket holes. The design check fails with `any-gradient` (score 3, fails at 3). The owner wants no gradients at all. Replace it with flat shapes, for example an inline SVG `url("data:image/svg+xml,...")` circle tile with `background-repeat: repeat-y`, or a row of real circles. Afterwards `npm run design-check` must report no finding. The `repeating-linear-gradient` bands in `.ledger` (line 195) and line 368 were not flagged, but the Builder should check whether they trip the check after the fix. Switching them to a flat tint is safer.

## Warnings
- The cancel path is described in `preise.astro` and `agb.astro` as "Stripe-Kundenportal", but no page or code links to a portal, and no portal session is created. Customers can only reach it through Stripe's own emails or a portal login link. Either add a link or tell the owner to activate the portal (see humanTasks), and mention the support e-mail on the Preise page as a fallback.
- The paywall is enforced in the browser only, because the file is generated client-side. A motivated user can bypass it. This is inherent to the "nothing leaves the browser" design, so accept it knowingly.
- `handleStripeEvent` creates a licence on `checkout.session.completed` without checking `payment_status`. For card subscriptions this is usually `paid`, but checking it is cheap.
- The success page's inline styles use hardcoded hex colours that duplicate the tokens. They will drift from the design.
- `tests/pages.test.ts` skips when `dist/` is missing, so run `npm run build` before `npm test` in CI.
- The cancel path, Stripe webhook and KV binding could only be checked with mocks, not with a live Stripe test account.

## Not verifiable here
- Real Amazon files and a real DATEV import (SPEC §11, human).
- Menu path of the Amazon report in the Flat File V2 guide (SPEC §11, human).

## Round 1: blockers

- (high) design-check fails (any-gradient, score 3): .paper::before/::after draw the sprocket holes with radial-gradient. Replace with flat shapes (e.g. an inline SVG circle tile repeated with repeat-y, or real circle elements) and re-run `npm run design-check` until it reports no findings. Also check whether the repeating-linear-gradient bands in .ledger (line ~195) and line ~368 trip the check, and use flat tints if so. [src/styles/global.css:141]
