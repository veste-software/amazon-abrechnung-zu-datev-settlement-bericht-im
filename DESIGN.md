# DESIGN: Amazon-Abrechnung zu DATEV

## The idea

The site is the cousin of a **green-barred continuous-form journal printout** (Tabellierpapier/Endlospapier, the kind an old DATEV Primanota came out on) that a bookkeeper has just checked and stamped **"abgestimmt"** in red or green ink. It borrows the discipline of a Swiss railway timetable for its structure: a strict column grid, hairline rules, tabular figures and one signal colour used only where something needs attention.

**Why not the pure timetable direction:** the studio's starting direction was the Swiss railway timetable. SPEC §12 names the ledger printout and the rubber stamp as this product's real-world cousin, and that object is what the audience (bookkeepers, tax firm staff) trusts. So the ledger sets the materials (paper, green bars, carbon ink, sprocket holes, stamp), and the timetable sets the rules (grid, hairlines, tabular numerals, one red).

## Typefaces (self-hosted, never a CDN)

| Role | Face | Source | Use |
|---|---|---|---|
| Display and text | **Archivo** (variable, weights 400–800) | `@fontsource-variable/archivo` | Headings at 700–800 tight-tracked; body at 400; labels at 600 in small caps with letter-spacing 0.08em |
| Figures and printout | **IBM Plex Mono** (400, 500, 600) | `@fontsource/ibm-plex-mono` | Every amount, account number, date, ID, the preview table, the check view, the stamp, the file name |

Rule: a number is always in Plex Mono with `font-variant-numeric: tabular-nums`, and amounts are right-aligned so the decimal commas line up. Words are always Archivo.

**Type scale** (custom properties in `src/styles/global.css`):

| Token | Size | Use |
|---|---|---|
| `--fs-xs` | 0.8125rem (13px) | Footnotes, column heads in tables (Plex Mono, uppercase, tracked) |
| `--fs-sm` | 0.9375rem (15px) | Table cells, notices, form labels |
| `--fs-base` | 1.0625rem (17px) | Body text, line-height 1.55, measure 66ch |
| `--fs-lg` | 1.375rem (22px) | Lead paragraph, H3 |
| `--fs-xl` | 2rem (32px) | H2 |
| `--fs-2xl` | clamp(2.5rem, 6vw, 4.25rem) | H1 |
| `--fs-figure` | clamp(3.5rem, 11vw, 7.5rem) | **The difference to the payout**, the largest thing on the tool screen (Plex Mono 600) |

## Colours

| Name | Hex | For |
|---|---|---|
| Tabellierpapier | `#F6F3EA` | Page surface (warm paper, never pure white) |
| Grünband | `#E2EDDC` | The pale green bars behind every other table row band, input fields, the drop zone fill |
| Kohle | `#24292B` | All text and hairline ink (carbon grey, never pure black). Muted text uses `--ink-muted: #565E5A` (6.2:1 on paper) |
| Stempelrot | `#B0281F` | The single accent: "Differenz" stamp, errors, the primary download button, focus ring. 6.0:1 on paper |
| Stempelgrün | `#2E6A3A` | Only the "Saldo stimmt / abgestimmt" stamp and success notes. 6.1:1 on paper |

Hairline rules are `1px solid` Kohle at 35 % opacity (`--rule`), heavy rules are `2px solid` Kohle (`--rule-heavy`), used as top/bottom rules of tables and sections, never as a coloured side border.

## Grid and spacing

- Spacing unit `--u: 0.5rem` (8px). Allowed steps: 1, 2, 3, 4, 6, 8, 12, 16 units. Nothing else.
- Page = a **paper strip** with two **sprocket margins** (`--margin-strip: 1.75rem`) on left and right, inside them a 12-column grid with `1.5rem` gutters, max width 76rem.
- Text blocks sit on columns 1–8 (66ch measure); side notes, account numbers and "Quelle" lines sit in columns 9–12, set smaller, like marginalia on a printout. Below 760px everything stacks in one column and the sprocket strips shrink to 0.75rem.
- Sections are separated by a full-width heavy rule plus a small Plex Mono section label at the left ("01 DATEI", "02 PRÜFUNG", "03 EXPORT") the way a printout has form-feed headers. Rhythm changes per section: the tool is dense, content pages are airy.

## Signature elements

1. **Sprocket margin (Führungslochrand).** Both page edges carry a vertical strip of punched holes, built in CSS only: a `::before`/`::after` on `.paper` with `background-image: radial-gradient(circle, var(--hole) 0 0.3rem, transparent 0.32rem)` repeated every `1.27rem` (half-inch pitch scaled), plus a dashed hairline (`border-inline: 1px dashed`) for the perforation where the strip would tear off. The hole colour is a slightly darker paper tone `#E4DFD2`. Hidden in print.
2. **Green-bar banding.** Tables and the booking preview use `background-image: repeating-linear-gradient(to bottom, var(--band) 0 calc(3 * var(--row)), transparent calc(3 * var(--row)) calc(6 * var(--row)))`: bands of three rows, exactly like Tabellierpapier, not zebra stripes per row.
3. **The stamp.** A hand-built inline SVG component (`src/components/Stamp.astro` for static use and `Stamp.tsx` for the island): double-ruled rectangle with slightly uneven corners, the word in Plex Mono 600 uppercase, letter-spaced, rotated −3°, with an SVG `feTurbulence` + `feDisplacementMap` filter for uneven ink. Two states: green "SALDO STIMMT" / "ABGESTIMMT" and red "DIFFERENZ 1,00 €". It appears once per screen, never as decoration elsewhere.
4. **The big difference figure.** In the check view, the difference (`0,00 €` or `1,00 €`) is set at `--fs-figure` in Plex Mono, with the Amazon total and the line sum in a small two-row "Soll/Ist" table beside it.

## Components

- **Buttons:** rectangular, `border-radius: 0`, `2px solid Kohle`, Archivo 600, small caps label. Primary (download) = Stempelrot fill with paper text; secondary = paper fill, Kohle text. Hover: fill shifts to Kohle (secondary) or darker red `#8E1F18` (primary); no movement, no shadow. Disabled: dashed border, muted ink, and a one-line reason under it ("Erst Kontenzuordnung bestätigen").
- **Inputs:** look like a field on a printed form: Grünband fill, no box, only a `2px` Kohle bottom rule, label above in small caps 600, value in Plex Mono when numeric (Beraternummer, Konto). Error: the bottom rule turns Stempelrot and the message sits under it in Stempelrot, prefixed "Fehler:".
- **Drop zone:** a torn-off sheet: dashed 2px Kohle border, Grünband fill, a Plex Mono line "Abrechnung (Flat File V2, .txt) hier ablegen" and a plain secondary button "Datei wählen". The privacy sentence sits directly under it.
- **Results:** the check view is a printout block: heavy rule, header line in Plex Mono (`ABRECHNUNG 12345678901 · 03.10.2026–17.10.2026 · AUSZAHLUNG 20.10.2026`), the big difference figure with the stamp, then banded tables.
- **Notices:** no boxes with coloured side bars. A notice is a paragraph with a small caps label in front ("HINWEIS", "ACHTUNG" in Stempelrot, "OK" in Stempelgrün) and a hairline above and below.
- **Focus and selection:** `outline: 3px solid Stempelrot; outline-offset: 2px` everywhere; `::selection` is Grünband on Kohle.
- **Favicon:** an SVG of a small red stamp square with "A→D" in mono.
- **404:** a printout with "Seite 404 von 9" and a line "Diese Seite ist nicht im Stapel."
- **Print stylesheet:** the check view prints cleanly on A4 (no sprocket strips, no buttons), because bookkeepers will print it for the file.

## Voice

German, formal "Sie", the tone of a careful colleague in a tax firm: short sentences, concrete nouns, accounting terms used correctly (Verrechnungskonto, Gegenkonto, BU-Schlüssel, Belegfeld 1, OP-Ausgleich). Say what happens to the data and what the user must check. No exclamation marks, no promises about saving time, no "einfach", "nahtlos", "mühelos". Errors name the row and the value: "Zeile 14: Datum »2026/10/03« nicht erkannt."

## What we will not do

- No coloured side-border cards or callouts, no rounded corners beyond 2px, no pill buttons, no shadows except none.
- No gradients other than the sprocket holes and the green bands described above; no purple, indigo or blue anywhere.
- No hero with two buttons over three icon cards; the tool itself is the top of the start page.
- No emoji, no icon packs, no stock photos, no illustrations of people, no Amazon or DATEV logos.
- No Tailwind or UI kit; one stylesheet of tokens plus scoped component styles.
- No ratings, testimonials, customer counts, "trusted by" rows or countdowns.
- No motion except one 150ms stamp "press" (scale 1.04 → 1, opacity 0 → 1) when the check finishes, and none at all under `prefers-reduced-motion`.
