# DESIGN: Grünband (Amazon-Abrechnung zu DATEV)

Brand kit by the studio Designer. This file is the direction; `src/styles/brand.css` is its code. Where `global.css` or an older rule disagrees, this file and `brand.css` win.

## 1. The real-world cousin

A **green-barred continuous-form journal printout** (Tabellierpapier, Endlospapier, the kind an old DATEV Primanota came out on), with sprocket holes down both edges, that a bookkeeper has checked, underlined twice in red pencil under the total and stamped **"abgestimmt"**. The structure follows a Swiss railway timetable: a strict column grid, hairline rules, tabular figures, one signal colour.

The product's story in one line: **a loose Amazon sheet goes in, a checked and stamped stack of green-bar paper comes out.** Every illustration tells part of that story.

## 2. Name and mark

- **Name: Grünband.** The pale green bars of Tabellierpapier that made long columns of figures readable. Short, German, about the object the audience trusts, and it owns its colour. Descriptor, always next to it: "Amazon-Abrechnung → DATEV".
- **The mark** (`public/brand/logo.svg`): one sheet of continuous paper seen from above, with a solid offset sheet under it (the stack, the "Durchschlag"), three sprocket holes in the left margin, two Journalgrün bars, and a red **double rule** at the bottom right. The double rule is the bookkeeper's sign that a total is closed and balanced. No text in the mark. `public/favicon.svg` is the same mark with two holes and one red bar for 16 px.
- **Lock-up in the header:** mark at 32 px, then "Grünband" in Archivo 800 at `font-stretch: 118%`, 1.375rem, Kohle, then a hairline vertical rule and the descriptor in IBM Plex Mono 500, 0.8125rem, uppercase, tracked 0.08em, muted. Below 480 px the descriptor is hidden. The page `<title>` ends with "· Grünband", and the JSON-LD `name` is "Grünband – Amazon-Abrechnung zu DATEV".

## 3. Palette (flat, nothing else)

| Role | Name | Hex | Token | Use |
|---|---|---|---|---|
| Surface | **Papier** | `#F6F3EA` | `--paper` | The page. Never pure white. |
| Second surface | **Grünband** | `#E2EDDC` | `--band` | Table bands, input fill, the drop zone, the illustration desk |
| Ink | **Kohle** | `#24292B` | `--ink` | All text and rules (13.3:1 on Papier). Muted text `#565E5A` (6.0:1 on Papier, 5.5:1 on Grünband) |
| Accent (sparingly) | **Journalgrün** | `#2E6A3A` | `--accent` | The **one primary button** per screen, the "Saldo stimmt" stamp, OK labels, the bars in the mark. Papier text on it: 5.8:1. Hover `#22502B` (8.4:1) |
| Signal | **Stempelrot** | `#B0281F` | `--signal` | Differences, errors, "Achtung", the focus ring (the red pencil), the double rule in the mark. 6.0:1 on Papier. Dark `#8E1F18` |

Tints for depth in illustrations and CSS only (never as text colours): **Lochrand** `#E4DFD2` (sprocket holes on Papier, shadow on paper, folded corners), **Bandschatten** `#C8D9BF` (shadow and holes on a Grünband surface).

No blue, purple, indigo or pure black anywhere. **No gradients anywhere**: not in CSS, not in SVG, not in shadows. Repeating shapes (sprocket holes, bands) are drawn with flat SVG tiles (data URIs in `brand.css`) or `:nth-child` fills.

## 4. Type

| Role | Face | npm | Settings |
|---|---|---|---|
| Display | **Archivo**, wide | `@fontsource-variable/archivo` (`wdth.css`, both axes) | 800, `font-stretch: 108%` (H1) / 700, 106% (H2, H3), brand name 800 at 118 %, tracking −0.015em. The wide cut reads like the heading of a printed DATEV form. |
| Text | **Archivo**, normal width | same file | 400 body, 600 labels and buttons |
| Figures | **IBM Plex Mono** | `@fontsource/ibm-plex-mono` (400, 500, 600) | Every amount, account, date, ID, file name, column head, section label. `font-variant-numeric: tabular-nums`; amounts right-aligned on the decimal comma. |

Rule: a number is always Plex Mono; a word is always Archivo.

**Scale** (tokens in `brand.css`):

| Token | Size | Use |
|---|---|---|
| `--fs-xs` | 0.8125rem / 13 px | Mono labels, column heads, section labels only (uppercase, tracked) |
| `--fs-sm` | 1rem / 16 px | Table cells, notices, footnotes |
| `--fs-base` | 1.125rem / 18 px | Body, line-height 1.55, measure 64ch |
| `--fs-lg` | 1.375rem / 22 px | Lead sentence, H3, drop zone title |
| `--fs-xl` | clamp(1.625rem → 2.25rem) | H2 |
| `--fs-2xl` | clamp(2rem → 3.375rem) | H1 (about 32 px at 390, 54 px at 1280) |
| `--fs-figure` | clamp(3.5rem → 7.5rem) | The difference to the payout, the largest thing on the tool screen |

## 5. Grid and spacing

- Unit `--u` = 8 px. Steps: `--s-1` 8, `--s-2` 16, `--s-3` 24, `--s-4` 32, `--s-6` 48, `--s-8` 64, `--s-12` 96. Nothing else.
- Page: the **paper strip** `.paper` with sprocket margins (`--margin-strip` 1.75rem, 0.75rem under 760 px) left and right, inside a 12-column grid, gutter 1.5rem (1rem under 760 px), max width 76rem.
- Text sits in columns 1–7 or 1–8 (64ch); marginalia (sources, account numbers) in 9–12, smaller and muted, like notes on a printout.
- Sections are divided by a 2 px Kohle rule and a mono section label at the left ("01 DATEI", "02 PRÜFUNG", "03 EXPORT", "04 ABLAUF").
- Under 760 px everything stacks in one column.

## 6. Signature elements

1. **The sprocket margin (Führungslochrand).** Both page edges carry punched holes (Lochrand circles, 10 px, every 32 px) and a dashed perforation hairline. Drawn with a flat SVG tile in `brand.css`. The drop zone carries the same margins in Bandschatten. Hidden in print.
2. **Green bands of three rows.** Tables: `tbody tr:nth-child(6n+1/2/3)` get Grünband. The preview `<pre>`: class `.bands` (a flat SVG tile, three rows Grünband, three rows clear). Never zebra stripes per row.
3. **The stamp.** Double-ruled rectangle, Plex Mono 600 uppercase, rotated −3°: Journalgrün "SALDO STIMMT", Stempelrot "DIFFERENZ 1,00 €". Once per screen, never decoration. The ink texture uses no blur.
4. **The double rule.** A total that is checked gets a red double underline (`.sum-closed`: two 2 px Stempelrot rules, 2 px apart), like a pencil mark under a closed total. Used under the Amazon total in the check view and in the mark.
5. **Durchschlag (the offset sheet).** The only depth in the product: a flat sheet offset 8 px down-right behind the drop zone and the check printout (`box-shadow: 8px 8px 0 0` in Bandschatten or Lochrand, **zero blur**). It reads as the next sheet in the stack. No other shadows.

## 7. Illustration style

- Hand-built SVG, flat fills from the palette and tints above, **one stroke width: 4 units, Kohle, square corners, miter joins**. Paper objects have radius 0; only the stamp knob, zeros and holes are round.
- Depth: every object on the desk casts a flat offset copy of its own outline, 14 units down-right, in the shadow tint of the surface it lies on (Bandschatten on Grünband, Lochrand on Papier). Stacks are sheets offset by 12 units.
- Figures and text in drawings are abstract bars (Kohle, 6 high) laid out in real columns: account, contra account, text, amount right-aligned. The only drawn characters are "0,00" and "1,00" on stamp imprints, built from shapes, so no font is needed.
- Red appears only where something is being checked: the total cell circled on the Amazon sheet, the double rule, a difference.
- Not allowed: people, hands, laptops, charts, isometric views, blobs, icon-pack icons, emoji, Amazon or DATEV logos.

**Files**

| File | Size | Shows |
|---|---|---|
| `public/brand/logo.svg` | 64×64 | The mark (section 2) |
| `public/favicon.svg` | 32×32 | The mark simplified for 16 px |
| `public/art/hero.svg` | 1200×720 | The whole story on a green desk: the loose Amazon sheet (tilted, folded corner, raw tab data, total cell circled red) feeds a strip of green-bar continuous paper; a rubber stamp hovers over the strip and has left a green "0,00" imprint; the strip runs into a neat stack of sheets whose top sheet ends in the red double rule. |
| `public/art/spot-1.svg` | 480×360 | Step 1 "Bericht holen": the settlement sheet sliding out of a report slot, total cell circled red |
| `public/art/spot-2.svg` | 480×360 | Step 2 "Abgleich prüfen": Soll/Ist rows of equal length on a sheet, the green "0,00" imprint, the stamp standing beside it |
| `public/art/spot-3.svg` | 480×360 | Step 3 "Stapel einlesen": the zig-zag folded continuous stack (Leporello) with green bands, the red double rule on top |
| `public/art/spot-empty.svg` | 480×360 | Empty state of the drop zone: an empty letter tray (Ablagekorb) with a sheet hovering above it and its dashed landing outline |
| `public/art/spot-difference.svg` | 480×360 | Difference state: a sheet with one row circled in red and a red "1,00" imprint |
| `public/art/pattern.svg` | 32×32 tile | The sprocket margin: one hole and a perforation dash, for borders and the print-free page strip |

## 8. The first screen

Goal in five seconds: **what** (Amazon-Abrechnung → DATEV), **for whom** (sellers and their tax firm), **what to do** (drop the file). The working tool is fully visible without scrolling at 1280×800 and at 390×844.

**Words**

- Eyebrow (mono, xs, muted): `FLAT FILE V2 → DATEV EXTF · IM BROWSER`
- H1: **Amazon-Abrechnung in DATEV-Buchungen umwandeln** (`text-wrap: balance`)
- Lead (one sentence, `--fs-lg`): "Legen Sie den Abrechnungsbericht ab: Sie sehen sofort, ob die Zeilen zur Auszahlung passen, und erhalten einen geprüften Buchungsstapel für DATEV."
- Drop zone title: **Abrechnungsbericht hier ablegen**; mono line: `Flat File V2 · .txt · EUR · mehrere Dateien möglich`
- Primary button (Journalgrün, the only one on the screen): **Abrechnung auswählen**
- Under the drop zone, one line, two parts: left "Die Datei bleibt in Ihrem Browser. Es wird nichts hochgeladen." Right, mono: `Prüfung und Vorschau kostenlos · Export ab 9 € im Monat` (link to /preise/).

**1280×800**

```
| [mark] Grünband | AMAZON-ABRECHNUNG → DATEV        Konverter Umstieg Kontierung Für Kanzleien Preise |  ~76px, 2px rule
| cols 1–7: eyebrow / H1 (3 lines, 54px) / lead (3 lines) | cols 8–12: hero.svg (≈490×294)  |  ~320px
| 01 DATEI                                                                                       |
| ┌ drop zone, full width, sprocket margins, Durchschlag ──────────────────────────────────┐   |
| │ [spot-empty 168px] │ Abrechnungsbericht hier ablegen / mono line │ [Abrechnung auswählen] │   |  ~176px
| └──────────────────────────────────────────────────────────────────────────────────────┘   |
| privacy sentence                                        Prüfung kostenlos · Export ab 9 €   |  bottom ≈ 690px
```

**390×844**

```
| [mark] Grünband                    |  brand row ~56px
| Konverter Umstieg Kontierung       |  nav wraps to 2 rows, 16px, ~56px, 2px rule
| Für Kanzleien Preise               |
| eyebrow                            |
| H1, 32px, 3 lines                  |  ~110px
| lead, 4 lines                      |  ~110px
| 01 DATEI                           |
| drop zone: title / mono line /     |
| [ Abrechnung auswählen ] full width|  ~200px, spot hidden
| privacy sentence, price line       |  bottom ≈ 700px
```

The hero illustration is hidden in the intro under 760 px and appears instead at the top of the "So arbeitet der Konverter" section (class `.art-mobile`), full width.

**Drop zone states** (all designed, same box):

- **Empty:** Grünband fill, 2 px Kohle border, sprocket margins, Durchschlag, spot-empty at left (desktop only).
- **Drag over:** fill Papier, border 2 px **dashed** Journalgrün, title changes to "Loslassen, um zu prüfen".
- **Working:** title "Datei wird gelesen …", mono line shows the file name; the button is disabled. No spinner.
- **Done:** the zone shrinks to one bar: mono file name + row count, and a secondary button "Andere Datei wählen". The check printout below takes over.
- **Error:** border Stempelrot, label "FEHLER" in Stempelrot, the message names row and value, and the button stays active.

**Below the tool, in this order:** "So arbeitet der Konverter" as three steps in a row (spot-1, spot-2, spot-3, 160 px tall, each with a mono number, a 3-word H3 and one sentence, separated by hairlines, no boxes), then the banded table of what goes into the batch, then the FAQ, then the further reading links.

## 9. Components (implemented in brand.css)

- **Buttons:** square, 2 px border, min-height 48 px, Archivo 600, 1.0625rem. `.btn` = Papier with Kohle text, hover Grünband. `.btn-primary` = Journalgrün with Papier text, hover `#22502B`. Disabled = dashed border, muted text, and a one-line reason under it. No movement, no shadow on hover.
- **Fields:** label above (Archivo 600, 0.9375rem), input with Grünband fill, no box, a 2 px Kohle bottom rule, min-height 48 px, Plex Mono for numbers. Error: Stempelrot rule and a message under it starting "Fehler:".
- **Select:** native select with `appearance: none` and a flat Kohle chevron (SVG tile).
- **Checkbox:** 22 px square, 2 px Kohle border, checked = Journalgrün with a Papier tick (SVG tile).
- **Notices:** a paragraph between two hairlines with a label in front: "HINWEIS" (Kohle), "ACHTUNG" (Stempelrot), "OK" (Journalgrün). Never a coloured side border.
- **FAQ:** `<details>` with a hairline above, the summary in Archivo 600 with a drawn plus/minus at the right.
- **Focus:** `outline: 3px solid` Stempelrot, offset 3 px, everywhere. **Selection:** Grünband on Kohle.
- **Motion:** only the 150 ms stamp press; nothing under `prefers-reduced-motion`.

## 10. Voice

German, formal "Sie", a careful colleague in a tax firm. Short sentences, concrete nouns, accounting terms used correctly (Verrechnungskonto, Gegenkonto, BU-Schlüssel, Belegfeld 1, OP-Ausgleich). Say what happens to the data and what the user must check. No exclamation marks, no "einfach", "nahtlos", "mühelos", no promises about saved time.

1. "Abrechnungsbericht hier ablegen"
2. "Saldo stimmt. Die Summe der 214 Zeilen entspricht der Auszahlung."
3. "Zeile 14: Datum »2026/10/03« nicht erkannt. Erwartet wird 03.10.2026 oder 2026-10-03."
4. "Differenz 1,00 €. Der Export bleibt gesperrt, bis Sie die Differenz einem Konto zuordnen."
5. "Die Datei bleibt in Ihrem Browser. Es wird nichts hochgeladen."

## 11. What we will not do

- No gradients of any kind, no blurred shadows, no glass, no glow.
- No rounded cards, no pill buttons, no radius above 2 px except round things (holes, stamp knob).
- No coloured side borders on notices or cards.
- No hero with two buttons over three icon cards; the tool is on the first screen.
- No emoji, icon packs, stock photos, people, Amazon or DATEV logos.
- No ratings, testimonials, customer counts, "trusted by" rows or countdowns.
- No Tailwind or UI kit: `brand.css` for tokens and base, scoped styles for components.
